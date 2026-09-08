import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPageBySlug } from "@/lib/pages.functions";
import { RichContent } from "@/components/site/RichContent";
import { StudioSections, pageSections } from "@/components/site/StudioSections";

const q = (slug: string) => queryOptions({ queryKey: ["page", slug], queryFn: () => getPageBySlug({ data: { slug } }) });

export const Route = createFileRoute("/pages/$slug")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(q(params.slug));
    if (!d) throw notFound();
    return d;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.meta_title || loaderData?.title || "Page"} — Rosado Gems` },
      { name: "description", content: loaderData?.meta_description || loaderData?.excerpt || "" },
      { property: "og:title", content: loaderData?.meta_title || loaderData?.title || "" },
      { property: "og:description", content: loaderData?.meta_description || loaderData?.excerpt || "" },
      { property: "og:image", content: loaderData?.cover_image || "" },
      { property: "og:type", content: "article" },
    ],
  }),
  errorComponent: ({ error }) => <SiteShell><section className="container-site py-24 text-center"><p className="text-sm text-red-600">{error.message}</p></section></SiteShell>,
  notFoundComponent: () => <SiteShell><section className="container-site py-24 text-center"><h1 className="font-display text-4xl">Page not found</h1></section></SiteShell>,
  component: PageView,
});

function PageView() {
  const { slug } = Route.useParams();
  const p = useSuspenseQuery(q(slug)).data!;
  return (
    <SiteShell>
      <StudioSections
        sections={pageSections(p)}
        fallback={
          <article className="pb-24">
            {p.cover_image && (
              <div className="mb-12 h-[46vh] min-h-[320px] overflow-hidden">
                <img src={p.cover_image} alt={p.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="container-site max-w-4xl">
              <h1 className="mb-8 font-display text-4xl md:text-5xl leading-tight">{p.title}</h1>
              <RichContent html={p.body} />
            </div>
          </article>
        }
      />
    </SiteShell>
  );
}
