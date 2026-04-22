ALTER TABLE public.formations
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.formations SET updated_at = created_at;

CREATE TRIGGER formations_updated_at
  BEFORE UPDATE ON public.formations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
