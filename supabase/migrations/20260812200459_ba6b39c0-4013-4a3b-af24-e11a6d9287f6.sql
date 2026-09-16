ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS tax_origin_state text NOT NULL DEFAULT 'Maharashtra';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tax numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_detail jsonb NOT NULL DEFAULT '{}'::jsonb;