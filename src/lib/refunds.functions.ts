import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";

export type OrderRefund = {
  id: string;
  order_id: string;
  gateway: string;
  gateway_refund_id: string | null;
  amount: number;
  currency: string;
  reason: string | null;
  status: string;
  is_manual: boolean;
  created_by_email: string | null;
  created_at: string;
};

/** Refund summary for one order: what was paid, what is already refunded, what is left. */
export const adminGetOrderRefunds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { order_id: string }) => z.object({ order_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, total, currency, payment_method, payment_status, payment_gateway, gateway_payment_id")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw error;
    if (!order) throw new Error("Order not found");

    const { data: rows } = await supabaseAdmin
      .from("order_refunds")
      .select("*")
      .eq("order_id", data.order_id)
      .order("created_at", { ascending: false });

    const refunds = (rows ?? []) as unknown as OrderRefund[];
    const refunded = refunds.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const total = Number(order.total || 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = order as any;
    return {
      refunds,
      total,
      refunded: Math.round(refunded * 100) / 100,
      refundable: Math.max(0, Math.round((total - refunded) * 100) / 100),
      currency: o.currency ?? "INR",
      gateway: (o.payment_gateway as string | null) ?? (o.payment_method === "cod" ? "cod" : null),
      gateway_payment_id: (o.gateway_payment_id as string | null) ?? null,
      payment_status: o.payment_status as string,
    };
  });

/**
 * Issues a partial or full refund through the original gateway (Razorpay or
 * PayPal) and records it in the refunds ledger. `manual` records an offline
 * refund (bank transfer, COD, cash) without calling any gateway.
 */
export const adminRefundOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { order_id: string; amount: number; reason?: string; manual?: boolean; notify?: boolean }) =>
    z.object({
      order_id: z.string().uuid(),
      amount: z.number().positive(),
      reason: z.string().max(500).optional(),
      manual: z.boolean().optional(),
      notify: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin.from("orders").select("*").eq("id", data.order_id).maybeSingle();
    if (error) throw error;
    if (!order) throw new Error("Order not found");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = order as any;

    const { data: prior } = await supabaseAdmin.from("order_refunds").select("amount").eq("order_id", data.order_id);
    const alreadyRefunded = (prior ?? []).reduce((s, r) => s + Number((r as { amount: number }).amount || 0), 0);
    const total = Number(o.total || 0);
    const amount = Math.round(Number(data.amount) * 100) / 100;
    const refundable = Math.round((total - alreadyRefunded) * 100) / 100;
    if (amount > refundable + 0.001) {
      throw new Error(`Only ${refundable.toFixed(2)} is left to refund on this order`);
    }

    const currency = (o.currency as string) ?? "INR";
    const gateway = (o.payment_gateway as string | null) ?? null;
    const paymentId = (o.gateway_payment_id as string | null) ?? null;

    let gatewayRefundId: string | null = null;
    let status = "processed";
    let raw: Record<string, unknown> = {};
    const manual = !!data.manual || !gateway || !paymentId || !["paid", "partially_refunded"].includes(String(o.payment_status));

    if (!manual) {
      const gw = await import("@/lib/payments.server");
      const settings = await gw.loadGatewaySettings();
      if (gateway === "razorpay") {
        if (!settings.razorpay_key_id || !settings.razorpay_key_secret) throw new Error("Razorpay keys are not configured");
        const r = await gw.razorpayRefund(settings, {
          paymentId: paymentId!,
          amount,
          notes: { order_id: String(o.id), reason: data.reason ?? "" },
        });
        gatewayRefundId = r.refundId;
        status = r.status;
        raw = r.raw;
      } else if (gateway === "paypal") {
        if (!settings.paypal_client_id || !settings.paypal_client_secret) throw new Error("PayPal credentials are not configured");
        const r = await gw.paypalRefund(settings, {
          captureId: paymentId!,
          amount,
          currency,
          ...(data.reason ? { note: data.reason } : {}),
        });
        gatewayRefundId = r.refundId;
        status = r.status === "completed" ? "processed" : r.status;
        raw = r.raw;
      } else {
        throw new Error(`Refunds are not supported for the "${gateway}" payment method — record it as a manual refund instead`);
      }
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("order_refunds")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        order_id: data.order_id,
        gateway: manual ? (gateway ?? o.payment_method ?? "manual") : gateway,
        gateway_refund_id: gatewayRefundId,
        amount,
        currency,
        reason: data.reason ?? null,
        status,
        is_manual: manual,
        created_by: context.userId,
        created_by_email: (context.claims as { email?: string } | undefined)?.email ?? null,
        raw,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select("*")
      .single();
    if (insErr) throw insErr;

    const refundedTotal = Math.round((alreadyRefunded + amount) * 100) / 100;
    const fully = refundedTotal >= total - 0.001;
    const patch: Record<string, unknown> = { refunded_total: refundedTotal };
    if (fully) {
      patch.payment_status = "refunded";
      patch.status = "refunded";
    } else if (o.payment_status === "paid") {
      patch.payment_status = "partially_refunded";
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabaseAdmin.from("orders").update(patch as any).eq("id", data.order_id);

    const label = `${currency} ${amount.toFixed(2)}`;
    const insertedRow = inserted as unknown as { id: string };
    const reference = gatewayRefundId || `RF-${insertedRow.id.slice(0, 8).toUpperCase()}`;
    await supabaseAdmin.from("order_messages").insert({
      order_id: data.order_id,
      direction: "outbound",
      subject: fully ? "Refund issued" : "Partial refund issued",
      body: `A refund of ${label} has been ${manual ? "recorded" : "sent to your original payment method"}.${
        data.reason ? `\n\nReason: ${data.reason}` : ""
      }\n\nRefund reference: ${reference}\nOrder: ${String(data.order_id).slice(0, 8).toUpperCase()}`,
      status_snapshot: fully ? "refunded" : "partially_refunded",
      visible_to_customer: data.notify !== false,
      author_id: context.userId,
      author_name: "Rosado Gems",
      author_email: (context.claims as { email?: string } | undefined)?.email ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);


    return {
      ok: true,
      refund: inserted as unknown as OrderRefund,
      refunded: refundedTotal,
      refundable: Math.max(0, Math.round((total - refundedTotal) * 100) / 100),
      fully,
      manual,
    };
  });
