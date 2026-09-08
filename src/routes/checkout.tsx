import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useCart } from "@/lib/cart-store";
import { useCurrency, formatMoney, convertFromINR } from "@/lib/currency";
import { quoteOrder, currencyForCountry, codAvailableForCountry, type PricingRules } from "@/lib/pricing";

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { placeOrder } from "@/lib/products.functions";
import { getPaymentOptions, createPaymentSession, confirmPayment } from "@/lib/payments.functions";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { toast } from "sonner";
import { ArrowRight, MapPin, Loader2, Banknote, CreditCard } from "lucide-react";
import { computeTax, INDIAN_STATES, isIndia } from "@/lib/tax";
import { loadRazorpayScript } from "@/lib/razorpay";
import { PaymentOverlay, type PaymentStage } from "@/components/site/PaymentOverlay";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Rosado Gems" },
      { name: "description", content: "Complete your Rosado Gems purchase securely: confirm your delivery address, choose prepaid or cash on delivery, and place your order in minutes." },
      { property: "og:title", content: "Secure Checkout — Rosado Gems" },
      { property: "og:description", content: "Complete your Rosado Gems purchase securely: confirm your delivery address, choose prepaid or cash on delivery, and place your order in minutes." },
      { property: "og:url", content: "https://rosado.techberries.com/checkout" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://rosado.techberries.com/checkout" }],
  }),
  component: Checkout,
});

type AddressForm = {
  line1: string; line2: string; city: string; state: string; pincode: string; country: string;
};

const emptyAddress: AddressForm = { line1: "", line2: "", city: "", state: "", pincode: "", country: "India" };

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { currency, currencies } = useCurrency();
  const nav = useNavigate();
  const submit = useServerFn(placeOrder);
  const settingsQ = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings() });
  const s = settingsQ.data;
  const [pending, setPending] = useState(false);
  const [stage, setStage] = useState<PaymentStage | null>(null);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState<AddressForm>(emptyAddress);
  const [payment, setPayment] = useState<"cod" | "prepaid">("cod");


  // The currency the order is priced in: the one configured for the shipping
  // country when we have it, otherwise the shopper's selected currency.
  const quoteCurrency = currencyForCountry(currencies, address.country) ?? currency;
  const money = (v: number) => formatMoney(v, quoteCurrency);

  const rules: PricingRules = {
    shippingEnabled: s?.shipping_enabled ?? true,
    shippingFlatRate: Number(s?.shipping_flat_rate ?? 500),
    freeShippingThreshold: Number(s?.free_shipping_threshold ?? 25000),
    codEnabled: s?.cod_enabled ?? true,
    codFee: Number(s?.cod_fee ?? 0),
    codMinOrder: Number(s?.cod_min_order ?? 0),
    codMaxOrder: Number(s?.cod_max_order ?? 0),
    tax: {
      enabled: s?.tax_enabled ?? false,
      label: s?.tax_label ?? "GST",
      rate: Number(s?.tax_rate ?? 0),
      inclusive: s?.tax_inclusive ?? false,
      originState: s?.tax_origin_state ?? "Maharashtra",
    },
  };

  const subT = subtotal();
  const quote = quoteOrder({
    subtotalInr: subT,
    rules,
    currency: quoteCurrency,
    country: address.country,
    state: address.state,
    paymentMethod: payment,
  });

  const codEligible = quote.codEligible;
  const activePayment: "cod" | "prepaid" = payment === "cod" && !codEligible ? "prepaid" : payment;
  const { shipping, codFee, tax, total } = quote;
  const codMin = rules.codMinOrder > 0 ? convertFromINR(rules.codMinOrder, quoteCurrency) : 0;
  const codMax = rules.codMaxOrder > 0 ? convertFromINR(rules.codMaxOrder, quoteCurrency) : 0;
  const codFeeCfg = convertFromINR(rules.codFee, quoteCurrency);

  // Live gateways configured by the admin. Razorpay handles INR (UPI / netbanking /
  // cards); PayPal / Payoneer cover the currencies they support. Falls back to an
  // offline order when none is configured, so checkout never breaks while keys are missing.
  const gatewaysQ = useQuery({ queryKey: ["payment-options"], queryFn: () => getPaymentOptions() });
  const g = gatewaysQ.data;
  const gateway: "razorpay" | "paypal" | "payoneer" | null = (() => {
    if (!g) return null;
    const code = quoteCurrency.code.toUpperCase();
    // PayPal simply refuses some currencies (INR among them) — never route those to it.
    const paypalOk = g.paypal.enabled && (g.paypal.currencies ?? []).includes(code);
    if (code === "INR" && g.razorpay.enabled) return "razorpay";
    if (paypalOk) return "paypal";
    if (g.payoneer?.enabled) return "payoneer";
    if (g.razorpay.enabled) return "razorpay";
    return null;
  })();

  function goToOrder(orderId: string, result?: "success" | "failed" | "cancelled" | "pending") {
    nav({
      to: "/order-confirmation/$id",
      params: { id: orderId },
      search: result ? { payment: result } : {},
    });
  }

  async function startOnlinePayment(orderId: string, via: "razorpay" | "paypal" | "payoneer", name: string, phone: string) {
    setStage("starting");
    const session = await createPaymentSession({ data: { order_id: orderId, gateway: via, origin: window.location.origin } });
    if ("alreadyPaid" in session) {
      setStage("success");
      goToOrder(orderId, "success");
      return;
    }
    if (session.gateway === "paypal" || session.gateway === "payoneer") {
      setStage("redirecting");
      window.location.href = session.approveUrl;
      return;
    }

    await loadRazorpayScript();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Razorpay = (window as any).Razorpay;
    if (!Razorpay) throw new Error("Could not load the Razorpay checkout");
    setStage("awaiting");
    const rzp = new Razorpay({
      key: session.key_id,
      amount: session.amount,
      currency: session.currency,
      order_id: session.gateway_order_id,
      name: "Rosado Gems",
      description: `Order ${orderId.slice(0, 8).toUpperCase()}`,
      prefill: { name, email: session.email, contact: phone },
      theme: { color: "#7a1f3d" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async (resp: any) => {
        setStage("verifying");
        try {
          await confirmPayment({ data: {
            order_id: orderId, gateway: "razorpay",
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          }});
          setStage("success");
          toast.success("Payment successful");
          goToOrder(orderId, "success");
        } catch (e) {
          setStage("failed");
          toast.error((e as Error).message);
          goToOrder(orderId, "pending");
        }
      },
      modal: {
        ondismiss: () => {
          setStage("failed");
          toast.message("Payment cancelled — your order is saved as unpaid.");
          goToOrder(orderId, "cancelled");
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rzp.on?.("payment.failed", (resp: any) => {
      setStage("failed");
      toast.error(resp?.error?.description || "Payment failed");
      goToOrder(orderId, "failed");
    });
    rzp.open();
  }





  function setField<K extends keyof AddressForm>(k: K, v: AddressForm[K]) {
    setAddress((a) => ({ ...a, [k]: v }));
  }

  async function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000, maximumAge: 60000,
        })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("reverse geocode failed");
      const data = await res.json();
      const a = data.address ?? {};
      const line1 = [a.house_number, a.road].filter(Boolean).join(" ").trim();
      const line2 = [a.neighbourhood, a.suburb, a.village].filter(Boolean).join(", ");
      const city = a.city || a.town || a.village || a.county || "";
      const state = a.state || "";
      const pincode = a.postcode || "";
      const country = a.country || "India";
      setAddress({
        line1: line1 || data.display_name?.split(",")[0] || "",
        line2, city, state, pincode, country,
      });
      toast.success("Address autofilled from your location");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "code" in err && (err as GeolocationPositionError).code === 1
          ? "Location permission denied"
          : "Couldn't fetch your location";
      toast.error(msg);
    } finally {
      setLocating(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) return;
    const f = new FormData(e.currentTarget);
    setPending(true);
    setStage("placing");
    try {
      const { id } = await submit({ data: {
        contact_name: String(f.get("name")),
        contact_email: String(f.get("email")),
        contact_phone: String(f.get("phone") || ""),
        shipping_address: {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country || "India",
        },
        items: items.map((i) => ({ id: i.id, slug: i.slug, name: i.name, price: i.price, qty: i.qty, variant_id: i.variant_id ?? null, sku: i.sku ?? null, variant: i.variantLabel ?? null })),
        // INR base figures — the server converts and rounds them for the chosen currency.
        subtotal: quote.base.subtotal, shipping: quote.base.shipping, total: quote.base.total,
        payment_method: activePayment, cod_fee: quote.base.codFee,
        tax: quote.base.tax,
        tax_detail: tax.applicable
          ? {
              label: s?.tax_label ?? "GST", rate: tax.rate, inclusive: tax.inclusive, regime: tax.regime,
              // lines in INR base — the server converts them back to the order currency
              lines: tax.lines.map((l) => ({ ...l, amount: Math.round((l.amount / (quoteCurrency.rate || 1)) * 100) / 100 })),
              place_of_supply: address.state, country: address.country || "India",
            }
          : {},
        currency: quoteCurrency.code,

        notes: String(f.get("notes") || ""),
      }});
      clear();

      if (activePayment === "prepaid" && gateway) {
        try {
          await startOnlinePayment(id, gateway, f.get("name") ? String(f.get("name")) : "", String(f.get("phone") || ""));
          return;
        } catch (err) {
          setStage("failed");
          toast.error((err as Error).message || "Payment could not be started");
          goToOrder(id, "failed");
          return;
        }
      }

      setStage(null);
      toast.success("Order placed");
      goToOrder(id);
    } catch {
      setStage(null);
      toast.error("Could not place order");
    }
    finally { setPending(false); }
  }

  if (items.length === 0) {
    return (
      <SiteShell>
        <PaymentOverlay stage={stage} />
        <section className="container-site py-20 text-center">
          <h1 className="mb-6 font-display text-4xl">{stage ? "Finishing your order" : "Nothing to checkout"}</h1>
          {!stage && (
            <Link to="/collections" className="btn-primary flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-sm px-6"><span>Continue shopping</span><ArrowRight className="h-4 w-4" /></Link>
          )}
        </section>
      </SiteShell>
    );
  }


  return (
    <SiteShell>
      <PaymentOverlay stage={stage} />
      <section className="py-14">
        <div className="container-site">
          <h1 className="mb-10 font-display text-5xl">Checkout</h1>
          <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[1fr_420px]">
            <div className="space-y-10">
              <fieldset>
                <legend className="eyebrow mb-5">Contact</legend>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input name="name" label="Full name" required />
                  <Input name="email" label="Email" type="email" required />
                  <Input name="phone" label="Phone" />
                </div>
              </fieldset>
              <fieldset>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <legend className="eyebrow">Shipping Address</legend>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-foreground/80 transition hover:border-primary hover:text-primary disabled:opacity-60"
                  >
                    {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                    <span>{locating ? "Detecting…" : "Use my location"}</span>
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input name="line1" label="Address line 1" required className="md:col-span-2" value={address.line1} onChange={(v) => setField("line1", v)} />
                  <Input name="line2" label="Address line 2" className="md:col-span-2" value={address.line2} onChange={(v) => setField("line2", v)} />
                  <Input name="city" label="City" required value={address.city} onChange={(v) => setField("city", v)} />
                  {isIndia(address.country) ? (
                    <label className="flex flex-col gap-1">
                      <span className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">State *</span>
                      <select
                        name="state"
                        required
                        value={address.state}
                        onChange={(e) => setField("state", e.target.value)}
                        className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-primary"
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </label>
                  ) : (
                    <Input name="state" label="State" required value={address.state} onChange={(v) => setField("state", v)} />
                  )}
                  <Input name="pincode" label="Pincode" required value={address.pincode} onChange={(v) => setField("pincode", v)} />
                </div>
              </fieldset>
              <fieldset>
                <legend className="eyebrow mb-5">Notes</legend>
                <textarea name="notes" rows={3} className="w-full border border-border bg-transparent p-3 text-sm outline-none focus:border-primary" placeholder="Anything the rosado should know" />
              </fieldset>
              <fieldset>
                <legend className="eyebrow mb-3">Payment Method</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition ${activePayment === "cod" ? "border-primary bg-header-top/40" : "border-border"} ${!codEligible ? "cursor-not-allowed opacity-50" : ""}`}>
                    <input type="radio" name="payment" value="cod" checked={activePayment === "cod"} disabled={!codEligible} onChange={() => setPayment("cod")} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium"><Banknote className="h-4 w-4" /> Cash on Delivery</div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {!codAvailableForCountry(address.country)
                          ? "Cash on delivery is available for orders shipping within India only."
                          : codEligible
                          ? (codFeeCfg > 0 ? `Pay ${money(codFeeCfg)} extra on delivery.` : "Pay in cash when your order arrives.")
                          : `Available on orders ${codMin > 0 ? `above ${money(codMin)}` : ""}${codMax > 0 ? ` up to ${money(codMax)}` : ""}.`}
                      </p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition ${activePayment === "prepaid" ? "border-primary bg-header-top/40" : "border-border"}`}>
                    <input type="radio" name="payment" value="prepaid" checked={activePayment === "prepaid"} onChange={() => setPayment("prepaid")} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4" /> Pay Using (Online Banking / UPI / Debit or Credit Card)</div>
                    </div>
                  </label>
                </div>
              </fieldset>
            </div>

            <aside className="h-fit border border-border p-6">
              <p className="eyebrow mb-4">Order Summary</p>
              <ul className="mb-4 space-y-3">
                {items.map((it) => (
                  <li key={it.id} className="flex gap-3 text-sm">
                    <img src={it.image} alt="" className="h-16 w-14 object-cover" />
                    <div className="flex-1"><p className="font-display leading-tight">{it.name}</p><p className="text-xs text-muted-foreground">Qty {it.qty}</p></div>
                    <span>{money(convertFromINR(it.price * it.qty, quoteCurrency))}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(quote.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
                {codFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">COD fee</span><span>{money(codFee)}</span></div>}
                {tax.applicable && tax.lines.map((l) => (
                  <div key={l.label} className="flex justify-between">
                    <span className="text-muted-foreground">{l.label}{tax.inclusive ? " (incl.)" : ""}</span>
                    <span>{money(l.amount)}</span>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg"><span>Total</span><span className="font-display">{money(total)}</span></div>
                <p className="pt-2 text-[0.68rem] text-muted-foreground">
                  Charged in {quoteCurrency.code}
                  {!tax.applicable ? " · taxes and duties, if any, are collected on delivery" : ""}
                  {quoteCurrency.code !== currency.code ? ` (switched from ${currency.code} for delivery to ${address.country})` : ""}.
                </p>
              </div>
              <button disabled={pending} className="btn-primary mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-sm px-6 disabled:opacity-60"><span>{pending ? "Placing order…" : "Place order"}</span><ArrowRight className="h-4 w-4" /></button>
            </aside>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}

function Input({
  name, label, type = "text", required, className = "", value, onChange,
}: {
  name: string; label: string; type?: string; required?: boolean; className?: string;
  value?: string; onChange?: (v: string) => void;
}) {
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">{label}{required && " *"}</span>
      <input
        name={name}
        type={type}
        required={required}
        {...(controlled ? { value, onChange: (e) => onChange!(e.target.value) } : {})}
        className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
