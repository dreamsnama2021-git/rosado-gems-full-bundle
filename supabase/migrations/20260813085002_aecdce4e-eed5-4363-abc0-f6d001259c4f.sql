ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.products.price_overrides IS
  'Optional per-currency price overrides, e.g. {"USD": 149, "AED": 540}. Amounts are in that currency. Empty = convert from the INR price.';