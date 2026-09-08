import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";
import type { FooterConfig } from "@/lib/footer-config";
import type { MegaMenuConfig } from "@/lib/mega-menu-config";
import type { CurrencyRow } from "@/lib/currency";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type EmailTemplate = { subject: string; body: string };
export type EmailTemplatesMap = Record<string, EmailTemplate>;
export type HeaderMenuItem = { label: string; to: string; mega?: boolean };
export type HomepageSection = { eyebrow: string; title: string; subtitle: string; product_ids: string[] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StudioSectionRow = { id: string; type: string; visible: boolean; props: Record<string, any> };
export type HomepageConfig = { new_arrivals: HomepageSection; best_sellers: HomepageSection; sections?: StudioSectionRow[] };

export type SiteSettings = {
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_message: string;
  ai_chat_enabled: boolean;
  ai_chat_persona: string;
  ai_chat_model: string;
  social_share_enabled: boolean;
  share_instagram: boolean;
  share_facebook: boolean;
  share_twitter: boolean;
  share_email: boolean;
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  blog_share_enabled: boolean;
  blog_comments_enabled: boolean;
  blog_comments_moderation: boolean;
  default_country: string;
  default_currency: string;
  currency_symbol: string;
  currencies?: CurrencyRow[];
  tax_enabled: boolean;
  tax_label: string;
  tax_rate: number;
  tax_inclusive: boolean;
  tax_origin_state?: string;
  maintenance_enabled?: boolean;
  maintenance_title?: string;
  maintenance_message?: string;
  maintenance_eta?: string;
  maintenance_image?: string;
  ring_size_guide_enabled: boolean;
  ring_size_guide_image: string;
  ring_size_guide_note: string;
  email_templates: EmailTemplatesMap;
  head_scripts: string;
  body_scripts: string;
  shipping_enabled: boolean;
  shipping_flat_rate: number;
  free_shipping_threshold: number;
  cod_enabled: boolean;
  cod_fee: number;
  cod_min_order: number;
  cod_max_order: number;
  shiprocket_enabled: boolean;
  shiprocket_email: string;
  shiprocket_password: string;
  shiprocket_pickup_location: string;
  shiprocket_channel_id: string;
  shiprocket_pickup_pincode: string;
  header_menu: HeaderMenuItem[];
  footer_menu?: FooterConfig;
  mega_menu?: MegaMenuConfig;
  homepage?: HomepageConfig;
};


// Columns safe to expose publicly. Credentials (shiprocket_*) and email
// templates are never returned to unauthenticated callers.
const PUBLIC_SETTINGS_COLUMNS = [
  "id",
  "whatsapp_enabled", "whatsapp_number", "whatsapp_message",
  "ai_chat_enabled", "ai_chat_persona", "ai_chat_model",
  "social_share_enabled", "share_instagram", "share_facebook", "share_twitter", "share_email",
  "instagram_url", "facebook_url", "twitter_url",
  "blog_share_enabled", "blog_comments_enabled", "blog_comments_moderation",
  "default_country", "default_currency", "currency_symbol", "currencies",
  "tax_enabled", "tax_label", "tax_rate", "tax_inclusive", "tax_origin_state",
  "head_scripts", "body_scripts",
  "ring_size_guide_enabled", "ring_size_guide_image", "ring_size_guide_note",
  "maintenance_enabled", "maintenance_title", "maintenance_message", "maintenance_eta", "maintenance_image",
  "shipping_enabled", "shipping_flat_rate", "free_shipping_threshold",
  "cod_enabled", "cod_fee", "cod_min_order", "cod_max_order",
  "header_menu", "homepage", "footer_menu", "mega_menu",
].join(",");

export type PublicSiteSettings = Omit<
  SiteSettings,
  "email_templates" | "shiprocket_enabled" | "shiprocket_email" | "shiprocket_password" | "shiprocket_pickup_location" | "shiprocket_channel_id" | "shiprocket_pickup_pincode"
> & { id: string };

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub().from("site_settings").select(PUBLIC_SETTINGS_COLUMNS).eq("id", "default").maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as PublicSiteSettings | null;
});

export const getAdminSiteSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("site_settings").select("*").eq("id", "default").maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as (SiteSettings & { id: string }) | null;
  });

export const getPublicCurrencies = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub().from("site_settings").select("currencies").eq("id", "default").maybeSingle();
  if (error) throw error;
  return ((data?.currencies ?? []) as unknown) as CurrencyRow[];
});

// Exchange rates are no longer written directly. Every change goes through the
// review queue in src/lib/currency-proposals.functions.ts and is published only
// when a second administrator approves it.

export const getPublicSiteScripts = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await pub().from("site_settings").select("head_scripts,body_scripts").eq("id", "default").maybeSingle();
  return { head_scripts: (data?.head_scripts as string) ?? "", body_scripts: (data?.body_scripts as string) ?? "" };
});

const emailTemplateSchema = z.object({ subject: z.string(), body: z.string() });
const settingsPayload = z.object({
  whatsapp_enabled: z.boolean(),
  whatsapp_number: z.string(),
  whatsapp_message: z.string(),
  ai_chat_enabled: z.boolean(),
  ai_chat_persona: z.string(),
  ai_chat_model: z.string(),
  social_share_enabled: z.boolean(),
  share_instagram: z.boolean(),
  share_facebook: z.boolean(),
  share_twitter: z.boolean(),
  share_email: z.boolean(),
  instagram_url: z.string(),
  facebook_url: z.string(),
  twitter_url: z.string(),
  blog_share_enabled: z.boolean(),
  blog_comments_enabled: z.boolean(),
  blog_comments_moderation: z.boolean(),
  default_country: z.string(),
  default_currency: z.string(),
  currency_symbol: z.string(),
  currencies: z.array(z.object({
    country: z.string(),
    country_code: z.string(),
    code: z.string(),
    symbol: z.string(),
    rate: z.number().positive(),
    rounding: z.enum(["none", "nearest_1", "nearest_5", "ending_99"]),
    enabled: z.boolean(),
  })).optional(),
  tax_enabled: z.boolean(),
  tax_label: z.string(),
  tax_rate: z.number().min(0).max(100),
  tax_inclusive: z.boolean(),
  tax_origin_state: z.string().optional(),
  maintenance_enabled: z.boolean().optional(),
  maintenance_title: z.string().optional(),
  maintenance_message: z.string().optional(),
  maintenance_eta: z.string().optional(),
  maintenance_image: z.string().optional(),
  ring_size_guide_enabled: z.boolean(),
  ring_size_guide_image: z.string(),
  ring_size_guide_note: z.string(),
  email_templates: z.record(z.string(), emailTemplateSchema),
  head_scripts: z.string(),
  body_scripts: z.string(),
  shipping_enabled: z.boolean(),
  shipping_flat_rate: z.number().min(0),
  free_shipping_threshold: z.number().min(0),
  cod_enabled: z.boolean(),
  cod_fee: z.number().min(0),
  cod_min_order: z.number().min(0),
  cod_max_order: z.number().min(0),
  shiprocket_enabled: z.boolean(),
  shiprocket_email: z.string(),
  shiprocket_password: z.string(),
  shiprocket_pickup_location: z.string(),
  shiprocket_channel_id: z.string(),
  shiprocket_pickup_pincode: z.string(),
  header_menu: z.array(z.object({ label: z.string(), to: z.string(), mega: z.boolean().optional() })),
  footer_menu: z.record(z.string(), z.any()).optional(),
  mega_menu: z.record(z.string(), z.any()).optional(),
  homepage: z.object({
    new_arrivals: z.object({ eyebrow: z.string(), title: z.string(), subtitle: z.string(), product_ids: z.array(z.string()) }),
    best_sellers: z.object({ eyebrow: z.string(), title: z.string(), subtitle: z.string(), product_ids: z.array(z.string()) }),
    sections: z.array(z.object({
      id: z.string(),
      type: z.string(),
      visible: z.boolean(),
      props: z.record(z.string(), z.any()),
    })).optional(),
  }).optional(),
});


export const adminUpdateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof settingsPayload>) => settingsPayload.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_settings")// eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ id: "default", ...data } as any);
    if (error) throw error;
    return { ok: true };
  });

const navPayload = z.object({
  header_menu: z.array(z.object({ label: z.string().min(1), to: z.string().min(1), mega: z.boolean().optional() })),
  footer_menu: z.record(z.string(), z.any()),
  mega_menu: z.record(z.string(), z.any()).optional(),
});

export const adminUpdateNavigation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof navPayload>) => navPayload.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ id: "default", header_menu: data.header_menu, footer_menu: data.footer_menu, ...(data.mega_menu ? { mega_menu: data.mega_menu } : {}) } as any);
    if (error) throw error;
    return { ok: true };
  });
