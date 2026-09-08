ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS maintenance_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_title text NOT NULL DEFAULT 'We are polishing something beautiful',
  ADD COLUMN IF NOT EXISTS maintenance_message text NOT NULL DEFAULT 'Our atelier is being refreshed. Rosado Gems will be back shortly with a new experience.',
  ADD COLUMN IF NOT EXISTS maintenance_eta text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS maintenance_image text NOT NULL DEFAULT '';

GRANT SELECT (maintenance_enabled, maintenance_title, maintenance_message, maintenance_eta, maintenance_image) ON public.site_settings TO anon, authenticated;