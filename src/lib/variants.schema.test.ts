import { describe, expect, it } from "vitest";
import {
  VARIANT_ROW_KEYS,
  buildVariantRows,
  keepIdsOf,
  variantsPayloadSchema,
  variantSchema,
} from "./variants.schema";

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const EXISTING_ID = "22222222-2222-4222-8222-222222222222";

let seq = 0;
const newId = () => `generated-${++seq}`;

describe("variantSchema normalization", () => {
  it("turns empty and whitespace strings into null", () => {
    const v = variantSchema.parse({ size: "", metal: "   ", sku: "", color_hex: "" });
    expect(v.size).toBeNull();
    expect(v.metal).toBeNull();
    expect(v.sku).toBeNull();
    expect(v.color_hex).toBeNull();
  });

  it("treats empty and NaN numbers as null instead of failing", () => {
    const v = variantSchema.parse({ price: "", compare_at_price: Number.NaN });
    expect(v.price).toBeNull();
    expect(v.compare_at_price).toBeNull();
  });

  it("coerces numeric strings", () => {
    const v = variantSchema.parse({ price: "199.5", stock: "3" });
    expect(v.price).toBe(199.5);
    expect(v.stock).toBe(3);
  });

  it("defaults missing/NaN stock to 0 and never negative", () => {
    expect(variantSchema.parse({}).stock).toBe(0);
    expect(variantSchema.parse({ stock: "" }).stock).toBe(0);
    expect(variantSchema.parse({ stock: Number.NaN }).stock).toBe(0);
    expect(() => variantSchema.parse({ stock: -1 })).toThrow();
  });

  it("accepts rows with no id (new variants)", () => {
    expect(variantSchema.parse({ metal: "Gold" }).id).toBeUndefined();
  });

  it("rejects a malformed id", () => {
    expect(() => variantSchema.parse({ id: "not-a-uuid" })).toThrow();
  });

  it("accepts a mixed payload of new and existing rows", () => {
    const parsed = variantsPayloadSchema.parse({
      product_id: PRODUCT_ID,
      variants: [{ id: EXISTING_ID, metal: "Gold" }, { metal: "" }],
    });
    expect(parsed.variants).toHaveLength(2);
  });
});

describe("buildVariantRows", () => {
  it("gives every row an identical key set (PostgREST bulk requirement)", () => {
    const rows = buildVariantRows(
      PRODUCT_ID,
      variantsPayloadSchema.parse({
        product_id: PRODUCT_ID,
        variants: [
          { id: EXISTING_ID, metal: "Gold", price: 100, stock: 2 },
          { metal: "", size: "7" },
          { gemstone_color: "Ruby", price: "" },
        ],
      }).variants,
      newId,
    );
    const expected = [...VARIANT_ROW_KEYS].sort();
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual(expected);
    }
  });

  it("keeps existing ids and generates ids for new rows", () => {
    const rows = buildVariantRows(PRODUCT_ID, [{ id: EXISTING_ID, stock: 0 }, { stock: 0 }], newId);
    expect(rows[0]!.id).toBe(EXISTING_ID);
    expect(rows[1]!.id).toMatch(/^generated-/);
    expect(rows[0]!.product_id).toBe(PRODUCT_ID);
  });

  it("writes nulls (not undefined or empty strings) for blank fields", () => {
    const [row] = buildVariantRows(
      PRODUCT_ID,
      variantsPayloadSchema.parse({ product_id: PRODUCT_ID, variants: [{ metal: "", price: "", sku: "  " }] }).variants,
      newId,
    );
    expect(row!.metal).toBeNull();
    expect(row!.price).toBeNull();
    expect(row!.sku).toBeNull();
    expect(Object.values(row!).some((v) => v === undefined)).toBe(false);
  });

  it("reindexes sort_order by array position", () => {
    const rows = buildVariantRows(
      PRODUCT_ID,
      [{ stock: 0, sort_order: 9 }, { stock: 0, sort_order: 9 }, { stock: 0 }],
      newId,
    );
    expect(rows.map((r) => r.sort_order)).toEqual([0, 1, 2]);
  });

  it("produces unique ids for a batch of all-new rows", () => {
    const rows = buildVariantRows(PRODUCT_ID, [{ stock: 0 }, { stock: 0 }, { stock: 0 }], newId);
    expect(new Set(rows.map((r) => r.id)).size).toBe(3);
  });

  it("handles an empty variant list", () => {
    expect(buildVariantRows(PRODUCT_ID, [], newId)).toEqual([]);
  });
});

describe("keepIdsOf", () => {
  it("returns only existing ids so new rows never get deleted", () => {
    expect(keepIdsOf([{ id: EXISTING_ID, stock: 0 }, { stock: 0 }])).toEqual([EXISTING_ID]);
  });

  it("returns an empty list for an all-new product (delete-all path)", () => {
    expect(keepIdsOf([{ stock: 0 }])).toEqual([]);
  });
});
