-- Auto-update updated_at on contacts, companies, deals (BEFORE UPDATE triggers)
-- Columns already have DEFAULT now(); this ensures they refresh on UPDATE.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
