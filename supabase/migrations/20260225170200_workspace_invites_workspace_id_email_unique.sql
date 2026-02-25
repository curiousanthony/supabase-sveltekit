-- Enforce at most one pending invite per (workspace_id, email)
ALTER TABLE "workspace_invites"
	ADD CONSTRAINT "workspace_invites_workspace_id_email_key" UNIQUE ("workspace_id", "email");
