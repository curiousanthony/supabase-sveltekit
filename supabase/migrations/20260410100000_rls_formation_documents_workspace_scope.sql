-- T-6: Replace permissive formation_documents RLS with workspace-scoped policies.
-- Join path: formation_documents.formation_id → formations.workspace_id → workspaces_users.user_id

DROP POLICY IF EXISTS "formation_documents_all" ON formation_documents;

CREATE POLICY "formation_documents_select"
ON formation_documents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id
    AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_documents_insert"
ON formation_documents FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id
    AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_documents_update"
ON formation_documents FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id
    AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_documents_delete"
ON formation_documents FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id
    AND wu.user_id = auth.uid()
  )
);
