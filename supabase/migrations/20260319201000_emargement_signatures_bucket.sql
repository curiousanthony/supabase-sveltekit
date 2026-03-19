-- Public bucket for émargement signature images (uploaded server-side with service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'emargement-signatures',
	'emargement-signatures',
	true,
	2097152, -- 2MB
	ARRAY['image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Emargement signatures public read" ON storage.objects;
CREATE POLICY "Emargement signatures public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'emargement-signatures');
