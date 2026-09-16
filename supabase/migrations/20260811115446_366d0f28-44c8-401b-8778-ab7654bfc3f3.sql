ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS footer_menu jsonb NOT NULL DEFAULT '{}'::jsonb;