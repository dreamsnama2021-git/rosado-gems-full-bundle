/**
 * Standardized jewellery variant attributes.
 * Admin uses these lists for consistent option values; storefront swatches
 * sort values using the same canonical order.
 */

export type VariantAttr =
  | "component"
  | "plating"
  | "metal"
  | "gemstone_color"
  | "size"
  | "length";

export const ATTR_ORDER: VariantAttr[] = [
  "component",
  "plating",
  "metal",
  "gemstone_color",
  "size",
  "length",
];

export const ATTR_LABELS: Record<VariantAttr, string> = {
  component: "Components",
  plating: "Plating / Finish",
  metal: "Metal / Karat",
  gemstone_color: "Gemstone colour",
  size: "Size",
  length: "Length",
};

export const COMPONENT_OPTIONS = [
  "Pendant Only",
  "Pendant + Chain",
  "Only Studs",
  "Studs + Jackets",
  "Ring Only",
  "Ring + Band",
  "Single Piece",
  "Pair",
  "Full Set",
];

export const PLATING_OPTIONS = [
  "Yellow Gold Plated",
  "Rose Gold Plated",
  "White Rhodium Plated",
  "Silver Polish",
  "Antique Finish",
  "Matte Finish",
  "High Polish",
];

export const METAL_OPTIONS = [
  "14K Yellow Gold",
  "14K White Gold",
  "14K Rose Gold",
  "18K Yellow Gold",
  "18K White Gold",
  "18K Rose Gold",
  "22K Yellow Gold",
  "925 Sterling Silver",
  "Platinum 950",
];

export const GEMSTONE_OPTIONS: Array<{ name: string; hex: string }> = [
  { name: "Diamond", hex: "#e8e8e8" },
  { name: "Ruby", hex: "#9b111e" },
  { name: "Emerald", hex: "#046307" },
  { name: "Blue Sapphire", hex: "#0f52ba" },
  { name: "Yellow Sapphire", hex: "#e4c04a" },
  { name: "Pink Sapphire", hex: "#e75480" },
  { name: "Amethyst", hex: "#9966cc" },
  { name: "Aquamarine", hex: "#7fffd4" },
  { name: "Topaz", hex: "#ffc87c" },
  { name: "Garnet", hex: "#733635" },
  { name: "Pearl", hex: "#f4f0e6" },
  { name: "Onyx", hex: "#1c1c1c" },
  { name: "Turquoise", hex: "#40e0d0" },
  { name: "Carnelian", hex: "#b31b1b" },
];

/** US ring sizes, whole and half. */
export const RING_SIZE_OPTIONS = Array.from({ length: 21 }, (_, i) => {
  const n = 4 + i * 0.5;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
});

/** Chain / bracelet / bangle lengths in inches. */
export const LENGTH_OPTIONS = [
  '6"',
  '6.5"',
  '7"',
  '7.5"',
  '8"',
  '8.5"',
  '16"',
  '18"',
  '20"',
  '22"',
  '24"',
  '28"',
];

export const OPTIONS: Record<VariantAttr, string[]> = {
  component: COMPONENT_OPTIONS,
  plating: PLATING_OPTIONS,
  metal: METAL_OPTIONS,
  gemstone_color: GEMSTONE_OPTIONS.map((g) => g.name),
  size: RING_SIZE_OPTIONS,
  length: LENGTH_OPTIONS,
};

export function gemstoneHex(name?: string | null) {
  if (!name) return null;
  return GEMSTONE_OPTIONS.find((g) => g.name.toLowerCase() === name.trim().toLowerCase())?.hex ?? null;
}

/** Normalize a free-typed value to the canonical form where possible. */
export function normalizeValue(attr: VariantAttr, raw: string | null | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (attr === "length") {
    const m = v.match(/^(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")?$/i);
    if (m) return `${m[1]}"`;
  }
  if (attr === "size") {
    const m = v.match(/^(\d+(?:\.\d+)?)$/);
    if (m) return String(Number(m[1]));
  }
  const match = OPTIONS[attr].find((o) => o.toLowerCase() === v.toLowerCase());
  return match ?? v;
}

/** Sort values by the canonical option order; unknown values go last, alphabetically. */
export function sortValues(attr: VariantAttr, values: string[]) {
  const order = OPTIONS[attr];
  return [...values].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}
