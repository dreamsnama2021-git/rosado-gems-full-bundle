import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";

export type WebhookEvent = {
  id: string;
  gateway: string;
  event_type: string | null;
  event_id: string | null;
  order_id: string | null;
  signature: string | null;
  signature_valid: boolean;
  headers: Record<string, string>;
  payload_json: string;
  raw_body: string;
  status: string;
  error: string | null;
  note: string | null;
  recheck_count: number;
  last_recheck_at: string | null;
  processed_at: string | null;
  received_at: string;
};

/** Admin-only listing of inbound gateway webhooks, newest first. */
export const adminListWebhookEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { gateway?: string; status?: string; limit?: number }) =>
    z.object({
      gateway: z.enum(["all", "razorpay", "paypal", "payoneer"]).optional(),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabaseAdmin.from("payment_webhook_events") as any)
      .select("*")
      .order("received_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.gateway && data.gateway !== "all") q = q.eq("gateway", data.gateway);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: WebhookEvent[] = ((rows ?? []) as any[]).map((r) => ({
      id: String(r.id),
      gateway: String(r.gateway),
      event_type: r.event_type ?? null,
      event_id: r.event_id ?? null,
      order_id: r.order_id ?? null,
      signature: r.signature ?? null,
      signature_valid: !!r.signature_valid,
      headers: (r.headers ?? {}) as Record<string, string>,
      payload_json: JSON.stringify(r.payload ?? {}, null, 2),
      raw_body: String(r.raw_body ?? ""),
      status: String(r.status ?? "received"),
      error: r.error ?? null,
      note: r.note ?? null,
      recheck_count: Number(r.recheck_count ?? 0),
      last_recheck_at: r.last_recheck_at ?? null,
      processed_at: r.processed_at ?? null,
      received_at: String(r.received_at),
    }));
    return { events };
  });

/** Re-asks the gateway about a stored event and reconciles the order. */
export const adminRecheckWebhookEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { recheckWebhookEvent } = await import("@/lib/webhook-log.server");
    return await recheckWebhookEvent(data.id);
  });
