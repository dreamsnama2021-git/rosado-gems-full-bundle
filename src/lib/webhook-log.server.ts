/**
 * Server-only helpers that record every inbound payment-gateway webhook
 * (signature, headers, raw payload, outcome) and allow an admin to re-check
 * a single event against the gateway later.
 */
import type { GatewaySettings } from "@/lib/payments.server";

const SAFE_HEADER_PREFIXES = ["x-razorpay", "paypal-", "content-type", "user-agent", "x-forwarded-for"];

export function collectHeaders(headers: Headers) {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (SAFE_HEADER_PREFIXES.some((p) => k.startsWith(p))) out[k] = value;
  });
  return out;
}

export type WebhookLogInput = {
  gateway: "razorpay" | "paypal" | "payoneer";
  event_type?: string | null;
  event_id?: string | null;
  order_id?: string | null;
  signature?: string | null;
  signature_valid: boolean;
  headers: Record<string, string>;
  raw_body: string;
  status: string;
  error?: string | null;
};

/** Persists a webhook event. Never throws — logging must not break the webhook. */
export async function logWebhookEvent(input: WebhookLogInput): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let payload: unknown = {};
    try { payload = JSON.parse(input.raw_body); } catch { payload = { unparsed: true }; }
    const { data } = await supabaseAdmin
      .from("payment_webhook_events")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        gateway: input.gateway,
        event_type: input.event_type ?? null,
        event_id: input.event_id ?? null,
        order_id: input.order_id ?? null,
        signature: input.signature ? input.signature.slice(0, 512) : null,
        signature_valid: input.signature_valid,
        headers: input.headers,
        payload,
        raw_body: input.raw_body.slice(0, 60000),
        status: input.status,
        error: input.error ?? null,
        processed_at: input.status === "processed" ? new Date().toISOString() : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select("id")
      .maybeSingle();
    return (data as { id?: string } | null)?.id ?? null;
  } catch {
    return null;
  }
}

export async function patchWebhookEvent(id: string, patch: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("payment_webhook_events") as any).update(patch).eq("id", id);
  } catch { /* logging must never break the request */ }
}

type EventRow = {
  id: string;
  gateway: string;
  event_type: string | null;
  event_id: string | null;
  order_id: string | null;
  payload: Record<string, unknown> | null;
  recheck_count: number;
};

/**
 * Re-asks the gateway about the payment referenced by a stored event and
 * reconciles the order if it is actually paid. Returns a human-readable note.
 */
export async function recheckWebhookEvent(id: string): Promise<{ status: string; note: string; order_id: string | null }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("payment_webhook_events").select("*").eq("id", id).maybeSingle();
  const row = data as unknown as EventRow | null;
  if (!row) throw new Error("Webhook event not found");

  const {
    loadGatewaySettings, razorpayFetchPayment, paypalCaptureOrder, markOrderPaid,
  } = await import("@/lib/payments.server");
  const s: GatewaySettings = await loadGatewaySettings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (row.payload ?? {}) as any;

  let status = "rechecked";
  let note = "";
  let orderId = row.order_id;

  try {
    if (row.gateway === "razorpay") {
      const paymentId: string | undefined = p?.payload?.payment?.entity?.id ?? row.event_id ?? undefined;
      const gatewayOrderId: string | undefined = p?.payload?.payment?.entity?.order_id;
      if (!orderId) {
        const notesOrder = p?.payload?.payment?.entity?.notes?.order_id;
        if (notesOrder) orderId = notesOrder;
        else if (gatewayOrderId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: o } = await (supabaseAdmin.from("orders") as any)
            .select("id").eq("gateway_order_id", gatewayOrderId).maybeSingle();
          orderId = o?.id ?? null;
        }
      }
      if (!paymentId) throw new Error("This event carries no Razorpay payment id to verify");
      const payment = await razorpayFetchPayment(s, paymentId);
      note = `Razorpay reports payment ${paymentId} as “${payment.status ?? "unknown"}”.`;
      if (payment.status === "captured" && orderId) {
        await markOrderPaid(orderId, "razorpay", paymentId);
        status = "processed";
        note += " Order marked as paid.";
      } else if (!orderId) {
        status = "unmatched";
        note += " No matching order could be found.";
      }
    } else if (row.gateway === "payoneer") {
      const { payoneerGetSession } = await import("@/lib/payments.server");
      const listId: string | undefined =
        p?.identification?.longId ?? p?.listId ?? row.event_id ?? undefined;
      if (!orderId) {
        const ref = p?.transactionId ?? p?.payment?.reference ?? null;
        if (ref) orderId = ref;
        else if (listId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: o } = await (supabaseAdmin.from("orders") as any)
            .select("id").eq("gateway_order_id", listId).maybeSingle();
          orderId = o?.id ?? null;
        }
      }
      if (!listId) throw new Error("This event carries no Payoneer session id to verify");
      const res = await payoneerGetSession(s, listId);
      note = `Payoneer reports session ${listId} as “${res.code || "unknown"}”.`;
      if (res.paid && orderId) {
        await markOrderPaid(orderId, "payoneer", listId);
        status = "processed";
        note += " Order marked as paid.";
      } else if (!orderId) {
        status = "unmatched";
        note += " No matching order could be found.";
      }
    } else {
      const captureId: string | undefined = p?.resource?.id ?? row.event_id ?? undefined;
      const ppOrder: string | undefined =
        p?.resource?.supplementary_data?.related_ids?.order_id ?? p?.resource?.id;
      if (!orderId) {
        orderId = p?.resource?.custom_id ?? null;
        if (!orderId && ppOrder) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: o } = await (supabaseAdmin.from("orders") as any)
            .select("id").eq("gateway_order_id", ppOrder).maybeSingle();
          orderId = o?.id ?? null;
        }
      }
      if (!ppOrder) throw new Error("This event carries no PayPal order id to verify");
      const res = await paypalCaptureOrder(s, ppOrder);
      note = `PayPal reports order ${ppOrder} as “${res.status}”.`;
      if (res.status === "COMPLETED" && orderId) {
        await markOrderPaid(orderId, "paypal", res.captureId || captureId || ppOrder);
        status = "processed";
        note += " Order marked as paid.";
      } else if (!orderId) {
        status = "unmatched";
        note += " No matching order could be found.";
      }
    }
  } catch (e) {
    status = "recheck_failed";
    note = (e as Error).message;
  }

  await patchWebhookEvent(id, {
    status,
    note,
    order_id: orderId,
    recheck_count: (row.recheck_count ?? 0) + 1,
    last_recheck_at: new Date().toISOString(),
    ...(status === "processed" ? { processed_at: new Date().toISOString(), error: null } : {}),
  });

  return { status, note, order_id: orderId };
}
