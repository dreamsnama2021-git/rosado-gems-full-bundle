import { Instagram } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import ig2 from "@/assets/lookbook/ig-2.webp.asset.json";
import ig3 from "@/assets/lookbook/ig-3.webp.asset.json";
import ig4 from "@/assets/lookbook/ig-4.webp.asset.json";
import ig5 from "@/assets/lookbook/ig-5.webp.asset.json";
import ig6 from "@/assets/lookbook/ig-6.webp.asset.json";

const defaultTiles = [ig2.url, ig5.url, ig3.url, ig4.url, ig6.url];

export function LookbookGrid({
  eyebrow = "You Would Love You On Social",
  title = "Follow Us @rosado_gemsofficial",
  subtitle = "Discover daily sparkle, exclusive drops, and behind-the-scenes moments just for you.",
  handle = "rosado_gemsofficial",
  tiles = defaultTiles,
}: { eyebrow?: string; title?: string; subtitle?: string; handle?: string; tiles?: string[] }) {
  const user = (handle || "rosado_gemsofficial").replace(/^@/, "").trim();
  const profileUrl = `https://www.instagram.com/${user}/`;
  const colMap: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5", 6: "md:grid-cols-6" };
  const cols = colMap[tiles.length] ?? "md:grid-cols-5";
  return (
    <section className="pt-24">
      <div className="container-site">
        <Reveal className="mb-10 text-center">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h2 className="font-display text-4xl md:text-5xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base md:text-lg text-muted-foreground">
            {subtitle}
          </p>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-primary hover:text-primary"
          >
            <Instagram className="h-4 w-4" />
            <span>@{user}</span>
          </a>
        </Reveal>
      </div>
      <div className={`grid grid-cols-2 gap-0 ${cols}`}>
        {tiles.map((src, i) => {
          const isCenter = i === Math.floor(tiles.length / 2);
          return (
            <a
              key={i}
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View @${user} on Instagram`}
              className="group relative block overflow-hidden"
            >
              <div className="aspect-[25/33] bg-[#f2f0ee]">
                <img
                  src={src}
                  alt={`@${user} jewelry post ${i + 1} on Instagram`}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                />
              </div>
              <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <Instagram className="h-6 w-6 text-white" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-white">@{user}</span>
              </span>
              {isCenter && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 group-hover:opacity-0">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-foreground shadow-md">
                    <Instagram className="h-6 w-6" />
                  </span>
                </span>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
