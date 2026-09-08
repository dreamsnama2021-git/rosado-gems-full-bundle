ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS component text,
  ADD COLUMN IF NOT EXISTS plating text;