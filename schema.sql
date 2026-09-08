
-- Categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  hero_image TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  sku TEXT,
  stock INT NOT NULL DEFAULT 10,
  gemstone TEXT,
  cut TEXT,
  carat NUMERIC(6,2),
  clarity TEXT,
  metal TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_new BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE INDEX products_category_idx ON public.products(category_id);

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  contact_name TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT WITH CHECK (true);

-- Contact messages
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a contact message" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Newsletter
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Blog posts
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  body TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Rosado Gems',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blog posts are viewable by everyone" ON public.blog_posts FOR SELECT USING (true);

UPDATE public.blog_posts SET cover_image='/__l5e/assets-v1/516cd49c-d687-4332-9c24-406f3334aba5/blog-atelier-ring.jpg' WHERE slug='inside-the-atelier';
UPDATE public.blog_posts SET cover_image='/__l5e/assets-v1/9ec336b9-311a-45a2-8ef4-ae70709d1cc6/blog-diamond-set.jpg' WHERE slug='caring-for-fine-jewelry';
UPDATE public.blog_posts SET cover_image='/__l5e/assets-v1/b6fef264-abd4-433c-83e0-7809edeea2d7/blog-bridal-earrings.jpg' WHERE slug='bridal-collection-2026';
UPDATE public.blog_posts SET cover_image='/__l5e/assets-v1/6bc71a45-b747-421f-a1b0-7aa3ab6dbc8d/blog-emerald-pendant.webp' WHERE slug='the-language-of-gemstones';

INSERT INTO public.blog_posts (slug, title, excerpt, cover_image, body, author, published_at) VALUES
('the-modern-gold-edit', 'The Modern Gold Edit', 'Sculptural silhouettes and warm gold tones — the pieces defining the season.',
 '/__l5e/assets-v1/6db3b0d8-c689-4a8f-8b94-6db21313d2f5/blog-gold-portrait.webp',
 'A closer look at our latest gold edit — bold hoops, signet rings and layered chains crafted for everyday wear with an editorial edge.',
 'Priya Rasoda', now()),
('the-art-of-stacking', 'The Art of Stacking', 'Delicate rings, layered chains — a guide to building a signature stack that lasts.',
 '/__l5e/assets-v1/cfc89b36-4163-46b0-8165-696042474926/blog-delicate-stack.webp',
 'Stacking is personal. We share our atelier’s rules for mixing metals, proportions and meaning into a jewelry story that is uniquely yours.',
 'Rosado Atelier', now());

UPDATE public.categories SET hero_image = '/__l5e/assets-v1/23bafa65-f151-447d-99e8-69030d17c864/rings.jpg' WHERE slug = 'rings';
UPDATE public.categories SET hero_image = '/__l5e/assets-v1/cbda2a11-18a7-4041-ab4f-996dd415bdc3/earrings.jpg' WHERE slug = 'earrings';
UPDATE public.categories SET hero_image = '/__l5e/assets-v1/4147cf6e-66b8-4ef8-9075-c7c755d81a0b/necklaces.jpg' WHERE slug = 'necklaces';
UPDATE public.categories SET hero_image = '/__l5e/assets-v1/3a8bd2ae-2c07-46e3-95be-c47235520217/bracelets.webp' WHERE slug = 'bracelets';

-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users see their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins see all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- WISHLIST
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlists
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ADDRESSES
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  name text NOT NULL,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text,
  pincode text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.addresses
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tg_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- SEO + updated_at on content tables
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER tg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER tg_blog_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER tg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER tg_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ADMIN policies (full manage)
CREATE POLICY "Admins manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage blog_posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read contact_messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete contact_messages" ON public.contact_messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read newsletter" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete newsletter" ON public.newsletter_subscribers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users see own orders by email match or user_id
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (contact_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Additional public grants (categories/products/blog already have SELECT policy)
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;

ALTER FUNCTION public.tg_touch_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

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

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS blog_share_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS blog_comments_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS blog_comments_moderation boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_email text,
  body text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_comments_post_id_idx ON public.blog_comments(post_id);

GRANT SELECT, INSERT ON public.blog_comments TO anon, authenticated;
GRANT UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT ALL ON public.blog_comments TO service_role;

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved comments are public"
  ON public.blog_comments FOR SELECT
  USING (approved = true);

CREATE POLICY "Admins can view all comments"
  ON public.blog_comments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit a comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update comments"
  ON public.blog_comments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete comments"
  ON public.blog_comments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER blog_comments_touch_updated_at
  BEFORE UPDATE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP POLICY IF EXISTS "Anyone can submit a comment" ON public.blog_comments;

CREATE POLICY "Anyone can submit a comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (
    approved = false
    AND (auth.uid() IS NULL OR auth.uid() = user_id)
  );

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
GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS default_country text NOT NULL DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS default_currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS currency_symbol text NOT NULL DEFAULT '₹',
  ADD COLUMN IF NOT EXISTS tax_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_label text NOT NULL DEFAULT 'GST',
  ADD COLUMN IF NOT EXISTS tax_rate numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_inclusive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_templates jsonb NOT NULL DEFAULT '{
    "order_confirmation": {"subject":"Your Rosado Gems order #{{order_id}}","body":"Hi {{name}},\n\nThank you for your order! We''ve received order #{{order_id}} totaling {{currency}}{{total}}.\n\nWe''ll email you again when it ships.\n\n— Rosado Gems"},
    "shipping_notice":    {"subject":"Your order #{{order_id}} has shipped","body":"Hi {{name}},\n\nGood news — your order #{{order_id}} is on its way. Tracking: {{tracking}}\n\n— Rosado Gems"},
    "welcome":            {"subject":"Welcome to Rosado Gems","body":"Hi {{name}},\n\nWelcome to Rosado Gems. Explore our latest collections and enjoy your journey with us.\n\n— Rosado Gems"},
    "password_reset":     {"subject":"Reset your Rosado Gems password","body":"Hi {{name}},\n\nUse the link below to reset your password:\n{{reset_link}}\n\nIf you didn''t request this, you can ignore this email.\n\n— Rosado Gems"},
    "contact_reply":      {"subject":"We received your message","body":"Hi {{name}},\n\nThanks for reaching out to Rosado Gems. Our team will get back to you shortly.\n\n— Rosado Gems"}
  }'::jsonb;
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS head_scripts TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS body_scripts TEXT NOT NULL DEFAULT '';
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS shipping_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shipping_flat_rate numeric(10,2) NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS free_shipping_threshold numeric(10,2) NOT NULL DEFAULT 25000,
  ADD COLUMN IF NOT EXISTS cod_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cod_fee numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cod_min_order numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cod_max_order numeric(10,2) NOT NULL DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS shiprocket_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shiprocket_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shiprocket_password text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shiprocket_pickup_location text NOT NULL DEFAULT 'Primary',
  ADD COLUMN IF NOT EXISTS shiprocket_channel_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shiprocket_pickup_pincode text NOT NULL DEFAULT '';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS cod_fee numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shiprocket_order_id text,
  ADD COLUMN IF NOT EXISTS shiprocket_shipment_id text,
  ADD COLUMN IF NOT EXISTS awb_code text,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_url text;

CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_html TEXT,
  hero_image TEXT,
  meta_title TEXT,
  meta_description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view blog categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog categories" ON public.blog_categories FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_blog_categories_updated_at BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS header_menu jsonb NOT NULL DEFAULT '[]'::jsonb;ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS homepage jsonb NOT NULL DEFAULT jsonb_build_object(
  'new_arrivals', jsonb_build_object('eyebrow','Just In','title','New Arrival','subtitle','','product_ids', '[]'::jsonb),
  'best_sellers', jsonb_build_object('eyebrow','Beloved','title','Best Sellers','subtitle','','product_ids', '[]'::jsonb)
);
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  length TEXT,
  metal TEXT,
  gemstone_color TEXT,
  color_hex TEXT,
  price NUMERIC,
  compare_at_price NUMERIC,
  sku TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product_id_idx ON public.product_variants(product_id);

GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants are viewable by everyone"
  ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can insert variants"
  ON public.product_variants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update variants"
  ON public.product_variants FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete variants"
  ON public.product_variants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ============ SEED DEFAULTS ============
-- Helper CTEs generate default variants per category type.
-- Skip products that already have variants.

WITH prods AS (
  SELECT p.id, p.price, p.compare_at_price, p.metal, p.gemstone, LOWER(COALESCE(c.slug, '')) AS cat
  FROM public.products p LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE NOT EXISTS (SELECT 1 FROM public.product_variants v WHERE v.product_id = p.id)
),
-- Metals per product (2-3 metal karat options)
metals AS (
  SELECT id, price, compare_at_price, gemstone, cat, m.metal_name, m.ord
  FROM prods, LATERAL (VALUES
    ('18K Yellow Gold', 1),
    ('18K Rose Gold', 2),
    ('18K White Gold', 3)
  ) AS m(metal_name, ord)
),
-- Ring sizes
ring_variants AS (
  SELECT id AS product_id,
         s.size, NULL::text AS length, m.metal_name AS metal, m.gemstone AS gemstone_color,
         NULL::text AS color_hex,
         m.price + (s.size_num - 7) * 500 AS price,
         m.compare_at_price,
         10 AS stock, ((m.ord - 1) * 10 + s.ord) AS sort_order
  FROM metals m,
       LATERAL (VALUES (6,'6',1),(7,'7',2),(8,'8',3),(9,'9',4),(10,'10',5)) AS s(size_num, size, ord)
  WHERE m.cat IN ('rings','ring')
),
-- Chain lengths for necklaces
necklace_variants AS (
  SELECT id AS product_id,
         NULL::text AS size, l.len AS length, m.metal_name AS metal, m.gemstone AS gemstone_color,
         NULL::text AS color_hex,
         m.price + l.delta AS price, m.compare_at_price,
         10 AS stock, ((m.ord - 1) * 10 + l.ord) AS sort_order
  FROM metals m,
       LATERAL (VALUES ('16"',0,1),('18"',1500,2),('20"',3000,3)) AS l(len, delta, ord)
  WHERE m.cat IN ('necklaces','necklace','pendants')
),
-- Bracelet / anklet lengths
wrist_variants AS (
  SELECT id AS product_id,
         NULL::text AS size, l.len AS length, m.metal_name AS metal, m.gemstone AS gemstone_color,
         NULL::text AS color_hex,
         m.price + l.delta AS price, m.compare_at_price,
         10 AS stock, ((m.ord - 1) * 10 + l.ord) AS sort_order
  FROM metals m,
       LATERAL (VALUES ('6.5"',0,1),('7"',800,2),('7.5"',1600,3)) AS l(len, delta, ord)
  WHERE m.cat IN ('bracelets','bracelet','anklets','anklet','bangles','bangle')
),
-- Earrings / brooches / other: metals only
metal_only_variants AS (
  SELECT id AS product_id,
         NULL::text AS size, NULL::text AS length, m.metal_name AS metal, m.gemstone AS gemstone_color,
         NULL::text AS color_hex,
         m.price AS price, m.compare_at_price,
         10 AS stock, m.ord AS sort_order
  FROM metals m
  WHERE m.cat NOT IN ('rings','ring','necklaces','necklace','pendants','bracelets','bracelet','anklets','anklet','bangles','bangle')
),
all_variants AS (
  SELECT * FROM ring_variants
  UNION ALL SELECT * FROM necklace_variants
  UNION ALL SELECT * FROM wrist_variants
  UNION ALL SELECT * FROM metal_only_variants
)
INSERT INTO public.product_variants
  (product_id, size, length, metal, gemstone_color, color_hex, price, compare_at_price, stock, sort_order)
SELECT
  product_id, size, length, metal, gemstone_color,
  CASE LOWER(COALESCE(gemstone_color,''))
    WHEN 'ruby' THEN '#9b1b30'
    WHEN 'emerald' THEN '#046a38'
    WHEN 'sapphire' THEN '#0f52ba'
    WHEN 'diamond' THEN '#e6e6e6'
    WHEN 'pearl' THEN '#f2ead6'
    WHEN 'topaz' THEN '#ffc87c'
    WHEN 'garnet' THEN '#733635'
    WHEN 'amethyst' THEN '#9966cc'
    WHEN 'citrine' THEN '#e4d00a'
    WHEN 'aquamarine' THEN '#7fffd4'
    WHEN 'onyx' THEN '#353839'
    WHEN 'turquoise' THEN '#30d5c8'
    ELSE '#c9a86a'
  END AS color_hex,
  price, compare_at_price, stock, sort_order
FROM all_variants;
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, category_id)
);

GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product categories are viewable by everyone"
ON public.product_categories FOR SELECT
USING (true);

CREATE POLICY "Admins manage product categories"
ON public.product_categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_product_categories_product ON public.product_categories(product_id);
CREATE INDEX idx_product_categories_category ON public.product_categories(category_id);

INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id FROM public.products WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS component text,
  ADD COLUMN IF NOT EXISTS plating text;ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS footer_menu jsonb NOT NULL DEFAULT '{}'::jsonb;-- 1) Column-level lockdown of site_settings: hide credentials/templates from public reads
REVOKE SELECT ON public.site_settings FROM anon, authenticated;

GRANT SELECT (
  id, whatsapp_enabled, whatsapp_number, whatsapp_message,
  ai_chat_enabled, ai_chat_persona, ai_chat_model,
  social_share_enabled, share_instagram, share_facebook, share_twitter, share_email,
  instagram_url, facebook_url, twitter_url, created_at, updated_at,
  blog_share_enabled, blog_comments_enabled, blog_comments_moderation,
  default_country, default_currency, currency_symbol,
  tax_enabled, tax_label, tax_rate, tax_inclusive,
  head_scripts, body_scripts,
  shipping_enabled, shipping_flat_rate, free_shipping_threshold,
  cod_enabled, cod_fee, cod_min_order, cod_max_order,
  header_menu, homepage, footer_menu
) ON public.site_settings TO anon, authenticated;

GRANT ALL ON public.site_settings TO service_role;

-- 2) SECURITY DEFINER function must not be directly callable by API roles.
-- Existing RLS policies keep working (policy expressions are parsed as their owner).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO postgres, service_role;GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;CREATE SCHEMA IF NOT EXISTS private;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;

GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS tax_origin_state text NOT NULL DEFAULT 'Maharashtra';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tax numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_detail jsonb NOT NULL DEFAULT '{}'::jsonb;GRANT SELECT (
  id,
  whatsapp_enabled, whatsapp_number, whatsapp_message,
  ai_chat_enabled, ai_chat_persona, ai_chat_model,
  social_share_enabled, share_instagram, share_facebook, share_twitter, share_email,
  instagram_url, facebook_url, twitter_url,
  blog_share_enabled, blog_comments_enabled, blog_comments_moderation,
  default_country, default_currency, currency_symbol,
  tax_enabled, tax_label, tax_rate, tax_inclusive, tax_origin_state,
  head_scripts, body_scripts,
  shipping_enabled, shipping_flat_rate, free_shipping_threshold,
  cod_enabled, cod_fee, cod_min_order, cod_max_order,
  header_menu, homepage, footer_menu,
  created_at, updated_at
) ON public.site_settings TO anon, authenticated;

GRANT ALL ON public.site_settings TO service_role;ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS sections jsonb NOT NULL DEFAULT '[]'::jsonb;ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS currencies jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.site_settings
SET currencies = '[
  {"country":"India","country_code":"IN","code":"INR","symbol":"₹","rate":1,"rounding":"none","enabled":true},
  {"country":"United States","country_code":"US","code":"USD","symbol":"$","rate":0.012,"rounding":"nearest_1","enabled":true},
  {"country":"United Kingdom","country_code":"GB","code":"GBP","symbol":"£","rate":0.0094,"rounding":"nearest_1","enabled":true},
  {"country":"European Union","country_code":"EU","code":"EUR","symbol":"€","rate":0.011,"rounding":"nearest_1","enabled":true},
  {"country":"United Arab Emirates","country_code":"AE","code":"AED","symbol":"د.إ","rate":0.044,"rounding":"nearest_1","enabled":true},
  {"country":"Australia","country_code":"AU","code":"AUD","symbol":"A$","rate":0.018,"rounding":"nearest_1","enabled":true},
  {"country":"Canada","country_code":"CA","code":"CAD","symbol":"C$","rate":0.016,"rounding":"nearest_1","enabled":true},
  {"country":"Singapore","country_code":"SG","code":"SGD","symbol":"S$","rate":0.015,"rounding":"nearest_1","enabled":true}
]'::jsonb
WHERE currencies = '[]'::jsonb;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS currency_rate numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_base numeric;

UPDATE public.orders SET total_base = total WHERE total_base IS NULL;

GRANT SELECT (currencies) ON public.site_settings TO anon, authenticated;insert into public.pages (slug, title, excerpt, cover_image, body, meta_title, meta_description, published, sort_order, sections)
values
  ('collections', 'All Collections', 'A house of eight distinct collections, hand-crafted in the Mumbai rosado.', '', '', 'Product Categories — Rosado Gems', 'Browse Rosado Gems collections: rings, necklaces, earrings, bracelets, anklets, pendants, loose gemstones and bridal.', true, 0, '[{"id":"collections-header","type":"page_header","visible":true,"props":{"eyebrow":"Product Categories","title":"All Collections","subtitle":"A house of eight distinct collections, hand-crafted in the Mumbai rosado.","cover":"","align":"center"}}]'::jsonb),
  ('blog', 'The Rosado Journal', 'Field notes from the rosado — on stones, craft and the bridal season.', '', '', 'Journal — Rosado Gems', 'Stories from the Rosado Gems — gemstones, craft, and the bridal collection.', true, 0, '[{"id":"blog-header","type":"page_header","visible":true,"props":{"eyebrow":"Our Journal","title":"The Rosado Journal","subtitle":"Field notes from the rosado — on stones, craft and the bridal season.","cover":"","align":"center"}}]'::jsonb)
on conflict (slug) do nothing;CREATE TABLE public.currency_rate_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text,
  status text NOT NULL DEFAULT 'pending',
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_by_email text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by_email text,
  review_note text,
  reviewed_at timestamp with time zone,
  applied_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.currency_rate_proposals TO authenticated;
GRANT ALL ON public.currency_rate_proposals TO service_role;

ALTER TABLE public.currency_rate_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rate proposals"
ON public.currency_rate_proposals FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can submit rate proposals"
ON public.currency_rate_proposals FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin') AND submitted_by = auth.uid());

CREATE POLICY "Admins can review rate proposals"
ON public.currency_rate_proposals FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_currency_proposal_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    IF NEW.reviewed_by IS NULL OR NEW.reviewed_by = OLD.submitted_by THEN
      RAISE EXCEPTION 'A rate proposal must be approved by a different administrator';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER currency_proposal_guard
BEFORE INSERT OR UPDATE ON public.currency_rate_proposals
FOR EACH ROW EXECUTE FUNCTION public.tg_currency_proposal_guard();

CREATE INDEX currency_rate_proposals_status_idx
ON public.currency_rate_proposals (status, created_at DESC);REVOKE ALL ON FUNCTION public.tg_currency_proposal_guard() FROM PUBLIC, anon, authenticated;ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ring_size_guide_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ring_size_guide_image text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ring_size_guide_note text NOT NULL DEFAULT '';

GRANT SELECT (ring_size_guide_enabled, ring_size_guide_image, ring_size_guide_note) ON public.site_settings TO anon, authenticated;
insert into public.products (id, slug, name, description, price, compare_at_price, sku, stock, gemstone, cut, carat, clarity, metal, images, is_new, is_bestseller, is_trending, sort_order, meta_title, meta_description)
values
('11111111-1111-4111-8111-000000000001','demo-ruby-solitaire-ring','Demo — Ruby Solitaire Ring',
 '<p>A single Burmese-style ruby set in a softly twisted band. This demo product shows how <strong>variants</strong> work: pick a metal, a plating finish and your ring size — each combination carries its own SKU, price and stock.</p><p>Hand-finished, nickel-free and hallmarked. Ships in a signature Rosado box.</p>',
 24500, 29900, 'DEMO-RING', 25, 'Ruby', 'Round Brilliant', 1.25, 'VS1', '18K Gold',
 '["/__l5e/assets-v1/996d9c8a-6c46-48d0-a59c-168838b1b258/demo-ring.jpg"]'::jsonb,
 true, true, false, 1, 'Demo Ruby Solitaire Ring | Rosado Gems', 'A demo ruby solitaire ring showing metal, finish and ring-size variants with live pricing.'),
('11111111-1111-4111-8111-000000000002','demo-emerald-drop-pendant','Demo — Emerald Drop Pendant',
 '<p>A pear-cut emerald suspended from a fine cable chain. Use this demo to see how <strong>chain length</strong> and <strong>plating</strong> variants change the price and the photo shown on the page.</p><p>Each stone is hand-selected for colour saturation.</p>',
 18900, 22500, 'DEMO-PEND', 30, 'Emerald', 'Pear', 1.8, 'VVS2', '18K Gold',
 '["/__l5e/assets-v1/32b4eba7-5937-48a1-b3a1-da77da62e023/demo-pendant.jpg"]'::jsonb,
 true, false, true, 2, 'Demo Emerald Drop Pendant | Rosado Gems', 'A demo emerald pendant showing chain length and plating variants with per-variant pricing.'),
('11111111-1111-4111-8111-000000000003','demo-sapphire-tennis-bracelet','Demo — Sapphire Tennis Bracelet',
 '<p>Blue sapphires in a continuous white-gold line. This demo shows <strong>component</strong> and <strong>gemstone colour</strong> variants with colour swatches, plus bracelet length options.</p>',
 42500, 49900, 'DEMO-BRAC', 15, 'Blue Sapphire', 'Oval', 6.5, 'VS', '14K White Gold',
 '["/__l5e/assets-v1/f7006886-ce71-4583-af92-fcfa960ab17e/demo-bracelet.jpg"]'::jsonb,
 false, true, true, 3, 'Demo Sapphire Tennis Bracelet | Rosado Gems', 'A demo sapphire bracelet showing component, gemstone colour and length variants.');

insert into public.product_categories (product_id, category_id) values
('11111111-1111-4111-8111-000000000001','f62610a6-f2fe-4710-9c84-eb7200bae341'),
('11111111-1111-4111-8111-000000000001','57fa2a64-7215-4a41-a1e8-93b84020f1fb'),
('11111111-1111-4111-8111-000000000002','c6fb8e9c-678f-47d5-a9ca-f3b1ee9b99e0'),
('11111111-1111-4111-8111-000000000002','329b1cbc-d6d2-40bc-a1ef-4fb42b6cc011'),
('11111111-1111-4111-8111-000000000003','57fa2a64-7215-4a41-a1e8-93b84020f1fb');

update public.products set category_id='f62610a6-f2fe-4710-9c84-eb7200bae341' where id='11111111-1111-4111-8111-000000000001';
update public.products set category_id='c6fb8e9c-678f-47d5-a9ca-f3b1ee9b99e0' where id='11111111-1111-4111-8111-000000000002';
update public.products set category_id='57fa2a64-7215-4a41-a1e8-93b84020f1fb' where id='11111111-1111-4111-8111-000000000003';

-- Ring: Metal x Plating x Ring size
insert into public.product_variants (product_id, metal, plating, size, gemstone_color, color_hex, price, compare_at_price, sku, stock, image, sort_order)
select '11111111-1111-4111-8111-000000000001', m.metal, pl.plating, s.size, 'Ruby Red', '#9B111E',
       24500 + m.delta + pl.delta, 29900 + m.delta + pl.delta,
       'DEMO-RING-' || m.code || '-' || pl.code || '-' || s.size, 6,
       '/__l5e/assets-v1/996d9c8a-6c46-48d0-a59c-168838b1b258/demo-ring.jpg',
       row_number() over ()
from (values ('18K Gold','G',0),('Platinum','P',6000)) as m(metal, code, delta),
     (values ('Yellow Gold','YG',0),('Rose Gold','RG',1500)) as pl(plating, code, delta),
     (values ('12'),('14'),('16')) as s(size);

-- Pendant: Plating x Length
insert into public.product_variants (product_id, metal, plating, length, gemstone_color, color_hex, price, compare_at_price, sku, stock, image, sort_order)
select '11111111-1111-4111-8111-000000000002', '18K Gold', pl.plating, l.length, 'Emerald Green', '#046307',
       18900 + pl.delta + l.delta, 22500 + pl.delta + l.delta,
       'DEMO-PEND-' || pl.code || '-' || replace(l.length,'"',''), 8,
       '/__l5e/assets-v1/32b4eba7-5937-48a1-b3a1-da77da62e023/demo-pendant.jpg',
       row_number() over ()
from (values ('Yellow Gold','YG',0),('Rose Gold','RG',1200)) as pl(plating, code, delta),
     (values ('16 in',0),('18 in',900),('20 in',1800)) as l(length, delta);

-- Bracelet: Component x Gemstone colour x Length
insert into public.product_variants (product_id, component, metal, gemstone_color, color_hex, length, price, compare_at_price, sku, stock, image, sort_order)
select '11111111-1111-4111-8111-000000000003', c.component, '14K White Gold', g.gem, g.hex, c.length,
       42500 + c.delta + g.delta, 49900 + c.delta + g.delta,
       'DEMO-BRAC-' || c.code || '-' || g.code, 5,
       '/__l5e/assets-v1/f7006886-ce71-4583-af92-fcfa960ab17e/demo-bracelet.jpg',
       row_number() over ()
from (values ('Classic Line','CL','6.5 in',0),('Extended Line','EL','7.5 in',5500)) as c(component, code, length, delta),
     (values ('Blue Sapphire','BS','#0F52BA',0),('Pink Sapphire','PS','#E75480',2500),('White Topaz','WT','#F2F2F2',-4000)) as g(gem, code, hex, delta);
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.products.price_overrides IS
  'Optional per-currency price overrides, e.g. {"USD": 149, "AED": 540}. Amounts are in that currency. Empty = convert from the INR price.';CREATE TABLE public.order_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'outbound',
  template_key text,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL,
  status_snapshot text,
  visible_to_customer boolean NOT NULL DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  author_name text NOT NULL DEFAULT 'Rosado Gems',
  author_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX order_messages_order_id_idx ON public.order_messages(order_id);

GRANT SELECT, INSERT ON public.order_messages TO authenticated;
GRANT ALL ON public.order_messages TO service_role;

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage order messages" ON public.order_messages
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers read their own order messages" ON public.order_messages
  FOR SELECT TO authenticated
  USING (
    visible_to_customer
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_messages.order_id
        AND (o.user_id = auth.uid() OR lower(o.contact_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

CREATE POLICY "Customers reply on their own orders" ON public.order_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    direction = 'inbound'
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_messages.order_id
        AND (o.user_id = auth.uid() OR lower(o.contact_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );UPDATE public.site_settings
SET homepage = jsonb_set(
  homepage,
  '{sections}',
  (
    SELECT jsonb_agg(
      CASE WHEN s->>'type' = 'lookbook'
        THEN jsonb_set(s, '{props,handle}', '"rosado_gemsofficial"'::jsonb, true)
        ELSE s END
      ORDER BY ord
    )
    FROM jsonb_array_elements(homepage->'sections') WITH ORDINALITY AS t(s, ord)
  )
)
WHERE homepage ? 'sections';ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_status_check CHECK (status IN ('draft','published'));

CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status);

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Published products are viewable by everyone"
ON public.products FOR SELECT
USING (status = 'published' OR private.has_role(auth.uid(), 'admin'));ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS mega_menu jsonb NOT NULL DEFAULT '{}'::jsonb;
GRANT SELECT (mega_menu) ON public.site_settings TO anon, authenticated;ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS maintenance_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_title text NOT NULL DEFAULT 'We are polishing something beautiful',
  ADD COLUMN IF NOT EXISTS maintenance_message text NOT NULL DEFAULT 'Our atelier is being refreshed. Rosado Gems will be back shortly with a new experience.',
  ADD COLUMN IF NOT EXISTS maintenance_eta text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS maintenance_image text NOT NULL DEFAULT '';

GRANT SELECT (maintenance_enabled, maintenance_title, maintenance_message, maintenance_eta, maintenance_image) ON public.site_settings TO anon, authenticated;ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_gateway text,
  ADD COLUMN IF NOT EXISTS gateway_order_id text,
  ADD COLUMN IF NOT EXISTS gateway_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_gateway_order_id_idx ON public.orders (gateway_order_id);CREATE TABLE public.order_refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  gateway text NOT NULL,
  gateway_refund_id text,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  reason text,
  status text NOT NULL DEFAULT 'processed',
  is_manual boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_by_email text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX order_refunds_order_id_idx ON public.order_refunds(order_id);

GRANT SELECT ON public.order_refunds TO authenticated;
GRANT ALL ON public.order_refunds TO service_role;

ALTER TABLE public.order_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view refunds" ON public.order_refunds
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Customers can view refunds on their orders" ON public.order_refunds
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_refunds.order_id AND o.user_id = auth.uid()));

CREATE TRIGGER order_refunds_touch_updated_at
  BEFORE UPDATE ON public.order_refunds
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_total numeric NOT NULL DEFAULT 0;CREATE TABLE public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL,
  event_type text,
  event_id text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  signature text,
  signature_valid boolean NOT NULL DEFAULT false,
  headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'received',
  error text,
  note text,
  recheck_count integer NOT NULL DEFAULT 0,
  last_recheck_at timestamptz,
  processed_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payment_webhook_events_received_idx ON public.payment_webhook_events (received_at DESC);
CREATE INDEX payment_webhook_events_order_idx ON public.payment_webhook_events (order_id);

GRANT SELECT ON public.payment_webhook_events TO authenticated;
GRANT ALL ON public.payment_webhook_events TO service_role;

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook events"
  ON public.payment_webhook_events FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payment_webhook_events_touch_updated_at
  BEFORE UPDATE ON public.payment_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS payoneer_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payoneer_mode text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS payoneer_merchant_code text,
  ADD COLUMN IF NOT EXISTS payoneer_api_key text,
  ADD COLUMN IF NOT EXISTS payoneer_division text,
  ADD COLUMN IF NOT EXISTS payoneer_webhook_secret text;