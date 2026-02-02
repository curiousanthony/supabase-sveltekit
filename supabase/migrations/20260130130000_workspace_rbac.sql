-- Workspace RBAC: secretary role, last_active_workspace_id

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'workspace_role' AND e.enumlabel = 'secretary'
  ) THEN
    ALTER TYPE workspace_role ADD VALUE 'secretary';
  END IF;
END
$$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
