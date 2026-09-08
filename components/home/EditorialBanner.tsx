import { Link } from "@tanstack/react-router";
import img8 from "@/assets/img-5-8.webp.asset.json";
import img9 from "@/assets/img-5-9.jpg.asset.json";
import img10 from "@/assets/img-5-10.webp.asset.json";
import img11 from "@/assets/img-5-11.webp.asset.json";
import img12 from "@/assets/img-5-12.webp.asset.json";
import editorialBackground from "@/assets/editorial-background.jpg.asset.json";

const defaultImages = [img8.url, img9.url, img11.url, img12.url, img10.url];

export function EditorialBanner({
  eyebrow = "GRAM GALLERY",
  title = "Artistry And Inspiration",
  copy = "Discover a selection that blends the latest trends with timeless styles. Our collection offers versatile pieces that elevate your wardrobe.",
  cta = "View All Gallery",
  href = "/collections",
  background = editorialBackground.url,
  images = defaultImages,
}: { eyebrow?: string; title?: string; copy?: string; cta?: string; href?: string; background?: string; images?: string[] }) {
  const img = (i: number) => images?.[i] ?? defaultImages[i];
  return (
    <section
      className="py-14 md:py-24"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container-site grid gap-10 lg:grid-cols-[40%_60%] lg:items-center lg:gap-12">
        <div className="max-w-lg">
          <p className="eyebrow mb-4 tracking-[0.25em] md:mb-6">{eyebrow}</p>
          <h2 className="mb-5 font-display text-3xl leading-[1.05] md:mb-6 md:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="mb-8 text-sm text-muted-foreground leading-relaxed md:mb-10 md:text-base">
            {copy}
          </p>
          <Link
            to={href}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-xs font-medium text-background transition-opacity hover:opacity-90 md:px-10 md:py-4 md:text-sm"
          >
            {cta}
          </Link>
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[340px] sm:h-[440px] md:gap-3 md:h-[560px]">

          <img
            src={img(0)}
            alt="Gold star earring"
            className="col-span-1 row-span-1 h-full w-full object-cover"
          />
          <img
            src={img(1)}
            alt="Layered gold necklaces"
            className="col-span-1 row-span-1 h-full w-full object-cover"
          />
          <img
            src={img(2)}
            alt="Ring and necklace"
            className="col-span-1 row-span-2 h-full w-full object-cover"
          />
          <img
            src={img(3)}
            alt="Layered chokers"
            className="col-span-1 row-span-2 h-full w-full object-cover"
          />
          <img
            src={img(4)}
            alt="Beaded bracelet"
            className="col-span-2 row-span-1 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
