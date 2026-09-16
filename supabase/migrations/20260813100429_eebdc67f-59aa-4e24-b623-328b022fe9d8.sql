ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_status_check CHECK (status IN ('draft','published'));

CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status);

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Published products are viewable by everyone"
ON public.products FOR SELECT
USING (status = 'published' OR private.has_role(auth.uid(), 'admin'));