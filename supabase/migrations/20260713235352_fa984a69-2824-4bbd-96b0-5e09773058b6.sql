
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  default_gateway TEXT NOT NULL DEFAULT 'razorpay',
  currency TEXT NOT NULL DEFAULT 'INR',

  stripe_enabled BOOLEAN NOT NULL DEFAULT false,
  stripe_mode TEXT NOT NULL DEFAULT 'test',
  stripe_publishable_key TEXT DEFAULT '',
  stripe_secret_key TEXT DEFAULT '',
  stripe_webhook_secret TEXT DEFAULT '',

  razorpay_enabled BOOLEAN NOT NULL DEFAULT false,
  razorpay_mode TEXT NOT NULL DEFAULT 'test',
  razorpay_key_id TEXT DEFAULT '',
  razorpay_key_secret TEXT DEFAULT '',
  razorpay_webhook_secret TEXT DEFAULT '',

  cashfree_enabled BOOLEAN NOT NULL DEFAULT false,
  cashfree_mode TEXT NOT NULL DEFAULT 'test',
  cashfree_app_id TEXT DEFAULT '',
  cashfree_secret_key TEXT DEFAULT '',
  cashfree_webhook_secret TEXT DEFAULT '',

  paypal_enabled BOOLEAN NOT NULL DEFAULT false,
  paypal_mode TEXT NOT NULL DEFAULT 'sandbox',
  paypal_client_id TEXT DEFAULT '',
  paypal_client_secret TEXT DEFAULT '',
  paypal_webhook_id TEXT DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_settings_single CHECK (id = 'default')
);

GRANT SELECT, INSERT, UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read payment settings" ON public.payment_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert payment settings" ON public.payment_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payment settings" ON public.payment_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_payment_settings BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

INSERT INTO public.payment_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;
