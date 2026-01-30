CREATE TABLE IF NOT EXISTS "formation_workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formation_id" uuid NOT NULL,
	"step_key" varchar(64) NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	CONSTRAINT "unique_formation_step" UNIQUE("formation_id", "step_key")
);
--> statement-breakpoint
ALTER TABLE "formation_workflow_steps" ADD CONSTRAINT "formation_workflow_steps_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "public"."formations"("id") ON UPDATE cascade ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "formation_workflow_steps" ADD CONSTRAINT "formation_workflow_steps_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id");
