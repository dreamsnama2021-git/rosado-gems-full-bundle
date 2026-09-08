import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/paypal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { loadGatewaySettings, paypalVerifyWebhook, markOrderPaid } = await import("@/lib/payments.server");
        const { collectHeaders, logWebhookEvent } = await import("@/lib/webhook-log.server");
        const headers = collectHeaders(request.headers);
        const signature = request.headers.get("paypal-transmission-sig") ?? "";
        const s = await loadGatewaySettings();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let event: any = {};
        try { event = JSON.parse(raw); } catch { /* logged as unparsed */ }

        const verified = await paypalVerifyWebhook(s, request.headers, raw);
        if (!verified) {
          await logWebhookEvent({
            gateway: "paypal", event_type: event?.event_type ?? null, event_id: event?.resource?.id ?? null,
            signature, signature_valid: false, headers, raw_body: raw,
            status: "invalid_signature", error: "Signature verification failed",
          });
          return new Response("Invalid signature", { status: 401 });
        }

        let orderId: string | null = event?.resource?.custom_id ?? null;
        let status = "ignored";
        let error: string | null = null;
        try {
          if (event?.event_type === "PAYMENT.CAPTURE.COMPLETED" && event?.resource?.id) {
            if (!orderId) {
              const ppOrder = event.resource?.supplementary_data?.related_ids?.order_id;
              if (ppOrder) {
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data } = await (supabaseAdmin.from("orders") as any).select("id").eq("gateway_order_id", ppOrder).maybeSingle();
                orderId = data?.id ?? null;
              }
            }
            if (orderId) {
              await markOrderPaid(orderId, "paypal", event.resource.id);
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
          gateway: "paypal", event_type: event?.event_type ?? null, event_id: event?.resource?.id ?? null,
          order_id: orderId, signature, signature_valid: true, headers, raw_body: raw, status, error,
        });
        return new Response("ok");
      },
    },
  },
});
