import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { getProductBySlug } from "@/lib/products.functions";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/ProductCard";
import { Heart, Truck, Shield, Sparkles, Minus, Plus, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RichContent } from "@/components/site/RichContent";
import { ProductSwatches, type Variant } from "@/components/site/ProductSwatches";
import { ATTR_ORDER, ATTR_LABELS } from "@/lib/variant-options";
import { RingSizeGuide } from "@/components/site/RingSizeGuide";
import { useMoney, useProductPrice } from "@/lib/currency";

const q = (slug: string) => queryOptions({ queryKey: ["product", slug], queryFn: () => getProductBySlug({ data: { slug } }) });

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(q(params.slug));
    if (!d) throw notFound();
    return d;
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const imgs = Array.isArray(p?.images) ? (p!.images as string[]) : [];
    return {
      meta: [
        { title: `${p?.name ?? "Product"} — Rosado Gems` },
        { name: "description", content: p?.description ?? "" },
        { property: "og:title", content: p?.name ?? "" },
        { property: "og:description", content: p?.description ?? "" },
        { property: "og:image", content: imgs[0] ?? "" },
        { name: "twitter:image", content: imgs[0] ?? "" },
        { property: "og:type", content: "product" },
      ],
      links: [{ rel: "canonical", href: `https://rosado.techberries.com/products/${p?.slug ?? ""}` }],
      scripts: p
        ? [{
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: p.name,
              description: p.description ?? undefined,
              image: imgs,
              sku: p.sku ?? undefined,
              brand: { "@type": "Brand", name: "Rosado Gems" },
              offers: {
                "@type": "Offer",
                url: `https://rosado.techberries.com/products/${p.slug}`,
                price: Number(p.price),
                priceCurrency: "INR",
                availability: Number(p.stock ?? 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              },
            }),
          }]
        : [],
    };
  },
  notFoundComponent: () => (<SiteShell><section className="container-site py-24 text-center"><h1 className="font-display text-4xl">Piece not found</h1></section></SiteShell>),
  component: ProductPage,
});

function ProductPage() {
  const money = useMoney();
  const price = useProductPrice();
  const { slug } = Route.useParams();
  const d = useSuspenseQuery(q(slug)).data!;
  const { product: p, related } = d;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variants: Variant[] = ((d as any).variants ?? []) as Variant[];
  const baseImgs = Array.isArray(p.images) ? (p.images as string[]) : [];
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [selVariant, setSelVariant] = useState<Variant | null>(null);
  const add = useCart((s) => s.add);

  const effectivePrice = selVariant?.price != null ? Number(selVariant.price) : Number(p.price);
  const effectiveCompare = selVariant?.compare_at_price != null
    ? Number(selVariant.compare_at_price)
    : (p.compare_at_price ? Number(p.compare_at_price) : null);
  const effectiveSku = selVariant?.sku || p.sku;
  const outOfStock = variants.length > 0 && (!selVariant || selVariant.stock <= 0);
  const variantImg = selVariant?.image || null;
  const maxQty = variants.length > 0 ? (selVariant?.stock ?? 0) : (Number(p.stock ?? 0) || 0);
  useEffect(() => {
    if (maxQty > 0 && qty > maxQty) setQty(maxQty);
  }, [maxQty, qty]);
  const imgs: string[] = variantImg
    ? [variantImg, ...baseImgs.filter((s) => s !== variantImg)]
    : baseImgs;

  useEffect(() => { setActive(0); }, [variantImg]);

  // Ring products: those offering a ring size, or named/categorised as rings.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catName = String((p as any).categories?.name ?? "");
  const isRing = variants.some((v) => !!v.size) || /ring/i.test(p.name) || /ring/i.test(catName);

  return (
    <SiteShell>
      <section className="py-10">
        <div className="container-site">
          <nav className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link><span>·</span>
            <Link to="/collections" className="hover:text-primary">Collections</Link><span>·</span>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(p as any).categories && <><Link to="/collections/$slug" params={{ slug: (p as any).categories.slug }} className="hover:text-primary">{(p as any).categories.name}</Link><span className="hidden sm:inline">·</span></>}
            <span className="hidden sm:inline text-foreground">{p.name}</span>
          </nav>

          <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:gap-16">
            <div>
              <div className="mb-3 aspect-[4/5] overflow-hidden bg-header-top">
                <img src={imgs[active]} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {imgs.map((src: string, i: number) => (
                  <button key={i} onClick={() => setActive(i)} className={`aspect-square overflow-hidden border ${i===active ? "border-primary" : "border-border"}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-3">{p.metal ?? p.gemstone ?? "Fine Jewelry"}</p>
              <h1 className="font-display text-3xl md:text-5xl">{p.name}</h1>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-2xl">{selVariant?.price != null ? money(effectivePrice) : price.format(effectivePrice, (p as unknown as { price_overrides?: unknown }).price_overrides)}</span>
                {effectiveCompare && effectiveCompare > effectivePrice && (
                  <span className="text-muted-foreground line-through">{money(effectiveCompare)}</span>
                )}
              </div>
              {effectiveSku && <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">SKU · {effectiveSku}</p>}

              {p.description && (/^\s*</.test(p.description)
                ? <div className="mt-6"><RichContent html={p.description} className="text-muted-foreground" /></div>
                : <p className="mt-6 text-muted-foreground leading-relaxed">{p.description}</p>)}

              <ProductSwatches variants={variants} onSelect={setSelVariant} />

              {isRing && <RingSizeGuide />}

              <div className="mt-8 grid grid-cols-2 gap-3 border-y border-border py-6 text-sm">
                {p.gemstone && <div><p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">Gemstone</p><p>{p.gemstone}</p></div>}
                {p.cut && <div><p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">Cut</p><p>{p.cut}</p></div>}
                {p.carat && <div><p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">Carat</p><p>{p.carat} ct</p></div>}
                {p.clarity && <div><p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">Clarity</p><p>{p.clarity}</p></div>}
                {p.metal && <div className="col-span-2"><p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">Metal</p><p>{p.metal}</p></div>}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center border border-border">
                  <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty-1))} className="grid h-11 w-11 place-items-center hover:text-primary"><Minus className="h-4 w-4" /></button>
                  <span className="w-10 text-center">{qty}</span>
                  <button aria-label="Increase quantity" onClick={() => setQty(maxQty ? Math.min(maxQty, qty+1) : qty+1)} disabled={!!maxQty && qty >= maxQty} className="grid h-11 w-11 place-items-center hover:text-primary"><Plus className="h-4 w-4" /></button>
                </div>
                <button
                  disabled={outOfStock}
                  onClick={() => {
                    const suffix = selVariant
                      ? ATTR_ORDER
                          .map((a) => {
                            const val = (selVariant as Record<string, unknown>)[a];
                            return val ? `${ATTR_LABELS[a]}: ${val}` : null;
                          })
                          .filter(Boolean).join(" · ")
                      : "";
                    add({
                      id: selVariant ? `${p.id}::${selVariant.id}` : p.id,
                      slug: p.slug,
                      name: suffix ? `${p.name} — ${suffix}` : p.name,
                      price: selVariant?.price != null
                        ? effectivePrice
                        : price.inr(effectivePrice, (p as unknown as { price_overrides?: unknown }).price_overrides),
                      image: imgs[0],
                      metal: selVariant?.metal ?? p.metal,
                      gemstone: selVariant?.gemstone_color ?? p.gemstone,
                      variant_id: selVariant?.id ?? null,
                      sku: effectiveSku ?? null,
                      variantLabel: suffix || null,
                      maxStock: maxQty,
                    }, qty);
                    toast.success("Added to your bag");
                  }}
                  className="btn-primary flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-sm px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{outOfStock ? "Out of stock" : "Buy Now"}</span>
                  {!outOfStock && <ArrowRight className="h-4 w-4" />}
                </button>
                <button aria-label="Wishlist" className="grid h-11 w-11 place-items-center border border-border hover:border-primary hover:text-primary"><Heart className="h-4 w-4" /></button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Free shipping</div>
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Lifetime buy-back</div>
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Certified stones</div>
              </div>

              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="desc"><AccordionTrigger>Description &amp; Craft</AccordionTrigger><AccordionContent className="text-muted-foreground">{p.description && /^\s*</.test(p.description) ? <RichContent html={p.description} /> : <>{p.description} </>}Every piece is hand-set at the Rosado in Lower Parel, Mumbai.</AccordionContent></AccordionItem>
                <AccordionItem value="shipping"><AccordionTrigger>Shipping &amp; Returns</AccordionTrigger><AccordionContent className="text-muted-foreground">Complimentary insured shipping across India. International shipping available on request. 14-day returns on unworn pieces.</AccordionContent></AccordionItem>
                <AccordionItem value="care"><AccordionTrigger>Care Instructions</AccordionTrigger><AccordionContent className="text-muted-foreground">Store separately in the pouch provided. Avoid contact with perfume, hairspray and chlorine. Bring in yearly for complimentary polish.</AccordionContent></AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-20">
          <div className="container-site">
            <h2 className="mb-10 text-center font-display text-3xl md:text-4xl">You may also love</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => <ProductCard key={r.id} p={r} />)}
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
