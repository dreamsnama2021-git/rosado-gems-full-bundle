import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getAdminSiteSettings, adminUpdateNavigation, type HeaderMenuItem } from "@/lib/site-settings.functions";
import { mergeFooter, DEFAULT_HEADER_MENU, type FooterConfig, type FooterColumn } from "@/lib/footer-config";
import { mergeMegaMenu, type MegaMenuConfig } from "@/lib/mega-menu-config";
import { MegaMenuEditor } from "@/components/admin/MegaMenuEditor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

const q = queryOptions({ queryKey: ["site-settings", "admin"], queryFn: () => getAdminSiteSettings() });

export const Route = createFileRoute("/_authenticated/admin/navigation")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: NavigationPage,
});

const inp = "w-full h-9 rounded-sm border border-border bg-background px-2.5 text-sm outline-none focus:border-foreground";
const lbl = "text-xs uppercase tracking-[0.15em] text-muted-foreground";

function NavigationPage() {
  const initial = useSuspenseQuery(q).data;
  const qc = useQueryClient();
  const [header, setHeader] = useState<HeaderMenuItem[]>(
    initial?.header_menu && initial.header_menu.length > 0 ? initial.header_menu : DEFAULT_HEADER_MENU,
  );
  const [footer, setFooter] = useState<FooterConfig>(() => mergeFooter(initial?.footer_menu));
  const [mega, setMega] = useState<MegaMenuConfig>(() => mergeMegaMenu(initial?.mega_menu));
  const [saving, setSaving] = useState(false);

  function updF<K extends keyof FooterConfig>(k: K, v: FooterConfig[K]) { setFooter((p) => ({ ...p, [k]: v })); }

  async function save() {
    if (header.some((h) => !h.label.trim() || !h.to.trim())) { toast.error("Every header item needs a label and a link"); return; }
    setSaving(true);
    try {
      await adminUpdateNavigation({ data: { header_menu: header, footer_menu: footer as unknown as Record<string, unknown>, mega_menu: mega as unknown as Record<string, unknown> } });
      toast.success("Navigation saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl mb-1">Menus &amp; Footer</h1>
          <p className="text-sm text-muted-foreground">Manage the header navigation and every part of the footer — drag to reorder, edit labels, links and content.</p>
        </div>
        <button onClick={save} disabled={saving} className="h-11 px-6 shrink-0 rounded-sm bg-foreground text-background text-sm uppercase tracking-[0.15em] disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <Tabs defaultValue="header">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="header">Header Menu</TabsTrigger>
          <TabsTrigger value="mega">Mega Menu</TabsTrigger>
          <TabsTrigger value="brand">Footer Brand</TabsTrigger>
          <TabsTrigger value="contact">Footer Contact</TabsTrigger>
          <TabsTrigger value="columns">Footer Columns</TabsTrigger>
          <TabsTrigger value="bottom">Bottom Bar</TabsTrigger>
        </TabsList>

        <TabsContent value="header">
          <HeaderMenuEditor items={header} onChange={setHeader} />
        </TabsContent>

        <TabsContent value="mega">
          <MegaMenuEditor value={mega} onChange={setMega} />
        </TabsContent>

        <TabsContent value="brand">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <h2 className="font-display text-xl">Brand block</h2>
            <div><label className={lbl}>Heading</label><input className={inp} value={footer.heading} onChange={(e) => updF("heading", e.target.value)} /></div>
            <div>
              <label className={lbl}>Paragraph</label>
              <textarea rows={4} className="w-full rounded-sm border border-border bg-background p-3 text-sm outline-none focus:border-foreground" value={footer.blurb} onChange={(e) => updF("blurb", e.target.value)} />
            </div>
            <div><label className={lbl}>Follow label</label><input className={inp} value={footer.follow_label} onChange={(e) => updF("follow_label", e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["facebook", "instagram", "twitter", "youtube", "tiktok"] as const).map((k) => (
                <div key={k}>
                  <label className={lbl}>{k} URL</label>
                  <input className={inp} placeholder="https://…" value={footer.socials[k]} onChange={(e) => updF("socials", { ...footer.socials, [k]: e.target.value })} />
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="contact">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <h2 className="font-display text-xl">Contact block</h2>
            <div><label className={lbl}>Title</label><input className={inp} value={footer.contact_title} onChange={(e) => updF("contact_title", e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["phone", "address", "email", "hours"] as const).map((k) => (
                <div key={k}>
                  <label className={lbl}>{k}</label>
                  <input className={inp} value={footer.contact[k]} onChange={(e) => updF("contact", { ...footer.contact, [k]: e.target.value })} />
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="columns">
          <FooterColumnsEditor columns={footer.columns} onChange={(c) => updF("columns", c)} />
        </TabsContent>

        <TabsContent value="bottom">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <h2 className="font-display text-xl">Bottom bar</h2>
            <div><label className={lbl}>Copyright ({"{year}"} is replaced automatically)</label><input className={inp} value={footer.copyright} onChange={(e) => updF("copyright", e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={lbl}>Country / currency label</label><input className={inp} value={footer.locale_label} onChange={(e) => updF("locale_label", e.target.value)} /></div>
              <div><label className={lbl}>Language label</label><input className={inp} value={footer.language_label} onChange={(e) => updF("language_label", e.target.value)} /></div>
            </div>
            <div>
              <label className={lbl}>Payment badges (comma separated)</label>
              <input className={inp} value={footer.badges.join(", ")} onChange={(e) => updF("badges", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Header menu ---------------- */

function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

function HeaderMenuEditor({ items, onChange }: { items: HeaderMenuItem[]; onChange: (items: HeaderMenuItem[]) => void }) {
  const sensors = useDndSensors();
  const ids = items.map((_, i) => `h-${i}`);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onChange(arrayMove(items, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  return (
    <section className="space-y-4 border border-border rounded-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl">Header Menu</h2>
          <p className="text-xs text-muted-foreground">Drag to reorder. Toggle “Mega” to attach the shop mega-menu.</p>
        </div>
        <button type="button" onClick={() => onChange([...items, { label: "New Link", to: "/" }])} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-sm border border-border text-xs uppercase tracking-[0.15em] hover:bg-muted">
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((it, i) => (
              <SortableItem key={ids[i]} id={ids[i]} onRemove={() => onChange(items.filter((_, x) => x !== i))}>
                <input className={`${inp} flex-1`} placeholder="Label" value={it.label} onChange={(e) => onChange(items.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))} />
                <input className={`${inp} flex-1`} placeholder="/path" value={it.to} onChange={(e) => onChange(items.map((x, xi) => (xi === i ? { ...x, to: e.target.value } : x)))} />
                <label className="flex items-center gap-1.5 text-xs whitespace-nowrap px-2">
                  <input type="checkbox" checked={!!it.mega} onChange={(e) => onChange(items.map((x, xi) => (xi === i ? { ...x, mega: e.target.checked } : x)))} />
                  Mega
                </label>
              </SortableItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-sm">No menu items yet.</p>}
    </section>
  );
}

/* ---------------- Footer columns ---------------- */

function FooterColumnsEditor({ columns, onChange }: { columns: FooterColumn[]; onChange: (c: FooterColumn[]) => void }) {
  const sensors = useDndSensors();
  const ids = columns.map((_, i) => `c-${i}`);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onChange(arrayMove(columns, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }
  function updCol(i: number, patch: Partial<FooterColumn>) {
    onChange(columns.map((c, ci) => (ci === i ? { ...c, ...patch } : c)));
  }

  return (
    <section className="space-y-4 border border-border rounded-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl">Footer link columns</h2>
          <p className="text-xs text-muted-foreground">Drag columns and links to reorder. Links accept internal paths (/blog) or full URLs.</p>
        </div>
        <button type="button" onClick={() => onChange([...columns, { title: "New Column", links: [{ label: "New Link", to: "/" }] }])} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-sm border border-border text-xs uppercase tracking-[0.15em] hover:bg-muted">
          <Plus className="h-3.5 w-3.5" /> Add column
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="grid gap-4 lg:grid-cols-2">
            {columns.map((col, i) => (
              <SortableItem key={ids[i]} id={ids[i]} onRemove={() => onChange(columns.filter((_, x) => x !== i))} column>
                <div className="flex-1 space-y-3">
                  <input className={inp} placeholder="Column title" value={col.title} onChange={(e) => updCol(i, { title: e.target.value })} />
                  <LinksEditor links={col.links} onChange={(links) => updCol(i, { links })} />
                </div>
              </SortableItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function LinksEditor({ links, onChange }: { links: { label: string; to: string }[]; onChange: (l: { label: string; to: string }[]) => void }) {
  const sensors = useDndSensors();
  const ids = links.map((_, i) => `l-${i}`);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onChange(arrayMove(links, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {links.map((l, i) => (
              <SortableItem key={ids[i]} id={ids[i]} onRemove={() => onChange(links.filter((_, x) => x !== i))} compact>
                <input className={`${inp} flex-1`} placeholder="Label" value={l.label} onChange={(e) => onChange(links.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))} />
                <input className={`${inp} flex-1`} placeholder="/path" value={l.to} onChange={(e) => onChange(links.map((x, xi) => (xi === i ? { ...x, to: e.target.value } : x)))} />
              </SortableItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button type="button" onClick={() => onChange([...links, { label: "New Link", to: "/" }])} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-dashed border-border text-[11px] uppercase tracking-[0.15em] hover:bg-muted">
        <Plus className="h-3 w-3" /> Add link
      </button>
    </div>
  );
}

function SortableItem({ id, children, onRemove, compact, column }: {
  id: string; children: React.ReactNode; onRemove: () => void; compact?: boolean; column?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 rounded-sm border border-border bg-background ${compact ? "p-1.5 items-center" : column ? "p-3 items-start" : "p-2 items-center"}`}
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-1 shrink-0" aria-label="Drag">
        <GripVertical className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      {children}
      <button type="button" onClick={onRemove} className="p-2 text-muted-foreground hover:text-red-600 shrink-0" aria-label="Remove">
        <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
    </li>
  );
}
