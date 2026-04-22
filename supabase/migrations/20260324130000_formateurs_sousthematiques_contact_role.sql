-- Migration: add formateurs_sousthematiques table + revamp contact_role enum

-- 1. Create formateurs_sousthematiques join table
CREATE TABLE IF NOT EXISTS "public"."formateurs_sousthematiques" (
    "id"                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    "created_at"          timestamptz NOT NULL DEFAULT now(),
    "sousthematique_id"   uuid        NOT NULL,
    "formateur_id"        uuid        NOT NULL,
    CONSTRAINT "formateurs_sousthematiques_pkey"
        PRIMARY KEY ("id"),
    CONSTRAINT "unique_formateur_sousthematique"
        UNIQUE ("formateur_id", "sousthematique_id"),
    CONSTRAINT "formateurs_sousthematiques_sousthematique_id_fkey"
        FOREIGN KEY ("sousthematique_id")
        REFERENCES "public"."sousthematiques"("id")
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "formateurs_sousthematiques_formateur_id_fkey"
        FOREIGN KEY ("formateur_id")
        REFERENCES "public"."formateurs"("id")
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 2. Revamp contact_role enum
--    PostgreSQL does not support removing enum values; we rename the old type,
--    create the new type, migrate the column, then drop the old type.

ALTER TYPE "public"."contact_role" RENAME TO "contact_role_old";

CREATE TYPE "public"."contact_role" AS ENUM (
    'Salarié',
    'Manager / Responsable',
    'Cadre',
    'Dirigeant / Gérant',
    'RH / Formation',
    'Commercial',
    'Technique / IT',
    'Opérationnel',
    'Administratif',
    'Indépendant / Freelance',
    'Autre'
);

-- Migrate existing data: best-effort mapping, unmapped values become NULL
ALTER TABLE "public"."contacts"
    ALTER COLUMN "poste" TYPE "public"."contact_role"
    USING CASE "poste"::text
        WHEN 'Gérant'    THEN 'Dirigeant / Gérant'::"public"."contact_role"
        WHEN 'Associé'   THEN 'Dirigeant / Gérant'::"public"."contact_role"
        WHEN 'PDG / Président'                       THEN 'Dirigeant / Gérant'::"public"."contact_role"
        WHEN 'Directeur Général'                     THEN 'Dirigeant / Gérant'::"public"."contact_role"
        WHEN 'Directeur des Ressources Humaines'     THEN 'RH / Formation'::"public"."contact_role"
        WHEN 'Responsable RH'                        THEN 'RH / Formation'::"public"."contact_role"
        WHEN 'Responsable Formation'                 THEN 'RH / Formation'::"public"."contact_role"
        WHEN 'Directeur Commercial'                  THEN 'Commercial'::"public"."contact_role"
        WHEN 'Responsable Commercial'                THEN 'Commercial'::"public"."contact_role"
        WHEN 'Directeur Marketing'                   THEN 'Commercial'::"public"."contact_role"
        WHEN 'Directeur Technique'                   THEN 'Technique / IT'::"public"."contact_role"
        WHEN 'Directeur Financier'                   THEN 'Cadre'::"public"."contact_role"
        WHEN 'Directeur des Opérations'              THEN 'Opérationnel'::"public"."contact_role"
        WHEN 'Office Manager'                        THEN 'Administratif'::"public"."contact_role"
        WHEN 'Assistant(e) de Direction'             THEN 'Administratif'::"public"."contact_role"
        WHEN 'Chef de Projet'                        THEN 'Manager / Responsable'::"public"."contact_role"
        WHEN 'Responsable des Achats'                THEN 'Manager / Responsable'::"public"."contact_role"
        WHEN 'Consultant'                            THEN 'Indépendant / Freelance'::"public"."contact_role"
        WHEN 'Autre'                                 THEN 'Autre'::"public"."contact_role"
        ELSE NULL
    END;

DROP TYPE "public"."contact_role_old";
