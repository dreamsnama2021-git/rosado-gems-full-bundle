import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useCart } from "@/lib/cart-store";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useMoney } from "@/lib/currency";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Rosado Gems" },
      { name: "description", content: "Review the fine jewelry pieces in your Rosado Gems bag, adjust sizes and quantities, then continue to secure checkout." },
      { property: "og:title", content: "Your Bag — Rosado Gems" },
      { property: "og:description", content: "Review the fine jewelry pieces in your Rosado Gems bag, adjust sizes and quantities, then continue to secure checkout." },
      { property: "og:url", content: "https://rosado.techberries.com/cart" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://rosado.techberries.com/cart" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const money = useMoney();
  return (
    <SiteShell>
      <section className="py-16">
        <div className="container-site">
          <h1 className="mb-10 font-display text-5xl">Your Bag</h1>
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <p className="mb-6 font-display text-2xl">Your bag is empty</p>
              <Link to="/collections" className="btn-primary flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-sm px-6"><span>Continue shopping</span><ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
              <ul className="divide-y divide-border border-y border-border">
                {items.map((it) => (
                  <li key={it.id} className="flex gap-5 py-6">
                    <img src={it.image} alt={it.name} className="h-32 w-24 object-cover" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link to="/products/$slug" params={{ slug: it.slug }} className="font-display text-xl hover:text-primary">{it.name}</Link>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{it.variantLabel || [it.metal, it.gemstone].filter(Boolean).join(" · ")}</p>
                        {it.sku && <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/80">SKU · {it.sku}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button onClick={() => setQty(it.id, it.qty-1)} className="grid h-8 w-8 place-items-center hover:text-primary"><Minus className="h-3 w-3" /></button>
                          <span className="w-8 text-center text-sm">{it.qty}</span>
                          <button onClick={() => setQty(it.id, it.qty+1)} disabled={!!it.maxStock && it.qty >= it.maxStock} className="grid h-8 w-8 place-items-center hover:text-primary disabled:opacity-40"><Plus className="h-3 w-3" /></button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{money(it.price * it.qty)}</span>
                          <button onClick={() => remove(it.id)} className="text-foreground/50 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <aside className="h-fit border border-border p-6">
                <p className="eyebrow mb-4">Order Summary</p>
                <div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{money(subtotal())}</span></div>
                <div className="mb-4 flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>Calculated at checkout</span></div>
                <div className="mb-6 flex justify-between border-t border-border pt-4 text-lg"><span>Total</span><span className="font-display">{money(subtotal())}</span></div>
                <Link to="/checkout" className="btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-sm px-6"><span>Proceed to checkout</span><ArrowRight className="h-4 w-4" /></Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
