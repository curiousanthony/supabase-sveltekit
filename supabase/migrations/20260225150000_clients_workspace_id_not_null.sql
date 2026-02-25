-- clients.workspace_id: backfill any NULLs then set NOT NULL for workspace-scoped RLS
UPDATE clients c
SET workspace_id = w.id
FROM (SELECT id FROM workspaces ORDER BY id LIMIT 1) w
WHERE c.workspace_id IS NULL AND w.id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_workspace_id_fkey";
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "workspace_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;
