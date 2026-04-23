-- Phase 0: workspace identity expansion + documents/email tables + emargement signer model

-- 1) Workspace identity / legal metadata
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS postal_code varchar(10);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS phone varchar(20);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS nda varchar(20);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS signatory_name text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS signatory_role text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS show_referral_cta boolean NOT NULL DEFAULT true;

-- 2) Emargement signer model (apprenant | formateur)
DO $$ BEGIN
  CREATE TYPE emargement_signer_type AS ENUM ('apprenant', 'formateur');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE emargements ADD COLUMN IF NOT EXISTS signer_type emargement_signer_type NOT NULL DEFAULT 'apprenant';
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS formateur_id uuid;
ALTER TABLE emargements ALTER COLUMN contact_id DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'emargements_formateur_id_fkey'
      AND table_name = 'emargements'
  ) THEN
    ALTER TABLE emargements
      ADD CONSTRAINT emargements_formateur_id_fkey
      FOREIGN KEY (formateur_id) REFERENCES formateurs(id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'emargements_signer_consistency_chk'
      AND table_name = 'emargements'
  ) THEN
    ALTER TABLE emargements
      ADD CONSTRAINT emargements_signer_consistency_chk
      CHECK (
        (signer_type = 'apprenant' AND contact_id IS NOT NULL AND formateur_id IS NULL)
        OR
        (signer_type = 'formateur' AND formateur_id IS NOT NULL AND contact_id IS NULL)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_emargement_seance_formateur'
  ) THEN
    ALTER TABLE emargements
      ADD CONSTRAINT unique_emargement_seance_formateur UNIQUE (seance_id, formateur_id);
  END IF;
END $$;

-- 3) Formation documents
CREATE TABLE IF NOT EXISTS formation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  storage_path text,
  generated_at timestamptz,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  signed_at timestamptz,
  sent_at timestamptz,
  sent_to text[],
  related_contact_id uuid REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE SET NULL,
  related_formateur_id uuid REFERENCES formateurs(id) ON UPDATE CASCADE ON DELETE SET NULL,
  related_seance_id uuid REFERENCES seances(id) ON UPDATE CASCADE ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS formation_documents_formation_id_idx ON formation_documents (formation_id);
CREATE INDEX IF NOT EXISTS formation_documents_type_idx ON formation_documents (type);
CREATE INDEX IF NOT EXISTS formation_documents_status_idx ON formation_documents (status);

-- 4) Formation emails
CREATE TABLE IF NOT EXISTS formation_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  document_id uuid REFERENCES formation_documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  type text NOT NULL,
  subject text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  recipient_type text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  postmark_message_id text,
  body_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS formation_emails_formation_id_idx ON formation_emails (formation_id);
CREATE INDEX IF NOT EXISTS formation_emails_status_idx ON formation_emails (status);
CREATE INDEX IF NOT EXISTS formation_emails_type_idx ON formation_emails (type);

-- 5) RLS
ALTER TABLE formation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'formation_documents' AND policyname = 'formation_documents_all'
  ) THEN
    CREATE POLICY "formation_documents_all" ON formation_documents
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'formation_emails' AND policyname = 'formation_emails_all'
  ) THEN
    CREATE POLICY "formation_emails_all" ON formation_emails
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6) Storage bucket for generated docs
INSERT INTO storage.buckets (id, name, public)
VALUES ('formation-documents', 'formation-documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'formation_docs_auth_upload'
  ) THEN
    CREATE POLICY "formation_docs_auth_upload"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'formation-documents');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'formation_docs_auth_read'
  ) THEN
    CREATE POLICY "formation_docs_auth_read"
      ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'formation-documents');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'formation_docs_auth_delete'
  ) THEN
    CREATE POLICY "formation_docs_auth_delete"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'formation-documents');
  END IF;
END $$;
