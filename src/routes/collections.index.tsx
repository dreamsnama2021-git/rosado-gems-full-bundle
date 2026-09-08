import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { Reveal } from "@/components/site/Reveal";
import { getCategories } from "@/lib/products.functions";
import { getPageBySlug } from "@/lib/pages.functions";
import { StudioSections, pageSections } from "@/components/site/StudioSections";

const catsQ = queryOptions({ queryKey: ["categories"], queryFn: () => getCategories() });
const pageQ = queryOptions({ queryKey: ["page", "collections"], queryFn: () => getPageBySlug({ data: { slug: "collections" } }) });

export const Route = createFileRoute("/collections/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(catsQ);
    await context.queryClient.ensureQueryData(pageQ);
  },
  head: () => ({
    meta: [
      { title: "Product Categories — Rosado Gems" },
      { name: "description", content: "Browse Rosado Gems collections: rings, necklaces, earrings, bracelets, anklets, pendants, loose gemstones and bridal." },
      { property: "og:title", content: "Collections — Rosado Gems" },
      { property: "og:description", content: "Explore our full catalogue of fine jewelry and certified gemstones." },
    ],
  }),
  component: CollectionsIndex,
});

function CollectionsIndex() {
  const cats = useSuspenseQuery(catsQ).data;
  const page = useSuspenseQuery(pageQ).data;
  return (
    <SiteShell>
      <StudioSections
        sections={pageSections(page)}
        fallback={
          <section className="py-16 md:py-20">
            <div className="container-site text-center">
              <p className="eyebrow mb-3">Product Categories</p>
              <h1 className="font-display text-5xl md:text-6xl">All Collections</h1>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">A house of eight distinct collections, hand-crafted in the Mumbai rosado.</p>
            </div>
          </section>
        }
      />
      <section className="pb-24">
        <div className="container-site grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {cats.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.04}>
              <Link to="/collections/$slug" params={{ slug: c.slug }} className="group block overflow-hidden">
                <div className="aspect-[3/4] overflow-hidden bg-header-top">
                  <img src={c.hero_image ?? ""} alt={c.name} className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-110" />
                </div>
                <div className="pt-4 text-center">
                  <p className="font-display text-xl group-hover:text-primary transition-colors">{c.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">Shop the collection →</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
