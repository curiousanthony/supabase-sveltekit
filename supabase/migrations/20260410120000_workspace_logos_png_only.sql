-- T-8: Logos are normalized to PNG at upload; tighten bucket to match processed output.
UPDATE storage.buckets
SET
	allowed_mime_types = ARRAY['image/png']::text[],
	file_size_limit = 2097152 -- 2 MiB ceiling for optimized PNG
WHERE id = 'workspace-logos';
