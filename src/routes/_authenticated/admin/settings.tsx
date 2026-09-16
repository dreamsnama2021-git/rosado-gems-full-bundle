import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getAdminSiteSettings, adminUpdateSiteSettings, type SiteSettings, type EmailTemplatesMap, type HeaderMenuItem } from "@/lib/site-settings.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { INDIAN_STATES } from "@/lib/tax";
import { CurrenciesPanel } from "@/components/admin/CurrenciesPanel";
import { SingleImageUpload } from "@/components/admin/ImageUpload";

const q = queryOptions({ queryKey: ["site-settings", "admin"], queryFn: () => getAdminSiteSettings() });

export const Route = createFileRoute("/_authenticated/admin/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: SettingsPage,
});

const COUNTRIES = [
  ["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"],
  ["AU", "Australia"], ["AE", "United Arab Emirates"], ["SG", "Singapore"], ["DE", "Germany"],
  ["FR", "France"], ["IT", "Italy"], ["ES", "Spain"], ["JP", "Japan"], ["NZ", "New Zealand"],
] as const;
const CURRENCIES = [
  ["INR", "₹", "Indian Rupee"], ["USD", "$", "US Dollar"], ["EUR", "€", "Euro"],
  ["GBP", "£", "British Pound"], ["AED", "د.إ", "UAE Dirham"], ["AUD", "A$", "Australian Dollar"],
  ["CAD", "C$", "Canadian Dollar"], ["SGD", "S$", "Singapore Dollar"], ["JPY", "¥", "Japanese Yen"],
] as const;
const TEMPLATE_KEYS: Array<{ key: string; label: string; hint: string }> = [
  { key: "order_confirmation", label: "Order Confirmation", hint: "Placeholders: {{name}}, {{order_id}}, {{total}}, {{currency}}" },
  { key: "shipping_notice",    label: "Shipping Notice",    hint: "Placeholders: {{name}}, {{order_id}}, {{tracking}}" },
  { key: "welcome",            label: "Welcome Email",      hint: "Placeholders: {{name}}" },
  { key: "password_reset",     label: "Password Reset",     hint: "Placeholders: {{name}}, {{reset_link}}" },
  { key: "contact_reply",      label: "Contact Auto-Reply", hint: "Placeholders: {{name}}" },
];

const DEFAULT_MENU: HeaderMenuItem[] = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "My Shop", to: "/collections", mega: true },
  { label: "Our Blog", to: "/blog" },
  { label: "Contact Us", to: "/contact" },
];

function SettingsPage() {
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
    tax_origin_state: initial?.tax_origin_state ?? "Maharashtra",
    maintenance_enabled: initial?.maintenance_enabled ?? false,
    maintenance_title: initial?.maintenance_title ?? "We are polishing something beautiful",
    maintenance_message: initial?.maintenance_message ?? "Our rosado is being refreshed. Rosado Gems will be back shortly with a new experience.",
    maintenance_eta: initial?.maintenance_eta ?? "",
    maintenance_image: initial?.maintenance_image ?? "",
    ring_size_guide_enabled: initial?.ring_size_guide_enabled ?? true,
    ring_size_guide_image: initial?.ring_size_guide_image ?? "",
    ring_size_guide_note: initial?.ring_size_guide_note ?? "",
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
    header_menu: (initial?.header_menu && initial.header_menu.length > 0) ? initial.header_menu : DEFAULT_MENU,
  }));
  const [saving, setSaving] = useState(false);

  function upd<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) { setF((p) => ({ ...p, [k]: v })); }
  function updTpl(key: string, field: "subject" | "body", v: string) {
    setF((p) => ({ ...p, email_templates: { ...p.email_templates, [key]: { subject: p.email_templates?.[key]?.subject ?? "", body: p.email_templates?.[key]?.body ?? "", [field]: v } } }));
  }

  async function save() {
    setSaving(true);
    try {
      await adminUpdateSiteSettings({ data: f });
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  const label = "text-xs uppercase tracking-[0.15em] text-muted-foreground";
  const inp = "w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:border-foreground";

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl mb-1">Site Settings</h1>
          <p className="text-sm text-muted-foreground">Configure store defaults, taxes, emails, chat, and scripts.</p>
        </div>
        <button onClick={save} disabled={saving} className="h-11 px-6 rounded-sm bg-foreground text-background text-sm uppercase tracking-[0.15em] disabled:opacity-50">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="ring-guide">Ring Guide</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="maintenance">Under Construction</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <h2 className="font-display text-xl">Store Defaults</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Default Country</label>
                <select className={inp} value={f.default_country} onChange={(e) => upd("default_country", e.target.value)}>
                  {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n} ({c})</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Default Currency</label>
                <select className={inp} value={f.default_currency} onChange={(e) => {
                  const found = CURRENCIES.find(([c]) => c === e.target.value);
                  setF((p) => ({ ...p, default_currency: e.target.value, currency_symbol: found?.[1] ?? p.currency_symbol }));
                }}>
                  {CURRENCIES.map(([c, s, n]) => <option key={c} value={c}>{n} — {s} ({c})</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Currency Symbol</label>
                <input className={inp} value={f.currency_symbol} onChange={(e) => upd("currency_symbol", e.target.value)} />
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="maintenance">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Under Construction Mode</h2>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.maintenance_enabled} onChange={(e) => upd("maintenance_enabled", e.target.checked)} /> Enabled</label>
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, visitors see a styled under-construction page. Signed-in administrators keep full access to the storefront and this control panel.
            </p>
            <div><label className={label}>Headline</label>
              <input className={inp} value={f.maintenance_title ?? ""} onChange={(e) => upd("maintenance_title", e.target.value)} />
            </div>
            <div><label className={label}>Message</label>
              <textarea rows={3} className={`${inp} h-auto py-2`} value={f.maintenance_message ?? ""} onChange={(e) => upd("maintenance_message", e.target.value)} />
            </div>
            <div><label className={label}>Badge / Expected return (optional)</label>
              <input className={inp} placeholder="Back on 1 September" value={f.maintenance_eta ?? ""} onChange={(e) => upd("maintenance_eta", e.target.value)} />
            </div>
            <div><label className={label}>Background image (optional)</label>
              <SingleImageUpload value={f.maintenance_image ?? ""} onChange={(v) => upd("maintenance_image", v)} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="currencies">
          <CurrenciesPanel initial={(initial as unknown as { currencies?: unknown })?.currencies} />
        </TabsContent>

        <TabsContent value="taxes">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Taxes</h2>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.tax_enabled} onChange={(e) => upd("tax_enabled", e.target.checked)} /> Enabled</label>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={label}>Tax Label</label>
                <input className={inp} placeholder="GST / VAT / Sales Tax" value={f.tax_label} onChange={(e) => upd("tax_label", e.target.value)} />
              </div>
              <div>
                <label className={label}>Tax Rate (%)</label>
                <input type="number" step="0.001" min="0" max="100" className={inp} value={f.tax_rate} onChange={(e) => upd("tax_rate", Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className={label}>Price Setting</label>
                <select className={inp} value={f.tax_inclusive ? "inclusive" : "exclusive"} onChange={(e) => upd("tax_inclusive", e.target.value === "inclusive")}>
                  <option value="exclusive">Exclusive of taxes (added at checkout)</option>
                  <option value="inclusive">Inclusive of taxes (already in price)</option>
                </select>
              </div>
              <div>
                <label className={label}>Home / Origin State (India)</label>
                <select className={inp} value={f.tax_origin_state ?? "Maharashtra"} onChange={(e) => upd("tax_origin_state", e.target.value)}>
                  {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, checkout applies {f.tax_rate}% {f.tax_label} {f.tax_inclusive ? "(inclusive of price)" : "(added to totals)"} for orders shipping to India.
              Orders within <strong>{f.tax_origin_state ?? "Maharashtra"}</strong> are split into CGST + SGST; any other Indian state is charged IGST at the full rate.
            </p>
          </section>
        </TabsContent>

        <TabsContent value="emails">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <h2 className="font-display text-xl">Email Templates</h2>
            <p className="text-xs text-muted-foreground">Edit the subject and body for automated store emails. Use double-curly placeholders (e.g. <code>{`{{name}}`}</code>).</p>
            <div className="space-y-6">
              {TEMPLATE_KEYS.map((t) => {
                const tpl = f.email_templates?.[t.key] ?? { subject: "", body: "" };
                return (
                  <div key={t.key} className="border border-border rounded-sm p-4 space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-medium text-sm">{t.label}</h3>
                      <span className="text-[11px] text-muted-foreground">{t.hint}</span>
                    </div>
                    <div>
                      <label className={label}>Subject</label>
                      <input className={inp} value={tpl.subject} onChange={(e) => updTpl(t.key, "subject", e.target.value)} />
                    </div>
                    <div>
                      <label className={label}>Body</label>
                      <textarea rows={6} className={`${inp} h-auto py-2 font-mono text-xs`} value={tpl.body} onChange={(e) => updTpl(t.key, "body", e.target.value)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="chat">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">AI Chat Assistant</h2>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.ai_chat_enabled} onChange={(e) => upd("ai_chat_enabled", e.target.checked)} /> Enabled</label>
            </div>
            <div><label className={label}>Model</label>
              <select className={inp} value={f.ai_chat_model} onChange={(e) => upd("ai_chat_model", e.target.value)}>
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (fast, recommended)</option>
                <option value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (cheapest)</option>
                <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (highest quality)</option>
              </select>
            </div>
            <div><label className={label}>Persona / System Prompt</label>
              <textarea rows={5} className={`${inp} h-auto py-2`} value={f.ai_chat_persona} onChange={(e) => upd("ai_chat_persona", e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Product catalog and categories are appended automatically.</p>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="whatsapp">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">WhatsApp</h2>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.whatsapp_enabled} onChange={(e) => upd("whatsapp_enabled", e.target.checked)} /> Enabled</label>
            </div>
            <div><label className={label}>WhatsApp Number (with country code, digits only)</label>
              <input className={inp} placeholder="919876543210" value={f.whatsapp_number} onChange={(e) => upd("whatsapp_number", e.target.value)} />
            </div>
            <div><label className={label}>Default Message</label>
              <textarea rows={2} className={`${inp} h-auto py-2`} value={f.whatsapp_message} onChange={(e) => upd("whatsapp_message", e.target.value)} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="social">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Social Share Icons</h2>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.social_share_enabled} onChange={(e) => upd("social_share_enabled", e.target.checked)} /> Show share menu</label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={f.share_instagram} onChange={(e) => upd("share_instagram", e.target.checked)} /> Instagram</label>
                <input className={inp} placeholder="https://instagram.com/…" value={f.instagram_url} onChange={(e) => upd("instagram_url", e.target.value)} />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={f.share_facebook} onChange={(e) => upd("share_facebook", e.target.checked)} /> Facebook</label>
                <input className={inp} placeholder="https://facebook.com/…" value={f.facebook_url} onChange={(e) => upd("facebook_url", e.target.value)} />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={f.share_twitter} onChange={(e) => upd("share_twitter", e.target.checked)} /> X (Twitter)</label>
                <input className={inp} placeholder="https://twitter.com/…" value={f.twitter_url} onChange={(e) => upd("twitter_url", e.target.value)} />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={f.share_email} onChange={(e) => upd("share_email", e.target.checked)} /> Email</label>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="blog">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <h2 className="font-display text-xl">Blog</h2>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.blog_share_enabled} onChange={(e) => upd("blog_share_enabled", e.target.checked)} /> Show share bar on blog posts</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.blog_comments_enabled} onChange={(e) => upd("blog_comments_enabled", e.target.checked)} /> Enable comments</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.blog_comments_moderation} onChange={(e) => upd("blog_comments_moderation", e.target.checked)} /> Require admin approval before publishing comments</label>
          </section>
        </TabsContent>

        <TabsContent value="ring-guide">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl">Ring Size Guide</h2>
                <p className="text-sm text-muted-foreground">Shown as a “Ring size guide” link on every ring product page.</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.ring_size_guide_enabled} onChange={(e) => upd("ring_size_guide_enabled", e.target.checked)} />
                Enabled
              </label>
            </div>
            <div>
              <label className={label}>Ring size chart image</label>
              <div className="mt-2 max-w-md">
                <SingleImageUpload value={f.ring_size_guide_image} onChange={(url) => upd("ring_size_guide_image", url)} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Leave empty to show the built-in Indian ring size table instead.</p>
            </div>
            <div>
              <label className={label}>Helper note (optional)</label>
              <textarea className={inp + " h-24 py-2"} value={f.ring_size_guide_note} onChange={(e) => upd("ring_size_guide_note", e.target.value)} placeholder="How to measure, sizing policy, etc." />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="scripts">
          <section className="space-y-4 border border-border rounded-sm p-6">
            <h2 className="font-display text-xl">Header & Footer Scripts</h2>
            <p className="text-xs text-muted-foreground">
              Paste raw HTML snippets (e.g. Google Analytics / Tag Manager, Facebook Pixel, Search Console verification).
              Header scripts inject into <code>&lt;head&gt;</code>. Footer scripts inject at the end of <code>&lt;body&gt;</code>.
              Only paste code from trusted sources — it runs on every page.
            </p>
            <div>
              <label className={label}>Header scripts (in &lt;head&gt;)</label>
              <textarea rows={8} spellCheck={false} className={`${inp} h-auto py-2 font-mono text-xs`}
                value={f.head_scripts} onChange={(e) => upd("head_scripts", e.target.value)} />
            </div>
            <div>
              <label className={label}>Footer scripts (end of &lt;body&gt;)</label>
              <textarea rows={6} spellCheck={false} className={`${inp} h-auto py-2 font-mono text-xs`}
                value={f.body_scripts} onChange={(e) => upd("body_scripts", e.target.value)} />
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="h-11 px-6 rounded-sm bg-foreground text-background text-sm uppercase tracking-[0.15em] disabled:opacity-50">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}

