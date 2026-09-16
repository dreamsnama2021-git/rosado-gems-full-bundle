-- 1) Column-level lockdown of site_settings: hide credentials/templates from public reads
REVOKE SELECT ON public.site_settings FROM anon, authenticated;

GRANT SELECT (
  id, whatsapp_enabled, whatsapp_number, whatsapp_message,
  ai_chat_enabled, ai_chat_persona, ai_chat_model,
  social_share_enabled, share_instagram, share_facebook, share_twitter, share_email,
  instagram_url, facebook_url, twitter_url, created_at, updated_at,
  blog_share_enabled, blog_comments_enabled, blog_comments_moderation,
  default_country, default_currency, currency_symbol,
  tax_enabled, tax_label, tax_rate, tax_inclusive,
  head_scripts, body_scripts,
  shipping_enabled, shipping_flat_rate, free_shipping_threshold,
  cod_enabled, cod_fee, cod_min_order, cod_max_order,
  header_menu, homepage, footer_menu
) ON public.site_settings TO anon, authenticated;

GRANT ALL ON public.site_settings TO service_role;

-- 2) SECURITY DEFINER function must not be directly callable by API roles.
-- Existing RLS policies keep working (policy expressions are parsed as their owner).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO postgres, service_role;