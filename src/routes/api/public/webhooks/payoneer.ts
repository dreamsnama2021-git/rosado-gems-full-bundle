import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/payoneer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { loadGatewaySettings, payoneerVerifyNotification, payoneerGetSession, markOrderPaid } =
          await import("@/lib/payments.server");
        const { collectHeaders, logWebhookEvent } = await import("@/lib/webhook-log.server");
        const headers = collectHeaders(request.headers);
        const signature =
          request.headers.get("x-payoneer-signature") ??
          request.headers.get("x-signature") ??
          "";
        const s = await loadGatewaySettings();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let event: any = {};
        try { event = JSON.parse(raw); } catch { /* logged as unparsed */ }

        const listId: string | null =
          event?.identification?.longId ?? event?.listId ?? event?.notification?.listId ?? null;

        // Payoneer only signs notifications when a shared secret is configured.
        if (s.payoneer_webhook_secret) {
          const ok = payoneerVerifyNotification(s.payoneer_webhook_secret, raw, signature);
          if (!ok) {
            await logWebhookEvent({
              gateway: "payoneer", event_type: event?.notificationType ?? null, event_id: listId,
              signature, signature_valid: false, headers, raw_body: raw,
              status: "invalid_signature", error: "Signature verification failed",
            });
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let orderId: string | null = event?.transactionId ?? event?.payment?.reference ?? null;
        let status = "ignored";
        let error: string | null = null;
        try {
          if (listId) {
            if (!orderId) {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data } = await (supabaseAdmin.from("orders") as any)
                .select("id").eq("gateway_order_id", listId).maybeSingle();
              orderId = data?.id ?? null;
            }
            // Always re-read the session server-side rather than trusting the payload.
            const res = await payoneerGetSession(s, listId);
            if (res.paid && orderId) {
              await markOrderPaid(orderId, "payoneer", listId);
              status = "processed";
            } else if (!orderId) {
              status = "unmatched";
            }
          }
        } catch (e) {
          status = "failed";
          error = (e as Error).message;
        }

        await logWebhookEvent({
          gateway: "payoneer", event_type: event?.notificationType ?? null, event_id: listId,
          order_id: orderId, signature, signature_valid: true, headers, raw_body: raw, status, error,
        });
        return new Response("ok");
      },
    },
  },
});
