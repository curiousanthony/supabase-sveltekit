CREATE TABLE "formateurs" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"taux_horaire_min" numeric,
	"taux_horaire_max" numeric,
	"description" text,
	"departements" text,
	"ville" text,
	"rating" numeric,
	"disponible_7j" boolean,
	"user_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formateurs_thematiques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"thematique_id" uuid NOT NULL,
	"formateur_id" uuid NOT NULL,
	CONSTRAINT "unique_formateur_thematique" UNIQUE("thematique_id","formateur_id")
);
--> statement-breakpoint
ALTER TABLE "formateurs" ADD CONSTRAINT "formateurs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "formateurs_thematiques" ADD CONSTRAINT "formateurs_thematiques_thematique_id_fkey" FOREIGN KEY ("thematique_id") REFERENCES "public"."thematiques"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "formateurs_thematiques" ADD CONSTRAINT "formateurs_thematiques_formateur_id_fkey" FOREIGN KEY ("formateur_id") REFERENCES "public"."formateurs"("id") ON DELETE cascade ON UPDATE cascade;