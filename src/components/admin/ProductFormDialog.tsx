import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminGetProduct,
  adminUpsertProduct,
  adminListCategories,
} from "@/lib/admin.functions";
import { adminSaveVariants, adminGetVariants, adminVerifyVariantSync } from "@/lib/variants.functions";
import { publishStorefrontRefresh } from "@/lib/storefront-refresh";
import { aiGenerate } from "@/lib/ai-content.functions";
import { toast } from "sonner";
import { RichEditor } from "@/components/admin/RichEditor";
import { MultiImageUpload } from "@/components/admin/ImageUpload";
import { AIFieldSwitch } from "@/components/admin/AIFieldSwitch";
import { VariantPreview } from "@/components/admin/VariantPreview";
import { VariantEditor, type VariantRow } from "@/components/admin/VariantEditor";
import { CategoryMultiSelect, type CategoryOption } from "@/components/admin/CategoryMultiSelect";
import { useCurrency, normalizeOverrides } from "@/lib/currency";

import { AdminFormCol, adminField } from "@/components/admin/AdminFormDialog";
import { AdminWizardDialog, type WizardStep } from "@/components/admin/AdminWizardDialog";
import { clearDraft, draftKey, formatDraftTime, readDraft, writeDraft } from "@/lib/admin-draft";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Prod = any;

export function ProductFormDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isNew = id === "new" || id === null;
  const qc = useQueryClient();
  const router = useRouter();
  const upsert = useServerFn(adminUpsertProduct);
  const saveVariants = useServerFn(adminSaveVariants);
  const verifySync = useServerFn(adminVerifyVariantSync);
  const gen = useServerFn(aiGenerate);
  const { currencies } = useCurrency();

  const prodQ = useQuery(
    queryOptions({
      queryKey: ["admin", "product", id],
      queryFn: () => adminGetProduct({ data: { id: id! } }),
      enabled: open && !isNew && !!id,
    }),
  );
  const catsQ = useQuery(
    queryOptions({
      queryKey: ["admin", "categories"],
      queryFn: () => adminListCategories(),
      enabled: open,
    }),
  );

  const variantsQ = useQuery(
    queryOptions({
      queryKey: ["admin", "variants", id],
      queryFn: () => adminGetVariants({ data: { product_id: id! } }),
      enabled: open && !isNew && !!id,
    }),
  );

  const [p, setP] = useState<Prod>(emptyProduct());
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // ---- draft autosave -------------------------------------------------
  const key = draftKey("product", isNew ? "new" : id);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [initialStep, setInitialStep] = useState(0);
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const draftRestoredRef = useRef(false);

  function handleVariantsChange(v: VariantRow[]) {
    setVariants(v);
  }

  useEffect(() => {
    if (!open) {
      setHydrated(false); setRestoredAt(null); setSavedAt(null);
      draftRestoredRef.current = false;
      return;
    }
    const draft = readDraft<{ p: Prod; variants: VariantRow[] }>(key);
    const base = isNew
      ? emptyProduct()
      : prodQ.data
        ? { ...prodQ.data, images: prodQ.data.images ?? [], category_ids: (prodQ.data as Prod).category_ids ?? [] }
        : null;
    if (draft) {
      draftRestoredRef.current = true;
      setP(draft.data.p);
      setVariants(draft.data.variants ?? []);
      setInitialStep(draft.step ?? 0);
      setStep(draft.step ?? 0);
      setRestoredAt(draft.savedAt);
      setHydrated(true);
      toast.info(`Draft restored from ${formatDraftTime(draft.savedAt)}`);
      return;
    }
    setInitialStep(0);
    setStep(0);
    if (base && (isNew || variantsQ.data)) {
      setP(base);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVariants(((variantsQ.data ?? []) as any[]).map((v) => ({
        id: v.id, size: v.size, length: v.length, metal: v.metal,
        gemstone_color: v.gemstone_color, component: v.component ?? "", plating: v.plating ?? "",
        color_hex: v.color_hex,
        price: v.price != null ? Number(v.price) : null,
        compare_at_price: v.compare_at_price != null ? Number(v.compare_at_price) : null,
        sku: v.sku, stock: v.stock ?? 0, image: v.image, sort_order: v.sort_order ?? 0,
      })));
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isNew, prodQ.data, variantsQ.data, key]);

  // Debounced autosave of the current form state + step.
  useEffect(() => {
    if (!open || !hydrated) return;
    const t = setTimeout(() => {
      writeDraft(key, { p, variants }, step);
      setSavedAt(Date.now());
    }, 600);
    return () => clearTimeout(t);
  }, [open, hydrated, key, p, variants, step]);


  function discardDraft() {
    clearDraft(key);
    setRestoredAt(null);
    setSavedAt(null);
    setHydrated(false);
    if (isNew) { setP(emptyProduct()); setVariants([]); }
    else if (prodQ.data) {
      setP({ ...prodQ.data, images: prodQ.data.images ?? [], category_ids: (prodQ.data as Prod).category_ids ?? [] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVariants(((variantsQ.data ?? []) as any[]).map((v) => ({
        id: v.id, size: v.size, length: v.length, metal: v.metal,
        gemstone_color: v.gemstone_color, component: v.component ?? "", plating: v.plating ?? "",
        color_hex: v.color_hex,
        price: v.price != null ? Number(v.price) : null,
        compare_at_price: v.compare_at_price != null ? Number(v.compare_at_price) : null,
        sku: v.sku, stock: v.stock ?? 0, image: v.image, sort_order: v.sort_order ?? 0,
      })));
    }
    setInitialStep(0);
    setStep(0);
    setTimeout(() => setHydrated(true), 0);
    toast.success("Draft discarded");
  }

  function upd<K extends keyof Prod>(k: K, v: Prod[K]) {
    setP((s: Prod) => ({ ...s, [k]: v }));
  }


  async function save(statusOverride?: "draft" | "published") {
    if (!p.name) { toast.error("Name is required"); return; }
    const status: "draft" | "published" = statusOverride ?? (p.status === "draft" ? "draft" : "published");
    if (statusOverride) upd("status", statusOverride);
    setSaving(true);
    try {
      const payload = {
        ...p,
        status,
        id: isNew ? undefined : p.id,
        price: Number(p.price),
        stock: Number(p.stock),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        price_overrides: normalizeOverrides(p.price_overrides),
        carat: p.carat ? Number(p.carat) : null,
        category_ids: (p.category_ids ?? []) as string[],
      };
      const res = await upsert({ data: payload });
      const savedId = res?.id ?? p.id;
      if (savedId) {
        await saveVariants({ data: { product_id: savedId, variants } });
      }
      clearDraft(key);
      setHydrated(false);
      toast.success(status === "draft" ? "Saved as draft" : "Published");

      // Post-publish sync check against what the storefront can actually read.
      // On a mismatch we automatically re-save the variants and re-check.
      if (savedId) {
        const MAX_RETRIES = 2;
        let attempt = 0;
        let lastSync: Awaited<ReturnType<typeof verifySync>> | null = null;
        let failed = false;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            lastSync = await verifySync({ data: { product_id: savedId, expected: variants.length } });
          } catch {
            lastSync = null;
            failed = true;
            break;
          }
          const stored = lastSync.saved === lastSync.expected;
          const live =
            status === "draft" || (lastSync.productVisible && lastSync.visible === lastSync.saved);
          if (stored && live) break;
          if (attempt >= MAX_RETRIES) break;
          attempt += 1;
          toast.info(`Storefront out of sync — retrying save (${attempt}/${MAX_RETRIES})…`);
          try {
            await saveVariants({ data: { product_id: savedId, variants } });
          } catch {
            /* keep retrying the verification anyway */
          }
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }

        if (failed || !lastSync) {
          toast.warning("Saved, but the storefront sync check could not run.");
        } else if (lastSync.saved !== lastSync.expected) {
          toast.error(
            `Sync mismatch after ${attempt} retr${attempt === 1 ? "y" : "ies"}: ${lastSync.expected} variant(s) submitted but ${lastSync.saved} stored.`,
          );
        } else if (status === "draft") {
          toast.info(`${lastSync.saved} variant(s) stored — hidden from the storefront while in draft.`);
        } else if (!lastSync.productVisible) {
          toast.error("Saved, but the product is not visible on the storefront yet.");
        } else if (lastSync.visible !== lastSync.saved) {
          toast.error(`Storefront shows ${lastSync.visible} of ${lastSync.saved} variant(s).`);
        } else {
          toast.success(
            attempt > 0
              ? `Storefront in sync after ${attempt} retr${attempt === 1 ? "y" : "ies"} — ${lastSync.visible} variant(s) live.`
              : `Storefront in sync — ${lastSync.visible} variant(s) live.`,
          );
        }
      }

      // Storefront cache invalidation + loader refetch, here and in other tabs.
      await publishStorefrontRefresh(qc, router);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const { label, input, textarea } = adminField;

  const steps: WizardStep[] = [
    {
      key: "basics",
      title: "Basics",
      description: "Name the piece, set its URL slug and write the story behind it.",
      validate: () => (!p.name ? "Product name is required" : !p.slug ? "Slug is required" : null),
      content: (
        <>
          <AdminFormCol span={7} title="Product">
            <div>
              <div className="flex items-center justify-between mb-1 gap-2">
                <label className={label}>Name</label>
                <AIFieldSwitch
                  label="Name"
                  onGenerate={async () => {
                    const seed =
                      [p.gemstone, p.metal, p.cut].filter(Boolean).join(", ") ||
                      p.name ||
                      "elegant jewelry piece";
                    const r = await gen({ data: { kind: "product-title", context: seed } });
                    upd("name", r.text ?? "");
                  }}
                />
              </div>
              <input className={input} value={p.name} onChange={(e) => upd("name", e.target.value)} />
            </div>
            <div>
              <label className={label}>Slug</label>
              <input className={input} value={p.slug} onChange={(e) => upd("slug", e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={label}>Description</label>
                <AIFieldSwitch
                  label="Description"
                  onGenerate={async () => {
                    if (!p.name) throw new Error("Enter a name first");
                    const r = await gen({
                      data: {
                        kind: "product-description",
                        context: `${p.name}. Metal: ${p.metal}. Gemstone: ${p.gemstone}. Carat: ${p.carat}.`,
                      },
                    });
                    const html = r.text
                      .trim()
                      .split(/\n{2,}/)
                      .map((para) => `<p>${para.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</p>`)
                      .join("");
                    upd("description", html);
                  }}
                />
              </div>
              <RichEditor
                value={p.description ?? ""}
                onChange={(html) => upd("description", html)}
                placeholder="Describe the piece…"
                minHeight={320}
              />
            </div>
          </AdminFormCol>
          <AdminFormCol span={5} title="Categories & flags">
            <div>
              <label className={label}>Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["draft", "Draft", "Hidden from the storefront"],
                  ["published", "Published", "Live for shoppers"],
                ] as const).map(([val, title, hint]) => {
                  const active = (p.status ?? "published") === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => upd("status", val)}
                      className={`rounded-sm border px-3 py-2 text-left transition ${
                        active ? "border-foreground bg-foreground/5" : "border-border hover:bg-foreground/5"
                      }`}
                    >
                      <span className="block text-xs font-medium">{title}</span>
                      <span className="block text-[10px] text-muted-foreground">{hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className={label}>Categories</label>
              <CategoryMultiSelect
                options={(catsQ.data ?? []) as CategoryOption[]}
                value={(p.category_ids ?? []) as string[]}
                onChange={(next) =>
                  setP((s: Prod) => ({ ...s, category_ids: next, category_id: next[0] ?? null }))
                }
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Search and select one or more. The first selected acts as the primary category.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={p.is_new} onChange={(e) => upd("is_new", e.target.checked)} />
                New arrival
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={p.is_bestseller}
                  onChange={(e) => upd("is_bestseller", e.target.checked)}
                />
                Bestseller
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={p.is_trending}
                  onChange={(e) => upd("is_trending", e.target.checked)}
                />
                Trending
              </label>
            </div>
          </AdminFormCol>
        </>
      ),
    },
    {
      key: "media",
      title: "Media",
      description: "Upload the gallery. The first image is used as the primary photo.",
      content: (
        <AdminFormCol span={12} title="Product images">
          <MultiImageUpload value={p.images ?? []} onChange={(urls) => upd("images", urls)} />
        </AdminFormCol>
      ),
    },
    {
      key: "pricing",
      title: "Pricing & stock",
      description: "Base pricing in ₹, plus optional fixed prices for other countries.",
      validate: () => (Number(p.price) > 0 ? null : "Enter a price greater than 0"),
      content: (
        <AdminFormCol span={12} title="Pricing & inventory">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={label}>Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className={input}
                value={p.price}
                onChange={(e) => upd("price", Number(e.target.value))}
              />
            </div>
            <div>
              <label className={label}>Compare-at</label>
              <input
                type="number"
                step="0.01"
                className={input}
                value={p.compare_at_price ?? ""}
                onChange={(e) => upd("compare_at_price", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <label className={label}>Stock</label>
              <input
                type="number"
                className={input}
                value={p.stock}
                onChange={(e) => upd("stock", Number(e.target.value))}
              />
            </div>
            <div>
              <label className={label}>SKU</label>
              <input className={input} value={p.sku ?? ""} onChange={(e) => upd("sku", e.target.value)} />
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm font-medium">Country pricing (optional)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set a fixed price for shoppers outside India. Leave a field empty to keep the
              automatic conversion from the ₹ price.
            </p>
            <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {currencies.filter((c) => c.code !== "INR").map((c) => {
                const ov = normalizeOverrides(p.price_overrides);
                const auto = Math.round(Number(p.price || 0) * c.rate * 100) / 100;
                return (
                  <div key={c.code}>
                    <label className={label}>{c.country} ({c.symbol} {c.code})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={input}
                      placeholder={`Auto ${c.symbol}${auto}`}
                      value={ov[c.code] ?? ""}
                      onChange={(e) => {
                        const next = { ...ov };
                        const n = Number(e.target.value);
                        if (e.target.value === "" || !(n > 0)) delete next[c.code];
                        else next[c.code] = n;
                        upd("price_overrides", next);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </AdminFormCol>
      ),
    },
    {
      key: "attributes",
      title: "Attributes",
      description: "Gemological details shown in the product specification table.",
      content: (
        <AdminFormCol span={12} title="Gemstone & metal">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className={label}>Metal</label>
              <input className={input} value={p.metal ?? ""} onChange={(e) => upd("metal", e.target.value)} />
            </div>
            <div>
              <label className={label}>Gemstone</label>
              <input
                className={input}
                value={p.gemstone ?? ""}
                onChange={(e) => upd("gemstone", e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Cut</label>
              <input className={input} value={p.cut ?? ""} onChange={(e) => upd("cut", e.target.value)} />
            </div>
            <div>
              <label className={label}>Carat</label>
              <input
                type="number"
                step="0.01"
                className={input}
                value={p.carat ?? ""}
                onChange={(e) => upd("carat", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <label className={label}>Clarity</label>
              <input
                className={input}
                value={p.clarity ?? ""}
                onChange={(e) => upd("clarity", e.target.value)}
              />
            </div>
          </div>
        </AdminFormCol>
      ),
    },
    {
      key: "variants",
      title: "Variants",
      description: "Build options like components, plating, metal, gemstone and size.",
      content: (
        <>
          <AdminFormCol span={12} title="Variants & swatches">
            <VariantEditor value={variants} onChange={handleVariantsChange} />
          </AdminFormCol>
          <AdminFormCol span={12} title="Live preview">
            <VariantPreview
              name={p.name ?? ""}
              images={(p.images ?? []) as string[]}
              basePrice={p.price != null ? Number(p.price) : null}
              baseCompareAt={p.compare_at_price != null ? Number(p.compare_at_price) : null}
              baseStock={Number(p.stock ?? 0)}
              variants={variants}
            />
          </AdminFormCol>
        </>
      ),
    },
    {
      key: "seo",
      title: "SEO & review",
      description: "Final check before publishing.",
      content: (
        <>
          <AdminFormCol span={7} title="Search engine listing">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Generate with AI
              </span>
              <AIFieldSwitch
                label="SEO"
                onGenerate={async () => {
                  if (!p.name) throw new Error("Enter a name first");
                  const r = await gen({
                    data: { kind: "product-seo", context: `${p.name}. ${p.description ?? ""}` },
                  });
                  if (r.json) {
                    upd("meta_title", r.json.meta_title ?? "");
                    upd("meta_description", r.json.meta_description ?? "");
                  }
                }}
              />
            </div>
            <div>
              <label className={label}>Meta title</label>
              <input
                className={input}
                value={p.meta_title ?? ""}
                onChange={(e) => upd("meta_title", e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Meta description</label>
              <textarea
                rows={4}
                className={textarea}
                value={p.meta_description ?? ""}
                onChange={(e) => upd("meta_description", e.target.value)}
              />
            </div>
          </AdminFormCol>
          <AdminFormCol span={5} title="Summary">
            <dl className="text-xs space-y-2">
              {[
                ["Name", p.name || "—"],
                ["Slug", p.slug || "—"],
                ["Price", `₹${Number(p.price || 0).toLocaleString("en-IN")}`],
                ["Stock", String(p.stock ?? 0)],
                ["Images", String((p.images ?? []).length)],
                ["Categories", String((p.category_ids ?? []).length)],
                ["Variants", String(variants.length)],
                ["Status", (p.status ?? "published") === "draft" ? "Draft" : "Published"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5">
                  <dt className="uppercase tracking-[0.18em] text-[10px] text-muted-foreground">{k}</dt>
                  <dd className="truncate">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => save("draft")}
                className="rounded-sm border border-border px-3 py-2 text-xs uppercase tracking-[0.18em] hover:bg-foreground/5 disabled:opacity-50"
              >
                Save as draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => save("published")}
                className="rounded-sm bg-foreground px-3 py-2 text-xs uppercase tracking-[0.18em] text-background hover:opacity-90 disabled:opacity-50"
              >
                Publish now
              </button>
            </div>
          </AdminFormCol>
        </>
      ),
    },
  ];

  return (
    <AdminWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? "New product" : `Edit: ${p.name || "Untitled"}`}
      subtitle="Step through the details — you can save at any point."
      steps={steps}
      onSave={() => save()}
      saveLabel={(p.status ?? "published") === "draft" ? "Save draft" : "Save & publish"}
      saving={saving}
      onStepError={(m) => toast.error(m)}
      initialStep={initialStep}
      onStepChange={setStep}
      footerNote={
        savedAt || restoredAt ? (
          <span className="flex items-center gap-2">
            <span>
              {restoredAt && !savedAt
                ? `Draft restored (${formatDraftTime(restoredAt)})`
                : `Draft saved ${formatDraftTime(savedAt!)}`}
            </span>
            <button
              type="button"
              onClick={discardDraft}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Discard draft
            </button>
          </span>
        ) : null
      }
    />
  );
}


function emptyProduct(): Prod {
  return {
    slug: "",
    name: "",
    description: "",
    price: 0,
    compare_at_price: null,
    price_overrides: {},
    category_id: null,
    category_ids: [],
    sku: "",
    stock: 10,
    gemstone: "",
    cut: "",
    carat: null,
    clarity: "",
    metal: "",
    images: [],
    status: "draft",
    is_new: false,
    is_bestseller: false,
    is_trending: false,
    meta_title: "",
    meta_description: "",
  };
}
