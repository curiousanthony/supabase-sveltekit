CREATE TYPE "public"."modalites" AS ENUM('Distanciel', 'Présentiel', 'Hybride', 'E-Learning');--> statement-breakpoint
CREATE TYPE "public"."statuts_formation" AS ENUM('En attente', 'En cours', 'Terminée');--> statement-breakpoint
CREATE TYPE "public"."type_client" AS ENUM('Entreprise', 'Particulier');--> statement-breakpoint
CREATE TABLE "apprenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"is_trainee_of" uuid
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"type" "type_client",
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"siret" integer,
	"legal_name" text
);
--> statement-breakpoint
CREATE TABLE "formations" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"name" text,
	"description" text,
	"workspace_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid,
	"subtopics_ids" uuid,
	"duree" integer,
	"modalite" "modalites",
	"code_rncp" text,
	"id_in_workspace" integer,
	"statut" "statuts_formation" DEFAULT 'En attente' NOT NULL,
	CONSTRAINT "courses_id2_key" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"duration_hours" numeric,
	"order_index" integer,
	"created_by" uuid NOT NULL,
	"course_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"location" text,
	"instructor" uuid,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sousthematiques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"parent_topic_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thematiques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"avatar_url" text,
	CONSTRAINT "users_id2_key" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	CONSTRAINT "workspaces_id2_key" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "workspaces_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apprenants" ADD CONSTRAINT "attendees_is_trainee_of_fkey" FOREIGN KEY ("is_trainee_of") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formations" ADD CONSTRAINT "courses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "formations" ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formations" ADD CONSTRAINT "courses_subtopics_ids_fkey" FOREIGN KEY ("subtopics_ids") REFERENCES "public"."sousthematiques"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "formations" ADD CONSTRAINT "formations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."thematiques"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."formations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seances" ADD CONSTRAINT "seances_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seances" ADD CONSTRAINT "seances_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seances" ADD CONSTRAINT "seances_instructor_fkey" FOREIGN KEY ("instructor") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sousthematiques" ADD CONSTRAINT "subtopics_parent_topic_id_fkey" FOREIGN KEY ("parent_topic_id") REFERENCES "public"."thematiques"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workspaces_users" ADD CONSTRAINT "workspaces_users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workspaces_users" ADD CONSTRAINT "workspaces_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unique_workspace_user" ON "workspaces_users" USING btree ("workspace_id" uuid_ops,"user_id" uuid_ops);