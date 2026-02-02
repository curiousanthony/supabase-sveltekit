-- Workspace settings: logo_url, legal_name, siret
-- Workspace invites table
-- Storage bucket and RLS for workspace logos

-- Add columns to workspaces table
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS legal_name text,
ADD COLUMN IF NOT EXISTS siret varchar(14);

-- Create workspace_invites table
CREATE TABLE IF NOT EXISTS workspace_invites (
	id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
	workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	email text NOT NULL,
	role workspace_role NOT NULL DEFAULT 'sales',
	invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token text NOT NULL UNIQUE,
	expires_at timestamptz NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace_id ON workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON workspace_invites(email);

-- Create storage bucket for workspace logos (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'workspace-logos',
	'workspace-logos',
	true,
	5242880, -- 5MB limit
	ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects (workspace-logos bucket)
-- Allow authenticated users to upload if they have workspace_settings permission
DROP POLICY IF EXISTS "Workspace logos upload" ON storage.objects;
CREATE POLICY "Workspace logos upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
	bucket_id = 'workspace-logos' AND
	(
		SELECT COUNT(*) > 0
		FROM workspaces_users wu
		JOIN workspaces w ON w.id = wu.workspace_id
		WHERE wu.user_id = auth.uid()
		AND wu.role IN ('owner', 'admin')
		AND (storage.foldername(name))[1] = w.id::text
	)
);

-- Allow authenticated users to update their own workspace logos
DROP POLICY IF EXISTS "Workspace logos update" ON storage.objects;
CREATE POLICY "Workspace logos update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
	bucket_id = 'workspace-logos' AND
	(
		SELECT COUNT(*) > 0
		FROM workspaces_users wu
		JOIN workspaces w ON w.id = wu.workspace_id
		WHERE wu.user_id = auth.uid()
		AND wu.role IN ('owner', 'admin')
		AND (storage.foldername(name))[1] = w.id::text
	)
);

-- Allow authenticated users to delete their own workspace logos
DROP POLICY IF EXISTS "Workspace logos delete" ON storage.objects;
CREATE POLICY "Workspace logos delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
	bucket_id = 'workspace-logos' AND
	(
		SELECT COUNT(*) > 0
		FROM workspaces_users wu
		JOIN workspaces w ON w.id = wu.workspace_id
		WHERE wu.user_id = auth.uid()
		AND wu.role IN ('owner', 'admin')
		AND (storage.foldername(name))[1] = w.id::text
	)
);

-- Allow public read access (bucket is public)
DROP POLICY IF EXISTS "Workspace logos public read" ON storage.objects;
CREATE POLICY "Workspace logos public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'workspace-logos');
