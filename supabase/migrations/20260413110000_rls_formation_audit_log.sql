-- T-13: Add workspace-scoped RLS to formation_audit_log.
-- Join path: formation_audit_log.formation_id → formations.workspace_id → workspaces_users.user_id
-- Only SELECT and INSERT are granted to authenticated members (no UPDATE/DELETE on audit rows).

ALTER TABLE formation_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "formation_audit_log_select"
ON formation_audit_log FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_audit_log.formation_id
    AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_audit_log_insert"
ON formation_audit_log FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_audit_log.formation_id
    AND wu.user_id = auth.uid()
  )
);
