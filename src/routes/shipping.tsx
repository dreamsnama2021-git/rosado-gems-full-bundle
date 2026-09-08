import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { StudioSections, pageSections } from "@/components/site/StudioSections";
import { getPageBySlug } from "@/lib/pages.functions";

const q = queryOptions({ queryKey: ["page", "shipping"], queryFn: () => getPageBySlug({ data: { slug: "shipping" } }) });

export const Route = createFileRoute("/shipping")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  head: () => ({
    meta: [
      { title: "Shipping Terms — Rosado Gems" },
      { name: "description", content: "Shipping, insurance and returns for Rosado Gems." },
      { property: "og:title", content: "Shipping Terms — Rosado Gems" },
      { property: "og:description", content: "How we ship, insure and return jewelry at Rosado Gems." },
    ],
  }),
  component: Shipping,
});

function Shipping() {
  const page = useSuspenseQuery(q).data;
  return (
    <SiteShell>
      <StudioSections
        sections={pageSections(page)}
        fallback={
          <>
            <section className="py-16 md:py-20">
              <div className="container-site text-center">
                <p className="eyebrow mb-3">Delivery &amp; Returns</p>
                <h1 className="font-display text-5xl md:text-6xl">{page?.title || "Shipping Terms"}</h1>
              </div>
            </section>
            <section className="pb-24">
              <div className="container-site max-w-3xl">
                <div className="rich-content" dangerouslySetInnerHTML={{ __html: page?.body || "" }} />
              </div>
            </section>
          </>
        }
      />
    </SiteShell>
  );
}
