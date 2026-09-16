import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { getHomepageSections } from "@/lib/products.functions";
import { StudioSections } from "@/components/site/StudioSections";
import { type StudioSection } from "@/lib/studio";

const homeQ = queryOptions({
  queryKey: ["homepage", "sections"],
  queryFn: () => getHomepageSections(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQ),
  head: () => ({
    meta: [
      { title: "Rosado Gems — Fine Jewelry & Certified Gemstones · Mumbai" },
      { name: "description", content: "Discover heritage rings, necklaces, earrings, bracelets and bridal collections from the Rosado Gems in Lower Parel, Mumbai." },
      { property: "og:title", content: "Rosado Gems — Fine Jewelry & Certified Gemstones · Mumbai" },
      { property: "og:description", content: "Discover heritage rings, necklaces, earrings, bracelets and bridal collections from the Rosado Gems in Lower Parel, Mumbai." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4ae6e882-b988-49dc-b479-7e9b4394cc1d" },
    ],
  }),
  component: Home,
});

function Home() {
  const data = useSuspenseQuery(homeQ).data;
  const sections = ((data.sections as unknown as StudioSection[]) ?? []);
  return (
    <SiteShell>
      <StudioSections sections={sections} />
    </SiteShell>
  );
}

