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

export const listApprovedComments = createServerFn({ method: "GET" })
  .inputValidator((d: { postId: string }) => z.object({ postId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: rows, error } = await pub()
      .from("blog_comments")
      .select("id, author_name, body, created_at")
      .eq("post_id", data.postId)
      .eq("approved", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const submitComment = createServerFn({ method: "POST" })
  .inputValidator((d: { postId: string; authorName: string; authorEmail?: string; body: string }) =>
    z.object({
      postId: z.string().uuid(),
      authorName: z.string().trim().min(1).max(80),
      authorEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
      body: z.string().trim().min(2).max(2000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    // Check moderation setting
    const { data: settings } = await pub().from("site_settings").select("blog_comments_enabled, blog_comments_moderation").eq("id", "default").maybeSingle();
    if (settings && settings.blog_comments_enabled === false) throw new Error("Comments are disabled");
    const approved = !(settings?.blog_comments_moderation ?? true);
    const { error } = await pub().from("blog_comments").insert({
      post_id: data.postId,
      author_name: data.authorName,
      author_email: data.authorEmail || null,
      body: data.body,
      approved,
    });
    if (error) throw error;
    return { ok: true, approved };
  });

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  await assertAdminUser(context.supabase, context.userId);
}

export const adminListComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("blog_comments")
      .select("id, post_id, author_name, author_email, body, approved, created_at, blog_posts(title, slug)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminSetCommentApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; approved: boolean }) => z.object({ id: z.string().uuid(), approved: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blog_comments").update({ approved: data.approved }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blog_comments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
