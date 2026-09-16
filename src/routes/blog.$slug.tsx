import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { getBlogPostBySlug } from "@/lib/products.functions";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { ShareBar } from "@/components/blog/ShareBar";
import { Comments } from "@/components/blog/Comments";
import { RichContent } from "@/components/site/RichContent";

const q = (slug: string) => queryOptions({ queryKey: ["blog", slug], queryFn: () => getBlogPostBySlug({ data: { slug } }) });
const settingsQ = queryOptions({ queryKey: ["site-settings"], queryFn: () => getSiteSettings() });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(q(params.slug));
    if (!d) throw notFound();
    context.queryClient.prefetchQuery(settingsQ);
    return d;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Journal"} — Rosado Gems` },
      { name: "description", content: loaderData?.excerpt ?? "" },
      { property: "og:title", content: loaderData?.title ?? "" },
      { property: "og:description", content: loaderData?.excerpt ?? "" },
      { property: "og:image", content: loaderData?.cover_image ?? "" },
      { property: "og:type", content: "article" },
      { name: "twitter:image", content: loaderData?.cover_image ?? "" },
    ],
    links: [{ rel: "canonical", href: `https://rosado.techberries.com/blog/${loaderData?.slug ?? ""}` }],
    scripts: loaderData
      ? [{
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: loaderData.title,
            description: loaderData.excerpt ?? undefined,
            image: loaderData.cover_image ?? undefined,
            author: { "@type": "Person", name: loaderData.author },
            publisher: { "@type": "Organization", name: "Rosado Gems" },
            datePublished: loaderData.published_at,
            dateModified: loaderData.updated_at ?? loaderData.published_at,
            mainEntityOfPage: `https://rosado.techberries.com/blog/${loaderData.slug}`,
          }),
        }]
      : [],
  }),
  errorComponent: ({ error }) => <SiteShell><section className="container-site py-24 text-center"><p className="text-sm text-red-600">{error.message}</p></section></SiteShell>,
  notFoundComponent: () => <SiteShell><section className="container-site py-24 text-center"><h1 className="font-display text-4xl">Post not found</h1></section></SiteShell>,
  component: Post,
});

function Post() {
  const { slug } = Route.useParams();
  const p = useSuspenseQuery(q(slug)).data!;
  const { data: settings } = useQuery(settingsQ);
  const shareOn = settings?.blog_share_enabled ?? true;
  const commentsOn = settings?.blog_comments_enabled ?? true;
  const moderated = settings?.blog_comments_moderation ?? true;

  return (
    <SiteShell>
      <article className="pb-24">
        {p.cover_image && (
          <div className="mb-12 h-[52vh] min-h-[380px] overflow-hidden">
            <img src={p.cover_image} alt={p.title} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="container-site max-w-4xl">
          <p className="mb-3 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
            {new Date(p.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {p.author}
          </p>
          <h1 className="mb-8 font-display text-4xl md:text-5xl leading-tight">{p.title}</h1>
          {/^\s*</.test(p.body) ? (
            <RichContent html={p.body} className="text-foreground/85 leading-relaxed text-[1.02rem] md:text-[1.08rem]" />
          ) : (
            <div className="prose prose-lg max-w-none space-y-5 text-foreground/85 leading-relaxed text-[1.02rem] md:text-[1.08rem]">
              {p.body.split("\n\n").map((para, i) => {
                if (para.startsWith("**") && para.includes("**")) {
                  const parts = para.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={i}>
                      {parts.map((s, j) =>
                        s.startsWith("**") && s.endsWith("**")
                          ? <strong key={j} className="font-display text-foreground">{s.slice(2, -2)}</strong>
                          : <span key={j}>{s}</span>,
                      )}
                    </p>
                  );
                }
                return <p key={i}>{para}</p>;
              })}
            </div>
          )}

          {shareOn && <ShareBar title={p.title} url={`/blog/${p.slug}`} />}

          {commentsOn && <Comments postId={p.id} moderated={moderated} />}

          <div className="mt-12 border-t border-border pt-8">
            <Link to="/blog" className="btn-ghost"><span>← Back to journal</span></Link>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
