-- Bibliothèque feature: core tables, junction tables, and enums

-- Enums
CREATE TYPE "public"."modalite_evaluation" AS ENUM('QCM', 'QCU', 'Pratique', 'Projet');
CREATE TYPE "public"."statut_programme" AS ENUM('Brouillon', 'En cours', 'Publié', 'Archivé');
CREATE TYPE "public"."type_questionnaire" AS ENUM('Test de niveau', 'Quiz / Exercice', 'Audit des besoins');

-- biblio_modules
CREATE TABLE IF NOT EXISTS "public"."biblio_modules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "titre" text NOT NULL,
    "contenu" text,
    "objectifs_pedagogiques" text,
    "modalite_evaluation" "public"."modalite_evaluation",
    "duree_heures" numeric,
    "workspace_id" uuid NOT NULL,
    "created_by" uuid NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "public"."biblio_modules"
    ADD CONSTRAINT "biblio_modules_workspace_id_fkey"
        FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_modules"
    ADD CONSTRAINT "biblio_modules_created_by_fkey"
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

-- biblio_programmes
CREATE TABLE IF NOT EXISTS "public"."biblio_programmes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "titre" text NOT NULL,
    "description" text,
    "modalite" "public"."modalites",
    "prix_public" numeric,
    "statut" "public"."statut_programme" DEFAULT 'Brouillon' NOT NULL,
    "prerequis" text,
    "duree_heures" numeric,
    "workspace_id" uuid NOT NULL,
    "created_by" uuid NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "public"."biblio_programmes"
    ADD CONSTRAINT "biblio_programmes_workspace_id_fkey"
        FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_programmes"
    ADD CONSTRAINT "biblio_programmes_created_by_fkey"
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

-- biblio_programme_modules (junction)
CREATE TABLE IF NOT EXISTS "public"."biblio_programme_modules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "programme_id" uuid NOT NULL,
    "module_id" uuid NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL
);

ALTER TABLE "public"."biblio_programme_modules"
    ADD CONSTRAINT "biblio_programme_modules_programme_id_fkey"
        FOREIGN KEY ("programme_id") REFERENCES "public"."biblio_programmes"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_programme_modules"
    ADD CONSTRAINT "biblio_programme_modules_module_id_fkey"
        FOREIGN KEY ("module_id") REFERENCES "public"."biblio_modules"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_programme_modules"
    ADD CONSTRAINT "biblio_programme_modules_unique"
        UNIQUE("programme_id", "module_id");

-- biblio_questionnaires
CREATE TABLE IF NOT EXISTS "public"."biblio_questionnaires" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "titre" text NOT NULL,
    "type" "public"."type_questionnaire",
    "url_test" text,
    "workspace_id" uuid NOT NULL,
    "created_by" uuid NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "public"."biblio_questionnaires"
    ADD CONSTRAINT "biblio_questionnaires_workspace_id_fkey"
        FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_questionnaires"
    ADD CONSTRAINT "biblio_questionnaires_created_by_fkey"
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

-- biblio_programme_questionnaires (junction)
CREATE TABLE IF NOT EXISTS "public"."biblio_programme_questionnaires" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "programme_id" uuid NOT NULL,
    "questionnaire_id" uuid NOT NULL
);

ALTER TABLE "public"."biblio_programme_questionnaires"
    ADD CONSTRAINT "biblio_prog_quest_programme_id_fkey"
        FOREIGN KEY ("programme_id") REFERENCES "public"."biblio_programmes"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_programme_questionnaires"
    ADD CONSTRAINT "biblio_prog_quest_questionnaire_id_fkey"
        FOREIGN KEY ("questionnaire_id") REFERENCES "public"."biblio_questionnaires"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_programme_questionnaires"
    ADD CONSTRAINT "biblio_programme_questionnaires_unique"
        UNIQUE("programme_id", "questionnaire_id");

-- biblio_module_questionnaires (junction)
CREATE TABLE IF NOT EXISTS "public"."biblio_module_questionnaires" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "module_id" uuid NOT NULL,
    "questionnaire_id" uuid NOT NULL
);

ALTER TABLE "public"."biblio_module_questionnaires"
    ADD CONSTRAINT "biblio_mod_quest_module_id_fkey"
        FOREIGN KEY ("module_id") REFERENCES "public"."biblio_modules"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_module_questionnaires"
    ADD CONSTRAINT "biblio_mod_quest_questionnaire_id_fkey"
        FOREIGN KEY ("questionnaire_id") REFERENCES "public"."biblio_questionnaires"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_module_questionnaires"
    ADD CONSTRAINT "biblio_module_questionnaires_unique"
        UNIQUE("module_id", "questionnaire_id");

-- biblio_supports
CREATE TABLE IF NOT EXISTS "public"."biblio_supports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "titre" text NOT NULL,
    "url" text,
    "file_path" text,
    "file_name" text,
    "file_size" integer,
    "mime_type" text,
    "workspace_id" uuid NOT NULL,
    "created_by" uuid NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "public"."biblio_supports"
    ADD CONSTRAINT "biblio_supports_workspace_id_fkey"
        FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_supports"
    ADD CONSTRAINT "biblio_supports_created_by_fkey"
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");

-- biblio_programme_supports (junction)
CREATE TABLE IF NOT EXISTS "public"."biblio_programme_supports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "programme_id" uuid NOT NULL,
    "support_id" uuid NOT NULL
);

ALTER TABLE "public"."biblio_programme_supports"
    ADD CONSTRAINT "biblio_prog_supp_programme_id_fkey"
        FOREIGN KEY ("programme_id") REFERENCES "public"."biblio_programmes"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_programme_supports"
    ADD CONSTRAINT "biblio_prog_supp_support_id_fkey"
        FOREIGN KEY ("support_id") REFERENCES "public"."biblio_supports"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_programme_supports"
    ADD CONSTRAINT "biblio_programme_supports_unique"
        UNIQUE("programme_id", "support_id");

-- biblio_module_supports (junction)
CREATE TABLE IF NOT EXISTS "public"."biblio_module_supports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "module_id" uuid NOT NULL,
    "support_id" uuid NOT NULL
);

ALTER TABLE "public"."biblio_module_supports"
    ADD CONSTRAINT "biblio_mod_supp_module_id_fkey"
        FOREIGN KEY ("module_id") REFERENCES "public"."biblio_modules"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_module_supports"
    ADD CONSTRAINT "biblio_mod_supp_support_id_fkey"
        FOREIGN KEY ("support_id") REFERENCES "public"."biblio_supports"("id")
        ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."biblio_module_supports"
    ADD CONSTRAINT "biblio_module_supports_unique"
        UNIQUE("module_id", "support_id");

-- Enable RLS on all new tables
ALTER TABLE "public"."biblio_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."biblio_programmes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."biblio_programme_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."biblio_questionnaires" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."biblio_programme_questionnaires" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."biblio_module_questionnaires" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."biblio_supports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."biblio_programme_supports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."biblio_module_supports" ENABLE ROW LEVEL SECURITY;
