-- Part 2: Schema changes using new enum values

-- Migrate existing 'En attente' rows to 'À traiter'
UPDATE formations SET statut = 'À traiter' WHERE statut = 'En attente';

-- Add new columns to formations
ALTER TABLE "formations"
  ADD COLUMN IF NOT EXISTS "type" "formation_type",
  ADD COLUMN IF NOT EXISTS "date_debut" date,
  ADD COLUMN IF NOT EXISTS "date_fin" date,
  ADD COLUMN IF NOT EXISTS "programme_source_id" uuid REFERENCES "biblio_programmes"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "financement_accorde" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "montant_accorde" numeric(12, 2),
  ADD COLUMN IF NOT EXISTS "tjm_formateur" numeric(10, 2),
  ADD COLUMN IF NOT EXISTS "location" text;

ALTER TABLE "formations" ALTER COLUMN "statut" SET DEFAULT 'À traiter';

-- Update seances: add formation_id, formateur_id; drop old instructor
ALTER TABLE "seances"
  ADD COLUMN IF NOT EXISTS "formation_id" uuid,
  ADD COLUMN IF NOT EXISTS "formateur_id" uuid REFERENCES "formateurs"("id") ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE "seances" DROP CONSTRAINT IF EXISTS "seances_instructor_fkey";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
ALTER TABLE "seances" DROP COLUMN IF EXISTS "instructor";

ALTER TABLE "seances" ALTER COLUMN "module_id" DROP NOT NULL;

-- Backfill formation_id from modules.course_id
UPDATE "seances" s
SET "formation_id" = m."course_id"
FROM "modules" m
WHERE s."module_id" = m."id" AND s."formation_id" IS NULL;

DO $$ BEGIN
  ALTER TABLE "seances"
    ADD CONSTRAINT "seances_formation_id_fkey"
    FOREIGN KEY ("formation_id") REFERENCES "formations"("id")
    ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM seances WHERE formation_id IS NULL) THEN
    ALTER TABLE "seances" ALTER COLUMN "formation_id" SET NOT NULL;
  END IF;
END $$;

-- Create formation_actions table
CREATE TABLE IF NOT EXISTS "formation_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "formation_id" uuid NOT NULL REFERENCES "formations"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "status" "action_status" DEFAULT 'Pas commencé' NOT NULL,
  "etape" "action_etape",
  "due_date" date,
  "completed_at" timestamptz,
  "completed_by" uuid REFERENCES "auth"."users"("id"),
  "blocked_by_action_id" uuid REFERENCES "formation_actions"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "order_index" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- Create formation_formateurs join table
CREATE TABLE IF NOT EXISTS "formation_formateurs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "formation_id" uuid NOT NULL REFERENCES "formations"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "formateur_id" uuid NOT NULL REFERENCES "formateurs"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "unique_formation_formateur" UNIQUE ("formation_id", "formateur_id")
);

-- Create formation_apprenants join table
CREATE TABLE IF NOT EXISTS "formation_apprenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "formation_id" uuid NOT NULL REFERENCES "formations"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "unique_formation_apprenant" UNIQUE ("formation_id", "contact_id")
);

-- Create emargements table
CREATE TABLE IF NOT EXISTS "emargements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "seance_id" uuid NOT NULL REFERENCES "seances"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "signed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
