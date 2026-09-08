import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";
import type { Database } from "@/integrations/supabase/types";
import { buildVariantRows, keepIdsOf, variantsPayloadSchema, type VariantInput } from "@/lib/variants.schema";

function pub() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getVariantsByProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { product_id: string }) => z.object({ product_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: rows, error } = await pub()
      .from("product_variants")
      .select("*")
      .eq("product_id", data.product_id)
      .order("sort_order");
    if (error) throw error;
    return rows ?? [];
  });

export const adminGetVariants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { product_id: string }) => z.object({ product_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("product_variants")
      .select("*")
      .eq("product_id", data.product_id)
      .order("sort_order");
    if (error) throw error;
    return rows ?? [];
  });

export const adminSaveVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { product_id: string; variants: VariantInput[] }) => variantsPayloadSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const keepIds = keepIdsOf(data.variants);
    // Delete removed
    let del = supabaseAdmin.from("product_variants").delete().eq("product_id", data.product_id);
    if (keepIds.length > 0) del = del.not("id", "in", `(${keepIds.join(",")})`);
    const { error: delErr } = await del;
    if (delErr) throw delErr;

    if (data.variants.length > 0) {
      // Every row must carry the SAME set of keys — PostgREST rejects a bulk
      // payload with mixed keys ("All object keys must match"), which is what
      // happened when an edit mixed existing (with id) and new (no id) rows.
      const rows = buildVariantRows(data.product_id, data.variants);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabaseAdmin.from("product_variants").upsert(rows as any, { onConflict: "id" });
      if (error) throw error;
    }

    return { ok: true };
  });

/**
 * Post-publish sync check: compares what admin saved against what the
 * storefront (anonymous, RLS-filtered) can actually read back.
 */
export const adminVerifyVariantSync = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { product_id: string; expected: number }) =>
    z.object({ product_id: z.string().uuid(), expected: z.coerce.number().int().nonnegative() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: savedCount }, { data: prod }] = await Promise.all([
      supabaseAdmin
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .eq("product_id", data.product_id),
      supabaseAdmin.from("products").select("id, slug, status").eq("id", data.product_id).maybeSingle(),
    ]);

    const c = pub();
    const [{ data: publicProd }, { count: publicCount }] = await Promise.all([
      c.from("products").select("id").eq("id", data.product_id).maybeSingle(),
      c.from("product_variants").select("id", { count: "exact", head: true }).eq("product_id", data.product_id),
    ]);

    const saved = savedCount ?? 0;
    const visible = publicProd ? (publicCount ?? 0) : 0;
    return {
      expected: data.expected,
      saved,
      visible,
      productVisible: !!publicProd,
      status: prod?.status ?? "published",
      slug: prod?.slug ?? null,
      inSync: saved === data.expected && (prod?.status === "draft" || (!!publicProd && visible === saved)),
    };
  });
