ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS homepage jsonb NOT NULL DEFAULT jsonb_build_object(
  'new_arrivals', jsonb_build_object('eyebrow','Just In','title','New Arrival','subtitle','','product_ids', '[]'::jsonb),
  'best_sellers', jsonb_build_object('eyebrow','Beloved','title','Best Sellers','subtitle','','product_ids', '[]'::jsonb)
);