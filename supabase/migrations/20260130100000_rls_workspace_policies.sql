-- RLS policies for workspace-scoped data
-- Note: With the default postgres connection, RLS is bypassed (superuser).
-- These policies will enforce when using Supabase pooler in session mode with JWT.

-- Helper: returns workspace IDs the user belongs to
CREATE OR REPLACE FUNCTION user_workspace_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT workspace_id FROM workspaces_users WHERE user_id = p_user_id;
$$;

-- Helper: true only when the user is the workspace creator (first member being added)
-- Prevents arbitrary self-insert into existing workspaces.
CREATE OR REPLACE FUNCTION validate_workspace_creator(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM workspaces WHERE id = p_workspace_id)
    AND NOT EXISTS (
      SELECT 1 FROM workspaces_users
      WHERE workspace_id = p_workspace_id
    );
$$;

-- workspaces: user must be a member to select; authenticated can create (for onboarding)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspaces_select_member"
  ON workspaces FOR SELECT
  USING (id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "workspaces_insert_authenticated"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- workspaces_users: members can select their workspace's rows; owner/admin can mutate
ALTER TABLE workspaces_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspaces_users_select"
  ON workspaces_users FOR SELECT
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "workspaces_users_insert"
  ON workspaces_users FOR INSERT
  WITH CHECK (
    validate_workspace_creator(workspace_id, user_id)
    OR
    EXISTS (
      SELECT 1 FROM workspaces_users wu
      WHERE wu.workspace_id = workspaces_users.workspace_id
        AND wu.user_id = auth.uid()
        AND wu.role IN ('owner', 'admin')
    )
  );
CREATE POLICY "workspaces_users_update_admin"
  ON workspaces_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces_users wu
      WHERE wu.workspace_id = workspaces_users.workspace_id
        AND wu.user_id = auth.uid()
        AND wu.role IN ('owner', 'admin')
    )
  );
CREATE POLICY "workspaces_users_delete_admin"
  ON workspaces_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces_users wu
      WHERE wu.workspace_id = workspaces_users.workspace_id
        AND wu.user_id = auth.uid()
        AND wu.role IN ('owner', 'admin')
    )
  );

-- deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_select"
  ON deals FOR SELECT
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "deals_insert"
  ON deals FOR INSERT
  WITH CHECK (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "deals_update"
  ON deals FOR UPDATE
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "deals_delete"
  ON deals FOR DELETE
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));

-- formations
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formations_select"
  ON formations FOR SELECT
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "formations_insert"
  ON formations FOR INSERT
  WITH CHECK (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "formations_update"
  ON formations FOR UPDATE
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "formations_delete"
  ON formations FOR DELETE
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));

-- clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_select"
  ON clients FOR SELECT
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())) OR workspace_id IS NULL);
CREATE POLICY "clients_insert"
  ON clients FOR INSERT
  WITH CHECK (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())) OR workspace_id IS NULL);
CREATE POLICY "clients_update"
  ON clients FOR UPDATE
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())) OR workspace_id IS NULL);
CREATE POLICY "clients_delete"
  ON clients FOR DELETE
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())) OR workspace_id IS NULL);

-- workspace_formateurs
ALTER TABLE workspace_formateurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_formateurs_select"
  ON workspace_formateurs FOR SELECT
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "workspace_formateurs_insert"
  ON workspace_formateurs FOR INSERT
  WITH CHECK (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "workspace_formateurs_update"
  ON workspace_formateurs FOR UPDATE
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));
CREATE POLICY "workspace_formateurs_delete"
  ON workspace_formateurs FOR DELETE
  USING (workspace_id IN (SELECT * FROM user_workspace_ids(auth.uid())));

-- users: allow read of own row for last_active_workspace_id, update own
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid());
