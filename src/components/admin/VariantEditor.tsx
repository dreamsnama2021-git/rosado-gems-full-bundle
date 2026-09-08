import { useEffect, useMemo, useRef, useState } from "react";
import { adminField } from "@/components/admin/AdminFormDialog";
import { ThumbImageUpload } from "@/components/admin/ImageUpload";
import { Trash2, Plus, Check, Wand2, Info, X } from "lucide-react";
import {
  OPTIONS,
  ATTR_ORDER,
  ATTR_LABELS,
  gemstoneHex,
  normalizeValue,
  sortValues,
  type VariantAttr,
} from "@/lib/variant-options";

export type VariantRow = {
  id?: string;
  size: string | null;
  length: string | null;
  metal: string | null;
  gemstone_color: string | null;
  component: string | null;
  plating: string | null;
  color_hex: string | null;
  price: number | null;
  compare_at_price: number | null;
  sku: string | null;
  stock: number;
  image: string | null;
  sort_order: number;
};

const empty = (): VariantRow => ({
  size: "", length: "", metal: "", gemstone_color: "", component: "", plating: "", color_hex: "",
  price: null, compare_at_price: null, sku: "", stock: 0, image: "", sort_order: 0,
});

const ATTR_HINTS: Record<VariantAttr, string> = {
  component: "What the buyer receives — e.g. pendant only vs. pendant with chain.",
  plating: "Surface finish applied to the metal.",
  metal: "Base metal and karat / purity.",
  gemstone_color: "Stone used. Picking one auto-fills the swatch colour.",
  size: "Ring size (US). Only for rings.",
  length: "Chain, bracelet or bangle length in inches.",
};

function attrOf(row: VariantRow, a: VariantAttr) {
  return (row[a] ?? "") as string;
}
function rowKey(row: VariantRow, attrs: VariantAttr[]) {
  return attrs.map((a) => attrOf(row, a).toLowerCase()).join("|");
}

/** Chip toggle for a single option value. */
function Chip({
  active, children, onClick, swatch,
}: { active: boolean; children: React.ReactNode; onClick: () => void; swatch?: string | null }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-3 h-7 text-xs transition-colors " +
        (active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-foreground hover:border-foreground/60")
      }
    >
      {swatch ? <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: swatch }} /> : null}
      {children}
      {active ? <Check className="h-3 w-3" /> : null}
    </button>
  );
}

export function VariantEditor({
  value,
  onChange,
}: {
  value: VariantRow[];
  onChange: (v: VariantRow[]) => void;
}) {
  // The rows themselves live in the parent form, so nothing is lost when the
  // wizard switches steps and this editor unmounts. The pickers below are just
  // derived UI state, rebuilt from the current rows.
  function derive(rows: VariantRow[]) {
    const nextUsed: VariantAttr[] = [];
    const nextPicked = { component: [], plating: [], metal: [], gemstone_color: [], size: [], length: [] } as Record<VariantAttr, string[]>;
    for (const a of ATTR_ORDER) {
      const vals = Array.from(new Set(rows.map((r) => attrOf(r, a)).filter(Boolean)));
      if (vals.length) { nextUsed.push(a); nextPicked[a] = sortValues(a, vals); }
    }
    return { nextUsed, nextPicked };
  }

  const initial = derive(value);
  const [used, setUsed] = useState<VariantAttr[]>(initial.nextUsed);
  const [picked, setPicked] = useState<Record<VariantAttr, string[]>>(initial.nextPicked);
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [bulk, setBulk] = useState<{ price: string; stock: string }>({ price: "", stock: "" });

  // Rows can arrive after mount (async load in the parent) — sync the pickers once.
  const syncedRef = useRef(false);
  useEffect(() => {
    if (syncedRef.current || value.length === 0) return;
    syncedRef.current = true;
    const { nextUsed, nextPicked } = derive(value);
    setUsed(nextUsed);
    setPicked(nextPicked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const { input } = adminField;

  const combos = useMemo(
    () => used.reduce((n, a) => n * Math.max(picked[a].length, 0), used.length ? 1 : 0),
    [used, picked],
  );

  function toggleAttr(a: VariantAttr) {
    setUsed((u) => (u.includes(a) ? u.filter((x) => x !== a) : [...ATTR_ORDER.filter((x) => u.includes(x) || x === a)]));
  }
  function toggleValue(a: VariantAttr, v: string) {
    setPicked((p) => ({
      ...p,
      [a]: p[a].includes(v) ? p[a].filter((x) => x !== v) : sortValues(a, [...p[a], v]),
    }));
  }
  function addCustom(a: VariantAttr) {
    const raw = (custom[a] ?? "").trim();
    if (!raw) return;
    const v = normalizeValue(a, raw);
    setPicked((p) => (p[a].includes(v) ? p : { ...p, [a]: sortValues(a, [...p[a], v]) }));
    setCustom((c) => ({ ...c, [a]: "" }));
  }

  /** Cartesian product of the picked values, keeping price/SKU/stock/image of matching existing rows. */
  function generate() {
    const active = used.filter((a) => picked[a].length > 0);
    if (!active.length) return;
    let rows: VariantRow[] = [{ ...empty() }];
    for (const a of active) {
      const next: VariantRow[] = [];
      for (const base of rows) {
        for (const v of picked[a]) {
          const r: VariantRow = { ...base, [a]: v } as VariantRow;
          if (a === "gemstone_color") r.color_hex = gemstoneHex(v) ?? r.color_hex;
          next.push(r);
        }
      }
      rows = next;
    }
    const byKey = new Map(value.map((r) => [rowKey(r, active), r]));
    onChange(
      rows.map((r, i) => {
        const prev = byKey.get(rowKey(r, active));
        return prev
          ? { ...prev, ...r, id: prev.id, price: prev.price, compare_at_price: prev.compare_at_price, sku: prev.sku, stock: prev.stock, image: prev.image, color_hex: prev.color_hex || r.color_hex, sort_order: i }
          : { ...r, sort_order: i };
      }),
    );
  }

  function update(i: number, patch: Partial<VariantRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)); }
  function addBlank() { onChange([...value, { ...empty(), sort_order: value.length }]); }
  function applyBulk() {
    const price = bulk.price === "" ? undefined : Number(bulk.price);
    const stock = bulk.stock === "" ? undefined : Number(bulk.stock);
    onChange(value.map((r) => ({ ...r, ...(price != null ? { price } : {}), ...(stock != null ? { stock } : {}) })));
  }

  // Columns shown in the table: the attributes in use, or all when nothing picked yet.
  const cols = used.length ? used : ATTR_ORDER;

  return (
    <div className="space-y-6">
      {/* Step 1 — pick attributes */}
      <section className="rounded-sm border border-border">
        <header className="flex flex-wrap items-center gap-3 border-b border-border bg-header-top px-4 py-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-[11px] text-background">1</span>
          <div>
            <p className="text-sm font-medium">Choose the options this product comes in</p>
            <p className="text-xs text-muted-foreground">Tick only what changes between pieces. Everything else stays on the main product.</p>
          </div>
        </header>
        <div className="flex flex-wrap gap-2 p-4">
          {ATTR_ORDER.map((a) => (
            <Chip key={a} active={used.includes(a)} onClick={() => toggleAttr(a)}>{ATTR_LABELS[a]}</Chip>
          ))}
        </div>
      </section>

      {/* Step 2 — pick values */}
      {used.length > 0 && (
        <section className="rounded-sm border border-border">
          <header className="flex flex-wrap items-center gap-3 border-b border-border bg-header-top px-4 py-3">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-[11px] text-background">2</span>
            <div>
              <p className="text-sm font-medium">Pick the values you sell</p>
              <p className="text-xs text-muted-foreground">Click a value to add it. Type your own if it isn't listed.</p>
            </div>
          </header>
          <div className="divide-y divide-border">
            {used.map((a) => (
              <div key={a} className="p-4">
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-xs uppercase tracking-[0.2em]">{ATTR_LABELS[a]}</p>
                  <p className="text-xs text-muted-foreground">{ATTR_HINTS[a]}</p>
                  <span className="ml-auto text-xs text-muted-foreground">{picked[a].length} selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {OPTIONS[a].map((o) => (
                    <Chip
                      key={o}
                      active={picked[a].includes(o)}
                      onClick={() => toggleValue(a, o)}
                      swatch={a === "gemstone_color" ? gemstoneHex(o) : null}
                    >
                      {o}
                    </Chip>
                  ))}
                  {picked[a].filter((v) => !OPTIONS[a].includes(v)).map((v) => (
                    <span key={v} className="inline-flex items-center gap-1.5 rounded-full border border-foreground bg-foreground px-3 h-7 text-xs text-background">
                      {v}
                      <button type="button" onClick={() => toggleValue(a, v)} aria-label={`Remove ${v}`}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    className={input + " h-8 max-w-[220px] text-xs"}
                    placeholder={`Add custom ${ATTR_LABELS[a].toLowerCase()}`}
                    value={custom[a] ?? ""}
                    onChange={(e) => setCustom((c) => ({ ...c, [a]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(a); } }}
                  />
                  <button type="button" onClick={() => addCustom(a)} className="h-8 rounded-sm border border-border px-3 text-xs hover:border-foreground">Add</button>
                </div>
              </div>
            ))}
          </div>
          <footer className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={generate}
              disabled={combos === 0}
              className="inline-flex items-center gap-2 h-9 rounded-sm bg-foreground px-4 text-xs uppercase tracking-[0.2em] text-background disabled:opacity-40"
            >
              <Wand2 className="h-3.5 w-3.5" /> Build {combos > 0 ? combos : ""} variant{combos === 1 ? "" : "s"}
            </button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" /> Prices, SKUs and stock you already entered are kept.
            </p>
          </footer>
        </section>
      )}

      {/* Step 3 — price & stock each variant */}
      <section className="rounded-sm border border-border">
        <header className="flex flex-wrap items-center gap-3 border-b border-border bg-header-top px-4 py-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-[11px] text-background">3</span>
          <div>
            <p className="text-sm font-medium">Price, stock &amp; photo for each variant</p>
            <p className="text-xs text-muted-foreground">Leave price blank to use the product's own price. {value.length} variant{value.length === 1 ? "" : "s"}.</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input className={input + " h-8 w-28 text-xs"} placeholder="Price all" value={bulk.price} onChange={(e) => setBulk({ ...bulk, price: e.target.value })} />
            <input className={input + " h-8 w-24 text-xs"} placeholder="Stock all" value={bulk.stock} onChange={(e) => setBulk({ ...bulk, stock: e.target.value })} />
            <button type="button" onClick={applyBulk} disabled={!value.length} className="h-8 rounded-sm border border-border px-3 text-xs hover:border-foreground disabled:opacity-40">Apply to all</button>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left uppercase tracking-[0.15em] text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-2 w-8">#</th>
                {cols.map((a) => <th key={a} className="p-2">{ATTR_LABELS[a]}</th>)}
                {used.includes("gemstone_color") || !used.length ? <th className="p-2">Swatch</th> : null}
                <th className="p-2">Photo</th>
                <th className="p-2">Price</th>
                <th className="p-2">Compare</th>
                <th className="p-2">SKU</th>
                <th className="p-2">Stock</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {value.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 7} className="p-6 text-center text-muted-foreground">
                    No variants yet — pick options above and press “Build variants”, or add one manually.
                  </td>
                </tr>
              )}
              {value.map((v, i) => (
                <tr key={i} className="border-b border-border/60 align-middle hover:bg-muted/40">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  {cols.map((a) => (
                    <td key={a} className="p-1">
                      <input
                        list={`vopt-${a}`}
                        className={input + " h-8 min-w-[120px] text-xs"}
                        value={attrOf(v, a)}
                        placeholder="—"
                        onChange={(e) => update(i, { [a]: e.target.value } as Partial<VariantRow>)}
                        onBlur={(e) => {
                          const val = normalizeValue(a, e.target.value);
                          update(i, a === "gemstone_color"
                            ? { gemstone_color: val, color_hex: gemstoneHex(val) ?? v.color_hex }
                            : ({ [a]: val } as Partial<VariantRow>));
                        }}
                      />
                    </td>
                  ))}
                  {used.includes("gemstone_color") || !used.length ? (
                    <td className="p-1">
                      <input type="color" aria-label="Swatch colour" className="h-8 w-12 rounded-sm border border-border" value={v.color_hex || "#c9a86a"} onChange={(e) => update(i, { color_hex: e.target.value })} />
                    </td>
                  ) : null}
                  <td className="p-1"><ThumbImageUpload value={v.image ?? ""} onChange={(url) => update(i, { image: url })} /></td>
                  <td className="p-1"><input type="number" step="0.01" className={input + " h-8 w-24 text-xs"} value={v.price ?? ""} onChange={(e) => update(i, { price: e.target.value ? Number(e.target.value) : null })} /></td>
                  <td className="p-1"><input type="number" step="0.01" className={input + " h-8 w-24 text-xs"} value={v.compare_at_price ?? ""} onChange={(e) => update(i, { compare_at_price: e.target.value ? Number(e.target.value) : null })} /></td>
                  <td className="p-1"><input className={input + " h-8 w-28 text-xs"} value={v.sku ?? ""} onChange={(e) => update(i, { sku: e.target.value })} /></td>
                  <td className="p-1"><input type="number" className={input + " h-8 w-20 text-xs"} value={v.stock} onChange={(e) => update(i, { stock: Number(e.target.value) })} /></td>
                  <td className="p-1 text-right">
                    <button type="button" aria-label={`Remove variant ${i + 1}`} onClick={() => remove(i)} className="grid h-8 w-8 place-items-center rounded-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border p-3">
          <button type="button" onClick={addBlank} className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-3 text-xs uppercase tracking-[0.2em] hover:border-foreground">
            <Plus className="h-3.5 w-3.5" /> Add variant manually
          </button>
        </div>
      </section>

      {/* Shared option lists for the table inputs */}
      {ATTR_ORDER.map((a) => (
        <datalist key={a} id={`vopt-${a}`}>
          {OPTIONS[a].map((o) => <option key={o} value={o} />)}
        </datalist>
      ))}
    </div>
  );
}
