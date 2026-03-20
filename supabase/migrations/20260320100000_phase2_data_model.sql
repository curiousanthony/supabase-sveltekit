-- Phase 2: Data model changes for full formation tab functionality

-- 1. Extend seances: add room and modality_override
ALTER TABLE seances ADD COLUMN IF NOT EXISTS room text;
ALTER TABLE seances ADD COLUMN IF NOT EXISTS modality_override modalites;

-- 2. Extend emargements: signature fields
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS signature_image_url text;
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS signature_token uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS signer_ip text;
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS signer_user_agent text;

-- Unique index on signature_token for public lookup
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_emargement_signature_token') THEN
    ALTER TABLE emargements ADD CONSTRAINT unique_emargement_signature_token UNIQUE (signature_token);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS emargements_signature_token_idx ON emargements (signature_token);

-- 3. Extend quest_sub_actions: accepted_file_types
ALTER TABLE quest_sub_actions ADD COLUMN IF NOT EXISTS accepted_file_types text[];

-- 4. Extend formation_formateurs: cost tracking
ALTER TABLE formation_formateurs ADD COLUMN IF NOT EXISTS tjm numeric(10,2);
ALTER TABLE formation_formateurs ADD COLUMN IF NOT EXISTS number_of_days numeric(5,1);
ALTER TABLE formation_formateurs ADD COLUMN IF NOT EXISTS deplacement_cost numeric(10,2);
ALTER TABLE formation_formateurs ADD COLUMN IF NOT EXISTS hebergement_cost numeric(10,2);

-- 5. Extend modules: add objectifs
ALTER TABLE modules ADD COLUMN IF NOT EXISTS objectifs text;

-- 6. New table: quest_documents
CREATE TABLE IF NOT EXISTS quest_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_action_id uuid NOT NULL REFERENCES quest_sub_actions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_quest_document_sub_action UNIQUE (sub_action_id)
);

-- 7. New table: quest_comments
CREATE TABLE IF NOT EXISTS quest_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_action_id uuid NOT NULL REFERENCES formation_actions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS quest_comments_action_created_idx ON quest_comments (formation_action_id, created_at);

-- 8. New table: formation_invoices
CREATE TABLE IF NOT EXISTS formation_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  invoice_number text NOT NULL,
  date date NOT NULL,
  amount numeric(12,2) NOT NULL,
  recipient text NOT NULL,
  recipient_type text NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'Brouillon',
  payment_date date,
  document_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS formation_invoices_formation_id_idx ON formation_invoices (formation_id);
CREATE INDEX IF NOT EXISTS formation_invoices_status_idx ON formation_invoices (status);
CREATE INDEX IF NOT EXISTS formation_invoices_due_date_idx ON formation_invoices (due_date);

-- 9. New table: formation_cost_items
CREATE TABLE IF NOT EXISTS formation_cost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_formation_cost_category UNIQUE (formation_id, category)
);

-- 10. RLS policies for new tables
ALTER TABLE quest_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quest_documents_all" ON quest_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "quest_comments_all" ON quest_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "formation_invoices_all" ON formation_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "formation_cost_items_all" ON formation_cost_items FOR ALL USING (true) WITH CHECK (true);

-- 11. Create Supabase Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('quest-documents', 'quest-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('formation-invoices', 'formation-invoices', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('emargement-signatures', 'emargement-signatures', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "quest_docs_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'quest-documents');
CREATE POLICY "quest_docs_auth_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'quest-documents');
CREATE POLICY "quest_docs_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'quest-documents');

CREATE POLICY "invoices_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'formation-invoices');
CREATE POLICY "invoices_auth_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'formation-invoices');
CREATE POLICY "invoices_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'formation-invoices');

CREATE POLICY "signatures_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'emargement-signatures');
CREATE POLICY "signatures_anon_upload" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'emargement-signatures');
CREATE POLICY "signatures_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'emargement-signatures');
