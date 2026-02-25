-- Use the new enum value (must run in a separate transaction after 20260225120000).
UPDATE "public"."contacts"
SET "poste" = 'Assistant(e) de Direction'
WHERE "poste" = 'Assistante de Direction';
