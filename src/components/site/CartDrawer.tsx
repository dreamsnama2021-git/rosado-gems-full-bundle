import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart-store";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMoney } from "@/lib/currency";

export function CartDrawer() {
  const { isOpen, close, items, setQty, remove, subtotal } = useCart();
  const money = useMoney();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h3 className="font-display text-2xl">Your Bag</h3>
              <button onClick={close} aria-label="Close" className="text-foreground/70 hover:text-primary"><X className="h-5 w-5" /></button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="font-display text-xl">Your bag is empty</p>
                <p className="text-sm text-muted-foreground">Discover our new arrivals and heritage pieces.</p>
                <Link to="/collections" onClick={close} className="btn-primary mt-2"><span>Continue shopping</span></Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <ul className="space-y-5">
                    {items.map((it) => (
                      <li key={it.id} className="flex gap-4">
                        <img src={it.image} alt={it.name} className="h-24 w-20 object-cover" />
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link to="/products/$slug" params={{ slug: it.slug }} onClick={close} className="font-display text-base leading-tight hover:text-primary">{it.name}</Link>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{it.variantLabel || [it.metal, it.gemstone].filter(Boolean).join(" · ")}</p>
                            {it.sku && <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/80">SKU · {it.sku}</p>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-border">
                              <button onClick={() => setQty(it.id, it.qty - 1)} className="grid h-7 w-7 place-items-center text-foreground/70 hover:text-primary"><Minus className="h-3 w-3" /></button>
                              <span className="w-6 text-center text-sm">{it.qty}</span>
                              <button onClick={() => setQty(it.id, it.qty + 1)} disabled={!!it.maxStock && it.qty >= it.maxStock} className="grid h-7 w-7 place-items-center text-foreground/70 hover:text-primary"><Plus className="h-3 w-3" /></button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm">{money(it.price * it.qty)}</span>
                              <button onClick={() => remove(it.id)} aria-label="Remove" className="text-foreground/50 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-border px-6 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Subtotal</span>
                    <span className="font-display text-xl">{money(subtotal())}</span>
                  </div>
                  <p className="mb-4 text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/cart" onClick={close} className="btn-ghost btn-small grid h-11 place-items-center rounded-sm"><span>View Bag</span></Link>
                    <Link to="/checkout" onClick={close} className="btn-primary btn-small grid h-11 place-items-center rounded-sm"><span>Checkout</span></Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
