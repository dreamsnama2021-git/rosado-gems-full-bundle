import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { convertFromINR, effectiveInrPrice, normalizeCurrencies, BASE_CURRENCY, type CurrencyRow } from "@/lib/currency";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

type HomeSection = { eyebrow: string; title: string; subtitle: string; product_ids: string[] };
type SectionRow = { id: string; type: string; visible: boolean; props: Record<string, any> };
type HomeCfg = { new_arrivals: HomeSection; best_sellers: HomeSection; sections?: SectionRow[] };

const DEFAULT_HOME: HomeCfg = {
  new_arrivals: { eyebrow: "Just In", title: "New Arrival", subtitle: "", product_ids: [] },
  best_sellers: { eyebrow: "Beloved", title: "Best Sellers", subtitle: "", product_ids: [] },
};

export const getHomepageSections = createServerFn({ method: "GET" }).handler(async () => {
  const c = pub();
  const { data: s } = await c.from("site_settings").select("homepage").eq("id", "default").maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg: HomeCfg = { ...DEFAULT_HOME, ...((s?.homepage as any) ?? {}) };

  async function loadSection(sec: HomeSection, fallbackFlag: "is_new" | "is_bestseller", limit: number) {
    if (sec.product_ids && sec.product_ids.length > 0) {
      const { data } = await c.from("products").select("*").in("id", sec.product_ids);
      const map = new Map((data ?? []).map((p) => [p.id, p]));
      const ordered = sec.product_ids.map((id) => map.get(id)).filter(Boolean);
      return { ...sec, products: ordered };
    }
    const { data } = await c.from("products").select("*").eq(fallbackFlag, true).order("sort_order").limit(limit);
    return { ...sec, products: data ?? [] };
  }

  const [newArrivals, bestSellers] = await Promise.all([
    loadSection(cfg.new_arrivals, "is_new", 12),
    loadSection(cfg.best_sellers, "is_bestseller", 8),
  ]);

  const sections: SectionRow[] = (cfg.sections && cfg.sections.length > 0)
    ? cfg.sections
    : [
        { id: "hero", type: "hero", visible: true, props: {} },
        { id: "gemstones", type: "gemstones", visible: true, props: {} },
        { id: "categories", type: "categories", visible: true, props: {} },
        { id: "product_rail", type: "product_rail", visible: true, props: { ...cfg.new_arrivals, fallback: "new" } },
        { id: "editorial", type: "editorial", visible: true, props: {} },
        { id: "product_grid", type: "product_grid", visible: true, props: { ...cfg.best_sellers, fallback: "bestseller" } },
        { id: "testimonials", type: "testimonials", visible: true, props: {} },
        { id: "blog", type: "blog", visible: true, props: {} },
        { id: "lookbook", type: "lookbook", visible: true, props: {} },
      ];

  const resolved = await Promise.all(sections.map(async (sec) => {
    if (sec.type !== "product_rail" && sec.type !== "product_grid") return sec;
    const ids: string[] = (sec.props?.product_ids as string[]) ?? [];
    if (ids.length > 0) {
      const { data } = await c.from("products").select("*").in("id", ids);
      const map = new Map((data ?? []).map((p) => [p.id, p]));
      return { ...sec, props: { ...sec.props, products: ids.map((id) => map.get(id)).filter(Boolean) } };
    }
    const fb = sec.props?.fallback ?? (sec.type === "product_rail" ? "new" : "bestseller");
    if (fb === "none") return { ...sec, props: { ...sec.props, products: [] } };
    const flag = fb === "new" ? "is_new" : "is_bestseller";
    const { data } = await c.from("products").select("*").eq(flag, true).order("sort_order").limit(12);
    return { ...sec, props: { ...sec.props, products: data ?? [] } };
  }));

  return { newArrivals, bestSellers, sections: resolved };
});

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub().from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
});

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { categorySlug?: string; flag?: "new" | "bestseller" | "trending"; limit?: number } | undefined) =>
    z.object({ categorySlug: z.string().optional(), flag: z.enum(["new","bestseller","trending"]).optional(), limit: z.number().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const c = pub();
    let q = data.categorySlug
      ? c.from("products").select("*, categories(slug, name), product_categories!inner(category_id, categories!inner(slug))").order("sort_order")
      : c.from("products").select("*, categories(slug, name)").order("sort_order");
    if (data.categorySlug) q = q.eq("product_categories.categories.slug", data.categorySlug);
    if (data.flag === "new") q = q.eq("is_new", true);
    if (data.flag === "bestseller") q = q.eq("is_bestseller", true);
    if (data.flag === "trending") q = q.eq("is_trending", true);
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const c = pub();
    const { data: p, error } = await c.from("products").select("*, categories(slug, name)").eq("slug", data.slug).maybeSingle();
    if (error) throw error;
    if (!p) return null;
    const [{ data: related }, { data: variants }] = await Promise.all([
      c.from("products").select("*, product_categories!inner(category_id)").eq("product_categories.category_id", p.category_id!).neq("id", p.id).limit(4),
      c.from("product_variants").select("*").eq("product_id", p.id).order("sort_order"),
    ]);
    return { product: p, related: related ?? [], variants: variants ?? [] };
  });

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const c = pub();
    const { data: cat, error } = await c.from("categories").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw error;
    if (!cat) return null;
    const { data: products } = await c
      .from("products")
      .select("*, product_categories!inner(category_id)")
      .eq("product_categories.category_id", cat.id)
      .order("sort_order");
    return { category: cat, products: products ?? [] };
  });

export const getBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub().from("blog_posts").select("*").order("published_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: post, error } = await pub().from("blog_posts").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw error;
    return post;
  });

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
    z.object({ name: z.string().min(1), email: z.string().email(), phone: z.string().optional(), subject: z.string().optional(), message: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await pub().from("contact_messages").insert(data);
    if (error) throw error;
    return { ok: true };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string }) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await pub().from("newsletter_subscribers").insert({ email: data.email });
    if (error && !String(error.message).includes("duplicate")) throw error;
    return { ok: true };
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveCurrency(raw: any, code: string): CurrencyRow {
  const list = normalizeCurrencies(raw);
  return list.find((c) => c.code === code) ?? list.find((c) => c.code === "INR") ?? BASE_CURRENCY;
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: {
    contact_name: string; contact_email: string; contact_phone?: string;
    shipping_address: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    subtotal: number; shipping: number; total: number; notes?: string;
    payment_method?: "cod" | "prepaid"; cod_fee?: number;
    tax?: number; tax_detail?: Record<string, unknown>;
    currency?: string;
  }) => z.object({
    contact_name: z.string().min(1), contact_email: z.string().email(), contact_phone: z.string().optional(),
    shipping_address: z.record(z.string(), z.unknown()),
    items: z.array(z.record(z.string(), z.unknown())).min(1),
    subtotal: z.number(), shipping: z.number(), total: z.number(), notes: z.string().optional(),
    payment_method: z.enum(["cod", "prepaid"]).optional(),
    cod_fee: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    tax_detail: z.record(z.string(), z.unknown()).optional(),
    currency: z.string().min(3).max(4).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve the display currency + rate server-side; a client-supplied rate is ignored.
    const wanted = String(data.currency ?? "INR").toUpperCase();
    const { data: settingsRow } = await supabaseAdmin
      .from("site_settings").select("currencies").eq("id", "default").maybeSingle();
    const currency = resolveCurrency(settingsRow?.currencies, wanted);
    const fx = (n: number) => convertFromINR(n, currency);

    // Server-side validation: re-price every line and verify stock before creating the order
    const validated: Array<Record<string, unknown>> = [];
    for (const raw of data.items) {
      const item = raw as { id?: string; slug?: string; name?: string; qty?: number; variant_id?: string | null; sku?: string | null; variant?: string | null };
      const qty = Math.max(1, Number(item.qty ?? 1));
      const productId = String(item.id ?? "").split("::")[0];
      const { data: product } = await supabaseAdmin
        .from("products").select("id, name, slug, price, stock, price_overrides, status").eq("id", productId).maybeSingle();
      if (!product) throw new Error(`Product no longer available: ${item.name ?? productId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (((product as any).status ?? "published") !== "published") throw new Error(`Product no longer available: ${item.name ?? product.name}`);

      // A per-country price set by the admin wins over the converted ₹ price;
      // it is stored back as its INR equivalent so all downstream maths stay in base currency.
      let unitPrice = effectiveInrPrice(Number(product.price), product.price_overrides, currency);
      let available = Number(product.stock ?? 0);
      let sku: string | null = null;

      if (item.variant_id) {
        const { data: variant } = await supabaseAdmin
          .from("product_variants").select("id, price, stock, sku, product_id").eq("id", item.variant_id).maybeSingle();
        if (!variant || variant.product_id !== product.id) throw new Error(`Selected option is no longer available for ${product.name}`);
        if (variant.price != null) unitPrice = Number(variant.price);
        available = Number(variant.stock ?? 0);
        sku = variant.sku ?? null;
      }

      if (available < qty) {
        throw new Error(`Only ${available} left in stock for ${product.name}${item.variant ? ` (${item.variant})` : ""}`);
      }

      validated.push({
        id: item.id, product_id: product.id, slug: product.slug, name: product.name,
        variant_id: item.variant_id ?? null, variant: item.variant ?? null, sku: sku ?? item.sku ?? null,
        qty, price: unitPrice, line_total: unitPrice * qty,
      });
    }

    // Base (INR) figures — always recomputed from the database, never trusted from the client.
    const subtotalBase = validated.reduce((s, i) => s + Number(i.line_total), 0);
    const shippingBase = Number(data.shipping ?? 0);
    const taxBase = Number(data.tax ?? 0);
    const codBase = Number(data.cod_fee ?? 0);
    const totalBase = subtotalBase + shippingBase + taxBase + codBase;


    const items = validated.map((l) => ({
      ...l,
      price: fx(Number(l.price)),
      line_total: fx(Number(l.line_total)),
      price_base: Number(l.price),
      line_total_base: Number(l.line_total),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taxDetail: Record<string, any> = { ...(data.tax_detail ?? {}) };
    if (Array.isArray(taxDetail.lines)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      taxDetail.lines = taxDetail.lines.map((l: any) => ({ ...l, amount: fx(Number(l.amount ?? 0)) }));
    }

    // Round each component in the order currency, then sum, so the stored
    // totals match exactly what the shopper saw at checkout.
    const subtotalCur = fx(subtotalBase);
    const shippingCur = fx(shippingBase);
    const taxCur = fx(taxBase);
    const codCur = fx(codBase);
    const totalCur = Math.round((subtotalCur + shippingCur + taxCur + codCur) * 100) / 100;

    const payload = {
      ...data,
      items,
      subtotal: subtotalCur,
      shipping: shippingCur,
      tax: taxCur,
      cod_fee: codCur,
      total: totalCur,
      total_base: Math.round(totalBase * 100) / 100,
      currency: currency.code,
      currency_rate: currency.rate,
      tax_detail: taxDetail,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await supabaseAdmin.from("orders").insert(payload as any).select("id").single();
    if (error) throw error;

    // Decrement stock for each validated line
    for (const line of validated) {
      const qty = Number(line.qty);
      if (line.variant_id) {
        const { data: v } = await supabaseAdmin.from("product_variants").select("stock").eq("id", line.variant_id as string).maybeSingle();
        if (v) await supabaseAdmin.from("product_variants").update({ stock: Math.max(0, Number(v.stock ?? 0) - qty) }).eq("id", line.variant_id as string);
      } else {
        const { data: pr } = await supabaseAdmin.from("products").select("stock").eq("id", line.product_id as string).maybeSingle();
        if (pr) await supabaseAdmin.from("products").update({ stock: Math.max(0, Number(pr.stock ?? 0) - qty) }).eq("id", line.product_id as string);
      }
    }

    return { id: row.id };
  });
