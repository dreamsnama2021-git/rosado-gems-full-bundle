import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { SingleImageUpload } from "@/components/admin/ImageUpload";
import type { MegaColumn, MegaMenuConfig, MegaPromo } from "@/lib/mega-menu-config";

const inp = "w-full h-9 rounded-sm border border-border bg-background px-2.5 text-sm outline-none focus:border-foreground";
const lbl = "text-xs uppercase tracking-[0.15em] text-muted-foreground";

function useDnd() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

function Row({ id, children, onRemove, onDuplicate, compact }: { id: string; children: React.ReactNode; onRemove: () => void; onDuplicate?: () => void; compact?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-sm border border-border bg-background ${compact ? "p-2" : "p-3"} ${isDragging ? "opacity-60 shadow-lg" : ""}`}
    >
      <button type="button" {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground hover:text-foreground" aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex flex-1 flex-wrap items-start gap-2">{children}</div>
      {onDuplicate && (
        <button type="button" onClick={onDuplicate} className="mt-1 text-muted-foreground hover:text-foreground" aria-label="Duplicate">
          <Copy className="h-4 w-4" />
        </button>
      )}
      <button type="button" onClick={onRemove} className="mt-1 text-muted-foreground hover:text-red-600" aria-label="Remove">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function MegaMenuEditor({ value, onChange }: { value: MegaMenuConfig; onChange: (v: MegaMenuConfig) => void }) {
  const sensors = useDnd();
  const set = <K extends keyof MegaMenuConfig>(k: K, v: MegaMenuConfig[K]) => onChange({ ...value, [k]: v });

  const colIds = value.columns.map((_, i) => `mc-${i}`);
  function colDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    set("columns", arrayMove(value.columns, colIds.indexOf(String(active.id)), colIds.indexOf(String(over.id))));
  }
  const updCol = (i: number, patch: Partial<MegaColumn>) =>
    set("columns", value.columns.map((c, ci) => (ci === i ? { ...c, ...patch } : c)));

  const promoIds = value.promos.map((_, i) => `mp-${i}`);
  function promoDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    set("promos", arrayMove(value.promos, promoIds.indexOf(String(active.id)), promoIds.indexOf(String(over.id))));
  }
  const updPromo = (i: number, patch: Partial<MegaPromo>) =>
    set("promos", value.promos.map((p, pi) => (pi === i ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-sm border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl">Mega menu</h2>
            <p className="text-xs text-muted-foreground">Shown under header items with “Mega” enabled. Drag columns, links and promo cards to reorder.</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={value.enabled !== false} onChange={(e) => set("enabled", e.target.checked)} />
            Enabled
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-sm border border-border p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">Link columns</h3>
          <button type="button" onClick={() => set("columns", [...value.columns, { title: "New Column", links: [{ label: "New Link", to: "/collections" }] }])} className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border px-3 text-xs uppercase tracking-[0.15em] hover:bg-muted">
            <Plus className="h-3.5 w-3.5" /> Add column
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={colDragEnd}>
          <SortableContext items={colIds} strategy={verticalListSortingStrategy}>
            <ul className="grid gap-4 lg:grid-cols-2">
              {value.columns.map((col, i) => (
                <Row
                  key={colIds[i]}
                  id={colIds[i]}
                  onRemove={() => set("columns", value.columns.filter((_, x) => x !== i))}
                  onDuplicate={() => set("columns", [...value.columns.slice(0, i + 1), JSON.parse(JSON.stringify(col)), ...value.columns.slice(i + 1)])}
                >
                  <div className="flex-1 space-y-3">
                    <input className={inp} placeholder="Column title" value={col.title} onChange={(e) => updCol(i, { title: e.target.value })} />
                    <LinksEditor links={col.links} onChange={(links) => updCol(i, { links })} />
                  </div>
                </Row>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </section>

      <section className="space-y-4 rounded-sm border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg">Promo cards</h3>
            <p className="text-xs text-muted-foreground">Appear in the last column and rotate automatically.</p>
          </div>
          <button type="button" onClick={() => set("promos", [...value.promos, { img: "", eyebrow: "New in", title: "Promo title", href: "/collections" }])} className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border px-3 text-xs uppercase tracking-[0.15em] hover:bg-muted">
            <Plus className="h-3.5 w-3.5" /> Add promo
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={value.promo_rotate} onChange={(e) => set("promo_rotate", e.target.checked)} />
            Auto rotate
          </label>
          <div className="sm:col-span-2">
            <label className={lbl}>Rotation interval (ms)</label>
            <input type="number" min={1200} step={100} className={inp} value={value.promo_interval} onChange={(e) => set("promo_interval", Number(e.target.value) || 3500)} />
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={promoDragEnd}>
          <SortableContext items={promoIds} strategy={verticalListSortingStrategy}>
            <ul className="grid gap-4 lg:grid-cols-2">
              {value.promos.map((p, i) => (
                <Row key={promoIds[i]} id={promoIds[i]} onRemove={() => set("promos", value.promos.filter((_, x) => x !== i))}>
                  <div className="flex-1 space-y-3">
                    <SingleImageUpload value={p.img} onChange={(url: string) => updPromo(i, { img: url })} />
                    <input className={inp} placeholder="Eyebrow" value={p.eyebrow} onChange={(e) => updPromo(i, { eyebrow: e.target.value })} />
                    <input className={inp} placeholder="Title" value={p.title} onChange={(e) => updPromo(i, { title: e.target.value })} />
                    <input className={inp} placeholder="/collections/rings" value={p.href} onChange={(e) => updPromo(i, { href: e.target.value })} />
                  </div>
                </Row>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </section>

      <section className="space-y-4 rounded-sm border border-border p-6">
        <h3 className="font-display text-lg">Bottom strip</h3>
        <div><label className={lbl}>Note</label><input className={inp} value={value.footer_note} onChange={(e) => set("footer_note", e.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={lbl}>Link label</label><input className={inp} value={value.footer_link_label} onChange={(e) => set("footer_link_label", e.target.value)} /></div>
          <div><label className={lbl}>Link path</label><input className={inp} value={value.footer_link_to} onChange={(e) => set("footer_link_to", e.target.value)} /></div>
        </div>
      </section>
    </div>
  );
}

function LinksEditor({ links, onChange }: { links: { label: string; to: string; badge?: string }[]; onChange: (l: { label: string; to: string; badge?: string }[]) => void }) {
  const sensors = useDnd();
  const ids = links.map((_, i) => `ml-${i}`);
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
              <Row key={ids[i]} id={ids[i]} compact onRemove={() => onChange(links.filter((_, x) => x !== i))}>
                <input className={`${inp} min-w-[7rem] flex-1`} placeholder="Label" value={l.label} onChange={(e) => onChange(links.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))} />
                <input className={`${inp} min-w-[7rem] flex-1`} placeholder="/collections/rings" value={l.to} onChange={(e) => onChange(links.map((x, xi) => (xi === i ? { ...x, to: e.target.value } : x)))} />
                <input className={`${inp} w-24`} placeholder="Badge" value={l.badge ?? ""} onChange={(e) => onChange(links.map((x, xi) => (xi === i ? { ...x, badge: e.target.value } : x)))} />
              </Row>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button type="button" onClick={() => onChange([...links, { label: "New Link", to: "/collections" }])} className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-dashed border-border px-2.5 text-[11px] uppercase tracking-[0.15em] hover:bg-muted">
        <Plus className="h-3 w-3" /> Add link
      </button>
    </div>
  );
}
