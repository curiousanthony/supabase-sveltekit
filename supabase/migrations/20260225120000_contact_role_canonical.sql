-- Add inclusive assistant title and canonicalize contact_role:
-- - Add 'Assistant(e) de Direction' (replaces gendered 'Assistante de Direction')
-- - Migrate existing data to canonical values (CEO -> PDG / Président; Assistante de Direction -> Assistant(e) de Direction)
-- Note: PostgreSQL does not support removing enum values; legacy values remain in the type but are no longer used.

ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Assistant(e) de Direction';

UPDATE "public"."contacts"
SET "poste" = 'PDG / Président'
WHERE "poste" = 'CEO';

UPDATE "public"."contacts"
SET "poste" = 'Assistant(e) de Direction'
WHERE "poste" = 'Assistante de Direction';
