-- Phase 1: Workspace RBAC - add secretary role and last_active_workspace_id

-- Add 'secretary' to workspace_role enum (PostgreSQL 15+)
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

-- Add last_active_workspace_id to users (persists workspace selection across devices)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
