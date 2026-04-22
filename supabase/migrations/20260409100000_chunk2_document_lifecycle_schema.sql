-- Chunk 2: Document lifecycle schema migration (T-32)
-- Adds lifecycle columns, changes default status, creates indexes

-- 1. Add new lifecycle columns
ALTER TABLE "formation_documents"
  ADD COLUMN "accepted_at" timestamptz,
  ADD COLUMN "refused_at" timestamptz,
  ADD COLUMN "expires_at" timestamptz,
  ADD COLUMN "archived_at" timestamptz,
  ADD COLUMN "status_changed_at" timestamptz,
  ADD COLUMN "status_changed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  ADD COLUMN "replaces_document_id" uuid REFERENCES "formation_documents"("id") ON DELETE SET NULL;

-- 2. Migrate existing 'draft' rows to 'genere'
UPDATE "formation_documents" SET "status" = 'genere' WHERE "status" = 'draft';

-- 3. Change default status from 'draft' to 'genere'
ALTER TABLE "formation_documents" ALTER COLUMN "status" SET DEFAULT 'genere';

-- 4. Composite index for "current doc of type X in formation Y"
CREATE INDEX "formation_documents_formation_type_status_idx"
  ON "formation_documents" ("formation_id", "type", "status");

-- 5. Partial index for devis expiry queries
CREATE INDEX "formation_documents_expires_at_idx"
  ON "formation_documents" ("expires_at")
  WHERE "expires_at" IS NOT NULL;

-- 6. Partial index for version chain lookups
CREATE INDEX "formation_documents_replaces_document_id_idx"
  ON "formation_documents" ("replaces_document_id")
  WHERE "replaces_document_id" IS NOT NULL;
