import { CheckCircle2, Circle, Clock, CreditCard, Loader2, RotateCcw, ShoppingBag, XCircle } from "lucide-react";

export type TimelineRefund = { amount: number; created_at: string; status?: string };

export type PaymentTimelineProps = {
  /** Raw payment status from the order row (unpaid/pending/paid/failed/cancelled/refunded/partially_refunded). */
  paymentStatus: string;
  paymentMethod?: string | null;
  gateway?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
  total: number;
  refundedTotal?: number;
  currency?: string;
  refunds?: TimelineRefund[];
  /** Show a spinner on the active step (e.g. while verifying a payment). */
  busy?: boolean;
  className?: string;
};

type State = "done" | "active" | "error" | "todo";

function fmtDate(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

function fmtMoney(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency", currency, maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function PaymentTimeline({
  paymentStatus, paymentMethod, gateway, createdAt, paidAt, total,
  refundedTotal = 0, currency = "INR", refunds = [], busy = false, className = "",
}: PaymentTimelineProps) {
  const s = (paymentStatus || "pending").toLowerCase();
  const isCod = paymentMethod === "cod";
  const paid = s === "paid" || s === "refunded" || s === "partially_refunded";
  const failed = s === "failed" || s === "cancelled";
  const refundedAmt = refundedTotal || refunds.reduce((a, r) => a + Number(r.amount || 0), 0);
  const hasRefund = refundedAmt > 0 || s === "refunded" || s === "partially_refunded";
  const fullyRefunded = refundedAmt >= total - 0.01 || s === "refunded";

  const steps: Array<{ key: string; label: string; note?: string; at?: string; state: State; Icon: typeof Circle }> = [
    {
      key: "placed",
      label: "Order placed",
      note: isCod ? "Cash on delivery" : gateway ? `Via ${gateway}` : undefined,
      at: fmtDate(createdAt),
      state: "done",
      Icon: ShoppingBag,
    },
    {
      key: "pending",
      label: isCod ? "Payment on delivery" : "Payment initiated",
      note: paid ? undefined : failed ? "Not completed" : "Awaiting confirmation",
      state: paid ? "done" : failed ? "done" : "active",
      Icon: CreditCard,
    },
    failed && !paid
      ? {
          key: "failed",
          label: s === "cancelled" ? "Payment cancelled" : "Payment failed",
          note: "You can retry with the same or another method.",
          state: "error" as State,
          Icon: XCircle,
        }
      : {
          key: "paid",
          label: "Payment received",
          note: paid ? fmtMoney(total, currency) : "Pending",
          at: fmtDate(paidAt),
          state: paid ? ("done" as State) : ("todo" as State),
          Icon: paid ? CheckCircle2 : Clock,
        },
  ];

  if (hasRefund) {
    steps.push({
      key: "refunded",
      label: fullyRefunded ? "Refunded" : "Partially refunded",
      note: `${fmtMoney(refundedAmt, currency)} returned${refunds.length ? ` · ${refunds.length} transaction${refunds.length > 1 ? "s" : ""}` : ""}`,
      at: fmtDate(refunds[refunds.length - 1]?.created_at),
      state: "done",
      Icon: RotateCcw,
    });
  }

  return (
    <div className={`rounded-sm border border-border p-4 text-left ${className}`}>
      <p className="eyebrow mb-4">Payment timeline</p>
      <ol className="space-y-0">
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          const tone =
            step.state === "error"
              ? "text-destructive"
              : step.state === "todo"
                ? "text-muted-foreground"
                : "text-primary";
          const Icon = step.state === "active" && busy ? Loader2 : step.Icon;
          return (
            <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
              {!last && <span aria-hidden className="absolute left-[11px] top-6 h-full w-px bg-border" />}
              <span className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background ${tone}`}>
                <Icon className={`h-3.5 w-3.5 ${step.state === "active" && busy ? "animate-spin" : ""}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${step.state === "todo" ? "text-muted-foreground" : ""}`}>{step.label}</p>
                {step.note && <p className="text-xs text-muted-foreground">{step.note}</p>}
                {step.at && <p className="text-xs text-muted-foreground">{step.at}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
