import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import slide1 from "@/assets/s-5-1.webp.asset.json";
import slide2 from "@/assets/s-5-2.webp.asset.json";
import slide3 from "@/assets/s-5-3.webp.asset.json";

const defaultSlides = [
  {
    img: slide1.url,
    position: "center 30%",
    eyebrow: "The New Season",
    title: "Where light is\ncaught in gold",
    copy: "Hand-set pendants from the rosado — luminous forms on delicate chains.",
    cta: "Explore necklaces",
    href: "/collections/necklaces",
  },
  {
    img: slide2.url,
    position: "center center",
    eyebrow: "Signature Rings",
    title: "A quiet promise\nin every band",
    copy: "Sculpted solitaires and heirloom silhouettes, made to be worn every day.",
    cta: "Shop rings",
    href: "/collections/rings",
  },
  {
    img: slide3.url,
    position: "center 30%",
    eyebrow: "Statement",
    title: "Colour that\ncatches the sun",
    copy: "Gemstone earrings and rings in cool blues — refined drops for every hour.",
    cta: "Shop earrings",
    href: "/collections/earrings",
  },
];

const wordVariants = {
  hidden: { y: "110%" },
  show: (d: number) => ({
    y: "0%",
    transition: { delay: 0.25 + d * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HomeHero({ slides = defaultSlides }: { slides?: any[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative h-[62vh] min-h-[440px] max-h-[820px] w-full overflow-hidden md:h-[78vh] md:min-h-[560px]">
        <AnimatePresence mode="wait">
          {slides.map((s, idx) => idx === i % slides.length && (
            <motion.div key={s.title} className="absolute inset-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
              <motion.img
                src={s.img} alt=""
                initial={{ scale: 1.12 }} animate={{ scale: 1 }}
                transition={{ duration: 7, ease: "easeOut" }}
                className="h-full w-full object-cover"
                style={{ objectPosition: s.position }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="container-site w-full">
                  <div className="max-w-xl text-white">
                    <div className="mb-5 overflow-hidden">
                      <motion.p
                        initial={{ y: "110%" }} animate={{ y: "0%" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[0.7rem] uppercase tracking-[0.4em] text-primary-glow"
                      >
                        {s.eyebrow}
                      </motion.p>
                    </div>

                    <h1 className="mb-6 font-display text-4xl leading-[1.05] md:text-6xl">
                      {String(s.title).split("\n").map((line: string, lineIdx: number) => (
                        <span key={lineIdx} className="block overflow-hidden">
                          <motion.span
                            className="block"
                            custom={lineIdx}
                            variants={wordVariants}
                            initial="hidden"
                            animate="show"
                          >
                            {line}
                          </motion.span>
                        </span>
                      ))}
                    </h1>

                    <div className="mb-8 overflow-hidden">
                      <motion.p
                        initial={{ y: "110%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                        transition={{ delay: 0.55, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-md text-sm leading-relaxed text-white/85 md:text-base"
                      >
                        {s.copy}
                      </motion.p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                    >
                      <Link
                        to={s.href}
                        className="inline-flex items-center gap-2 border border-white/80 px-5 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-white transition-colors hover:bg-white hover:text-foreground"
                      >
                        {s.cta}
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="absolute bottom-8 left-8 z-10 flex gap-2">
          {slides.map((_, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`}
              className={`h-px w-10 transition-all ${idx === i ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
