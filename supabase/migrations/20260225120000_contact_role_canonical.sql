-- Add inclusive assistant title and canonicalize contact_role:
-- - Add 'Assistant(e) de Direction' (replaces gendered 'Assistante de Direction')
-- - Migrate CEO -> PDG / Président (same transaction is fine).
-- - Migrate Assistante de Direction -> Assistant(e) de Direction is in 20260225120001 (new enum value cannot be used in same transaction).
-- Note: PostgreSQL does not support removing enum values; legacy values remain in the type but are no longer used.

ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Assistant(e) de Direction';

UPDATE "public"."contacts"
SET "poste" = 'PDG / Président'
WHERE "poste" = 'CEO';
