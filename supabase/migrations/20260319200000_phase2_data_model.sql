-- Phase 2 data model: extend existing tables + add new tables

-- 1a. Extend emargements: signature fields
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS signature_image_url text;
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS signature_token uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS signer_ip text;
ALTER TABLE emargements ADD COLUMN IF NOT EXISTS signer_user_agent text;
CREATE UNIQUE INDEX IF NOT EXISTS emargements_signature_token_idx ON emargements (signature_token);

-- 1b. Extend seances: modality override + room
ALTER TABLE seances ADD COLUMN IF NOT EXISTS modality_override modalites;
ALTER TABLE seances ADD COLUMN IF NOT EXISTS room text;

-- 1c. Extend quest_sub_actions: accepted file types
ALTER TABLE quest_sub_actions ADD COLUMN IF NOT EXISTS accepted_file_types text[];

-- 1d. Extend formation_formateurs: cost tracking
ALTER TABLE formation_formateurs ADD COLUMN IF NOT EXISTS tjm numeric(10,2);
ALTER TABLE formation_formateurs ADD COLUMN IF NOT EXISTS number_of_days numeric(5,1);
ALTER TABLE formation_formateurs ADD COLUMN IF NOT EXISTS deplacement_cost numeric(10,2);
ALTER TABLE formation_formateurs ADD COLUMN IF NOT EXISTS hebergement_cost numeric(10,2);

-- 1e. Extend modules: objectifs
ALTER TABLE modules ADD COLUMN IF NOT EXISTS objectifs text;

-- 2. New table: quest_documents
CREATE TABLE IF NOT EXISTS quest_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_action_id uuid NOT NULL REFERENCES quest_sub_actions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT quest_documents_sub_action_id_unique UNIQUE (sub_action_id)
);

-- 3. New table: quest_comments
CREATE TABLE IF NOT EXISTS quest_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_action_id uuid NOT NULL REFERENCES formation_actions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS quest_comments_action_created_idx ON quest_comments (formation_action_id, created_at);

-- 4. New table: formation_invoices
CREATE TABLE IF NOT EXISTS formation_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  invoice_number text NOT NULL,
  date date NOT NULL,
  amount numeric(12,2) NOT NULL,
  recipient text NOT NULL,
  recipient_type text NOT NULL DEFAULT 'client',
  due_date date,
  status text NOT NULL DEFAULT 'Brouillon',
  payment_date date,
  document_url text,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS formation_invoices_formation_id_idx ON formation_invoices (formation_id);
CREATE INDEX IF NOT EXISTS formation_invoices_status_idx ON formation_invoices (status);

-- 5. New table: formation_cost_items
CREATE TABLE IF NOT EXISTS formation_cost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT formation_cost_items_formation_category_unique UNIQUE (formation_id, category)
);
