-- Industries / secteurs d'activité (OPCO-aligned). Table modifiable pour ajouter d'autres secteurs.

CREATE TABLE IF NOT EXISTS "industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL UNIQUE,
	"display_order" smallint DEFAULT 0 NOT NULL
);

--> statement-breakpoint
-- Seed: secteurs couverts par les 11 OPCO (opérateurs de compétences) pour le financement formation pro.
INSERT INTO "industries" ("id", "name", "display_order") VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Agriculture, pêche et agroalimentaire', 10),
  ('a0000001-0001-4000-8000-000000000002', 'Industrie chimique et pharmaceutique', 20),
  ('a0000001-0001-4000-8000-000000000003', 'Métallurgie et industrie', 30),
  ('a0000001-0001-4000-8000-000000000004', 'Papier, carton et industries graphiques', 40),
  ('a0000001-0001-4000-8000-000000000005', 'Bâtiment et travaux publics', 50),
  ('a0000001-0001-4000-8000-000000000006', 'Commerce et distribution', 60),
  ('a0000001-0001-4000-8000-000000000007', 'Transport, logistique et mobilité', 70),
  ('a0000001-0001-4000-8000-000000000008', 'Services financiers, banque et assurance', 80),
  ('a0000001-0001-4000-8000-000000000009', 'Conseil et ingénierie', 90),
  ('a0000001-0001-4000-8000-00000000000a', 'Santé et médico-social', 100),
  ('a0000001-0001-4000-8000-00000000000b', 'Culture, médias et communication', 110),
  ('a0000001-0001-4000-8000-00000000000c', 'Tourisme, sport et loisirs', 120),
  ('a0000001-0001-4000-8000-00000000000d', 'Artisanat et services de proximité', 130),
  ('a0000001-0001-4000-8000-00000000000e', 'Propreté, sécurité et travail temporaire', 140),
  ('a0000001-0001-4000-8000-00000000000f', 'Restauration et hôtellerie', 150),
  ('a0000001-0001-4000-8000-000000000010', 'Cohésion sociale et insertion', 160),
  ('a0000001-0001-4000-8000-000000000011', 'Éducation et formation', 170),
  ('a0000001-0001-4000-8000-000000000012', 'Autre', 999)
ON CONFLICT ("name") DO NOTHING;

--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "industry_id" uuid REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE cascade;

--> statement-breakpoint
UPDATE "companies" c
SET "industry_id" = i.id
FROM "industries" i
WHERE c."industry"::text = i."name";

--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN IF EXISTS "industry";

--> statement-breakpoint
DROP TYPE IF EXISTS "public"."company_industry";
