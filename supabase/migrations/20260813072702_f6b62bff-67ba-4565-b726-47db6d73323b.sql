ALTER TABLE public.site_settings
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

GRANT SELECT (currencies) ON public.site_settings TO anon, authenticated;