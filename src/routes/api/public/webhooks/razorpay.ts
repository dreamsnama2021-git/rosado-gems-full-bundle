import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const { loadGatewaySettings, razorpayVerifySignature, markOrderPaid } = await import("@/lib/payments.server");
        const { collectHeaders, logWebhookEvent } = await import("@/lib/webhook-log.server");
        const headers = collectHeaders(request.headers);
        const s = await loadGatewaySettings();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let event: any = {};
        try { event = JSON.parse(raw); } catch { /* logged as unparsed */ }
        const entity = event?.payload?.payment?.entity;

        const valid = !!s.razorpay_webhook_secret && !!signature && razorpayVerifySignature(s.razorpay_webhook_secret, raw, signature);
        if (!valid) {
          await logWebhookEvent({
            gateway: "razorpay", event_type: event?.event ?? null, event_id: entity?.id ?? null,
            signature, signature_valid: false, headers, raw_body: raw,
            status: "invalid_signature", error: "Signature verification failed",
          });
          return new Response("Invalid signature", { status: 401 });
        }

        let orderId: string | null = entity?.notes?.order_id ?? null;
        let status = "ignored";
        let error: string | null = null;
        try {
          if ((event?.event === "payment.captured" || event?.event === "order.paid") && entity?.id) {
            if (!orderId && entity.order_id) {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data } = await (supabaseAdmin.from("orders") as any).select("id").eq("gateway_order_id", entity.order_id).maybeSingle();
              orderId = data?.id ?? null;
            }
            if (orderId) {
              await markOrderPaid(orderId, "razorpay", entity.id);
              status = "processed";
            } else {
              status = "unmatched";
            }
          }
        } catch (e) {
          status = "failed";
          error = (e as Error).message;
        }

        await logWebhookEvent({
          gateway: "razorpay", event_type: event?.event ?? null, event_id: entity?.id ?? null,
          order_id: orderId, signature, signature_valid: true, headers, raw_body: raw, status, error,
        });
        return new Response("ok");
      },
    },
  },
});
