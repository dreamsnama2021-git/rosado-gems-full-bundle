ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS payoneer_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payoneer_mode text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS payoneer_merchant_code text,
  ADD COLUMN IF NOT EXISTS payoneer_api_key text,
  ADD COLUMN IF NOT EXISTS payoneer_division text,
  ADD COLUMN IF NOT EXISTS payoneer_webhook_secret text;