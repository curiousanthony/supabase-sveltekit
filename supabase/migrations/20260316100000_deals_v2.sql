-- Deals v2: new pipeline stages, new fields, programme relation

-- 1. Create new enum types
CREATE TYPE "public"."deal_source" AS ENUM(
  'Site web',
  'Bouche-à-oreille',
  'Salon / Événement',
  'Ancien client',
  'Appel entrant',
  'LinkedIn',
  'Partenaire',
  'Autre'
);

CREATE TYPE "public"."deal_loss_reason" AS ENUM(
  'Prix trop élevé',
  'Concurrent choisi',
  'Report / Pas le bon moment',
  'Budget annulé',
  'Sans réponse',
  'Autre'
);

CREATE TYPE "public"."deal_funding_status" AS ENUM(
  'En attente',
  'Demande envoyée',
  'Accord reçu',
  'Refusé'
);

-- 2. Recreate deal_stage enum with new values (wipes old deal data)
DELETE FROM "public"."deal_companies";
DELETE FROM "public"."deals";

ALTER TABLE "public"."deals" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "public"."deals" ALTER COLUMN "stage" TYPE text USING stage::text;
DROP TYPE "public"."deal_stage";
CREATE TYPE "public"."deal_stage" AS ENUM(
  'Suspect',
  'Prospect',
  'Négociation',
  'Admin',
  'Signature',
  'Financement',
  'Gagné',
  'Perdu'
);
ALTER TABLE "public"."deals" ALTER COLUMN "stage" TYPE "public"."deal_stage" USING stage::"public"."deal_stage";
ALTER TABLE "public"."deals" ALTER COLUMN "stage" SET DEFAULT 'Suspect';

-- 3. Make clientId nullable
ALTER TABLE "public"."deals" ALTER COLUMN "client_id" DROP NOT NULL;

-- 4. Add new columns
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "programme_id" uuid;
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "funding_status" "public"."deal_funding_status";
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "funding_reference" text;
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "nb_apprenants" smallint;
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "expected_close_date" date;
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "probability" smallint;
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "source" "public"."deal_source";
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "loss_reason" "public"."deal_loss_reason";
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "loss_reason_detail" text;

-- 5. Add programme FK
ALTER TABLE "public"."deals"
  ADD CONSTRAINT "deals_programme_id_fkey"
  FOREIGN KEY ("programme_id")
  REFERENCES "public"."biblio_programmes"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;
