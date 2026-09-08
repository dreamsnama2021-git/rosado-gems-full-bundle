import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { ProductSwatches, type Variant } from "@/components/site/ProductSwatches";
import type { VariantRow } from "@/components/admin/VariantEditor";

function inr(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

/**
 * Storefront-accurate preview of the variant pickers. It renders the same
 * ProductSwatches component the product page uses, so admins can see exactly
 * how their options, swatches and per-variant images will behave.
 */
export function VariantPreview({
  name,
  images,
  basePrice,
  baseCompareAt,
  baseStock,
  variants,
}: {
  name: string;
  images: string[];
  basePrice: number | null;
  baseCompareAt: number | null;
  baseStock: number;
  variants: VariantRow[];
}) {
  const [sel, setSel] = useState<Variant | null>(null);

  // Only rows with something in them are meaningful on the storefront.
  const preview: Variant[] = useMemo(
    () =>
      variants.map((v, i) => ({
        id: v.id ?? `preview-${i}`,
        size: v.size || null,
        length: v.length || null,
        metal: v.metal || null,
        gemstone_color: v.gemstone_color || null,
        component: v.component || null,
        plating: v.plating || null,
        color_hex: v.color_hex || null,
        price: v.price,
        compare_at_price: v.compare_at_price,
        sku: v.sku || null,
        stock: Number(v.stock ?? 0),
        image: v.image || null,
      })),
    [variants],
  );

  const hero = sel?.image || images[0] || null;
  const price = sel?.price != null ? Number(sel.price) : basePrice;
  const compareAt = sel?.compare_at_price != null ? Number(sel.compare_at_price) : baseCompareAt;
  const stock = preview.length > 0 ? (sel?.stock ?? 0) : baseStock;

  return (
    <div className="rounded-sm border border-border">
      <header className="flex items-center gap-2 border-b border-border bg-header-top px-4 py-3">
        <Eye className="h-4 w-4" />
        <div>
          <p className="text-sm font-medium">Storefront preview</p>
          <p className="text-xs text-muted-foreground">
            Exactly how these options will look and behave on the product page.
          </p>
        </div>
      </header>

      <div className="grid gap-6 p-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-sm bg-muted">
          {hero ? (
            <img src={hero} alt={name || "Product preview"} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">
              No image yet
            </div>
          )}
        </div>

        <div>
          <h3 className="font-serif text-xl">{name || "Untitled product"}</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg">{inr(price)}</span>
            {compareAt != null && price != null && compareAt > price ? (
              <span className="text-sm text-muted-foreground line-through">{inr(compareAt)}</span>
            ) : null}
          </div>

          {preview.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No variants yet — the product page will show a single price with no option pickers.
            </p>
          ) : (
            <>
              <ProductSwatches variants={preview} onSelect={setSel} />
              <div className="mt-5 space-y-1 border-t border-border pt-4 text-xs">
                <p>
                  <span className="text-muted-foreground">SKU: </span>
                  {sel?.sku || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Availability: </span>
                  <span className={stock > 0 ? "text-green-700" : "text-destructive"}>
                    {sel ? (stock > 0 ? `In stock (${stock})` : "Out of stock") : "No matching combination"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                disabled={!sel || stock <= 0}
                className="mt-4 h-10 w-full max-w-[220px] rounded-sm bg-foreground text-xs uppercase tracking-[0.2em] text-background disabled:opacity-40"
              >
                {!sel || stock <= 0 ? "Out of stock" : "Add to bag"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
