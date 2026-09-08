import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { CheckCircle2, Loader2, AlertTriangle, XCircle, Clock, RefreshCw, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { confirmPayment, createPaymentSession, getOrderPaymentStatus } from "@/lib/payments.functions";
import { loadRazorpayScript } from "@/lib/razorpay";
import { PaymentTimeline } from "@/components/site/PaymentTimeline";

type PaymentResult = "success" | "failed" | "cancelled" | "pending";

type Search = { paypal?: string; payoneer?: string; payment?: PaymentResult };

export const Route = createFileRoute("/order-confirmation/$id")({
  head: () => ({ meta: [{ title: "Thank you — Rosado Gems" }] }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof s['paypal'] === "string") out.paypal = s['paypal'] as string;
    if (typeof s['payoneer'] === "string") out.payoneer = s['payoneer'] as string;
    const p = s['payment'];
    if (p === "success" || p === "failed" || p === "cancelled" || p === "pending") out.payment = p;
    return out;
  },
  component: Confirmation,
});

type View = "loading" | "capturing" | "paid" | "failed" | "cancelled" | "pending" | "offline";

function Confirmation() {
  const { id } = Route.useParams();
  const { paypal, payoneer, payment } = useSearch({ from: "/order-confirmation/$id" });
  const returning = paypal === "1" ? "paypal" : payoneer === "1" ? "payoneer" : null;
  const [view, setView] = useState<View>(returning ? "capturing" : "loading");
  const [retrying, setRetrying] = useState(false);
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrderPaymentStatus>> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const o = await getOrderPaymentStatus({ data: { order_id: id } });
      setOrder(o);
      if (o.payment_status === "paid") return setView("paid");
      if (o.payment_method === "cod" || !o.payment_gateway) return setView("offline");
      if (paypal === "cancel" || payoneer === "cancel" || payment === "cancelled") return setView("cancelled");
      if (payment === "failed") return setView("failed");
      return setView("pending");
    } catch {
      setView(payment === "success" ? "paid" : "pending");
    }
  }, [id, paypal, payoneer, payment]);

  // PayPal / Payoneer return here after approval — capture, then reconcile.
  useEffect(() => {
    let active = true;
    if (returning) {
      setView("capturing");
      confirmPayment({ data: { order_id: id, gateway: returning } })
        .then(() => { if (active) { setView("paid"); void refresh(); } })
        .catch(() => { if (active) void refresh(); });
      return () => { active = false; };
    }
    refresh();
    return () => { active = false; };
  }, [id, returning, refresh]);

  async function retryPayment() {
    setRetrying(true);
    try {
      const o = await getOrderPaymentStatus({ data: { order_id: id } });
      const gateway = o.payment_gateway ?? "razorpay";
      const session = await createPaymentSession({ data: { order_id: id, gateway, origin: window.location.origin } });
      if ("alreadyPaid" in session) { setView("paid"); return; }
      if (session.gateway === "paypal" || session.gateway === "payoneer") { window.location.href = session.approveUrl; return; }
      await loadRazorpayScript();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Razorpay = (window as any).Razorpay;
      const rzp = new Razorpay({
        key: session.key_id,
        amount: session.amount,
        currency: session.currency,
        order_id: session.gateway_order_id,
        name: "Rosado Gems",
        description: `Order ${id.slice(0, 8).toUpperCase()}`,
        prefill: { email: session.email },
        theme: { color: "#7a1f3d" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (resp: any) => {
          setView("capturing");
          try {
            await confirmPayment({ data: {
              order_id: id, gateway: "razorpay",
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }});
            setView("paid");
            toast.success("Payment successful");
          } catch (e) { toast.error((e as Error).message); setView("failed"); }
        },
        modal: { ondismiss: () => setView("cancelled") },
      });
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message || "Could not restart the payment");
    } finally {
      setRetrying(false);
    }
  }

  const ui = {
    loading: { Icon: Loader2, spin: true, tone: "text-primary", title: "Loading your order", body: "Fetching the latest status of your order…" },
    capturing: { Icon: Loader2, spin: true, tone: "text-primary", title: "Confirming your payment", body: "We're verifying the transaction with the payment gateway. Please don't close this page." },
    paid: { Icon: CheckCircle2, spin: false, tone: "text-primary", title: "Payment successful", body: "Payment received. We'll email your invoice and shipping updates shortly." },
    offline: { Icon: CheckCircle2, spin: false, tone: "text-primary", title: "Thank you", body: "Your order has been received. A member of the rosado team will contact you within one business day to confirm the details." },
    pending: { Icon: Clock, spin: false, tone: "text-primary", title: "Payment pending", body: "Your order is saved but we haven't received the payment yet. If it was already debited, it will reconcile automatically within a few minutes." },
    failed: { Icon: AlertTriangle, spin: false, tone: "text-destructive", title: "Payment failed", body: "The payment didn't go through. Your order is safe — you can retry with the same or another method." },
    cancelled: { Icon: XCircle, spin: false, tone: "text-destructive", title: "Payment cancelled", body: "You closed the payment window before completing it. Your order is saved as unpaid." },
  }[view];

  const canRetry = view === "pending" || view === "failed" || view === "cancelled";

  return (
    <SiteShell>
      <section className="container-site py-24 text-center">
        <ui.Icon className={`mx-auto mb-6 h-14 w-14 ${ui.spin ? "animate-spin" : ""} ${ui.tone}`} />
        <h1 className="mb-3 font-display text-5xl">{ui.title}</h1>
        <p className="mb-8 text-xs uppercase tracking-[0.22em] text-muted-foreground">Order · {id.slice(0, 8).toUpperCase()}</p>
        <p className="mx-auto mb-10 max-w-md text-sm text-muted-foreground">{ui.body}</p>
        {order && (
          <div className="mx-auto mb-10 max-w-md">
            <PaymentTimeline
              paymentStatus={view === "paid" ? "paid" : view === "failed" ? "failed" : view === "cancelled" ? "cancelled" : order.payment_status}
              paymentMethod={order.payment_method}
              gateway={order.payment_gateway}
              createdAt={order.created_at}
              paidAt={order.paid_at}
              total={order.total}
              currency={order.currency}
              refundedTotal={order.refunded_total}
              refunds={order.refunds}
              busy={view === "capturing"}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {canRetry && (
            <button
              onClick={retryPayment}
              disabled={retrying}
              className="btn-primary flex h-11 items-center justify-center gap-2 rounded-sm px-6 disabled:opacity-60"
            >
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>{retrying ? "Reopening payment…" : "Retry payment"}</span>
            </button>
          )}
          {canRetry && (
            <button
              onClick={refresh}
              className="flex h-11 items-center justify-center gap-2 rounded-sm border border-border px-6 text-sm transition hover:border-primary hover:text-primary"
            >
              <RefreshCw className="h-4 w-4" /><span>Check status again</span>
            </button>
          )}
          <Link to="/collections" className="flex h-11 items-center justify-center gap-2 rounded-sm border border-border px-6 text-sm transition hover:border-primary hover:text-primary">
            <span>Continue shopping</span><ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
