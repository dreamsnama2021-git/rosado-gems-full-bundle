import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { full_name?: string; phone?: string }) =>
    z.object({ full_name: z.string().max(120).optional(), phone: z.string().max(30).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").upsert({ id: context.userId, ...data });
    if (error) throw error;
    return { ok: true };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userData } = await context.supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) return [];
    const { data } = await supabaseAdmin.from("orders").select("*").eq("contact_email", email).order("created_at", { ascending: false });
    const orders = data ?? [];
    if (orders.length === 0) return [];

    // Attach the refund ledger (customer-safe columns only) so the storefront
    // can show a payment timeline with refunds.
    const { data: refundRows } = await supabaseAdmin
      .from("order_refunds")
      .select("order_id, amount, currency, status, reason, gateway, gateway_refund_id, created_at")
      .in("order_id", orders.map((o) => o.id))
      .order("created_at", { ascending: true });

    const byOrder = new Map<string, typeof refundRows>();
    for (const r of refundRows ?? []) {
      const list = byOrder.get(r.order_id) ?? [];
      list.push(r);
      byOrder.set(r.order_id, list as typeof refundRows);
    }
    return orders.map((o) => ({ ...o, refunds: byOrder.get(o.id) ?? [] }));
  });


export const getMyWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("wishlists").select("product_id, products(*)").eq("user_id", context.userId);
    return data ?? [];
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { product_id: string }) => z.object({ product_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase.from("wishlists").select("id").eq("user_id", context.userId).eq("product_id", data.product_id).maybeSingle();
    if (existing) {
      await context.supabase.from("wishlists").delete().eq("id", existing.id);
      return { added: false };
    }
    await context.supabase.from("wishlists").insert({ user_id: context.userId, product_id: data.product_id });
    return { added: true };
  });

export const searchSite = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => z.object({ q: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const c = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const term = `%${data.q}%`;
    const [prods, posts, cats] = await Promise.all([
      c.from("products").select("id, name, slug, price, images").or(`name.ilike.${term},description.ilike.${term},gemstone.ilike.${term}`).limit(6),
      c.from("blog_posts").select("id, title, slug, cover_image").or(`title.ilike.${term},excerpt.ilike.${term}`).limit(4),
      c.from("categories").select("id, name, slug").ilike("name", term).limit(4),
    ]);
    return { products: prods.data ?? [], posts: posts.data ?? [], categories: cats.data ?? [] };
  });

// --- Order conversation (customer side) -------------------------------------

export const getMyOrderMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { order_id: string }) => z.object({ order_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("order_messages").select("*").eq("order_id", data.order_id).order("created_at", { ascending: true });
    return rows ?? [];
  });

export const replyToOrderMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { order_id: string; body: string }) =>
    z.object({ order_id: z.string().uuid(), body: z.string().min(1).max(4000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: userData } = await context.supabase.auth.getUser();
    const { error } = await context.supabase.from("order_messages").insert({
      order_id: data.order_id,
      direction: "inbound",
      body: data.body,
      subject: "",
      visible_to_customer: true,
      author_id: context.userId,
      author_name: userData.user?.email ?? "Customer",
      author_email: userData.user?.email ?? null,
    });
    if (error) throw error;
    return { ok: true };
  });
