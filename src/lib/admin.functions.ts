import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  await assertAdminUser(supabase, userId);
}

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("products").select("*, categories(name, slug)").order("sort_order").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("products").select("*").eq("id", data.id).maybeSingle();
    if (error) throw error;
    if (!row) return row;
    const { data: links } = await supabaseAdmin
      .from("product_categories")
      .select("category_id")
      .eq("product_id", data.id);
    const category_ids = (links ?? []).map((l) => l.category_id);
    return { ...row, category_ids: category_ids.length ? category_ids : (row.category_id ? [row.category_id] : []) };
  });

const productPayload = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nullable().optional(),
  price_overrides: z.record(z.string(), z.number().nonnegative()).optional(),
  category_id: z.string().uuid().nullable().optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  sku: z.string().nullable().optional(),
  stock: z.number().int().nonnegative(),
  gemstone: z.string().nullable().optional(),
  cut: z.string().nullable().optional(),
  carat: z.number().nullable().optional(),
  clarity: z.string().nullable().optional(),
  metal: z.string().nullable().optional(),
  images: z.array(z.string()),
  status: z.enum(["draft", "published"]).optional(),
  is_new: z.boolean(),
  is_bestseller: z.boolean(),
  is_trending: z.boolean(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
});

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof productPayload>) => productPayload.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { category_ids, ...rest } = data;
    const ids = category_ids ? Array.from(new Set(category_ids)) : undefined;
    const payload = ids ? { ...rest, category_id: ids[0] ?? null } : rest;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await supabaseAdmin.from("products").upsert(payload as any).select("id").single();
    if (error) throw error;
    if (ids) {
      await supabaseAdmin.from("product_categories").delete().eq("product_id", row.id);
      if (ids.length > 0) {
        const { error: linkErr } = await supabaseAdmin
          .from("product_categories")
          .insert(ids.map((cid) => ({ product_id: row.id, category_id: cid })));
        if (linkErr) throw linkErr;
      }
    }
    return { id: row.id };
  });

export const adminSetProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "draft" | "published" }) =>
    z.object({ id: z.string(), status: z.enum(["draft", "published"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabaseAdmin.from("products").update({ status: data.status } as any).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminListBlog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("blog_posts").select("*").order("published_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminGetBlog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("blog_posts").select("*").eq("id", data.id).maybeSingle();
    if (error) throw error;
    return row;
  });

const blogPayload = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  body: z.string().min(1),
  author: z.string().min(1),
  category_id: z.string().uuid().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
});

export const adminUpsertBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof blogPayload>) => blogPayload.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await supabaseAdmin.from("blog_posts").upsert(data as any).select("id").single();
    if (error) throw error;
    return { id: row.id };
  });

export const adminDeleteBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return data ?? [];
  });

// Bootstrap: current signed-in user becomes admin IF no admin exists yet.
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("user_roles").select("id").eq("role", "admin").limit(1);
    if (existing && existing.length > 0) return { ok: false, reason: "admin_exists" };
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) throw error;
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Order detail, status control and customer communication
// ---------------------------------------------------------------------------

export const adminGetOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin.from("orders").select("*").eq("id", data.id).maybeSingle();
    if (error) throw error;
    if (!order) throw new Error("Order not found");
    const { data: messages } = await supabaseAdmin
      .from("order_messages").select("*").eq("order_id", data.id).order("created_at", { ascending: true });
    return { order, messages: messages ?? [] };
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string; status?: string; payment_status?: string; notes?: string;
    courier_name?: string; awb_code?: string; tracking_url?: string;
  }) => z.object({
    id: z.string().uuid(),
    status: z.string().min(1).max(40).optional(),
    payment_status: z.string().min(1).max(40).optional(),
    notes: z.string().max(4000).optional(),
    courier_name: z.string().max(120).optional(),
    awb_code: z.string().max(120).optional(),
    tracking_url: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    if (Object.keys(clean).length === 0) return { ok: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabaseAdmin.from("orders").update(clean as any).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const adminSendOrderMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    order_id: string; subject?: string; body: string; template_key?: string;
    visible_to_customer?: boolean; set_status?: string; set_payment_status?: string;
  }) => z.object({
    order_id: z.string().uuid(),
    subject: z.string().max(200).optional(),
    body: z.string().min(1).max(8000),
    template_key: z.string().max(60).optional(),
    visible_to_customer: z.boolean().optional(),
    set_status: z.string().max(40).optional(),
    set_payment_status: z.string().max(40).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, string> = {};
    if (data.set_status) patch.status = data.set_status;
    if (data.set_payment_status) patch.payment_status = data.set_payment_status;
    if (Object.keys(patch).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upErr } = await supabaseAdmin.from("orders").update(patch as any).eq("id", data.order_id);
      if (upErr) throw upErr;
    }

    const { data: order } = await supabaseAdmin.from("orders").select("status").eq("id", data.order_id).maybeSingle();
    const { data: profile } = await supabaseAdmin.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();

    const { data: row, error } = await supabaseAdmin.from("order_messages").insert({
      order_id: data.order_id,
      direction: "outbound",
      template_key: data.template_key ?? null,
      subject: data.subject ?? "",
      body: data.body,
      status_snapshot: order?.status ?? null,
      visible_to_customer: data.visible_to_customer ?? true,
      author_id: context.userId,
      author_name: profile?.full_name || "Rosado Gems",
      author_email: (context.claims as { email?: string } | undefined)?.email ?? null,
    }).select("id").single();
    if (error) throw error;
    return { id: row.id };
  });

// ---------------------------------------------------------------------------
// Customer management
// ---------------------------------------------------------------------------

export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, contact_email, contact_name, contact_phone, total, total_base, currency, status, payment_status, created_at, shipping_address")
      .order("created_at", { ascending: false })
      .limit(2000);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, phone, created_at");

    const map = new Map<string, {
      email: string; name: string; phone: string; orders: number; spend_base: number;
      last_order: string | null; first_order: string | null; city: string; country: string;
      last_status: string; order_ids: string[];
    }>();
    for (const o of orders ?? []) {
      const email = (o.contact_email ?? "").toLowerCase();
      if (!email) continue;
      const addr = (o.shipping_address ?? {}) as Record<string, unknown>;
      const cur = map.get(email) ?? {
        email, name: o.contact_name ?? "", phone: o.contact_phone ?? "", orders: 0, spend_base: 0,
        last_order: null, first_order: null, city: String(addr["city"] ?? ""), country: String(addr["country"] ?? ""),
        last_status: o.status ?? "", order_ids: [],
      };
      cur.orders += 1;
      cur.spend_base += Number(o.total_base ?? o.total ?? 0);
      cur.order_ids.push(o.id);
      if (!cur.last_order || o.created_at > cur.last_order) { cur.last_order = o.created_at; cur.last_status = o.status ?? ""; }
      if (!cur.first_order || o.created_at < cur.first_order) cur.first_order = o.created_at;
      if (!cur.phone && o.contact_phone) cur.phone = o.contact_phone;
      map.set(email, cur);
    }
    return {
      customers: Array.from(map.values()).sort((a, b) => b.spend_base - a.spend_base),
      accounts: (profiles ?? []).length,
    };
  });

export const adminGetCustomerOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin
      .from("orders").select("*").ilike("contact_email", data.email).order("created_at", { ascending: false });
    if (error) throw error;
    return orders ?? [];
  });
