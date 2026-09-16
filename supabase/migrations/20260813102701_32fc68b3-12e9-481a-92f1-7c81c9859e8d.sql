ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS mega_menu jsonb NOT NULL DEFAULT '{}'::jsonb;
GRANT SELECT (mega_menu) ON public.site_settings TO anon, authenticated;