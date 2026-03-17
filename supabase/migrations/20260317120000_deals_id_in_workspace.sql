ALTER TABLE "deals" ADD COLUMN "id_in_workspace" integer;

ALTER TABLE "deals" ADD CONSTRAINT "deals_workspace_id_in_workspace_unique" UNIQUE("workspace_id", "id_in_workspace");
