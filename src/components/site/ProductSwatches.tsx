import { useMemo, useState, useEffect } from "react";
import { ATTR_LABELS, ATTR_ORDER, sortValues, type VariantAttr } from "@/lib/variant-options";

export type Variant = {
  id: string;
  size: string | null;
  length: string | null;
  metal: string | null;
  gemstone_color: string | null;
  component: string | null;
  plating: string | null;
  color_hex: string | null;
  price: number | string | null;
  compare_at_price: number | string | null;
  sku: string | null;
  stock: number;
  image?: string | null;
};

type Attr = VariantAttr;

const LABELS = ATTR_LABELS;

function uniq(values: (string | null)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v && v.trim() !== "")));
}

export function ProductSwatches({
  variants,
  onSelect,
}: {
  variants: Variant[];
  onSelect: (v: Variant | null) => void;
}) {
  const opts = useMemo(() => {
    const map: Partial<Record<Attr, string[]>> = {};
    for (const a of ATTR_ORDER) {
      const vals = uniq(variants.map((v) => v[a] as string | null));
      if (vals.length > 0) map[a] = sortValues(a, vals);
    }
    return map;
  }, [variants]);


  const [sel, setSel] = useState<Partial<Record<Attr, string>>>({});

  // Preselect first available for each attribute
  useEffect(() => {
    const init: Partial<Record<Attr, string>> = {};
    (Object.keys(opts) as Attr[]).forEach((a) => { init[a] = opts[a]![0]; });
    setSel(init);
  }, [opts]);

  // Match a variant
  const matched = useMemo(() => {
    const attrs = Object.keys(opts) as Attr[];
    // Variants without any attribute values (price/SKU-only) still need a selection
    if (attrs.length === 0) return variants.find((v) => v.stock > 0) ?? variants[0] ?? null;
    return (
      variants.find((v) => attrs.every((a) => (v[a] ?? "") === (sel[a] ?? ""))) ?? null
    );
  }, [variants, opts, sel]);


  useEffect(() => { onSelect(matched); }, [matched, onSelect]);

  // Which values are available given current selection (for other attrs)?
  function available(attr: Attr, val: string) {
    return variants.some((v) => {
      if ((v[attr] ?? "") !== val) return false;
      return (Object.keys(opts) as Attr[]).every(
        (a) => a === attr || !sel[a] || (v[a] ?? "") === sel[a],
      );
    });
  }

  // A representative image for an attribute value, when one was assigned in admin
  function imageFor(attr: Attr, val: string) {
    const withSel = variants.find(
      (v) =>
        (v[attr] ?? "") === val &&
        !!v.image &&
        (Object.keys(opts) as Attr[]).every((a) => a === attr || !sel[a] || (v[a] ?? "") === sel[a]),
    );
    return (withSel ?? variants.find((v) => (v[attr] ?? "") === val && !!v.image))?.image ?? null;
  }

  if (variants.length === 0) return null;

  const presentAttrs = (Object.keys(opts) as Attr[]).filter((a) => !!sel[a]);

  return (
    <div className="mt-6 space-y-5">
      {(Object.keys(opts) as Attr[]).map((attr) => (
        <div key={attr}>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
              {LABELS[attr]}
            </p>
            <p className="text-xs">{sel[attr] ?? ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {opts[attr]!.map((val) => {
              const active = sel[attr] === val;
              const inStock = available(attr, val);
              const img = imageFor(attr, val);
              if (img) {
                return (
                  <button
                    key={val}
                    type="button"
                    title={val}
                    aria-label={val}
                    onClick={() => setSel((s) => ({ ...s, [attr]: val }))}
                    className={`h-14 w-14 overflow-hidden border-2 transition ${active ? "border-primary" : "border-border hover:border-foreground"} ${!inStock ? "opacity-40" : ""}`}
                  >
                    <img src={img} alt={val} className="h-full w-full object-cover" />
                  </button>
                );
              }
              if (attr === "gemstone_color") {
                const v = variants.find((x) => x.gemstone_color === val);
                const hex = v?.color_hex || "#c9a86a";
                return (
                  <button
                    key={val}
                    type="button"
                    title={val}
                    onClick={() => setSel((s) => ({ ...s, [attr]: val }))}
                    className={`h-9 w-9 rounded-full border-2 transition ${active ? "border-primary" : "border-border"} ${!inStock ? "opacity-40" : ""}`}
                    style={{ backgroundColor: hex }}
                    aria-label={val}
                  />
                );
              }
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSel((s) => ({ ...s, [attr]: val }))}
                  className={`h-9 min-w-[2.5rem] px-3 border text-xs uppercase tracking-[0.15em] transition ${active ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-foreground"} ${!inStock ? "line-through opacity-50" : ""}`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected variant summary */}
      <div className="mt-6 rounded-sm border border-border bg-header-top/30 p-4">
        <p className="mb-3 text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
          Your selection
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {presentAttrs.map((attr) => (
            <div key={attr}>
              <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                {LABELS[attr]}
              </span>
              <span className="font-medium">{sel[attr]}</span>
            </div>
          ))}
          {matched?.sku && (
            <div>
              <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">SKU</span>
              <span className="font-medium">{matched.sku}</span>
            </div>
          )}
          {matched && (
            <div>
              <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Availability</span>
              <span className={`font-medium ${matched.stock > 0 ? "text-green-700" : "text-destructive"}`}>
                {matched.stock > 0 ? `In stock (${matched.stock})` : "Out of stock"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
