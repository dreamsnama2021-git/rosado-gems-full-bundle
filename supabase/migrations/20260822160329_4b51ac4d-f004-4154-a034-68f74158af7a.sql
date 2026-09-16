CREATE TABLE public.payment_webhook_events (
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
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();