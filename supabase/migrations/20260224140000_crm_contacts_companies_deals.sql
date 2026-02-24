-- CRM: contacts, companies, join tables, and deal extensions (TCK-17 / N1, N2, N3)

CREATE TYPE "public"."contact_role" AS ENUM('Responsable RH', 'CEO', 'Autre');
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"poste" "contact_role",
	"linkedin_url" text,
	"owner_id" uuid,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");
--> statement-breakpoint
CREATE TYPE "public"."legal_status" AS ENUM('Indépendant', 'Entreprise');
--> statement-breakpoint
CREATE TYPE "public"."company_industry" AS ENUM('Éducation et formation', 'Restauration', 'Autre');
--> statement-breakpoint
CREATE TYPE "public"."company_size" AS ENUM('0 - Solo', '1-10 - TPE', '11-49 - PME', '50-249', '250+');
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"siret" text,
	"legal_status" "legal_status",
	"industry" "company_industry",
	"company_size" "company_size",
	"website_url" text,
	"address" text,
	"city" text,
	"region" text,
	"estimated_budget" numeric(12, 2),
	"funding_devices" text[],
	"opco_id" uuid,
	"owner_id" uuid,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "contact_companies" (
	"contact_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	PRIMARY KEY ("contact_id", "company_id")
);
--> statement-breakpoint
ALTER TABLE "contact_companies" ADD CONSTRAINT "contact_companies_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "contact_companies" ADD CONSTRAINT "contact_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE TYPE "public"."deal_funding_type" AS ENUM('Financement fonds propres (Client)', 'Financement public (OPCO; CPF...)', 'Co-financement (OPCO + Client)');
--> statement-breakpoint
CREATE TYPE "public"."deal_format" AS ENUM('Individuel', 'Collectif');
--> statement-breakpoint
CREATE TYPE "public"."deal_intra_inter" AS ENUM('Intra', 'Inter');
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "company_id" uuid;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "funding_type" "deal_funding_type";
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "deal_format" "deal_format";
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "intra_inter" "deal_intra_inter";
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "modalities" text[];
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "deal_amount" numeric(12, 2);
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "funded_amount" numeric(12, 2);
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "is_funded" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "duration_hours" integer;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "desired_start_date" date;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "desired_end_date" date;
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "commercial_id" uuid;
--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_commercial_id_fkey" FOREIGN KEY ("commercial_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "deal_companies" (
	"deal_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	PRIMARY KEY ("deal_id", "company_id")
);
--> statement-breakpoint
ALTER TABLE "deal_companies" ADD CONSTRAINT "deal_companies_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "deal_companies" ADD CONSTRAINT "deal_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade;
