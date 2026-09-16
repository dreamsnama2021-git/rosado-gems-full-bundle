import { Star } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

type Review = {
  quote: string;
  name: string;
  location: string;
  initials: string;
  tone?: string;
};

const defaultReviews: Review[] = [
  {
    quote:
      "I absolutely love my new ring! The craftsmanship is stunning, and it fits perfectly. I've received so many compliments. Thank you for such a beautiful piece!",
    name: "Candace V. Miller",
    location: "From Florida",
    initials: "CM",
    tone: "bg-[#e8d5c4] text-[#7a4a2b]",
  },
  {
    quote:
      "I was thrilled with my recent purchase! The quality of the jewelry is top-notch, and the shipping was super fast. I'll definitely be a returning customer for sure!",
    name: "Margaret B. Dobbins",
    location: "From Louisiana",
    initials: "MD",
    tone: "bg-[#f2c9c2] text-[#8a3a3a]",
  },
  {
    quote:
      "I ordered a pair of earrings for a wedding, and they were a huge hit! They complemented my dress beautifully, I felt so confident wearing them that day.",
    name: "Thersa T. Marston",
    location: "From California",
    initials: "TM",
    tone: "bg-[#f0d1b5] text-[#8a4a1f]",
  },
  {
    quote:
      "This is my go-to place for all gifts! The jewelry is unique, and the recipients always love their beautiful pieces. Great service and fast delivery every time!",
    name: "Latoya M. White",
    location: "From Florida",
    initials: "LW",
    tone: "bg-[#cddccb] text-[#3d5a3f]",
  },
];

export function Testimonials({
  eyebrow = "Testimonials",
  title = "Loved & Worn Everywhere",
  subtitle = "Real words from the people who wear Rosadogems every day — from first heirlooms to bridal moments and everyday little luxuries.",
  reviews = defaultReviews,
}: { eyebrow?: string; title?: string; subtitle?: string; reviews?: Review[] }) {
  const tones = defaultReviews.map((r) => r.tone);
  return (
    <section className="py-16 md:py-28">
      <div className="container-site">
        <Reveal className="mb-10 max-w-3xl md:mb-14">
          {eyebrow && <p className="eyebrow mb-3 md:mb-4">{eyebrow}</p>}
          <h2 className="font-display text-3xl leading-[1.1] md:text-6xl md:leading-[1.05]">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground md:mt-5 md:text-base">
            {subtitle}
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">

          {reviews.map((r, idx) => (
            <Reveal key={`${r.name}-${idx}`} delay={idx * 0.08}>
              <article className="flex h-full flex-col rounded-[10px] bg-[#faf8f5] p-7 transition-colors hover:bg-[#f5f2ed]">
                <div className="mb-5 flex gap-1 text-foreground">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" strokeWidth={0} />
                  ))}
                </div>
                <p className="flex-1 text-[0.98rem] leading-relaxed text-foreground/85">
                  {r.quote}
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full text-xs font-medium tracking-wide ${r.tone ?? tones[idx % tones.length]}`}
                    aria-hidden
                  >
                    {r.initials}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.location}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
