-- Storage bucket for bibliothèque supports (course materials: PDFs, Office docs, images)
-- Path pattern: {workspace_id}/{segment_id}/{filename}
-- Private bucket; access via RLS for authenticated workspace members.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'bibliotheque-supports',
	'bibliotheque-supports',
	false,
	10485760, -- 10MB limit (matches app validation)
	ARRAY[
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.ms-powerpoint',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'image/png',
		'image/jpeg',
		'image/gif',
		'image/webp'
	]
)
ON CONFLICT (id) DO NOTHING;

-- RLS: allow authenticated workspace members to insert in their workspace folder
DROP POLICY IF EXISTS "Bibliotheque supports upload" ON storage.objects;
CREATE POLICY "Bibliotheque supports upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
	bucket_id = 'bibliotheque-supports'
	AND (
		SELECT COUNT(*) > 0
		FROM workspaces_users wu
		WHERE wu.user_id = auth.uid()
		AND (storage.foldername(name))[1] = wu.workspace_id::text
	)
);

-- RLS: allow authenticated workspace members to update objects in their workspace
DROP POLICY IF EXISTS "Bibliotheque supports update" ON storage.objects;
CREATE POLICY "Bibliotheque supports update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
	bucket_id = 'bibliotheque-supports'
	AND (
		SELECT COUNT(*) > 0
		FROM workspaces_users wu
		WHERE wu.user_id = auth.uid()
		AND (storage.foldername(name))[1] = wu.workspace_id::text
	)
);

-- RLS: allow authenticated workspace members to delete objects in their workspace
DROP POLICY IF EXISTS "Bibliotheque supports delete" ON storage.objects;
CREATE POLICY "Bibliotheque supports delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
	bucket_id = 'bibliotheque-supports'
	AND (
		SELECT COUNT(*) > 0
		FROM workspaces_users wu
		WHERE wu.user_id = auth.uid()
		AND (storage.foldername(name))[1] = wu.workspace_id::text
	)
);

-- RLS: allow authenticated workspace members to read objects in their workspace
DROP POLICY IF EXISTS "Bibliotheque supports select" ON storage.objects;
CREATE POLICY "Bibliotheque supports select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
	bucket_id = 'bibliotheque-supports'
	AND (
		SELECT COUNT(*) > 0
		FROM workspaces_users wu
		WHERE wu.user_id = auth.uid()
		AND (storage.foldername(name))[1] = wu.workspace_id::text
	)
);
