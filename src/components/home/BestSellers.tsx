import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { Link } from "@tanstack/react-router";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BestSellers({ products, eyebrow = "Beloved", title = "Best Sellers", subtitle = "" }: { products: any[]; eyebrow?: string; title?: string; subtitle?: string }) {
  return (
    <section className="py-14 md:py-24 bg-background">
      <div className="container-site">
        <Reveal className="mb-8 text-center md:mb-12">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="font-display text-3xl md:text-5xl">{title}</h2>
          {subtitle && <p className="mt-3 text-sm text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
        </Reveal>
        <div className="grid gap-4 grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
        <div className="mt-10 text-center md:mt-14">
          <Link to="/collections" className="btn-primary scale-[0.7]"><span>View all jewelry</span></Link>
        </div>
      </div>
    </section>

  );
}
