import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getAdminSiteSettings, adminUpdateSiteSettings, type SiteSettings, type EmailTemplatesMap } from "@/lib/site-settings.functions";

const q = queryOptions({ queryKey: ["site-settings", "admin"], queryFn: () => getAdminSiteSettings() });

export const Route = createFileRoute("/_authenticated/admin/shipping")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: ShippingPage,
});

function ShippingPage() {
  const initial = useSuspenseQuery(q).data;
  const qc = useQueryClient();


  const [f, setF] = useState<SiteSettings>(() => ({
    whatsapp_enabled: initial?.whatsapp_enabled ?? true,
    whatsapp_number: initial?.whatsapp_number ?? "",
    whatsapp_message: initial?.whatsapp_message ?? "",
    ai_chat_enabled: initial?.ai_chat_enabled ?? true,
    ai_chat_persona: initial?.ai_chat_persona ?? "",
    ai_chat_model: initial?.ai_chat_model ?? "google/gemini-2.5-flash",
    social_share_enabled: initial?.social_share_enabled ?? true,
    share_instagram: initial?.share_instagram ?? true,
    share_facebook: initial?.share_facebook ?? true,
    share_twitter: initial?.share_twitter ?? true,
    share_email: initial?.share_email ?? true,
    instagram_url: initial?.instagram_url ?? "",
    facebook_url: initial?.facebook_url ?? "",
    twitter_url: initial?.twitter_url ?? "",
    blog_share_enabled: initial?.blog_share_enabled ?? true,
    blog_comments_enabled: initial?.blog_comments_enabled ?? true,
    blog_comments_moderation: initial?.blog_comments_moderation ?? true,
    default_country: initial?.default_country ?? "IN",
    default_currency: initial?.default_currency ?? "INR",
    currency_symbol: initial?.currency_symbol ?? "₹",
    tax_enabled: initial?.tax_enabled ?? false,
    tax_label: initial?.tax_label ?? "GST",
    tax_rate: Number(initial?.tax_rate ?? 0),
    tax_inclusive: initial?.tax_inclusive ?? false,
    email_templates: (initial?.email_templates as EmailTemplatesMap) ?? {},
    head_scripts: initial?.head_scripts ?? "",
    body_scripts: initial?.body_scripts ?? "",
    shipping_enabled: initial?.shipping_enabled ?? true,
    shipping_flat_rate: Number(initial?.shipping_flat_rate ?? 500),
    free_shipping_threshold: Number(initial?.free_shipping_threshold ?? 25000),
    cod_enabled: initial?.cod_enabled ?? true,
    cod_fee: Number(initial?.cod_fee ?? 0),
    cod_min_order: Number(initial?.cod_min_order ?? 0),
    cod_max_order: Number(initial?.cod_max_order ?? 50000),
    shiprocket_enabled: initial?.shiprocket_enabled ?? false,
    shiprocket_email: initial?.shiprocket_email ?? "",
    shiprocket_password: initial?.shiprocket_password ?? "",
    shiprocket_pickup_location: initial?.shiprocket_pickup_location ?? "Primary",
    shiprocket_channel_id: initial?.shiprocket_channel_id ?? "",
    shiprocket_pickup_pincode: initial?.shiprocket_pickup_pincode ?? "",
    header_menu: initial?.header_menu ?? [],
    ring_size_guide_enabled: initial?.ring_size_guide_enabled ?? true,
    ring_size_guide_image: initial?.ring_size_guide_image ?? "",
    ring_size_guide_note: initial?.ring_size_guide_note ?? "",
  }));

  const [saving, setSaving] = useState(false);

  function upd<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) { setF((p) => ({ ...p, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await adminUpdateSiteSettings({ data: f });
      toast.success("Shipping settings saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }


  const label = "text-xs uppercase tracking-[0.15em] text-muted-foreground";
  const inp = "w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:border-foreground";

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className="font-display text-3xl mb-1">Shipping & Logistics</h1>
        <p className="text-sm text-muted-foreground">Set shipping charges, enable Cash on Delivery, and connect Shiprocket for fulfilment.</p>
      </div>

      <section className="space-y-4 border border-border rounded-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Shipping Charges</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.shipping_enabled} onChange={(e) => upd("shipping_enabled", e.target.checked)} /> Charge shipping</label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Flat shipping rate ({f.currency_symbol})</label>
            <input type="number" min="0" step="1" className={inp} value={f.shipping_flat_rate} onChange={(e) => upd("shipping_flat_rate", Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className={label}>Free shipping above ({f.currency_symbol})</label>
            <input type="number" min="0" step="1" className={inp} value={f.free_shipping_threshold} onChange={(e) => upd("free_shipping_threshold", Number(e.target.value) || 0)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Orders above the threshold ship free. Set threshold to 0 to disable free shipping.</p>
      </section>

      <section className="space-y-4 border border-border rounded-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Cash on Delivery (COD)</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.cod_enabled} onChange={(e) => upd("cod_enabled", e.target.checked)} /> Allow COD at checkout</label>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Extra COD fee ({f.currency_symbol})</label>
            <input type="number" min="0" step="1" className={inp} value={f.cod_fee} onChange={(e) => upd("cod_fee", Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className={label}>Min order for COD ({f.currency_symbol})</label>
            <input type="number" min="0" step="1" className={inp} value={f.cod_min_order} onChange={(e) => upd("cod_min_order", Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className={label}>Max order for COD ({f.currency_symbol})</label>
            <input type="number" min="0" step="1" className={inp} value={f.cod_max_order} onChange={(e) => upd("cod_max_order", Number(e.target.value) || 0)} />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="h-11 px-6 rounded-sm bg-foreground text-background text-sm uppercase tracking-[0.15em] disabled:opacity-50">
          {saving ? "Saving…" : "Save shipping settings"}
        </button>
      </div>
    </div>
  );
}

