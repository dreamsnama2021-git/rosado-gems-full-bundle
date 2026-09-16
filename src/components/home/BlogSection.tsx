import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Reveal } from "@/components/site/Reveal";
import { ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import { getBlogPosts } from "@/lib/products.functions";

const postsQ = queryOptions({ queryKey: ["blog", "home"], queryFn: () => getBlogPosts() });

export function BlogSection({
  eyebrow = "Journal",
  title = "Stories from the Rosadogems",
  subtitle = "Field notes on craft, provenance and the quiet rituals behind every piece.",
  background = "#E8D6C8",
}: { eyebrow?: string; title?: string; subtitle?: string; background?: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { data: posts = [] } = useQuery(postsQ);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-blog-card]");
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  if (posts.length === 0) return null;

  return (
    <section className="py-24" style={{ backgroundColor: background }}>
      <div className="container-site">
        <Reveal className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
            <h2 className="font-display text-4xl md:text-5xl leading-tight">{title}</h2>
            <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/blog" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] border-b border-foreground/30 pb-1 hover:border-foreground transition-colors">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={() => scrollBy(-1)} aria-label="Previous stories" className="grid h-11 w-11 place-items-center rounded-full border border-foreground/20 text-foreground transition-all hover:bg-foreground hover:text-background"><ArrowLeft className="h-4 w-4" /></button>
              <button onClick={() => scrollBy(1)} aria-label="Next stories" className="grid h-11 w-11 place-items-center rounded-full border border-foreground/20 text-foreground transition-all hover:bg-foreground hover:text-background"><ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        </Reveal>

        <div ref={scrollerRef} className="no-scrollbar flex gap-6 overflow-x-auto scroll-smooth pb-2">
          {posts.map((post) => (
            <article key={post.id} data-blog-card className="group shrink-0 w-[82%] sm:w-[46%] md:w-[34%] lg:w-[26%] xl:w-[22%]">
              <Link to="/blog/$slug" params={{ slug: post.slug }} className="block">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f2f0ee] mb-5">
                  <img src={post.cover_image ?? ""} alt={post.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  <span>{new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <span>{post.author}</span>
                </div>
                <h3 className="font-display text-xl md:text-2xl leading-snug mb-3 transition-colors group-hover:text-foreground/70">{post.title}</h3>
                {post.excerpt && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{post.excerpt}</p>}
                <div className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-foreground">
                  Read story <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
