import { z } from "zod";

const nullableText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().nullable().optional(),
);
const nullableNum = z.preprocess(
  (v) => (v === "" || v === null || (typeof v === "number" && Number.isNaN(v)) ? null : v),
  z.coerce.number().nullable().optional(),
);

export const variantSchema = z.object({
  id: z.string().uuid().optional(),
  size: nullableText,
  length: nullableText,
  metal: nullableText,
  gemstone_color: nullableText,
  component: nullableText,
  plating: nullableText,
  color_hex: nullableText,
  price: nullableNum,
  compare_at_price: nullableNum,
  sku: nullableText,
  stock: z.preprocess(
    (v) => (v === "" || v === null || v === undefined || (typeof v === "number" && Number.isNaN(v)) ? 0 : v),
    z.coerce.number().int().nonnegative(),
  ),
  image: nullableText,
  sort_order: z.coerce.number().int().default(0),
});

export type VariantInput = z.infer<typeof variantSchema>;
/** Same shape, but sort_order is optional (it is reassigned by array index). */
export type VariantRowInput = Omit<VariantInput, "sort_order"> & { sort_order?: number };

export const variantsPayloadSchema = z.object({
  product_id: z.string().uuid(),
  variants: z.array(variantSchema),
});

export const VARIANT_ROW_KEYS = [
  "id",
  "product_id",
  "size",
  "length",
  "metal",
  "gemstone_color",
  "component",
  "plating",
  "color_hex",
  "price",
  "compare_at_price",
  "sku",
  "stock",
  "image",
  "sort_order",
] as const;

/**
 * Builds the bulk-upsert payload. Every row carries an identical key set and a
 * concrete id (generated for new rows) — PostgREST rejects mixed-key batches.
 */
export function buildVariantRows(
  product_id: string,
  variants: VariantRowInput[],
  newId: () => string = () => crypto.randomUUID(),
) {
  return variants.map((v, i) => ({
    id: v.id ?? newId(),
    product_id,
    size: v.size ?? null,
    length: v.length ?? null,
    metal: v.metal ?? null,
    gemstone_color: v.gemstone_color ?? null,
    component: v.component ?? null,
    plating: v.plating ?? null,
    color_hex: v.color_hex ?? null,
    price: v.price ?? null,
    compare_at_price: v.compare_at_price ?? null,
    sku: v.sku ?? null,
    stock: v.stock ?? 0,
    image: v.image ?? null,
    sort_order: i,
  }));
}

/** Ids that must survive a save (used to build the delete filter). */
export function keepIdsOf(variants: VariantRowInput[]): string[] {
  return variants.filter((v) => v.id).map((v) => v.id!);
}
