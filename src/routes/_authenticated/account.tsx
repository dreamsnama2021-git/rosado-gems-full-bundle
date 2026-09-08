import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSuspenseQuery, queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteShell } from "@/components/site/SiteShell";
import { buildInvoice } from "@/lib/order-pdf";
import { OrderConversation } from "@/components/site/OrderConversation";
import { PaymentTimeline } from "@/components/site/PaymentTimeline";

import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile, getMyOrders, getMyWishlist, toggleWishlist } from "@/lib/account.functions";
import { bootstrapAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import { formatMoney, BASE_CURRENCY, type CurrencyRow } from "@/lib/currency";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orderCurrency(o: any): CurrencyRow {
  const code = String(o?.currency ?? "INR").toUpperCase();
  if (code === "INR") return BASE_CURRENCY;
  const symbols: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", AED: "د.إ", AUD: "A$", CAD: "C$", SGD: "S$" };
  return { ...BASE_CURRENCY, code, symbol: symbols[code] ?? code + " ", rate: Number(o?.currency_rate ?? 1) };
}

const profileQ = queryOptions({ queryKey: ["me", "profile"], queryFn: () => getMyProfile() });
const ordersQ = queryOptions({ queryKey: ["me", "orders"], queryFn: () => getMyOrders() });
const wishQ = queryOptions({ queryKey: ["me", "wishlist"], queryFn: () => getMyWishlist() });

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Rosado Gems" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(profileQ),
      context.queryClient.ensureQueryData(ordersQ),
    ]);
  },
  errorComponent: ({ error }) => <SiteShell><p className="container-site py-20 text-center">{error.message}</p></SiteShell>,
  notFoundComponent: () => <SiteShell><p className="container-site py-20 text-center">Not found</p></SiteShell>,
  component: Account,
});

function Account() {
  const nav = useNavigate();
  const profile = useSuspenseQuery(profileQ).data;
  const orders = useSuspenseQuery(ordersQ).data;
  const wish = useQuery(wishQ).data;
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState<"profile" | "orders" | "wishlist">("profile");
  const qc = useQueryClient();
  const save = useServerFn(updateMyProfile);
  const boot = useServerFn(bootstrapAdmin);
  const wl = useServerFn(toggleWishlist);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? "")); }, []);

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/" });
  }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try { await save({ data: { full_name: name, phone } }); toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["me"] }); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  }
  async function claimAdmin() {
    try { const r = await boot(); if (r.ok) { toast.success("Admin granted. Refresh to see admin menu."); } else toast.info("Admin already exists"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  }

  return (
    <SiteShell>
      <section className="container-site py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-2">Account</p>
            <h1 className="font-display text-4xl">Welcome, {profile?.full_name?.split(" ")[0] || "friend"}</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <button onClick={signOut} className="text-xs uppercase tracking-[0.2em] border-b border-foreground/30 pb-1 hover:border-foreground">Sign out</button>
        </div>

        <div className="mb-6 flex gap-6 border-b border-border text-sm uppercase tracking-[0.2em]">
          {(["profile", "orders", "wishlist"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 -mb-px border-b-2 transition-colors ${tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <form onSubmit={handleSave} className="max-w-lg space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full h-11 border border-foreground/20 bg-background px-4 text-sm rounded-sm" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone"
              className="w-full h-11 border border-foreground/20 bg-background px-4 text-sm rounded-sm" />
            <button className="h-11 px-6 rounded-sm bg-foreground text-background text-sm font-medium">Save</button>
            <div className="mt-8 border-t border-border pt-6">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin bootstrap</p>
              <p className="mb-3 text-sm text-muted-foreground">If no admin exists yet, claim admin access for this account.</p>
              <button type="button" onClick={claimAdmin} className="text-xs uppercase tracking-[0.2em] border-b border-foreground/30 pb-1 hover:border-foreground">Claim admin →</button>
            </div>
          </form>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
            {orders.map((o) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const refunds = ((o as any).refunds ?? []) as Array<{ amount: number; created_at: string; status?: string; gateway_refund_id?: string | null; reason?: string | null }>;
              return (
              <div key={o.id} className="border border-border p-4 rounded-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()} · {String(o.status).replace(/_/g, " ")} · {o.payment_method === "cod" ? "Cash on delivery" : "Prepaid"} ({o.payment_status})
                    </p>
                    {o.tracking_url && (
                      <a href={o.tracking_url} target="_blank" rel="noreferrer" className="text-xs underline">
                        Track {o.courier_name ? `with ${o.courier_name}` : "shipment"}{o.awb_code ? ` · ${o.awb_code}` : ""}
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl">{formatMoney(Number(o.total), orderCurrency(o))}</p>
                    <button type="button" onClick={() => buildInvoice(o)}
                      className="mt-1 text-xs uppercase tracking-[0.18em] border-b border-foreground/30 pb-0.5 hover:border-foreground">
                      Download invoice
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
                  <div>
                    <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Payment</p>
                    <PaymentTimeline
                      paymentStatus={o.payment_status}
                      paymentMethod={o.payment_method}
                      gateway={o.payment_gateway}
                      createdAt={o.created_at}
                      paidAt={o.paid_at}
                      total={Number(o.total)}
                      currency={String(o.currency ?? "INR")}
                      refundedTotal={Number(o.refunded_total ?? 0)}
                      refunds={refunds}
                    />
                  </div>
                  <div>
                    <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Refunds</p>
                    {refunds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No refunds on this order.</p>
                    ) : (
                      <ul className="space-y-2">
                        {refunds.map((r, i) => (
                          <li key={r.gateway_refund_id ?? i} className="rounded-sm border border-border px-3 py-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{formatMoney(Number(r.amount), orderCurrency(o))}</span>
                              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{String(r.status ?? "processed").replace(/_/g, " ")}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleString()}
                              {r.gateway_refund_id ? ` · Ref ${r.gateway_refund_id}` : ""}
                            </p>
                            {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <OrderConversation orderId={o.id} />
              </div>
              );
            })}
          </div>
        )}


        {tab === "wishlist" && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(wish ?? []).length === 0 && <p className="text-sm text-muted-foreground col-span-full">Your wishlist is empty.</p>}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(wish ?? []).map((w: any) => (
              <div key={w.product_id} className="group">
                <div className="aspect-square overflow-hidden bg-header-top mb-2">
                  <img src={w.products?.images?.[0] ?? ""} alt={w.products?.name} className="h-full w-full object-cover" />
                </div>
                <p className="text-sm">{w.products?.name}</p>
                <button onClick={async () => { await wl({ data: { product_id: w.product_id } }); qc.invalidateQueries({ queryKey: ["me", "wishlist"] }); }}
                  className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
