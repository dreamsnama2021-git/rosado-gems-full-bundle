/**
 * Server-only helpers for the live payment gateways (Razorpay + PayPal).
 * Credentials are read from the admin-managed `payment_settings` row, so the
 * merchant only has to paste real keys in Admin → Payments for this to go live.
 */
import { createHmac, timingSafeEqual } from "crypto";

export type GatewaySettings = {
  default_gateway: string;
  razorpay_enabled: boolean;
  razorpay_mode: string;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  razorpay_webhook_secret: string;
  paypal_enabled: boolean;
  paypal_mode: string;
  paypal_client_id: string;
  paypal_client_secret: string;
  paypal_webhook_id: string;
  payoneer_enabled: boolean;
  payoneer_mode: string;
  payoneer_merchant_code: string;
  payoneer_api_key: string;
  payoneer_division: string;
  payoneer_webhook_secret: string;
};

export async function loadGatewaySettings(): Promise<GatewaySettings> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("payment_settings").select("*").eq("id", "default").maybeSingle();
  const r = (data ?? {}) as Partial<GatewaySettings>;
  return {
    default_gateway: r.default_gateway ?? "razorpay",
    razorpay_enabled: !!r.razorpay_enabled,
    razorpay_mode: r.razorpay_mode ?? "test",
    razorpay_key_id: (r.razorpay_key_id ?? "").trim(),
    razorpay_key_secret: (r.razorpay_key_secret ?? "").trim(),
    razorpay_webhook_secret: (r.razorpay_webhook_secret ?? "").trim(),
    paypal_enabled: !!r.paypal_enabled,
    paypal_mode: r.paypal_mode ?? "sandbox",
    paypal_client_id: (r.paypal_client_id ?? "").trim(),
    paypal_client_secret: (r.paypal_client_secret ?? "").trim(),
    paypal_webhook_id: (r.paypal_webhook_id ?? "").trim(),
    payoneer_enabled: !!r.payoneer_enabled,
    payoneer_mode: r.payoneer_mode ?? "sandbox",
    payoneer_merchant_code: (r.payoneer_merchant_code ?? "").trim(),
    payoneer_api_key: (r.payoneer_api_key ?? "").trim(),
    payoneer_division: (r.payoneer_division ?? "").trim(),
    payoneer_webhook_secret: (r.payoneer_webhook_secret ?? "").trim(),
  };
}


/* ---------------------------------- Razorpay --------------------------------- */

function rzpAuth(s: GatewaySettings) {
  return "Basic " + Buffer.from(`${s.razorpay_key_id}:${s.razorpay_key_secret}`).toString("base64");
}

// Razorpay works in the smallest currency unit (paise/cents).
export function toMinorUnits(amount: number) {
  return Math.round(Number(amount) * 100);
}

export async function razorpayCreateOrder(s: GatewaySettings, args: { amount: number; currency: string; receipt: string; notes?: Record<string, string> }) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: rzpAuth(s), "content-type": "application/json" },
    body: JSON.stringify({
      amount: toMinorUnits(args.amount),
      currency: args.currency,
      receipt: args.receipt.slice(0, 40),
      notes: args.notes ?? {},
      payment_capture: 1,
    }),
  });
  const json = (await res.json()) as { id?: string; error?: { description?: string } };
  if (!res.ok || !json.id) throw new Error(json.error?.description ?? "Razorpay could not create the payment order");
  return json as { id: string; amount: number; currency: string };
}

export async function razorpayFetchPayment(s: GatewaySettings, paymentId: string) {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, { headers: { Authorization: rzpAuth(s) } });
  const json = (await res.json()) as { id?: string; status?: string; order_id?: string; amount?: number; currency?: string; error?: { description?: string } };
  if (!res.ok) throw new Error(json.error?.description ?? "Could not verify the Razorpay payment");
  return json;
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function razorpayVerifySignature(secret: string, payload: string, signature: string) {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return safeEqual(expected, signature);
}

/* ----------------------------------- PayPal ---------------------------------- */

export function paypalBase(s: GatewaySettings) {
  return s.paypal_mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export async function paypalToken(s: GatewaySettings) {
  const res = await fetch(`${paypalBase(s)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${s.paypal_client_id}:${s.paypal_client_secret}`).toString("base64"),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !json.access_token) throw new Error(json.error_description ?? "PayPal credentials were rejected");
  return json.access_token;
}

/** Currencies PayPal can actually charge. INR is deliberately absent — PayPal
 *  rejects INR for cross-border checkout, which is the usual reason a correctly
 *  configured PayPal account still fails to take a payment. */
export const PAYPAL_CURRENCIES = [
  "AUD", "BRL", "CAD", "CNY", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY", "MYR", "MXN",
  "TWD", "NZD", "NOK", "PHP", "PLN", "GBP", "SGD", "SEK", "CHF", "THB", "USD",
];
const ZERO_DECIMAL = new Set(["JPY", "HUF", "TWD"]);

export function paypalSupportsCurrency(currency: string) {
  return PAYPAL_CURRENCIES.includes(String(currency).toUpperCase());
}

function paypalAmountValue(amount: number, currency: string) {
  return ZERO_DECIMAL.has(currency.toUpperCase())
    ? String(Math.round(Number(amount)))
    : Number(amount).toFixed(2);
}

/** Turns PayPal's nested error envelope into one readable sentence. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function paypalError(json: any, fallback: string) {
  const issue = json?.details?.[0];
  const parts = [
    issue?.description || issue?.issue || json?.message || fallback,
    json?.debug_id ? `(PayPal ref ${json.debug_id})` : "",
  ].filter(Boolean);
  return parts.join(" ");
}

export async function paypalCreateOrder(
  s: GatewaySettings,
  args: {
    amount: number; currency: string; reference: string; returnUrl: string; cancelUrl: string;
    email?: string; brandName?: string;
  },
) {
  const currency = args.currency.toUpperCase();
  if (!paypalSupportsCurrency(currency)) {
    throw new Error(`PayPal does not accept ${currency}. Use Razorpay for ${currency} orders, or price this order in a PayPal-supported currency such as USD.`);
  }
  const token = await paypalToken(s);
  const res = await fetch(`${paypalBase(s)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      // Idempotency: retrying the same order never creates a duplicate PayPal order.
      "PayPal-Request-Id": `order-${args.reference}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: args.reference,
        custom_id: args.reference,
        invoice_id: `${args.reference.slice(0, 8)}-${Date.now().toString().slice(-6)}`,
        amount: { currency_code: currency, value: paypalAmountValue(args.amount, currency) },
      }],
      ...(args.email ? { payer: { email_address: args.email } } : {}),
      application_context: {
        brand_name: (args.brandName ?? "Rosado Gems").slice(0, 127),
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        landing_page: "LOGIN",
        return_url: args.returnUrl,
        cancel_url: args.cancelUrl,
      },
    }),
  });
  const json = (await res.json()) as { id?: string; links?: Array<{ rel: string; href: string }>; message?: string };
  if (!res.ok || !json.id) throw new Error(paypalError(json, "PayPal could not create the payment order"));
  const approve = json.links?.find((l) => l.rel === "approve" || l.rel === "payer-action")?.href;
  if (!approve) throw new Error("PayPal did not return an approval link");
  return { id: json.id, approveUrl: approve };
}

type PaypalOrderJson = {
  id?: string; status?: string; message?: string;
  purchase_units?: Array<{ payments?: { captures?: Array<{ id: string; status: string; amount?: { value?: string; currency_code?: string } }> } }>;
};

export async function paypalGetOrder(s: GatewaySettings, orderId: string) {
  const token = await paypalToken(s);
  const res = await fetch(`${paypalBase(s)}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as PaypalOrderJson;
  if (!res.ok) throw new Error(paypalError(json, "Could not read the PayPal order"));
  return json;
}

function captureFrom(json: PaypalOrderJson) {
  return json.purchase_units?.[0]?.payments?.captures?.[0];
}

export async function paypalCaptureOrder(s: GatewaySettings, orderId: string) {
  const token = await paypalToken(s);
  const res = await fetch(`${paypalBase(s)}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      // A retried capture returns the original result instead of erroring.
      "PayPal-Request-Id": `capture-${orderId}`,
      Prefer: "return=representation",
    },
    body: "{}",
  });
  const json = (await res.json()) as PaypalOrderJson & { details?: Array<{ issue?: string; description?: string }> };

  if (!res.ok && json.status !== "COMPLETED") {
    const issue = json.details?.[0]?.issue ?? "";
    // Already captured (double return / webhook race): read the real state instead of failing.
    if (issue === "ORDER_ALREADY_CAPTURED" || issue === "DUPLICATE_INVOICE_ID") {
      const fresh = await paypalGetOrder(s, orderId);
      const cap = captureFrom(fresh);
      return { status: fresh.status ?? "COMPLETED", captureId: cap?.id ?? orderId, amount: cap?.amount };
    }
    if (issue === "ORDER_NOT_APPROVED") {
      throw new Error("This PayPal payment was not approved yet — complete the approval in the PayPal window and try again.");
    }
    if (issue === "INSTRUMENT_DECLINED" || issue === "PAYER_ACTION_REQUIRED") {
      throw new Error("PayPal declined the payment method. Ask the customer to pick another card or PayPal balance and retry.");
    }
    throw new Error(paypalError(json, "PayPal could not capture the payment"));
  }

  const capture = captureFrom(json);
  return { status: json.status ?? capture?.status ?? "UNKNOWN", captureId: capture?.id ?? json.id ?? orderId, amount: capture?.amount };
}

/* ---------------------------------- Payoneer --------------------------------- */

export function payoneerBase(s: GatewaySettings) {
  return s.payoneer_mode === "live" ? "https://api.live.oscato.com" : "https://api.sandbox.oscato.com";
}

function payoneerAuth(s: GatewaySettings) {
  return "Basic " + Buffer.from(`${s.payoneer_merchant_code}:${s.payoneer_api_key}`).toString("base64");
}

type PayoneerList = {
  identification?: { longId?: string; shortId?: string };
  links?: Record<string, string>;
  redirect?: { url?: string };
  status?: { code?: string; reason?: string };
  payment?: { amount?: number; currency?: string };
  resultInfo?: string;
};

/**
 * Creates a Payoneer Checkout hosted LIST session and returns the URL the
 * shopper must be sent to. Payoneer returns the hosted page under `links.self`
 * (HOSTED integration) or `redirect.url`.
 */
export async function payoneerCreateSession(
  s: GatewaySettings,
  args: { amount: number; currency: string; reference: string; returnUrl: string; cancelUrl: string; email?: string; country?: string },
) {
  const res = await fetch(`${payoneerBase(s)}/api/lists`, {
    method: "POST",
    headers: { Authorization: payoneerAuth(s), "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      transactionId: args.reference,
      integration: "HOSTED",
      country: (args.country ?? "IN").toUpperCase(),
      ...(s.payoneer_division ? { division: s.payoneer_division } : {}),
      customer: args.email ? { email: args.email } : undefined,
      payment: {
        amount: Number(Number(args.amount).toFixed(2)),
        currency: args.currency.toUpperCase(),
        reference: args.reference.slice(0, 35),
      },
      callback: {
        returnUrl: args.returnUrl,
        cancelUrl: args.cancelUrl,
        summaryUrl: args.returnUrl,
        notificationUrl: args.returnUrl.replace(/\/order-confirmation\/.*$/, "/api/public/webhooks/payoneer"),
      },
      style: { language: "en_US" },
    }),
  });
  const json = (await res.json()) as PayoneerList & { resultInfo?: string };
  const url = json.links?.self || json.redirect?.url || json.links?.["self"];
  if (!res.ok || !json.identification?.longId || !url) {
    throw new Error(json.resultInfo || json.status?.reason || "Payoneer could not start the payment session");
  }
  return { id: json.identification.longId, hostedUrl: url };
}

/** Reads the current state of a Payoneer LIST session. */
export async function payoneerGetSession(s: GatewaySettings, listId: string) {
  const res = await fetch(`${payoneerBase(s)}/api/lists/${listId}?view=jsonForms`, {
    headers: { Authorization: payoneerAuth(s), accept: "application/json" },
  });
  const json = (await res.json()) as PayoneerList;
  if (!res.ok) throw new Error(json.resultInfo || "Could not read the Payoneer payment session");
  const code = (json.status?.code ?? "").toUpperCase();
  const paid = code === "CHARGED" || code === "PAID" || code === "CLOSED_SUCCESS";
  return { paid, code, raw: json as unknown as Record<string, unknown> };
}

export function payoneerVerifyNotification(secret: string, payload: string, signature: string) {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return safeEqual(expected, signature);
}


export async function paypalVerifyWebhook(s: GatewaySettings, headers: Headers, rawBody: string) {
  if (!s.paypal_webhook_id) return false;
  const token = await paypalToken(s);
  const res = await fetch(`${paypalBase(s)}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: s.paypal_webhook_id,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  const json = (await res.json()) as { verification_status?: string };
  return json.verification_status === "SUCCESS";
}

/* ------------------------------- shared helpers ------------------------------ */

export async function markOrderPaid(orderId: string, gateway: string, paymentId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("orders")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ payment_status: "paid", payment_gateway: gateway, gateway_payment_id: paymentId, paid_at: new Date().toISOString() } as any)
    .eq("id", orderId);
}

/* ------------------------------- refunds ------------------------------- */

export async function razorpayRefund(
  s: GatewaySettings,
  args: { paymentId: string; amount?: number; notes?: Record<string, string> },
) {
  const body: Record<string, unknown> = { speed: "normal", notes: args.notes ?? {} };
  if (args.amount != null) body.amount = toMinorUnits(args.amount);
  const res = await fetch(`https://api.razorpay.com/v1/payments/${args.paymentId}/refund`, {
    method: "POST",
    headers: { Authorization: rzpAuth(s), "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    id?: string; status?: string; amount?: number; currency?: string; error?: { description?: string };
  };
  if (!res.ok || !json.id) throw new Error(json.error?.description ?? "Razorpay could not process the refund");
  return {
    refundId: json.id,
    status: json.status ?? "processed",
    amount: json.amount != null ? json.amount / 100 : args.amount ?? 0,
    currency: json.currency ?? "INR",
    raw: json as unknown as Record<string, unknown>,
  };
}

export async function paypalRefund(
  s: GatewaySettings,
  args: { captureId: string; amount?: number; currency: string; note?: string },
) {
  const token = await paypalToken(s);
  const payload: Record<string, unknown> = {};
  if (args.amount != null) payload.amount = { value: Number(args.amount).toFixed(2), currency_code: args.currency };
  if (args.note) payload.note_to_payer = args.note.slice(0, 255);
  const res = await fetch(`${paypalBase(s)}/v2/payments/captures/${args.captureId}/refund`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as {
    id?: string; status?: string; message?: string;
    amount?: { value?: string; currency_code?: string };
    details?: Array<{ description?: string }>;
  };
  if (!res.ok || !json.id) {
    throw new Error(json.details?.[0]?.description ?? json.message ?? "PayPal could not process the refund");
  }
  return {
    refundId: json.id,
    status: (json.status ?? "COMPLETED").toLowerCase(),
    amount: json.amount?.value ? Number(json.amount.value) : args.amount ?? 0,
    currency: json.amount?.currency_code ?? args.currency,
    raw: json as unknown as Record<string, unknown>,
  };
}
