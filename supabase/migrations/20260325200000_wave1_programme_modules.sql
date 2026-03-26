-- Wave 1: Programme Linking + Modules Alignment
-- Adds new columns to formations, modules, biblio_programmes tables
-- Creates module_supports, module_questionnaires, and biblio_programme_sousthematiques junction tables

-- 1. Add missing programme-level columns to formations
ALTER TABLE "formations" ADD COLUMN IF NOT EXISTS "objectifs" text;
ALTER TABLE "formations" ADD COLUMN IF NOT EXISTS "prerequis" text;
ALTER TABLE "formations" ADD COLUMN IF NOT EXISTS "public_vise" text;
ALTER TABLE "formations" ADD COLUMN IF NOT EXISTS "prix_public" numeric;

-- 2. Add new columns to modules (formation-side)
ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "contenu" text;
ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "modalite_evaluation" "public"."modalite_evaluation";
ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "source_module_id" uuid;

ALTER TABLE "modules" DROP CONSTRAINT IF EXISTS "modules_source_module_id_fkey";
ALTER TABLE "modules"
  ADD CONSTRAINT "modules_source_module_id_fkey"
  FOREIGN KEY ("source_module_id") REFERENCES "biblio_modules"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- 3. Add new columns to biblio_programmes
ALTER TABLE "biblio_programmes" ADD COLUMN IF NOT EXISTS "objectifs" text;
ALTER TABLE "biblio_programmes" ADD COLUMN IF NOT EXISTS "public_vise" text;
ALTER TABLE "biblio_programmes" ADD COLUMN IF NOT EXISTS "topic_id" uuid;
ALTER TABLE "biblio_programmes" ADD COLUMN IF NOT EXISTS "derived_from_programme_id" uuid;

ALTER TABLE "biblio_programmes" DROP CONSTRAINT IF EXISTS "biblio_programmes_topic_id_fkey";
ALTER TABLE "biblio_programmes"
  ADD CONSTRAINT "biblio_programmes_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "thematiques"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "biblio_programmes" DROP CONSTRAINT IF EXISTS "biblio_programmes_derived_from_fkey";
ALTER TABLE "biblio_programmes"
  ADD CONSTRAINT "biblio_programmes_derived_from_fkey"
  FOREIGN KEY ("derived_from_programme_id") REFERENCES "biblio_programmes"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- 4. Create biblio_programme_sousthematiques junction table
CREATE TABLE IF NOT EXISTS "biblio_programme_sousthematiques" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "programme_id" uuid NOT NULL,
  "sousthematique_id" uuid NOT NULL,
  CONSTRAINT "biblio_programme_sousthematiques_unique" UNIQUE("programme_id", "sousthematique_id")
);

DO $$ BEGIN
  ALTER TABLE "biblio_programme_sousthematiques"
    ADD CONSTRAINT "biblio_prog_sousth_programme_id_fkey"
    FOREIGN KEY ("programme_id") REFERENCES "biblio_programmes"("id")
    ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "biblio_programme_sousthematiques"
    ADD CONSTRAINT "biblio_prog_sousth_sousthematique_id_fkey"
    FOREIGN KEY ("sousthematique_id") REFERENCES "sousthematiques"("id")
    ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Create module_supports junction table (formation-side, references biblio_supports)
CREATE TABLE IF NOT EXISTS "module_supports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "module_id" uuid NOT NULL,
  "support_id" uuid NOT NULL,
  CONSTRAINT "module_supports_unique" UNIQUE("module_id", "support_id")
);

DO $$ BEGIN
  ALTER TABLE "module_supports"
    ADD CONSTRAINT "module_supports_module_id_fkey"
    FOREIGN KEY ("module_id") REFERENCES "modules"("id")
    ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "module_supports"
    ADD CONSTRAINT "module_supports_support_id_fkey"
    FOREIGN KEY ("support_id") REFERENCES "biblio_supports"("id")
    ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Create module_questionnaires junction table (formation-side, references biblio_questionnaires)
CREATE TABLE IF NOT EXISTS "module_questionnaires" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "module_id" uuid NOT NULL,
  "questionnaire_id" uuid NOT NULL,
  CONSTRAINT "module_questionnaires_unique" UNIQUE("module_id", "questionnaire_id")
);

DO $$ BEGIN
  ALTER TABLE "module_questionnaires"
    ADD CONSTRAINT "module_questionnaires_module_id_fkey"
    FOREIGN KEY ("module_id") REFERENCES "modules"("id")
    ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "module_questionnaires"
    ADD CONSTRAINT "module_questionnaires_questionnaire_id_fkey"
    FOREIGN KEY ("questionnaire_id") REFERENCES "biblio_questionnaires"("id")
    ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. RLS policies for new tables (match workspace-level access pattern)
ALTER TABLE "biblio_programme_sousthematiques" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "module_supports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "module_questionnaires" ENABLE ROW LEVEL SECURITY;
