-- Bibliothèque: enums and tables for programmes, modules, questionnaires, supports

CREATE TYPE "public"."statut_programme" AS ENUM('Brouillon', 'En cours', 'Publié', 'Archivé');
--> statement-breakpoint
CREATE TYPE "public"."type_questionnaire" AS ENUM('Test de niveau', 'Quiz / Exercice', 'Audit des besoins');
--> statement-breakpoint
CREATE TYPE "public"."modalite_evaluation" AS ENUM('QCM', 'QCU', 'Pratique', 'Projet');
--> statement-breakpoint
CREATE TABLE "biblio_programmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" text NOT NULL,
	"description" text,
	"modalite" "modalites",
	"prix_public" numeric,
	"statut" "statut_programme" DEFAULT 'Brouillon' NOT NULL,
	"prerequis" text,
	"duree_heures" numeric,
	"workspace_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biblio_programmes" ADD CONSTRAINT "biblio_programmes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "biblio_programmes" ADD CONSTRAINT "biblio_programmes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "biblio_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" text NOT NULL,
	"contenu" text,
	"objectifs_pedagogiques" text,
	"modalite_evaluation" "modalite_evaluation",
	"duree_heures" numeric(6, 2),
	"workspace_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biblio_modules" ADD CONSTRAINT "biblio_modules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "biblio_modules" ADD CONSTRAINT "biblio_modules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "biblio_programme_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biblio_programme_modules" ADD CONSTRAINT "biblio_programme_modules_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "public"."biblio_programmes"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "biblio_programme_modules" ADD CONSTRAINT "biblio_programme_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."biblio_modules"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "biblio_programme_modules_unique" ON "biblio_programme_modules" USING btree ("programme_id","module_id");
--> statement-breakpoint
CREATE TABLE "biblio_questionnaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" text NOT NULL,
	"type" "type_questionnaire" NOT NULL,
	"url_test" text,
	"workspace_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biblio_questionnaires" ADD CONSTRAINT "biblio_questionnaires_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "biblio_questionnaires" ADD CONSTRAINT "biblio_questionnaires_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "biblio_programme_questionnaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"questionnaire_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biblio_programme_questionnaires" ADD CONSTRAINT "biblio_prog_quest_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "public"."biblio_programmes"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "biblio_programme_questionnaires" ADD CONSTRAINT "biblio_prog_quest_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."biblio_questionnaires"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "biblio_programme_questionnaires_unique" ON "biblio_programme_questionnaires" USING btree ("programme_id","questionnaire_id");
--> statement-breakpoint
CREATE TABLE "biblio_module_questionnaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"questionnaire_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biblio_module_questionnaires" ADD CONSTRAINT "biblio_mod_quest_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."biblio_modules"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "biblio_module_questionnaires" ADD CONSTRAINT "biblio_mod_quest_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."biblio_questionnaires"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "biblio_module_questionnaires_unique" ON "biblio_module_questionnaires" USING btree ("module_id","questionnaire_id");
--> statement-breakpoint
CREATE TABLE "biblio_supports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" text NOT NULL,
	"url" text,
	"file_path" text,
	"file_name" text,
	"file_size" integer,
	"mime_type" text,
	"workspace_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biblio_supports" ADD CONSTRAINT "biblio_supports_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "biblio_supports" ADD CONSTRAINT "biblio_supports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "biblio_programme_supports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"support_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biblio_programme_supports" ADD CONSTRAINT "biblio_prog_supp_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "public"."biblio_programmes"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "biblio_programme_supports" ADD CONSTRAINT "biblio_prog_supp_support_id_fkey" FOREIGN KEY ("support_id") REFERENCES "public"."biblio_supports"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "biblio_programme_supports_unique" ON "biblio_programme_supports" USING btree ("programme_id","support_id");
--> statement-breakpoint
CREATE TABLE "biblio_module_supports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"support_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biblio_module_supports" ADD CONSTRAINT "biblio_mod_supp_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."biblio_modules"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "biblio_module_supports" ADD CONSTRAINT "biblio_mod_supp_support_id_fkey" FOREIGN KEY ("support_id") REFERENCES "public"."biblio_supports"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "biblio_module_supports_unique" ON "biblio_module_supports" USING btree ("module_id","support_id");
