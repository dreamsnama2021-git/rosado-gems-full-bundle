
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_number TEXT DEFAULT '',
  whatsapp_message TEXT DEFAULT 'Hello Rosado Gems, I have a question about your jewelry.',
  ai_chat_enabled BOOLEAN NOT NULL DEFAULT true,
  ai_chat_persona TEXT DEFAULT 'You are Rose, a warm and knowledgeable shopping assistant for Rosado Gems (Mumbai). Help visitors discover jewelry, answer product questions, and share care/shipping info. Keep replies concise and friendly.',
  ai_chat_model TEXT DEFAULT 'google/gemini-2.5-flash',
  social_share_enabled BOOLEAN NOT NULL DEFAULT true,
  share_instagram BOOLEAN NOT NULL DEFAULT true,
  share_facebook BOOLEAN NOT NULL DEFAULT true,
  share_twitter BOOLEAN NOT NULL DEFAULT true,
  share_email BOOLEAN NOT NULL DEFAULT true,
  instagram_url TEXT DEFAULT 'https://instagram.com/rosadogems',
  facebook_url TEXT DEFAULT 'https://facebook.com/rosadogems',
  twitter_url TEXT DEFAULT 'https://twitter.com/rosadogems',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_single CHECK (id = 'default')
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_site_settings BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

INSERT INTO public.site_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;
