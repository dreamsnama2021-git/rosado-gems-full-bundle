CREATE TABLE public.order_messages (
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
  );