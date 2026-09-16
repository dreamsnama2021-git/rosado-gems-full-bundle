import { useEffect, useMemo, useState, type ReactNode } from "react";
import { renderSection, StudioBoundary, useStudioMode } from "@/components/home/SectionRenderer";
import { SECTION_MAP, type Props, type StudioSection } from "@/lib/studio";

/**
 * Renders a Studio-built section layout for any page and stays in sync with
 * the admin Studio preview iframe (live edits, section selection, hover
 * highlighting and inline section actions).
 *
 * Always mount this — even when the page has no saved sections — so the
 * Studio preview can stream a live layout into the page. When there is
 * nothing to render, `fallback` (the page's hand-coded design) is shown.
 */
export function StudioSections({
  sections,
  fallback,
}: {
  sections: StudioSection[];
  fallback?: ReactNode;
}) {
  const studio = useStudioMode();
  const [live, setLive] = useState<StudioSection[] | null>(null);
  const [liveProducts, setLiveProducts] = useState<Props[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const m = e.data;
      if (!m || m.source !== "rosado-studio") return;
      if (m.kind === "sections") {
        setLive(m.sections as StudioSection[]);
        if (Array.isArray(m.products)) setLiveProducts(m.products as Props[]);
      }
      if (m.kind === "select") setSelected(m.id ?? null);
    }
    window.addEventListener("message", onMsg);
    window.parent?.postMessage({ source: "rosado-preview", kind: "ready" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const list = live ?? sections ?? [];

  const productsById = useMemo(() => {
    const m = new Map<string, Props>();
    for (const s of sections ?? []) for (const p of (s.props?.products as Props[]) ?? []) m.set(String(p.id), p);
    for (const p of liveProducts) m.set(String(p.id), p);
    return m;
  }, [sections, liveProducts]);

  if (list.length === 0) return <>{fallback ?? null}</>;

  // In Studio, hidden sections stay in the flow (dimmed) so they can be re-enabled.
  const visible = studio ? list : list.filter((s) => s.visible !== false);

  return (
    <>
      {visible.map((s, i) => (
        <StudioBoundary
          key={s.id}
          id={s.id}
          label={SECTION_MAP[s.type]?.label ?? s.type}
          active={studio}
          selected={selected === s.id}
          hidden={s.visible === false}
          index={i}
          count={visible.length}
        >
          {renderSection(s, productsById)}
        </StudioBoundary>
      ))}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pageSections(page: any): StudioSection[] {
  const s = page?.sections;
  return Array.isArray(s) ? (s as StudioSection[]) : [];
}
