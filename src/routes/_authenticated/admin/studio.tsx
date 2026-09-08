import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Eye, EyeOff, GripVertical, Trash2, Plus, Monitor, Tablet, Smartphone,
  ExternalLink, Search, X, ChevronLeft, Package, Loader2, Settings2, Layers,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getAdminSiteSettings, adminUpdateSiteSettings,
  type SiteSettings, type EmailTemplatesMap,
} from "@/lib/site-settings.functions";
import { adminListProducts } from "@/lib/admin.functions";
import { adminListPages, adminUpsertPage, adminDeletePage } from "@/lib/pages.functions";
import {
  SECTION_DEFS, SECTION_MAP, defaultHomeSections, defaultPageSections, sectionsFromLegacyPage, makeSection,
  type Field, type Props, type StudioSection,
} from "@/lib/studio";
import { SingleImageUpload, MultiImageUpload } from "@/components/admin/ImageUpload";
import { RichEditor } from "@/components/admin/RichEditor";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";

const settingsQ = queryOptions({ queryKey: ["site-settings", "admin"], queryFn: () => getAdminSiteSettings() });
const productsQ = queryOptions({ queryKey: ["admin-products", "picker"], queryFn: () => adminListProducts() });
const pagesQ = queryOptions({ queryKey: ["admin-pages", "studio"], queryFn: () => adminListPages() });

export const Route = createFileRoute("/_authenticated/admin/studio")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(settingsQ),
    context.queryClient.ensureQueryData(productsQ),
    context.queryClient.ensureQueryData(pagesQ),
  ]),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: StudioPage,
});

const DEVICES = {
  desktop: { icon: Monitor, width: "100%", label: "Desktop" },
  tablet: { icon: Tablet, width: "820px", label: "Tablet" },
  mobile: { icon: Smartphone, width: "420px", label: "Mobile" },
} as const;
type DeviceKey = keyof typeof DEVICES;

/** Slugs that render through their own top-level route rather than /pages/<slug>. */
const RESERVED_PATHS: Record<string, string> = {
  about: "/about",
  contact: "/contact",
  terms: "/terms",
  privacy: "/privacy",
  shipping: "/shipping",
  collections: "/collections",
  blog: "/blog",
};

export function pathForPage(slug: string) {
  return RESERVED_PATHS[slug] ?? `/pages/${slug}`;
}

type PageRow = {
  id: string; slug: string; title: string; body?: string | null; excerpt?: string | null;
  cover_image?: string | null; meta_title?: string | null; meta_description?: string | null;
  published: boolean; sort_order: number; sections?: StudioSection[] | null;
};

function StudioPage() {
  const settings = useSuspenseQuery(settingsQ).data;
  const products = useSuspenseQuery(productsQ).data as Props[];
  const pages = useSuspenseQuery(pagesQ).data as PageRow[];
  const qc = useQueryClient();

  const [target, setTarget] = useState<string>("home");
  const isHome = target === "home";
  const page = useMemo(() => pages.find((p) => p.id === target) ?? null, [pages, target]);

  const homeInitial = useCallback((): StudioSection[] => {
    const saved = settings?.homepage?.sections;
    if (saved && saved.length > 0) return saved as StudioSection[];
    const defaults = defaultHomeSections();
    const na = settings?.homepage?.new_arrivals;
    const bs = settings?.homepage?.best_sellers;
    return defaults.map((s) => {
      if (s.type === "product_rail" && na) return { ...s, props: { ...s.props, ...na } };
      if (s.type === "product_grid" && bs) return { ...s, props: { ...s.props, ...bs } };
      return s;
    });
  }, [settings]);

  const [sections, setSections] = useState<StudioSection[]>(homeInitial);
  const [pageMeta, setPageMeta] = useState<PageRow | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editProduct, setEditProduct] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load the section layout for the current target.
  useEffect(() => {
    setSelected(null);
    setDirty(false);
    setShowSettings(false);
    if (isHome) {
      setPageMeta(null);
      setSections(homeInitial());
      return;
    }
    if (!page) return;
    setPageMeta({ ...page });
    const saved = Array.isArray(page.sections) ? page.sections : [];
    setSections(saved.length > 0 ? saved : sectionsFromLegacyPage(page));
  }, [target, isHome, page, homeInitial]);

  const previewSrc = isHome ? "/?studio=1" : `${pathForPage(pageMeta?.slug ?? "")}?studio=1`;

  const push = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const clean = sections.map((s) => {
      const { products: _drop, ...rest } = s.props ?? {};
      return { ...s, props: rest };
    });
    win.postMessage({ source: "rosado-studio", kind: "sections", sections: clean, products }, "*");
    win.postMessage({ source: "rosado-studio", kind: "select", id: selected }, "*");
  }, [sections, selected, products]);

  const runAction = useCallback((id: string, action: string) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      if (action === "up" && idx > 0) return arrayMove(prev, idx, idx - 1);
      if (action === "down" && idx < prev.length - 1) return arrayMove(prev, idx, idx + 1);
      if (action === "toggle") return prev.map((s) => (s.id === id ? { ...s, visible: s.visible === false } : s));
      if (action === "duplicate") {
        const copy = structuredClone(prev[idx]);
        copy.id = `${copy.type}-${Math.random().toString(36).slice(2, 9)}`;
        const next = [...prev];
        next.splice(idx + 1, 0, copy);
        setSelected(copy.id);
        return next;
      }
      if (action === "delete") {
        setSelected((sel) => (sel === id ? null : sel));
        return prev.filter((s) => s.id !== id);
      }
      return prev;
    });
    if (action !== "duplicate") setSelected(id);
    setDirty(true);
  }, []);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const m = e.data;
      if (!m || m.source !== "rosado-preview") return;
      if (m.kind === "ready") push();
      if (m.kind === "select") setSelected(m.id);
      if (m.kind === "action") runAction(String(m.id), String(m.action));
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [push, runAction]);

  useEffect(() => { push(); }, [push]);

  function update(id: string, patch: Partial<StudioSection>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setDirty(true);
  }
  function updateProps(id: string, patch: Props) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, props: { ...s.props, ...patch } } : s)));
    setDirty(true);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const from = prev.findIndex((s) => s.id === active.id);
      const to = prev.findIndex((s) => s.id === over.id);
      return from < 0 || to < 0 ? prev : arrayMove(prev, from, to);
    });
    setDirty(true);
  }

  const cleanSections = () => sections.map((s) => {
    const { products: _drop, ...rest } = s.props ?? {};
    return { id: s.id, type: s.type, visible: s.visible !== false, props: rest };
  });

  async function saveHome() {
    if (!settings) return;
    const rail = sections.find((s) => s.type === "product_rail");
    const grid = sections.find((s) => s.type === "product_grid");
    const strip = (s?: StudioSection) => ({
      eyebrow: String(s?.props?.eyebrow ?? ""),
      title: String(s?.props?.title ?? ""),
      subtitle: String(s?.props?.subtitle ?? ""),
      product_ids: (s?.props?.product_ids as string[]) ?? [],
    });
    const payload: SiteSettings = {
      whatsapp_enabled: settings.whatsapp_enabled, whatsapp_number: settings.whatsapp_number ?? "", whatsapp_message: settings.whatsapp_message ?? "",
      ai_chat_enabled: settings.ai_chat_enabled, ai_chat_persona: settings.ai_chat_persona ?? "", ai_chat_model: settings.ai_chat_model ?? "google/gemini-2.5-flash",
      social_share_enabled: settings.social_share_enabled, share_instagram: settings.share_instagram, share_facebook: settings.share_facebook, share_twitter: settings.share_twitter, share_email: settings.share_email,
      instagram_url: settings.instagram_url ?? "", facebook_url: settings.facebook_url ?? "", twitter_url: settings.twitter_url ?? "",
      blog_share_enabled: settings.blog_share_enabled, blog_comments_enabled: settings.blog_comments_enabled, blog_comments_moderation: settings.blog_comments_moderation,
      default_country: settings.default_country, default_currency: settings.default_currency, currency_symbol: settings.currency_symbol,
      tax_enabled: settings.tax_enabled, tax_label: settings.tax_label, tax_rate: Number(settings.tax_rate), tax_inclusive: settings.tax_inclusive,
      email_templates: (settings.email_templates as EmailTemplatesMap) ?? {},
      head_scripts: settings.head_scripts ?? "", body_scripts: settings.body_scripts ?? "",
      shipping_enabled: settings.shipping_enabled, shipping_flat_rate: Number(settings.shipping_flat_rate), free_shipping_threshold: Number(settings.free_shipping_threshold),
      cod_enabled: settings.cod_enabled, cod_fee: Number(settings.cod_fee), cod_min_order: Number(settings.cod_min_order), cod_max_order: Number(settings.cod_max_order),
      shiprocket_enabled: settings.shiprocket_enabled, shiprocket_email: settings.shiprocket_email ?? "", shiprocket_password: settings.shiprocket_password ?? "",
      shiprocket_pickup_location: settings.shiprocket_pickup_location ?? "Primary", shiprocket_channel_id: settings.shiprocket_channel_id ?? "", shiprocket_pickup_pincode: settings.shiprocket_pickup_pincode ?? "",
      header_menu: settings.header_menu ?? [],
      ring_size_guide_enabled: settings.ring_size_guide_enabled ?? true,
      ring_size_guide_image: settings.ring_size_guide_image ?? "",
      ring_size_guide_note: settings.ring_size_guide_note ?? "",
      homepage: { new_arrivals: strip(rail), best_sellers: strip(grid), sections: cleanSections() },
    };
    await adminUpdateSiteSettings({ data: payload });
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    qc.invalidateQueries({ queryKey: ["homepage"] });
  }

  async function savePage() {
    if (!pageMeta) return;
    await adminUpsertPage({
      data: {
        id: pageMeta.id,
        slug: pageMeta.slug,
        title: pageMeta.title,
        body: pageMeta.body ?? "",
        excerpt: pageMeta.excerpt ?? "",
        cover_image: pageMeta.cover_image ?? "",
        meta_title: pageMeta.meta_title ?? "",
        meta_description: pageMeta.meta_description ?? "",
        published: pageMeta.published,
        sort_order: pageMeta.sort_order ?? 0,
        sections: cleanSections(),
      },
    });
    qc.invalidateQueries({ queryKey: ["admin-pages"] });
    qc.invalidateQueries({ queryKey: ["page"] });
  }

  async function save() {
    setSaving(true);
    try {
      if (isHome) await saveHome(); else await savePage();
      toast.success(isHome ? "Homepage published" : "Page published");
      setDirty(false);
      iframeRef.current?.contentWindow?.location.reload();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  async function createPage() {
    const title = window.prompt("Page title");
    if (!title) return;
    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      const res = await adminUpsertPage({
        data: {
          slug, title, body: "", excerpt: "", cover_image: "",
          meta_title: title, meta_description: "", published: true, sort_order: 0,
          sections: defaultPageSections(title),
        },
      });
      await qc.invalidateQueries({ queryKey: ["admin-pages"] });
      setTarget(String(res.id));
      toast.success("Page created");
    } catch (e) { toast.error((e as Error).message); }
  }

  async function removePage() {
    if (!pageMeta || !window.confirm(`Delete “${pageMeta.title}”?`)) return;
    try {
      await adminDeletePage({ data: { id: pageMeta.id } });
      await qc.invalidateQueries({ queryKey: ["admin-pages"] });
      setTarget("home");
      toast.success("Page deleted");
    } catch (e) { toast.error((e as Error).message); }
  }

  const current = sections.find((s) => s.id === selected) ?? null;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#141417] text-white">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3">
        <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Admin
        </Link>
        <span className="font-display text-base">Studio</span>

        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="ml-2 h-8 max-w-[220px] rounded-md border border-white/15 bg-[#1c1c20] px-2 text-xs text-white/90 outline-none"
        >
          <optgroup label="Homepage">
            <option value="home">Homepage</option>
          </optgroup>
          <optgroup label="Pages">
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.title}{p.published ? "" : " (draft)"}</option>
            ))}
          </optgroup>
        </select>

        <button onClick={createPage} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-[11px] text-white/75 hover:bg-white/10">
          <Plus className="h-3.5 w-3.5" /> New page
        </button>
        <span className="hidden text-[10px] text-white/35 md:block">{isHome ? "/" : pathForPage(pageMeta?.slug ?? "")}</span>

        <div className="ml-auto flex items-center gap-1 rounded-md border border-white/10 p-0.5">
          {(Object.keys(DEVICES) as DeviceKey[]).map((k) => {
            const Icon = DEVICES[k].icon;
            return (
              <button key={k} onClick={() => setDevice(k)} title={DEVICES[k].label}
                className={`grid h-7 w-8 place-items-center rounded ${device === k ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}>
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <a href={isHome ? "/" : pathForPage(pageMeta?.slug ?? "")} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10">
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </a>
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-[#7c5cff] px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {dirty ? "Publish changes" : "Published"}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* left: section list */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 lg:flex">
          <div className="flex items-center justify-between px-3 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white/45">
            Sections
            <button onClick={() => setAdding((v) => !v)} className="grid h-6 w-6 place-items-center rounded hover:bg-white/10 hover:text-white" title="Add section">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {adding && (
            <div className="mx-2 mb-2 max-h-64 overflow-y-auto rounded-md border border-white/10 bg-[#1c1c20] p-1">
              {SECTION_DEFS.map((d) => (
                <button key={d.type}
                  onClick={() => { const s = makeSection(d.type); setSections((p) => [...p, s]); setSelected(s.id); setShowSettings(false); setAdding(false); setDirty(true); }}
                  className="block w-full rounded px-2 py-1.5 text-left text-xs text-white/80 hover:bg-white/10">
                  <span className="block">{d.label}</span>
                  <span className="block text-[10px] text-white/40">{d.description}</span>
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {!isHome && pageMeta && (
              <button
                onClick={() => { setShowSettings(true); setSelected(null); }}
                className={`mb-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs ${showSettings ? "bg-[#7c5cff]/20 text-white ring-1 ring-[#7c5cff]/60" : "text-white/70 hover:bg-white/5"}`}>
                <Settings2 className="h-3.5 w-3.5" /> Page settings
              </button>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1">
                  {sections.map((s) => (
                    <SectionRow
                      key={s.id} s={s} selected={selected === s.id}
                      onSelect={() => { setSelected(s.id); setShowSettings(false); }}
                      onToggle={() => update(s.id, { visible: !(s.visible !== false) })}
                      onDelete={() => { setSections((p) => p.filter((x) => x.id !== s.id)); setSelected(null); setDirty(true); }}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            {sections.length === 0 && (
              <p className="px-2 py-6 text-[11px] leading-relaxed text-white/40">
                No sections yet — use the + button above to build this page.
              </p>
            )}
          </div>
        </aside>

        {/* center: preview */}
        <main className="min-w-0 flex-1 overflow-hidden bg-[#0e0e10] p-4">
          <div className="mx-auto h-full overflow-hidden rounded-lg bg-white shadow-2xl transition-all" style={{ width: DEVICES[device].width, maxWidth: "100%" }}>
            <iframe
              ref={iframeRef}
              key={previewSrc}
              src={previewSrc}
              title="Site preview"
              className="h-full w-full border-0"
              onLoad={() => push()}
            />
          </div>
        </main>

        {/* right: inspector */}
        <aside className="hidden w-[340px] shrink-0 flex-col border-l border-white/10 xl:flex">
          {showSettings && pageMeta ? (
            <PageSettingsPanel
              page={pageMeta}
              onChange={(patch) => { setPageMeta((p) => (p ? { ...p, ...patch } : p)); setDirty(true); }}
              onDelete={removePage}
            />
          ) : current ? (
            <Inspector
              key={current.id}
              section={current}
              products={products}
              onChange={(patch) => updateProps(current.id, patch)}
            />
          ) : (
            <div className="px-5 py-8">
              <p className="text-xs leading-relaxed text-white/40">
                Click any section in the preview (or in the list on the left) to edit its text, images and products.
              </p>
              <p className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                <Layers className="h-3.5 w-3.5" /> Every page is built from sections
              </p>
              <button onClick={() => setEditProduct("new")} className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-[11px] text-white/70 hover:bg-white/10">
                <Package className="h-3.5 w-3.5" /> New product
              </button>
            </div>
          )}
        </aside>
      </div>

      {editProduct !== null && (
        <ProductFormDialog id={editProduct} open onOpenChange={(v) => { if (!v) { setEditProduct(null); iframeRef.current?.contentWindow?.location.reload(); } }} />
      )}
    </div>
  );
}

function PageSettingsPanel({ page, onChange, onDelete }: {
  page: PageRow; onChange: (patch: Partial<PageRow>) => void; onDelete: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Page settings</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">URL, visibility and search-engine details.</p>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div>
          <label className={lbl}>Title</label>
          <input className={inp} value={page.title} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>URL slug</label>
          <input className={inp} value={page.slug} onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
          <p className="mt-1 text-[10px] text-white/35">Live at {pathForPage(page.slug)}</p>
        </div>
        <div>
          <label className={lbl}>Excerpt</label>
          <textarea rows={2} className={inp} value={page.excerpt ?? ""} onChange={(e) => onChange({ excerpt: e.target.value })} />
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <label className={lbl}>Social / cover image</label>
          <div className="text-white/85">
            <SingleImageUpload value={page.cover_image ?? ""} onChange={(v: string) => onChange({ cover_image: v })} crop />
          </div>
        </div>
        <div>
          <label className={lbl}>Meta title</label>
          <input className={inp} value={page.meta_title ?? ""} onChange={(e) => onChange({ meta_title: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Meta description</label>
          <textarea rows={3} className={inp} value={page.meta_description ?? ""} onChange={(e) => onChange({ meta_description: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-xs text-white/80">
          <input type="checkbox" checked={page.published} onChange={(e) => onChange({ published: e.target.checked })} />
          Published
        </label>
        <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-2.5 py-1.5 text-[11px] text-red-300 hover:bg-red-500/10">
          <Trash2 className="h-3.5 w-3.5" /> Delete page
        </button>
      </div>
    </div>
  );
}

function SectionRow({ s, selected, onSelect, onToggle, onDelete }: {
  s: StudioSection; selected: boolean; onSelect: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const def = SECTION_MAP[s.type];
  const hidden = s.visible === false;
  return (
    <li ref={setNodeRef} style={style}
      className={`group flex items-center gap-1.5 rounded-md px-2 py-2 text-xs ${selected ? "bg-[#7c5cff]/20 text-white ring-1 ring-[#7c5cff]/60" : "text-white/70 hover:bg-white/5"}`}>
      <button className="cursor-grab text-white/30 hover:text-white/70" {...attributes} {...listeners} aria-label="Reorder">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className={`block truncate ${hidden ? "line-through opacity-50" : ""}`}>
          {typeof s.props?.title === "string" && s.props.title ? s.props.title : def?.label ?? s.type}
        </span>
        <span className="block truncate text-[10px] text-white/35">{def?.label ?? s.type}</span>
      </button>
      <button onClick={onToggle} className="text-white/35 hover:text-white" title={hidden ? "Show" : "Hide"}>
        {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button onClick={onDelete} className="text-white/35 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100" title="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/* ------------------------------- inspector ------------------------------- */

const lbl = "mb-1 block text-[10px] uppercase tracking-[0.18em] text-white/45";
const inp = "w-full rounded-md border border-white/15 bg-[#1c1c20] px-2.5 py-2 text-xs text-white outline-none focus:border-[#7c5cff]";

function Inspector({ section, products, onChange }: {
  section: StudioSection; products: Props[]; onChange: (patch: Props) => void;
}) {
  const def = SECTION_MAP[section.type];
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{def?.label}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">{def?.description}</p>
      </div>
      <div className="space-y-4 px-4 py-4">
        {(def?.fields ?? []).map((f) => (
          <FieldInput key={f.key} field={f} value={section.props?.[f.key]} products={products}
            onChange={(v) => onChange({ [f.key]: v })} />
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FieldInput({ field, value, products, onChange }: { field: Field; value: any; products: Props[]; onChange: (v: any) => void }) {
  switch (field.kind) {
    case "text":
    case "link":
      return (
        <div>
          <label className={lbl}>{field.label}</label>
          <input className={inp} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "textarea":
      return (
        <div>
          <label className={lbl}>{field.label}</label>
          <textarea rows={3} className={inp} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "select":
      return (
        <div>
          <label className={lbl}>{field.label}</label>
          <select className={inp} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    case "image":
      return (
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <label className={lbl}>{field.label}</label>
          <div className="text-white/85">
            <SingleImageUpload value={value ?? ""} onChange={onChange} crop />
          </div>
        </div>
      );
    case "images":
      return (
        <div className="space-y-2 rounded-md border border-white/10 bg-white/[0.04] p-2.5">
          <label className={lbl}>{field.label}</label>
          <div className="text-white/85">
            <MultiImageUpload
              value={(value as string[]) ?? []}
              onChange={(urls: string[]) => onChange(urls)}
              crop
            />
          </div>
        </div>
      );
    case "html":
      return (
        <div className="rounded-md bg-white p-1 text-foreground">
          <RichEditor value={value ?? ""} onChange={onChange} />
        </div>
      );
    case "products":
      return <ProductPicker label={field.label} ids={(value as string[]) ?? []} products={products} onChange={onChange} />;
    case "list":
      return <ListField field={field} value={(value as Props[]) ?? []} products={products} onChange={onChange} />;
    default:
      return null;
  }
}

function ListField({ field, value, products, onChange }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: Extract<Field, { kind: "list" }>; value: Props[]; products: Props[]; onChange: (v: any) => void;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      <label className={lbl}>{field.label}</label>
      {value.map((item, i) => (
        <div key={i} className="rounded-md border border-white/10">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <button className="min-w-0 flex-1 truncate text-left text-xs text-white/80" onClick={() => setOpen(open === i ? null : i)}>
              {field.itemLabel} {i + 1}{item.title ? ` — ${String(item.title).slice(0, 24)}` : item.label ? ` — ${String(item.label)}` : item.name ? ` — ${String(item.name)}` : ""}
            </button>
            <button className="text-white/35 hover:text-red-400" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {open === i && (
            <div className="space-y-3 border-t border-white/10 px-2 py-3">
              {field.fields.map((f) => (
                <FieldInput key={f.key} field={f} value={item[f.key]} products={products}
                  onChange={(v) => onChange(value.map((x, j) => (j === i ? { ...x, [f.key]: v } : x)))} />
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        onClick={() => onChange([...value, structuredClone(field.itemDefaults)])}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-[11px] text-white/70 hover:bg-white/10">
        <Plus className="h-3.5 w-3.5" /> Add {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

function ProductPicker({ label, ids, products, onChange }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  label: string; ids: string[]; products: Props[]; onChange: (v: any) => void;
}) {
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return products.filter((p) => !ids.includes(String(p.id)))
      .filter((p) => String(p.name ?? "").toLowerCase().includes(s) || String(p.slug ?? "").toLowerCase().includes(s) || String(p.sku ?? "").toLowerCase().includes(s))
      .slice(0, 10);
  }, [q, products, ids]);

  return (
    <div className="space-y-2">
      <label className={lbl}>{label} ({ids.length})</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
        <input className={`${inp} pl-8`} placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {results.length > 0 && (
        <div className="max-h-56 divide-y divide-white/5 overflow-auto rounded-md border border-white/10">
          {results.map((p) => (
            <button key={String(p.id)} onClick={() => { onChange([...ids, String(p.id)]); setQ(""); }}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-white/80 hover:bg-white/10">
              <img src={(p.images as string[])?.[0] ?? ""} alt="" className="h-8 w-8 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate">{String(p.name)}</span>
              <Plus className="h-3.5 w-3.5 text-white/40" />
            </button>
          ))}
        </div>
      )}
      <ul className="space-y-1">
        {ids.map((id, i) => {
          const p = byId.get(id);
          return (
            <li key={id} className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 text-xs text-white/80">
              <span className="w-4 text-white/30">{i + 1}</span>
              <img src={(p?.images as string[])?.[0] ?? ""} alt="" className="h-8 w-8 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate">{p ? String(p.name) : "Missing product"}</span>
              <button onClick={() => onChange(ids.filter((x) => x !== id))} className="text-white/35 hover:text-red-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
      {ids.length === 0 && <p className="text-[11px] italic text-white/35">No products chosen — the fallback below is used.</p>}
    </div>
  );
}

