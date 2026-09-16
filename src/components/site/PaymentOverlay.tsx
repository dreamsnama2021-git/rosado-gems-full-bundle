import { Loader2, CheckCircle2, AlertTriangle, CreditCard } from "lucide-react";

export type PaymentStage =
  | "placing"
  | "starting"
  | "redirecting"
  | "awaiting"
  | "verifying"
  | "success"
  | "failed";

const COPY: Record<PaymentStage, { title: string; body: string }> = {
  placing: { title: "Placing your order", body: "Reserving your pieces and preparing a secure payment session." },
  starting: { title: "Opening secure payment", body: "Connecting to the payment gateway — this only takes a moment." },
  redirecting: { title: "Redirecting to PayPal", body: "You're being taken to PayPal to approve the payment. Please don't close this tab." },
  awaiting: { title: "Waiting for your payment", body: "Complete the payment in the secure window. We'll confirm it here automatically." },
  verifying: { title: "Verifying your payment", body: "Confirming the transaction with the gateway. Don't refresh or close this page." },
  success: { title: "Payment successful", body: "Taking you to your order confirmation…" },
  failed: { title: "Payment not completed", body: "Your order is saved — you can retry the payment from the order page." },
};

export function PaymentOverlay({ stage }: { stage: PaymentStage | null }) {
  if (!stage) return null;
  const { title, body } = COPY[stage];
  const Icon = stage === "success" ? CheckCircle2 : stage === "failed" ? AlertTriangle : stage === "awaiting" ? CreditCard : Loader2;
  const spin = stage !== "success" && stage !== "failed" && stage !== "awaiting";
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-background/85 px-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-[10px] border border-border bg-card p-8 text-center shadow-xl">
        <Icon
          className={`mx-auto mb-5 h-10 w-10 ${spin ? "animate-spin text-primary" : stage === "failed" ? "text-destructive" : "text-primary"}`}
        />
        <h2 className="mb-2 font-display text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{body}</p>
        {stage !== "success" && stage !== "failed" && (
          <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
