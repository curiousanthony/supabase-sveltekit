-- Scoped unique constraint: (workspace_id, id_in_workspace) to prevent concurrent-insert duplicates.
ALTER TABLE "formations"
	ADD CONSTRAINT "formations_workspace_id_in_workspace_unique" UNIQUE ("workspace_id", "id_in_workspace");

-- Rollback: DROP CONSTRAINT "formations_workspace_id_in_workspace_unique" on "formations";
