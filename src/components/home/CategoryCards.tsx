import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";
import ringsImg from "@/assets/cat-rings.jpg.asset.json";
import necklacesImg from "@/assets/cat-necklaces.jpg.asset.json";
import earringsImg from "@/assets/cat-earrings.jpg.asset.json";
import braceletsImg from "@/assets/cat-bracelets.jpg.asset.json";

const defaultCards = [
  { slug: "rings", label: "Rings", img: ringsImg.url },
  { slug: "necklaces", label: "Necklaces", img: necklacesImg.url },
  { slug: "earrings", label: "Earrings", img: earringsImg.url },
  { slug: "bracelets", label: "Bracelets", img: braceletsImg.url },
];


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CategoryCards({ eyebrow = "Shop by category", title = "Adorned in every way", subtitle = "Find the piece that speaks your story.", cards = defaultCards }: { eyebrow?: string; title?: string; subtitle?: string; cards?: any[] }) {
  return (
    <section className="py-14 md:py-24">
      <div className="container-site">
        <Reveal className="mb-10 text-center md:mb-14">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h2 className="font-display text-3xl md:text-5xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground md:mt-4 md:text-[1.05rem]">{subtitle}</p>
        </Reveal>
        <div className="grid gap-3 grid-cols-2 sm:gap-5 lg:grid-cols-4">

          {cards.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.08}>
              <Link to="/collections/$slug" params={{ slug: c.slug }} className="group relative block overflow-hidden">
                <div className="aspect-[3/4] overflow-hidden bg-header-top">
                  <img src={c.img} alt={c.label} className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-6 text-center text-white">
                  <p className="font-display text-2xl">{c.label}</p>
                  <span className="mt-2 inline-block text-[0.68rem] uppercase tracking-[0.28em]">
                    <span className="relative">Shop now<span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100" /></span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
