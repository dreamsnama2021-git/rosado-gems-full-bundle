import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { StudioSections, pageSections } from "@/components/site/StudioSections";
import { getPageBySlug } from "@/lib/pages.functions";

const q = queryOptions({ queryKey: ["page", "terms"], queryFn: () => getPageBySlug({ data: { slug: "terms" } }) });

export const Route = createFileRoute("/terms")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  head: () => ({ meta: [{ title: "Terms & Conditions — Rosado Gems" }, { name: "description", content: "Terms and conditions for shopping with Rosado Gems." }] }),
  component: TermsPage,
});

function TermsPage() {
  const page = useSuspenseQuery(q).data;
  return (
    <SiteShell>
      <StudioSections
        sections={pageSections(page)}
        fallback={
          <>
            <section className="py-16"><div className="container-site text-center"><p className="eyebrow mb-3">Legal</p><h1 className="font-display text-5xl md:text-6xl">{page?.title || "Terms & Conditions"}</h1></div></section>
            <section className="pb-24"><div className="container-site max-w-3xl">
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: page?.body || "" }} />
            </div></section>
          </>
        }
      />
    </SiteShell>
  );
}
