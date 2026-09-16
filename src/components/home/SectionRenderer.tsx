import { useEffect, useRef, useState, type ReactNode } from "react";
import { STUDIO_PARAM, type StudioSection, type Props } from "@/lib/studio";
import { HomeHero } from "@/components/home/HomeHero";
import { ShapeOfGemstone } from "@/components/home/ShapeOfGemstone";
import { CategoryCards } from "@/components/home/CategoryCards";
import { NewArrivalRail } from "@/components/home/NewArrivalRail";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { BestSellers } from "@/components/home/BestSellers";
import { Testimonials } from "@/components/home/Testimonials";
import { BlogSection } from "@/components/home/BlogSection";
import { LookbookGrid } from "@/components/home/LookbookGrid";
import { RichContent } from "@/components/site/RichContent";
import {
  PageHeaderSection, ImageTextSection, FeatureCardsSection,
  ContactInfoSection, ContactFormSection, CtaBannerSection,
} from "@/components/site/PageSections";

/** True when the page is rendered inside the admin studio preview iframe. */
export function useStudioMode() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    setActive(new URLSearchParams(window.location.search).get(STUDIO_PARAM) === "1");
  }, []);
  return active;
}

function post(kind: string, payload: Record<string, unknown> = {}) {
  window.parent?.postMessage({ source: "rosado-preview", kind, ...payload }, "*");
}

type BoundaryProps = {
  id: string;
  label: string;
  active: boolean;
  selected: boolean;
  hidden?: boolean;
  index?: number;
  count?: number;
  children: ReactNode;
};

export function StudioBoundary({
  id, label, active, selected, hidden = false, index = 0, count = 1, children,
}: BoundaryProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll the section into view when it becomes the selected one.
  useEffect(() => {
    if (!active || !selected) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [active, selected]);

  if (!active) return <>{children}</>;

  const act = (action: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    post("action", { id, action });
  };

  return (
    <div
      ref={ref}
      data-studio-section={id}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        post("select", { id });
      }}
      className={`group/studio relative cursor-pointer outline-offset-[-2px] transition-all ${
        selected
          ? "outline outline-2 outline-[#7c5cff]"
          : "outline outline-0 outline-[#7c5cff]/50 hover:outline-2"
      } ${hidden ? "opacity-40" : ""}`}
    >
      {/* label chip */}
      <span
        className={`pointer-events-none absolute left-0 top-0 z-40 rounded-br-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white transition-opacity ${
          selected ? "bg-[#7c5cff] opacity-100" : "bg-[#7c5cff]/80 opacity-0 group-hover/studio:opacity-100"
        }`}
      >
        {label}{hidden ? " · hidden" : ""}
      </span>

      {/* quick actions */}
      <div
        className={`absolute right-2 top-2 z-40 flex items-center gap-0.5 rounded-md bg-[#141417]/95 p-0.5 shadow-lg ring-1 ring-white/15 transition-opacity ${
          selected ? "opacity-100" : "opacity-0 group-hover/studio:opacity-100"
        }`}
      >
        <StudioBtn title="Move up" disabled={index === 0} onClick={act("up")}>↑</StudioBtn>
        <StudioBtn title="Move down" disabled={index >= count - 1} onClick={act("down")}>↓</StudioBtn>
        <StudioBtn title={hidden ? "Show section" : "Hide section"} onClick={act("toggle")}>{hidden ? "◍" : "◎"}</StudioBtn>
        <StudioBtn title="Duplicate section" onClick={act("duplicate")}>⧉</StudioBtn>
        <StudioBtn title="Delete section" onClick={act("delete")} danger>✕</StudioBtn>
      </div>

      <div className="pointer-events-none">{children}</div>
    </div>
  );
}

function StudioBtn({ children, title, onClick, disabled, danger }: {
  children: ReactNode; title: string; onClick: (e: React.MouseEvent) => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-6 w-6 place-items-center rounded text-[11px] leading-none ${
        danger ? "text-red-300 hover:bg-red-500/20" : "text-white/80 hover:bg-white/15"
      } disabled:opacity-25`}
    >
      {children}
    </button>
  );
}


export function renderSection(sec: StudioSection, productsById: Map<string, Props>) {
  const p = sec.props ?? {};
  const pick = (): Props[] =>
    ((p.product_ids as string[]) ?? []).map((id) => productsById.get(id)).filter(Boolean) as Props[];

  switch (sec.type) {
    case "hero":
      return <HomeHero slides={p.slides} />;
    case "gemstones":
      return <ShapeOfGemstone eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} body={p.body} items={p.items} />;
    case "categories":
      return <CategoryCards eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} cards={p.cards} />;
    case "product_rail":
      return <NewArrivalRail products={(sec.props.products as Props[]) ?? pick()} eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} />;
    case "product_grid":
      return <BestSellers products={(sec.props.products as Props[]) ?? pick()} eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} />;
    case "editorial":
      return <EditorialBanner eyebrow={p.eyebrow} title={p.title} copy={p.copy} cta={p.cta} href={p.href} background={p.background} images={p.images} />;
    case "testimonials":
      return <Testimonials eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} reviews={p.reviews} />;
    case "blog":
      return <BlogSection eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} background={p.background} />;
    case "lookbook":
      return <LookbookGrid eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} handle={p.handle} tiles={p.tiles} />;
    case "rich_text":
      return (
        <section className="py-14 md:py-20">
          <div className="container-site max-w-4xl">
            {p.title && <h2 className="mb-6 font-display text-3xl md:text-4xl">{p.title}</h2>}
            <RichContent html={p.html ?? ""} />
          </div>
        </section>
      );
    case "page_header":
      return <PageHeaderSection eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} cover={p.cover} align={p.align} />;
    case "image_text":
      return <ImageTextSection image={p.image} side={p.side} eyebrow={p.eyebrow} title={p.title} html={p.html} cta={p.cta} href={p.href} />;
    case "feature_cards":
      return <FeatureCardsSection eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} cards={p.cards} />;
    case "contact_info":
      return <ContactInfoSection items={p.items} />;
    case "contact_form":
      return <ContactFormSection title={p.title} subtitle={p.subtitle} cta={p.cta} />;
    case "cta_banner":
      return <CtaBannerSection title={p.title} copy={p.copy} cta={p.cta} href={p.href} background={p.background} />;
    default:
      return null;
  }
}
