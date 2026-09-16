CREATE TABLE public.currency_rate_proposals (
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
ON public.currency_rate_proposals (status, created_at DESC);