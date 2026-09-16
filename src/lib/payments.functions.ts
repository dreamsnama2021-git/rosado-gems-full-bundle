import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = z.enum(["razorpay", "paypal", "payoneer"]);

/** Public, non-secret gateway info the checkout needs to launch a payment. */
export const getPaymentOptions = createServerFn({ method: "GET" }).handler(async () => {
  const { loadGatewaySettings, PAYPAL_CURRENCIES } = await import("@/lib/payments.server");
  const s = await loadGatewaySettings();
  const razorpayReady = s.razorpay_enabled && !!s.razorpay_key_id && !!s.razorpay_key_secret;
  const paypalReady = s.paypal_enabled && !!s.paypal_client_id && !!s.paypal_client_secret;
  const payoneerReady = s.payoneer_enabled && !!s.payoneer_merchant_code && !!s.payoneer_api_key;
  return {
    default_gateway: s.default_gateway,
    razorpay: { enabled: razorpayReady, key_id: razorpayReady ? s.razorpay_key_id : "", mode: s.razorpay_mode },
    paypal: { enabled: paypalReady, mode: s.paypal_mode, currencies: PAYPAL_CURRENCIES },
    payoneer: { enabled: payoneerReady, mode: s.payoneer_mode },
    online_enabled: razorpayReady || paypalReady || payoneerReady,
  };
});

/** Creates the gateway-side order for an existing storefront order. */
export const createPaymentSession = createServerFn({ method: "POST" })
  .inputValidator((d: { order_id: string; gateway: "razorpay" | "paypal" | "payoneer"; origin?: string }) =>
    z.object({ order_id: z.string().uuid(), gateway: GATEWAY, origin: z.string().url().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { loadGatewaySettings, razorpayCreateOrder, paypalCreateOrder, payoneerCreateSession } =
      await import("@/lib/payments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await loadGatewaySettings();

    const { data: order } = await supabaseAdmin
      .from("orders").select("id, total, currency, payment_status, contact_email, shipping_address").eq("id", data.order_id).maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.payment_status === "paid") return { alreadyPaid: true as const };

    const amount = Number(order.total);
    const currency = String(order.currency ?? "INR").toUpperCase();

    if (data.gateway === "razorpay") {
      if (!s.razorpay_enabled || !s.razorpay_key_id || !s.razorpay_key_secret) throw new Error("Razorpay is not configured");
      const rzp = await razorpayCreateOrder(s, { amount, currency, receipt: order.id, notes: { order_id: order.id } });
      await supabaseAdmin.from("orders")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ payment_gateway: "razorpay", gateway_order_id: rzp.id } as any).eq("id", order.id);
      return {
        gateway: "razorpay" as const,
        key_id: s.razorpay_key_id,
        gateway_order_id: rzp.id,
        amount: rzp.amount,
        currency: rzp.currency,
        email: order.contact_email ?? "",
      };
    }

    const origin = data.origin ?? "";

    if (data.gateway === "payoneer") {
      if (!s.payoneer_enabled || !s.payoneer_merchant_code || !s.payoneer_api_key) throw new Error("Payoneer is not configured");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ship = ((order as any).shipping_address ?? {}) as { country?: string };
      const session = await payoneerCreateSession(s, {
        amount, currency, reference: order.id,
        email: order.contact_email ?? undefined,
        country: ship.country || "IN",
        returnUrl: `${origin}/order-confirmation/${order.id}?payoneer=1`,
        cancelUrl: `${origin}/order-confirmation/${order.id}?payoneer=cancel`,
      });
      await supabaseAdmin.from("orders")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ payment_gateway: "payoneer", gateway_order_id: session.id } as any).eq("id", order.id);
      return { gateway: "payoneer" as const, gateway_order_id: session.id, approveUrl: session.hostedUrl };
    }

    if (!s.paypal_enabled || !s.paypal_client_id || !s.paypal_client_secret) throw new Error("PayPal is not configured");
    const pp = await paypalCreateOrder(s, {
      amount, currency, reference: order.id,
      email: order.contact_email ?? undefined,
      returnUrl: `${origin}/order-confirmation/${order.id}?paypal=1`,
      cancelUrl: `${origin}/order-confirmation/${order.id}?paypal=cancel`,
    });
    await supabaseAdmin.from("orders")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ payment_gateway: "paypal", gateway_order_id: pp.id } as any).eq("id", order.id);
    return { gateway: "paypal" as const, gateway_order_id: pp.id, approveUrl: pp.approveUrl };
  });

/** Verifies (Razorpay) or captures (PayPal / Payoneer) a payment and marks the order paid. */
export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator((d: {
    order_id: string; gateway: "razorpay" | "paypal" | "payoneer";
    razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string;
  }) => z.object({
    order_id: z.string().uuid(),
    gateway: GATEWAY,
    razorpay_order_id: z.string().optional(),
    razorpay_payment_id: z.string().optional(),
    razorpay_signature: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const {
      loadGatewaySettings, razorpayVerifySignature, razorpayFetchPayment,
      paypalCaptureOrder, payoneerGetSession, markOrderPaid,
    } = await import("@/lib/payments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await loadGatewaySettings();

    const { data: order } = await supabaseAdmin
      .from("orders").select("id, total, currency, payment_status, gateway_order_id").eq("id", data.order_id).maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.payment_status === "paid") return { status: "paid" as const };

    if (data.gateway === "razorpay") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) throw new Error("Incomplete Razorpay response");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((order as any).gateway_order_id && (order as any).gateway_order_id !== razorpay_order_id) throw new Error("Payment does not belong to this order");
      const ok = razorpayVerifySignature(s.razorpay_key_secret, `${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature);
      if (!ok) throw new Error("Payment signature verification failed");
      const payment = await razorpayFetchPayment(s, razorpay_payment_id);
      if (payment.status !== "captured" && payment.status !== "authorized") throw new Error(`Payment is ${payment.status ?? "incomplete"}`);
      await markOrderPaid(order.id, "razorpay", razorpay_payment_id);
      return { status: "paid" as const };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gatewayOrderId = (order as any).gateway_order_id as string | null;

    if (data.gateway === "payoneer") {
      if (!gatewayOrderId) throw new Error("No Payoneer session to verify");
      const res = await payoneerGetSession(s, gatewayOrderId);
      if (!res.paid) throw new Error(`Payoneer reports this payment as ${res.code || "incomplete"}`);
      await markOrderPaid(order.id, "payoneer", gatewayOrderId);
      return { status: "paid" as const };
    }

    if (!gatewayOrderId) throw new Error("No PayPal order to capture");
    const cap = await paypalCaptureOrder(s, gatewayOrderId);
    if (cap.status !== "COMPLETED") throw new Error(`PayPal payment is ${cap.status}`);
    await markOrderPaid(order.id, "paypal", cap.captureId);
    return { status: "paid" as const };
  });

/** Admin-only credential check so the merchant can confirm live keys work. */
export const adminTestGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { gateway: "razorpay" | "paypal" | "payoneer" }) => z.object({ gateway: GATEWAY }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdminUser } = await import("@/lib/admin-role");
    await assertAdminUser(context.supabase, context.userId);
    const { loadGatewaySettings, razorpayCreateOrder, paypalToken, paypalBase, payoneerBase, payoneerCreateSession } =
      await import("@/lib/payments.server");
    const s = await loadGatewaySettings();
    if (data.gateway === "razorpay") {
      if (!s.razorpay_key_id || !s.razorpay_key_secret) throw new Error("Add the Razorpay Key ID and Key Secret first");
      const o = await razorpayCreateOrder(s, { amount: 1, currency: "INR", receipt: `test_${Date.now()}`, notes: { test: "1" } });
      return { ok: true, detail: `Connected in ${s.razorpay_mode} mode (test order ${o.id})` };
    }
    if (data.gateway === "payoneer") {
      if (!s.payoneer_merchant_code || !s.payoneer_api_key) throw new Error("Add the Payoneer Merchant Code and API Key first");
      const session = await payoneerCreateSession(s, {
        amount: 1, currency: "USD", reference: `test-${Date.now()}`,
        returnUrl: "https://rosadogems.com/order-confirmation/test?payoneer=1",
        cancelUrl: "https://rosadogems.com/order-confirmation/test?payoneer=cancel",
      });
      return { ok: true, detail: `Connected to ${payoneerBase(s).replace("https://", "")} (${s.payoneer_mode}, session ${session.id.slice(0, 10)}…)` };
    }
    if (!s.paypal_client_id || !s.paypal_client_secret) throw new Error("Add the PayPal Client ID and Secret first");
    await paypalToken(s);
    return { ok: true, detail: `Connected to ${paypalBase(s).replace("https://", "")} (${s.paypal_mode})` };
  });


/** Lightweight, public payment state for an order id (used by the confirmation page). */
export const getOrderPaymentStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { order_id: string }) => z.object({ order_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, total, currency, payment_status, payment_method, payment_gateway, status, created_at, paid_at, refunded_total")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    const { data: refunds } = await supabaseAdmin
      .from("order_refunds")
      .select("amount, created_at, status")
      .eq("order_id", data.order_id)
      .order("created_at", { ascending: true });
    return {
      id: order.id,
      total: Number(order.total),
      currency: String(order.currency ?? "INR"),
      payment_status: String(order.payment_status ?? "unpaid"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payment_method: String((order as any).payment_method ?? ""),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payment_gateway: ((order as any).payment_gateway ?? null) as "razorpay" | "paypal" | "payoneer" | null,
      status: String(order.status ?? ""),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      created_at: String((order as any).created_at ?? ""),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paid_at: ((order as any).paid_at ?? null) as string | null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      refunded_total: Number((order as any).refunded_total ?? 0),
      refunds: (refunds ?? []).map((r) => ({
        amount: Number((r as { amount: number }).amount ?? 0),
        created_at: String((r as { created_at: string }).created_at),
        status: String((r as { status: string }).status ?? "processed"),
      })),
    };
  });
