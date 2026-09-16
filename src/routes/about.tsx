import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { StudioSections, pageSections } from "@/components/site/StudioSections";
import { Reveal } from "@/components/site/Reveal";
import { Link } from "@tanstack/react-router";
import { getPageBySlug } from "@/lib/pages.functions";
import { RichContent } from "@/components/site/RichContent";
import aboutHeroAsset from "@/assets/about-hero.jpg.asset.json";
import blueLapis from "@/assets/about-gems/blue-lapis.png.asset.json";
import goldenTopaz from "@/assets/about-gems/golden-topaz.png.asset.json";
import greenEmerald from "@/assets/about-gems/green-emerald.png.asset.json";
import redGarnet from "@/assets/about-gems/red-garnet.png.asset.json";

const aboutQ = queryOptions({
  queryKey: ["page", "about"],
  queryFn: () => getPageBySlug({ data: { slug: "about" } }),
});

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(aboutQ),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.meta_title || "About Us — Rosado Gems · Mumbai Rosado" },
      { name: "description", content: loaderData?.meta_description || "The story of Rosado Gems — a Mumbai rosado of fine jewelry and certified gemstones, based in Lower Parel." },
      { property: "og:title", content: loaderData?.meta_title || "About Rosado Gems" },
      { property: "og:description", content: loaderData?.meta_description || "A Mumbai rosado of fine jewelry and certified gemstones — the story, the craft, the values." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: loaderData?.cover_image || aboutHeroAsset.url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: loaderData?.cover_image || aboutHeroAsset.url },
    ],
  }),
  component: About,
});


const pillars = [
  { t: "Provenance", d: "Every stone traced from mine to setting, with a certification you can carry." },
  { t: "Craft", d: "Wax model, hand-set stone, hand-polish finish. No shortcuts in the rosado." },
  { t: "Materials", d: "Recycled 18K gold, platinum and ethically sourced gemstones." },
  { t: "Service", d: "Lifetime buy-back, complimentary cleaning, private consultations by appointment." },
];

const timeline = [
  { y: "2008", t: "The first bench", d: "Priya Rasoda opens a two-bench rosado in Lower Parel with a single master craftsman." },
  { y: "2013", t: "The bridal collection", d: "Our bridal editions become a mainstay for Mumbai's private clients." },
  { y: "2019", t: "Certified gemstones", d: "Direct sourcing partnerships with certified stone houses in Colombia, Sri Lanka and Burma." },
  { y: "2026", t: "The digital rosado", d: "Rosado Gems opens its first digital storefront while the workshop stays exactly where it began." },
];

function About() {
  const page = useSuspenseQuery(aboutQ).data;
  const secs = pageSections(page);

  const legacy = page?.body ? (
    <article className="pb-24">
      {page.cover_image && (
        <div className="mb-12 h-[46vh] min-h-[320px] overflow-hidden">
          <img src={page.cover_image} alt={page.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="container-site max-w-4xl">
        <h1 className="mb-8 mt-12 font-display text-4xl md:text-5xl leading-tight">{page.title}</h1>
        <RichContent html={page.body} />
      </div>
    </article>
  ) : null;

  return (
    <SiteShell>
      <StudioSections
        sections={secs}
        fallback={legacy ?? (
      <>
      <section className="relative h-[62vh] min-h-[440px] overflow-hidden">
        <img src={aboutHeroAsset.url} alt="Jeweler setting a gemstone at the Rosado Gems" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
        <div className="container-site absolute inset-0 flex items-end pb-16">
          <div className="max-w-xl text-foreground">
            <p className="eyebrow mb-4 !text-primary">Our Story</p>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">A small rosado with an old-world craft</h1>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-site grid gap-14 md:grid-cols-[1fr_1.2fr] md:items-start">
          <Reveal>
            <p className="eyebrow mb-4">Since 2008</p>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">Rosado Gems is a Mumbai house of fine jewelry.</h2>
          </Reveal>
          <Reveal delay={0.1} className="space-y-5 text-muted-foreground leading-relaxed">
            <p>We began with a single bench and a simple promise: every piece must earn its place, every stone must carry its provenance, every finish must be worked by hand. Almost two decades on, that promise has not changed.</p>
            <p>Our clients come to us for engagement rings and heirloom pendants, for certified emeralds and quiet everyday pieces. What they leave with is something made for them — considered, hand-set, and signed by the rosado.</p>
            <p>Today the workshop is still in Lower Parel, still small, still stubborn about doing things the slow way. It is our favourite thing about ourselves.</p>
          </Reveal>
        </div>
      </section>

      <section className="py-16 bg-header-top">
        <div className="container-site">
          <Reveal className="mb-12 text-center">
            <p className="eyebrow mb-3">Our Values</p>
            <h2 className="font-display text-4xl">Four pillars, one house</h2>
          </Reveal>
          <div className="grid gap-8 md:grid-cols-4">
            {pillars.map((p, i) => (
              <Reveal key={p.t} delay={i * 0.06}>
                <div className="border-t border-primary pt-6">
                  <p className="mb-3 font-display text-xl">{p.t}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-site">
          <Reveal className="mb-14 max-w-xl">
            <p className="eyebrow mb-3">Timeline</p>
            <h2 className="font-display text-4xl md:text-5xl">A slow, deliberate journey</h2>
          </Reveal>
          <div className="space-y-10">
            {timeline.map((t, i) => (
              <Reveal key={t.y} delay={i * 0.05}>
                <div className="grid gap-4 border-t border-border pt-8 md:grid-cols-[120px_180px_1fr]">
                  <p className="font-display text-3xl text-primary">{t.y}</p>
                  <p className="font-display text-xl">{t.t}</p>
                  <p className="text-muted-foreground leading-relaxed">{t.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-site">
          <Reveal className="mb-10 max-w-xl">
            <p className="eyebrow mb-3">The Stones We Love</p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">Colour, cut and character</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {[
              { src: blueLapis.url, name: "Blue Lapis" },
              { src: goldenTopaz.url, name: "Golden Topaz" },
              { src: greenEmerald.url, name: "Green Emerald" },
              { src: redGarnet.url, name: "Red Garnet" },
            ].map((g) => (
              <div key={g.name} className="group">
                <div className="aspect-square overflow-hidden rounded-sm bg-header-top/60 grid place-items-center p-8">
                  <img src={g.src} alt={g.name} className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105" />
                </div>
                <p className="mt-3 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{g.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="pb-24 text-center">
        <div className="container-site">
          <h2 className="mx-auto mb-6 max-w-2xl font-display text-4xl md:text-5xl leading-tight">Visit the rosado by appointment</h2>
          <Link to="/contact" className="btn-primary"><span>Book a private viewing</span></Link>
        </div>
      </section>
      </>
        )}
      />
    </SiteShell>
  );
}
