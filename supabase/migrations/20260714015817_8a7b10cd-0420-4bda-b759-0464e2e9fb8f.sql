
-- Pages CMS table
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  cover_image TEXT,
  meta_title TEXT,
  meta_description TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published pages"
  ON public.pages FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage pages"
  ON public.pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Categories: add rich long description
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description_html TEXT;

-- Storage RLS for admin-media bucket
CREATE POLICY "Anyone can read admin-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'admin-media');

CREATE POLICY "Admins can upload to admin-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin-media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'admin-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin-media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-media' AND public.has_role(auth.uid(), 'admin'));
