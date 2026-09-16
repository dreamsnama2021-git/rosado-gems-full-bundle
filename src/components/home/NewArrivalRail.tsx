import { useRef } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { ChevronLeft, ChevronRight } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NewArrivalRail({ products, eyebrow = "Just In", title = "New Arrival", subtitle = "" }: { products: any[]; eyebrow?: string; title?: string; subtitle?: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * 400, behavior: "smooth" });

  return (
    <section className="py-24">
      <div className="container-site">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">{eyebrow}</p>
            <h2 className="font-display text-4xl md:text-5xl">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground max-w-xl">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll(-1)} aria-label="Prev" className="grid h-10 w-10 place-items-center border border-border transition-colors hover:border-primary hover:text-primary"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => scroll(1)} aria-label="Next" className="grid h-10 w-10 place-items-center border border-border transition-colors hover:border-primary hover:text-primary"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </Reveal>

        <div ref={scroller} className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2">
          {products.map((p) => (
            <div key={p.id} className="w-[70vw] shrink-0 snap-start sm:w-[42vw] md:w-[28vw] lg:w-[22vw]">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
