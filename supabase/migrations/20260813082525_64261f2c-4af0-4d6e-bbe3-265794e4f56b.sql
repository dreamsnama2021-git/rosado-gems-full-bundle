ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ring_size_guide_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ring_size_guide_image text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ring_size_guide_note text NOT NULL DEFAULT '';

GRANT SELECT (ring_size_guide_enabled, ring_size_guide_image, ring_size_guide_note) ON public.site_settings TO anon, authenticated;