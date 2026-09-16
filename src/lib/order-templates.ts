// Predefined order-update messages the admin can send to a customer.
// Placeholders are filled in from the order before the message is sent.

export type OrderTemplate = {
  key: string;
  label: string;
  /** Optional order status to apply when this template is sent. */
  status?: string;
  /** Optional payment status to apply when this template is sent. */
  paymentStatus?: string;
  subject: string;
  body: string;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "on_hold",
  "cancelled",
  "refunded",
] as const;

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "partially_refunded", "refunded", "cod_due"] as const;

export const ORDER_TEMPLATES: OrderTemplate[] = [
  {
    key: "order_confirmed",
    label: "Order confirmed",
    status: "confirmed",
    subject: "Your order {{order_no}} is confirmed",
    body:
      "Hello {{customer_name}},\n\nThank you for your order {{order_no}} placed on {{order_date}}.\nWe have confirmed it and our Rosado team has begun preparing your piece.\n\nOrder total: {{order_total}}\n\nWe will write again as soon as it is packed for dispatch.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "payment_received",
    label: "Payment received",
    paymentStatus: "paid",
    subject: "Payment received for order {{order_no}}",
    body:
      "Hello {{customer_name}},\n\nWe have received your payment of {{order_total}} for order {{order_no}}. Your receipt is attached to your account.\n\nThank you for trusting Rosado Gems.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "payment_pending",
    label: "Payment pending / reminder",
    paymentStatus: "pending",
    subject: "Action needed: payment pending for order {{order_no}}",
    body:
      "Hello {{customer_name}},\n\nWe are holding order {{order_no}} for you, but the payment of {{order_total}} has not reached us yet.\nPlease complete the payment so we can begin crafting and dispatch on time.\n\nIf you have already paid, kindly share the transaction reference and we will reconcile it right away.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "cod_confirmation",
    label: "Cash on delivery confirmation",
    status: "confirmed",
    paymentStatus: "cod_due",
    subject: "Please confirm your cash-on-delivery order {{order_no}}",
    body:
      "Hello {{customer_name}},\n\nYour cash-on-delivery order {{order_no}} for {{order_total}} is with us.\nKindly reply with a simple \"confirmed\" so we can dispatch it — the amount will be collected at your doorstep.\n\nDelivery address on file:\n{{shipping_address}}\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "in_production",
    label: "In production / being prepared",
    status: "processing",
    subject: "Your order {{order_no}} is being prepared",
    body:
      "Hello {{customer_name}},\n\nYour order {{order_no}} is now with our craftspeople. Each stone is set and inspected by hand, so please allow 2-4 working days before dispatch.\n\nWe will share tracking details the moment it leaves our studio.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "shipped",
    label: "Shipped with tracking",
    status: "shipped",
    subject: "Your order {{order_no}} has shipped",
    body:
      "Hello {{customer_name}},\n\nGood news — order {{order_no}} is on its way.\n\nCourier: {{courier}}\nTracking number: {{awb}}\nTracking link: {{tracking_url}}\n\nDelivery usually takes 2-5 working days.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "out_for_delivery",
    label: "Out for delivery",
    status: "out_for_delivery",
    subject: "Order {{order_no}} is out for delivery today",
    body:
      "Hello {{customer_name}},\n\nYour order {{order_no}} is out for delivery today. Please keep your phone reachable so our courier partner can hand it over.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "delivered",
    label: "Delivered / thank you",
    status: "delivered",
    subject: "Order {{order_no}} delivered — we hope you love it",
    body:
      "Hello {{customer_name}},\n\nOur records show order {{order_no}} has been delivered. We would love to know how it looks on you — simply reply to this message with a photo or a note.\n\nThank you for choosing Rosado Gems.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "delay",
    label: "Delay apology",
    status: "on_hold",
    subject: "A short delay on your order {{order_no}}",
    body:
      "Hello {{customer_name}},\n\nWe are sorry — order {{order_no}} needs a little more time. The gemstone selected for your piece did not clear our quality check, so we are sourcing a better match.\n\nRevised dispatch date: within 5 working days. If you would prefer a refund instead, just reply and we will process it immediately.\n\nWith apologies,\nRosado Gems",
  },
  {
    key: "address_confirmation",
    label: "Confirm delivery address",
    subject: "Please confirm the delivery address for order {{order_no}}",
    body:
      "Hello {{customer_name}},\n\nBefore we dispatch order {{order_no}}, could you confirm this address is correct?\n\n{{shipping_address}}\n\nReply with any correction and we will update it before packing.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "cancelled",
    label: "Order cancelled",
    status: "cancelled",
    subject: "Order {{order_no}} has been cancelled",
    body:
      "Hello {{customer_name}},\n\nOrder {{order_no}} has been cancelled as requested. Any amount already paid ({{order_total}}) will be returned to the original payment method within 5-7 working days.\n\nWe hope to serve you again soon.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "refund_processed",
    label: "Refund processed",
    status: "refunded",
    paymentStatus: "refunded",
    subject: "Refund processed for order {{order_no}}",
    body:
      "Hello {{customer_name}},\n\nWe have processed a refund of {{order_total}} for order {{order_no}}. Depending on your bank it should reflect within 5-7 working days.\n\nWarm regards,\nRosado Gems",
  },
  {
    key: "custom",
    label: "Custom message",
    subject: "An update on your order {{order_no}}",
    body: "",
  },
];

export type OrderLike = {
  id: string;
  contact_name?: string | null;
  contact_email?: string | null;
  created_at?: string | null;
  total?: number | string | null;
  currency?: string | null;
  courier_name?: string | null;
  awb_code?: string | null;
  tracking_url?: string | null;
  shipping_address?: unknown;
};

export function orderNumber(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function formatAddress(addr: unknown) {
  if (!addr || typeof addr !== "object") return "-";
  const a = addr as Record<string, unknown>;
  return [a.line1, a.line2, a.city, a.state, a.pincode, a.country]
    .map((v) => (v == null ? "" : String(v).trim()))
    .filter(Boolean)
    .join(", ");
}

/** Replace {{placeholders}} in a template with values from the order. */
export function fillTemplate(text: string, order: OrderLike) {
  const currency = order.currency || "INR";
  const total = Number(order.total ?? 0);
  const map: Record<string, string> = {
    order_no: orderNumber(order.id),
    customer_name: order.contact_name || "there",
    customer_email: order.contact_email || "",
    order_date: order.created_at ? new Date(order.created_at).toLocaleDateString() : "",
    order_total: `${currency} ${total.toLocaleString()}`,
    courier: order.courier_name || "our courier partner",
    awb: order.awb_code || "will be shared shortly",
    tracking_url: order.tracking_url || "will be shared shortly",
    shipping_address: formatAddress(order.shipping_address),
  };
  return text.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => map[k] ?? `{{${k}}}`);
}
