-- workspaces.name: backfill NULLs then set NOT NULL to avoid empty workspace labels
UPDATE workspaces SET name = 'Unnamed workspace' WHERE name IS NULL;
--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "name" SET NOT NULL;
