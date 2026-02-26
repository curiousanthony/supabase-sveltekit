-- Add workspace_id to formateurs so formateurs are scoped per workspace (like contacts and companies).
ALTER TABLE formateurs ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- Backfill existing rows: assign to first workspace so NOT NULL can be applied.
UPDATE formateurs
SET workspace_id = (SELECT id FROM workspaces LIMIT 1)
WHERE workspace_id IS NULL
  AND EXISTS (SELECT 1 FROM workspaces LIMIT 1);

-- Drop rows that cannot be assigned (no workspaces); then enforce NOT NULL.
DELETE FROM formateurs WHERE workspace_id IS NULL;
ALTER TABLE formateurs ALTER COLUMN workspace_id SET NOT NULL;

-- Add foreign key to workspaces.
ALTER TABLE formateurs
  ADD CONSTRAINT formateurs_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE ON UPDATE CASCADE;
