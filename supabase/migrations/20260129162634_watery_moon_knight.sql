CREATE TYPE "public"."deal_stage" AS ENUM('Lead', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'sales');--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"stage" "deal_stage" DEFAULT 'Lead' NOT NULL,
	"value" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"closed_at" timestamp with time zone,
	"formation_id" uuid
);
--> statement-breakpoint
ALTER TABLE "formations" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "workspaces_users" ADD COLUMN "role" "workspace_role" DEFAULT 'sales' NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "public"."formations"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "formations" ADD CONSTRAINT "formations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE cascade;