-- T-7: Replace permissive formation-documents storage policies with workspace-scoped ones.
-- Storage path convention: {formationId}/{type}_{timestamp}.pdf
-- First folder segment is the formation UUID, used to join → formations → workspaces_users.

DROP POLICY IF EXISTS "formation_docs_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "formation_docs_auth_read" ON storage.objects;
DROP POLICY IF EXISTS "formation_docs_auth_delete" ON storage.objects;

CREATE POLICY "formation_docs_workspace_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'formation-documents'
  AND EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = ((storage.foldername(name))[1])::uuid
    AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_docs_workspace_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'formation-documents'
  AND EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = ((storage.foldername(name))[1])::uuid
    AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_docs_workspace_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'formation-documents'
  AND EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = ((storage.foldername(name))[1])::uuid
    AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_docs_workspace_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'formation-documents'
  AND EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = ((storage.foldername(name))[1])::uuid
    AND wu.user_id = auth.uid()
  )
);
