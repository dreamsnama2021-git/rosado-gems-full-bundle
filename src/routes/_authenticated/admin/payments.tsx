import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Eye, EyeOff } from "lucide-react";
import { adminGetPaymentSettings, adminUpdatePaymentSettings, type PaymentSettings } from "@/lib/payment-settings.functions";
import { adminTestGateway } from "@/lib/payments.functions";
import { cn } from "@/lib/utils";
import { WebhookLog } from "@/components/admin/WebhookLog";

const q = queryOptions({ queryKey: ["admin", "payment-settings"], queryFn: () => adminGetPaymentSettings() });

export const Route = createFileRoute("/_authenticated/admin/payments")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: PaymentsPage,
});

const defaults: PaymentSettings = {
  default_gateway: "razorpay",
  currency: "INR",
  stripe_enabled: false, stripe_mode: "test", stripe_publishable_key: "", stripe_secret_key: "", stripe_webhook_secret: "",
  razorpay_enabled: false, razorpay_mode: "test", razorpay_key_id: "", razorpay_key_secret: "", razorpay_webhook_secret: "",
  cashfree_enabled: false, cashfree_mode: "test", cashfree_app_id: "", cashfree_secret_key: "", cashfree_webhook_secret: "",
  paypal_enabled: false, paypal_mode: "sandbox", paypal_client_id: "", paypal_client_secret: "", paypal_webhook_id: "",
  payoneer_enabled: false, payoneer_mode: "sandbox", payoneer_merchant_code: "", payoneer_api_key: "", payoneer_division: "", payoneer_webhook_secret: "",
};

const label = "text-xs uppercase tracking-[0.15em] text-muted-foreground";
const inp = "w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:border-foreground font-mono";

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} className={inp} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function GatewayCard({
  title, description, docs, enabled, onEnabled, mode, modes, onMode, children,
}: {
  title: string; description: string; docs: string;
  enabled: boolean; onEnabled: (v: boolean) => void;
  mode: string; modes: string[]; onMode: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("border rounded-sm p-6 space-y-4 transition-colors", enabled ? "border-foreground" : "border-border")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-sm bg-header-top flex items-center justify-center"><CreditCard className="h-5 w-5" /></div>
          <div>
            <h2 className="font-display text-xl">{title}</h2>
            <p className="text-sm text-muted-foreground">{description} · <a href={docs} target="_blank" rel="noreferrer" className="underline">Docs</a></p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm shrink-0"><input type="checkbox" checked={enabled} onChange={(e) => onEnabled(e.target.checked)} /> Enabled</label>
      </div>
      <div>
        <label className={label}>Mode</label>
        <div className="flex gap-2 mt-1">
          {modes.map((m) => (
            <button key={m} type="button" onClick={() => onMode(m)} className={cn("h-9 px-4 text-xs uppercase tracking-[0.15em] rounded-sm border", mode === m ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground")}>{m}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function TestConnection({ gateway }: { gateway: "razorpay" | "paypal" | "payoneer" }) {
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const r = await adminTestGateway({ data: { gateway } });
      toast.success(r.detail);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <button type="button" onClick={run} disabled={busy} className="h-9 px-4 text-xs uppercase tracking-[0.15em] rounded-sm border border-border hover:border-foreground disabled:opacity-50">
      {busy ? "Testing…" : "Test connection"}
    </button>
  );
}

function WebhookUrl({ path }: { path: string }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <div>
      <label className={label}>Webhook URL (paste in the gateway dashboard)</label>
      <input readOnly onFocus={(e) => e.currentTarget.select()} className={inp} value={`${origin}${path}`} />
    </div>
  );
}

function PaymentsPage() {
  const initial = useSuspenseQuery(q).data;
  const qc = useQueryClient();
  const [f, setF] = useState<PaymentSettings>(() => ({ ...defaults, ...(initial ?? {}) }));
  const [saving, setSaving] = useState(false);

  function upd<K extends keyof PaymentSettings>(k: K, v: PaymentSettings[K]) { setF((p) => ({ ...p, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await adminUpdatePaymentSettings({ data: f });
      toast.success("Payment settings saved");
      qc.invalidateQueries({ queryKey: ["admin", "payment-settings"] });
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-3xl mb-1">Payment Gateways</h1>
        <p className="text-sm text-muted-foreground">Configure the payment gateways used at checkout. Keys are stored securely and only visible to admins.</p>
      </div>

      <section className="border border-border rounded-sm p-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Default gateway</label>
          <select className={`${inp} font-sans`} value={f.default_gateway} onChange={(e) => upd("default_gateway", e.target.value as PaymentSettings["default_gateway"])}>
            <option value="razorpay">Razorpay</option>
            <option value="paypal">PayPal</option>
            <option value="payoneer">Payoneer</option>
          </select>
        </div>
        <div>
          <label className={label}>Currency</label>
          <select className={`${inp} font-sans`} value={f.currency} onChange={(e) => upd("currency", e.target.value)}>
            <option value="INR">INR — Indian Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="AED">AED — UAE Dirham</option>
          </select>
        </div>
      </section>

      <GatewayCard
        title="Razorpay" description="India-first UPI, cards, netbanking, wallets" docs="https://razorpay.com/docs/api/"
        enabled={f.razorpay_enabled} onEnabled={(v) => upd("razorpay_enabled", v)}
        mode={f.razorpay_mode} modes={["test", "live"]} onMode={(v) => upd("razorpay_mode", v as "test" | "live")}
      >
        <div><label className={label}>Key ID</label><input className={inp} value={f.razorpay_key_id} onChange={(e) => upd("razorpay_key_id", e.target.value)} placeholder="rzp_test_..." /></div>
        <div><label className={label}>Key Secret</label><SecretInput value={f.razorpay_key_secret} onChange={(v) => upd("razorpay_key_secret", v)} /></div>
        <div><label className={label}>Webhook Secret</label><SecretInput value={f.razorpay_webhook_secret} onChange={(v) => upd("razorpay_webhook_secret", v)} /></div>
        <WebhookUrl path="/api/public/webhooks/razorpay" />
        <div><TestConnection gateway="razorpay" /></div>
      </GatewayCard>


      <GatewayCard
        title="PayPal" description="Global PayPal balance, cards, Pay Later" docs="https://developer.paypal.com/api/rest/"
        enabled={f.paypal_enabled} onEnabled={(v) => upd("paypal_enabled", v)}
        mode={f.paypal_mode} modes={["sandbox", "live"]} onMode={(v) => upd("paypal_mode", v as "sandbox" | "live")}
      >
        <div><label className={label}>Client ID</label><input className={inp} value={f.paypal_client_id} onChange={(e) => upd("paypal_client_id", e.target.value)} /></div>
        <div><label className={label}>Client Secret</label><SecretInput value={f.paypal_client_secret} onChange={(v) => upd("paypal_client_secret", v)} /></div>
        <div><label className={label}>Webhook ID</label><input className={inp} value={f.paypal_webhook_id} onChange={(e) => upd("paypal_webhook_id", e.target.value)} /></div>
        <WebhookUrl path="/api/public/webhooks/paypal" />
        <div><TestConnection gateway="paypal" /></div>
      </GatewayCard>

      <GatewayCard
        title="Payoneer" description="Global cards and local methods via Payoneer Checkout" docs="https://checkoutdocs.payoneer.com/"
        enabled={f.payoneer_enabled} onEnabled={(v) => upd("payoneer_enabled", v)}
        mode={f.payoneer_mode} modes={["sandbox", "live"]} onMode={(v) => upd("payoneer_mode", v as "sandbox" | "live")}
      >
        <div><label className={label}>Merchant Code</label><input className={inp} value={f.payoneer_merchant_code} onChange={(e) => upd("payoneer_merchant_code", e.target.value)} /></div>
        <div><label className={label}>API Key</label><SecretInput value={f.payoneer_api_key} onChange={(v) => upd("payoneer_api_key", v)} /></div>
        <div><label className={label}>Division (optional)</label><input className={inp} value={f.payoneer_division} onChange={(e) => upd("payoneer_division", e.target.value)} /></div>
        <div><label className={label}>Notification Secret (optional)</label><SecretInput value={f.payoneer_webhook_secret} onChange={(v) => upd("payoneer_webhook_secret", v)} /></div>
        <WebhookUrl path="/api/public/webhooks/payoneer" />
        <div><TestConnection gateway="payoneer" /></div>
      </GatewayCard>

      <WebhookLog />

      <div className="sticky bottom-4 flex justify-end">
        <button onClick={save} disabled={saving} className="h-11 px-6 rounded-sm bg-foreground text-background text-sm uppercase tracking-[0.15em] disabled:opacity-50 shadow-lg">
          {saving ? "Saving…" : "Save payment settings"}
        </button>
      </div>
    </div>
  );
}
