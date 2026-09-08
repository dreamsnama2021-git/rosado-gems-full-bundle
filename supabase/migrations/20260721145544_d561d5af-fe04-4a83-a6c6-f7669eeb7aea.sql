
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
