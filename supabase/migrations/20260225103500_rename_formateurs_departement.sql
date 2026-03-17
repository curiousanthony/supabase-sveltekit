-- Idempotent: skip if column already renamed (e.g. from prior remote migrations)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'formateurs' AND column_name = 'departements'
  ) THEN
    ALTER TABLE "formateurs" RENAME COLUMN "departements" TO "departement";
  END IF;
END $$;
