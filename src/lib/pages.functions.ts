import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const pagePayload = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  body: z.string().default(""),
  excerpt: z.string().max(500).optional().nullable(),
  cover_image: z.string().max(1000).optional().nullable(),
  meta_title: z.string().max(200).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  published: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sections: z.array(z.any()).default([]),
});

export const listPublishedPages = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub().from("pages").select("id, slug, title, excerpt, cover_image, updated_at").eq("published", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
});

export const getPageBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await pub().from("pages").select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (error) throw error;
    return row;
  });

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  await assertAdminUser(context.supabase, context.userId);
}

export const adminListPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (context.supabase as any).from("pages").select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminGetPage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (context.supabase as any).from("pages").select("*").eq("id", data.id).maybeSingle();
    if (error) throw error;
    return row;
  });

export const adminUpsertPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof pagePayload>) => pagePayload.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: any = context.supabase;
    if (data.id) {
      const { error } = await client.from("pages").update(data).eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: row, error } = await client.from("pages").insert(data).select("id").single();
    if (error) throw error;
    return { id: row.id };
  });

export const adminDeletePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase as any).from("pages").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
