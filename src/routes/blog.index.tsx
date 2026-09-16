import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getBlogPosts } from "@/lib/products.functions";
import { getPageBySlug } from "@/lib/pages.functions";
import { StudioSections, pageSections } from "@/components/site/StudioSections";

const postsQ = queryOptions({ queryKey: ["blog"], queryFn: () => getBlogPosts() });
const pageQ = queryOptions({ queryKey: ["page", "blog"], queryFn: () => getPageBySlug({ data: { slug: "blog" } }) });

export const Route = createFileRoute("/blog/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(postsQ);
    await context.queryClient.ensureQueryData(pageQ);
  },
  head: () => ({
    meta: [
      { title: "Journal — Rosado Gems" },
      { name: "description", content: "Stories from the Rosado Gems — gemstones, craft, and the bridal collection." },
      { property: "og:title", content: "Rosado Gems Journal" },
      { property: "og:description", content: "Stories from the rosado." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const posts = useSuspenseQuery(postsQ).data;
  const page = useSuspenseQuery(pageQ).data;
  return (
    <SiteShell>
      <StudioSections
        sections={pageSections(page)}
        fallback={
          <section className="py-16 md:py-20">
            <div className="container-site text-center">
              <p className="eyebrow mb-3">Our Journal</p>
              <h1 className="font-display text-5xl md:text-6xl">The Rosado Journal</h1>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Field notes from the rosado — on stones, craft and the bridal season.</p>
            </div>
          </section>
        }
      />
      <section className="pb-24">
        <div className="container-site grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group block">
              <div className="mb-5 aspect-[25/27] overflow-hidden bg-header-top">
                <img src={p.cover_image ?? ""} alt={p.title} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
              </div>
              <p className="mb-2 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">{new Date(p.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {p.author}</p>
              <h2 className="font-display text-2xl leading-tight group-hover:text-primary transition-colors">{p.title}</h2>
              {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
