import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { StudioSections, pageSections } from "@/components/site/StudioSections";
import { getPageBySlug } from "@/lib/pages.functions";

const q = queryOptions({ queryKey: ["page", "privacy"], queryFn: () => getPageBySlug({ data: { slug: "privacy" } }) });

export const Route = createFileRoute("/privacy")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  head: () => ({
    meta: [
      { title: "Privacy Policy — Rosado Gems" },
      { name: "description", content: "Read how Rosado Gems collects, uses, stores and protects your personal information when you browse, order or contact our Mumbai studio." },
      { property: "og:title", content: "Privacy Policy — Rosado Gems" },
      { property: "og:description", content: "How Rosado Gems collects, uses and protects the personal information of customers and website visitors." },
      { property: "og:url", content: "https://rosado.techberries.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://rosado.techberries.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const page = useSuspenseQuery(q).data;
  return (
    <SiteShell>
      <StudioSections
        sections={pageSections(page)}
        fallback={
          <>
            <section className="py-16"><div className="container-site text-center"><p className="eyebrow mb-3">Legal</p><h1 className="font-display text-5xl md:text-6xl">{page?.title || "Privacy Policy"}</h1></div></section>
            <section className="pb-24"><div className="container-site max-w-3xl">
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: page?.body || "" }} />
            </div></section>
          </>
        }
      />
    </SiteShell>
  );
}
