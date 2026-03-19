-- Quest system: phase enum, extend formation_actions, add quest_sub_actions + audit log

DO $$ BEGIN
  CREATE TYPE quest_phase AS ENUM ('conception', 'deploiement', 'evaluation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "formation_actions"
  ADD COLUMN IF NOT EXISTS "phase" quest_phase,
  ADD COLUMN IF NOT EXISTS "quest_key" varchar(64),
  ADD COLUMN IF NOT EXISTS "assignee_id" uuid REFERENCES "auth"."users"("id"),
  ADD COLUMN IF NOT EXISTS "guidance_dismissed" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "applicable_to" jsonb;

CREATE TABLE IF NOT EXISTS "quest_sub_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "formation_action_id" uuid NOT NULL REFERENCES "formation_actions"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "completed" boolean DEFAULT false NOT NULL,
  "completed_at" timestamptz,
  "completed_by" uuid REFERENCES "auth"."users"("id"),
  "order_index" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "formation_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "formation_id" uuid REFERENCES "formations"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "user_id" uuid REFERENCES "auth"."users"("id"),
  "action_type" text NOT NULL,
  "entity_type" text,
  "entity_id" uuid,
  "field_name" text,
  "old_value" text,
  "new_value" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_quest_sub_actions_formation_action"
  ON "quest_sub_actions" ("formation_action_id");

CREATE INDEX IF NOT EXISTS "idx_formation_audit_log_formation"
  ON "formation_audit_log" ("formation_id");

CREATE INDEX IF NOT EXISTS "idx_formation_actions_quest_key"
  ON "formation_actions" ("quest_key");

CREATE INDEX IF NOT EXISTS "idx_formation_actions_phase"
  ON "formation_actions" ("phase");
