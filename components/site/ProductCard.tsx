import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getVariantsByProduct } from "@/lib/variants.functions";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useMoney, useProductPrice } from "@/lib/currency";

type Product = {
  id: string; slug: string; name: string; price: number; compare_at_price: number | null;
  price_overrides?: unknown;
  images: unknown; gemstone: string | null; metal: string | null; is_new?: boolean; is_bestseller?: boolean;
};

export function ProductCard({ p }: { p: Product }) {
  const money = useMoney();
  const price = useProductPrice();
  const imgs = Array.isArray(p.images) ? (p.images as string[]) : [];
  const [img1, img2] = [imgs[0] ?? "", imgs[1] ?? imgs[0] ?? ""];
  const add = useCart((s) => s.add);
  const navigate = useNavigate();
  const loadVariants = useServerFn(getVariantsByProduct);
  const [busy, setBusy] = useState(false);

  async function quickAdd() {
    if (busy) return;
    setBusy(true);
    try {
      const variants = await loadVariants({ data: { product_id: p.id } });
      if (variants.length > 0) {
        toast("Choose your options", { description: "This piece has multiple variants." });
        navigate({ to: "/products/$slug", params: { slug: p.slug } });
        return;
      }
      add({ id: p.id, slug: p.slug, name: p.name, price: price.inr(p.price, p.price_overrides), image: img1, metal: p.metal, gemstone: p.gemstone });
      toast.success("Added to your bag");
    } catch {
      navigate({ to: "/products/$slug", params: { slug: p.slug } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div whileHover="hover" className="group flex flex-col">
      <Link to="/products/$slug" params={{ slug: p.slug }} className="relative block overflow-hidden bg-[#f2f0ee]">
        <div className="aspect-[4/5] w-full">
          <img src={img1} alt={p.name} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 group-hover:opacity-0" loading="lazy" />
          <img src={img2} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100" loading="lazy" />
        </div>
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {p.is_new && <span className="bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-background">New</span>}
          {p.compare_at_price && p.compare_at_price > p.price && <span className="bg-primary px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-primary-foreground">Sale</span>}
        </div>
        <motion.div
          variants={{ hover: { y: 0, opacity: 1 } }}
          initial={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-4 bottom-4 hidden md:block"
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void quickAdd();
            }}
            className="w-full bg-background/95 py-3 text-[0.72rem] uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Quick Add
          </button>
        </motion.div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void quickAdd();
          }}
          className="absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center border border-foreground bg-foreground text-background transition-colors hover:bg-primary hover:border-primary hover:text-background md:hidden"
          aria-label="Add to bag"
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
        </button>
      </Link>
      <div className="pt-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{p.metal ?? p.gemstone ?? ""}</p>
        <Link to="/products/$slug" params={{ slug: p.slug }} className="mt-1 block font-display text-sm leading-tight sm:text-lg transition-colors hover:text-primary">{p.name}</Link>
        <div className="mt-1 flex items-center justify-center gap-2 text-xs sm:text-sm">
          <span>{price.format(p.price, p.price_overrides)}</span>
          {p.compare_at_price && p.compare_at_price > p.price && (
            <span className="text-muted-foreground line-through">{money(Number(p.compare_at_price))}</span>
          )}
        </div>
      </div>

    </motion.div>
  );
}
