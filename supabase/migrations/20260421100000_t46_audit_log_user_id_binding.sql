-- T-46: bind formation_audit_log INSERTs to auth.uid()
-- Carry-over from T-13 security audit. Drizzle bypasses RLS today (T-47),
-- but defense in depth: any future PostgREST/Supabase-client exposure of
-- this table cannot attribute audit rows to another user.

DROP POLICY IF EXISTS "formation_audit_log_insert" ON formation_audit_log;

CREATE POLICY "formation_audit_log_insert"
ON formation_audit_log FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_audit_log.formation_id
    AND wu.user_id = auth.uid()
  )
);
