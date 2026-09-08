GRANT SELECT (
  id,
  whatsapp_enabled, whatsapp_number, whatsapp_message,
  ai_chat_enabled, ai_chat_persona, ai_chat_model,
  social_share_enabled, share_instagram, share_facebook, share_twitter, share_email,
  instagram_url, facebook_url, twitter_url,
  blog_share_enabled, blog_comments_enabled, blog_comments_moderation,
  default_country, default_currency, currency_symbol,
  tax_enabled, tax_label, tax_rate, tax_inclusive, tax_origin_state,
  head_scripts, body_scripts,
  shipping_enabled, shipping_flat_rate, free_shipping_threshold,
  cod_enabled, cod_fee, cod_min_order, cod_max_order,
  header_menu, homepage, footer_menu,
  created_at, updated_at
) ON public.site_settings TO anon, authenticated;

GRANT ALL ON public.site_settings TO service_role;