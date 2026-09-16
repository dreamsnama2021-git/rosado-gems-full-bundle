
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
