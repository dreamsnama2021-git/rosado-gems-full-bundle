import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard } from "@/components/site/ProductCard";
import { getCategoryBySlug, getCategories } from "@/lib/products.functions";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useMoney } from "@/lib/currency";


const catsQ = queryOptions({ queryKey: ["categories"], queryFn: () => getCategories() });
const catQ = (slug: string) => queryOptions({
  queryKey: ["category", slug],
  queryFn: () => getCategoryBySlug({ data: { slug } }),
});

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ context, params }) => {
    const [, cat] = await Promise.all([
      context.queryClient.ensureQueryData(catsQ),
      context.queryClient.ensureQueryData(catQ(params.slug)),
    ]);
    if (!cat) throw notFound();
    return cat;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category?.name ?? "Collection";
    return {
      meta: [
        { title: `${name} — Rosado Gems` },
        { name: "description", content: loaderData?.category?.description ?? "" },
        { property: "og:title", content: `${name} — Rosado Gems` },
        { property: "og:description", content: loaderData?.category?.description ?? "" },
        { property: "og:image", content: loaderData?.category?.hero_image ?? "" },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell><section className="container-site py-24 text-center"><h1 className="font-display text-4xl">Collection not found</h1></section></SiteShell>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const cats = useSuspenseQuery(catsQ).data;
  const data = useSuspenseQuery(catQ(slug)).data!;
  const [sort, setSort] = useState<"featured"|"price-asc"|"price-desc"|"new">("featured");
  const [metal, setMetal] = useState<string>("");
  const [gem, setGem] = useState<string>("");
  const [tag, setTag] = useState<""|"new"|"bestseller"|"trending">("");
  const [inStock, setInStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);


  const metals = useMemo(() => Array.from(new Set(data.products.map((p) => p.metal).filter(Boolean))) as string[], [data.products]);
  const gems = useMemo(() => Array.from(new Set(data.products.map((p) => p.gemstone).filter(Boolean))) as string[], [data.products]);
  const priceBounds = useMemo(() => {
    const prices = data.products.map((p) => Number(p.price));
    if (!prices.length) return { min: 0, max: 0 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [data.products]);
  const [priceMax, setPriceMax] = useState<number>(priceBounds.max);

  const products = useMemo(() => {
    let list = data.products.slice();
    if (metal) list = list.filter((p) => p.metal === metal);
    if (gem) list = list.filter((p) => p.gemstone === gem);
    if (inStock) list = list.filter((p) => (p.stock ?? 0) > 0);
    if (tag === "new") list = list.filter((p) => p.is_new);
    else if (tag === "bestseller") list = list.filter((p) => p.is_bestseller);
    else if (tag === "trending") list = list.filter((p) => p.is_trending);
    list = list.filter((p) => Number(p.price) <= priceMax);
    if (sort === "price-asc") list.sort((a,b) => Number(a.price)-Number(b.price));
    else if (sort === "price-desc") list.sort((a,b) => Number(b.price)-Number(a.price));
    else if (sort === "new") list.sort((a,b) => Number(b.is_new)-Number(a.is_new));
    return list;
  }, [data.products, sort, metal, gem, tag, inStock, priceMax]);

  const resetAll = () => { setMetal(""); setGem(""); setTag(""); setInStock(false); setPriceMax(priceBounds.max); };
  const money = useMoney();

  return (
    <SiteShell>
      <section className="border-b border-border py-10">
        <div className="container-site">
          <nav className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link><span>·</span>
            <Link to="/collections" className="hover:text-primary">Collections</Link><span>·</span>
            <span className="text-foreground">{data.category.name}</span>
          </nav>
          <h1 className="font-display text-5xl md:text-6xl">{data.category.name}</h1>
          {data.category.description && <p className="mt-3 max-w-2xl text-muted-foreground">{data.category.description}</p>}
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container-site grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
          {filtersOpen && (
            <button
              aria-label="Close filters overlay"
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
            />
          )}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[86vw] max-w-sm overflow-y-auto bg-background p-6 shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none ${
              filtersOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="mb-6 flex items-center justify-between lg:mb-0">
              <p className="eyebrow">Filters</p>
              <div className="flex items-center gap-4">
                <button onClick={resetAll} className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary">Reset</button>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="lg:hidden text-foreground/70 hover:text-primary"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="space-y-8 lg:mt-8">


            <div>
              <p className="eyebrow mb-4">Collections</p>
              <ul className="space-y-2 text-sm">
                {cats.map((c) => (
                  <li key={c.id}>
                    <Link to="/collections/$slug" params={{ slug: c.slug }} className={`hover:text-primary ${c.slug===slug ? "text-primary font-medium" : "text-foreground/80"}`}>{c.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {priceBounds.max > priceBounds.min && (
              <div>
                <p className="eyebrow mb-4">Price</p>
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{money(priceBounds.min)}</span>
                  <span className="text-foreground">Up to {money(priceMax)}</span>
                </div>
              </div>
            )}

            <div>
              <p className="eyebrow mb-4">Featured</p>
              <ul className="space-y-2 text-sm">
                {([["","All"],["new","New arrivals"],["bestseller","Best sellers"],["trending","Trending"]] as const).map(([v, label]) => (
                  <li key={v}><button onClick={() => setTag(v)} className={`hover:text-primary ${tag===v ? "text-primary" : "text-foreground/80"}`}>{label}</button></li>
                ))}
              </ul>
            </div>

            {metals.length > 0 && (
              <div>
                <p className="eyebrow mb-4">Metal</p>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => setMetal("")} className={`hover:text-primary ${metal==="" ? "text-primary" : "text-foreground/80"}`}>All metals</button></li>
                  {metals.map((m) => <li key={m}><button onClick={() => setMetal(m)} className={`hover:text-primary ${metal===m ? "text-primary" : "text-foreground/80"}`}>{m}</button></li>)}
                </ul>
              </div>
            )}
            {gems.length > 0 && (
              <div>
                <p className="eyebrow mb-4">Gemstone / Colour</p>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => setGem("")} className={`hover:text-primary ${gem==="" ? "text-primary" : "text-foreground/80"}`}>All stones</button></li>
                  {gems.map((g) => <li key={g}><button onClick={() => setGem(g)} className={`hover:text-primary ${gem===g ? "text-primary" : "text-foreground/80"}`}>{g}</button></li>)}
                </ul>
              </div>
            )}

            <div>
              <p className="eyebrow mb-4">Availability</p>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80 hover:text-primary">
                <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 accent-primary" />
                In stock only
              </label>
            </div>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:border-primary hover:text-primary lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </button>
              <p className="text-xs text-muted-foreground sm:text-sm">{products.length} pieces</p>
              <select value={sort} onChange={(e) => setSort(e.target.value as never)} className="bg-transparent text-xs outline-none sm:text-sm">
                <option value="featured">Sort: Featured</option>
                <option value="new">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
