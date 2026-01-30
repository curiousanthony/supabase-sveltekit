-- Seed mock data for Deals, Formations, Formateurs, Clients (only when workspace + user exist).
-- Uses existing workspace and first workspace user for created_by/owner_id; adds 2 mock users for formateurs.

-- Ensure clients.workspace_id exists (in case migration 20260129164731 was not applied on remote)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS workspace_id uuid;
DO $$ BEGIN
  ALTER TABLE clients ADD CONSTRAINT clients_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE set null ON UPDATE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1) Mock users for formateurs (idempotent)
INSERT INTO users (id, email, created_at)
VALUES
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'formateur1@seed.local', now()),
  ('a0000002-0000-4000-8000-000000000002'::uuid, 'formateur2@seed.local', now())
ON CONFLICT (id) DO NOTHING;

-- 2) Clients (3 rows), scoped to first workspace + user
WITH one AS (
  SELECT w.id AS workspace_id, wu.user_id
  FROM workspaces w
  JOIN workspaces_users wu ON wu.workspace_id = w.id
  LIMIT 1
)
INSERT INTO clients (workspace_id, created_by, type, legal_name, email)
SELECT one.workspace_id, one.user_id, 'Entreprise'::type_client, v.legal_name, v.email
FROM one
CROSS JOIN (VALUES
  ('Acme Corp', 'contact@acme.example.com'),
  ('Globex Corporation', 'info@globex.example.com'),
  ('Soylent Corp', 'hello@soylent.example.com')
) AS v(legal_name, email)
WHERE EXISTS (SELECT 1 FROM one);

-- 3) Formateurs (2 rows), using mock users (skip if already present)
INSERT INTO formateurs (user_id, ville, description, taux_horaire_min, taux_horaire_max)
SELECT u.id, 'Paris', 'Formateur seed', 200, 400
FROM users u
WHERE u.email IN ('formateur1@seed.local', 'formateur2@seed.local')
  AND NOT EXISTS (SELECT 1 FROM formateurs f WHERE f.user_id = u.id);

-- 4) Extra formations (3 rows), only if we have workspace + user (id_in_workspace 4,5,6 to avoid clash with existing seed)
WITH one AS (
  SELECT w.id AS workspace_id, wu.user_id
  FROM workspaces w
  JOIN workspaces_users wu ON wu.workspace_id = w.id
  LIMIT 1
)
INSERT INTO formations (workspace_id, created_by, name, duree, modalite, statut, id_in_workspace)
SELECT one.workspace_id, one.user_id, n.name, n.duree, n.modalite::modalites, n.statut::statuts_formation, n.id_in_workspace
FROM one
CROSS JOIN (VALUES
  ('Formation mock 1', 10, 'Présentiel', 'En attente', 4),
  ('Formation mock 2', 15, 'Hybride', 'En cours', 5),
  ('Formation mock 3', 5, 'Distanciel', 'Terminée', 6)
) AS n(name, duree, modalite, statut, id_in_workspace)
WHERE EXISTS (SELECT 1 FROM one);

-- 5) Deals (3 rows), linked to first workspace, user, and the 3 clients
WITH one AS (
  SELECT w.id AS workspace_id, wu.user_id
  FROM workspaces w
  JOIN workspaces_users wu ON wu.workspace_id = w.id
  LIMIT 1
),
clients_ordered AS (
  SELECT id, row_number() OVER (ORDER BY legal_name) AS rn
  FROM clients
  WHERE workspace_id = (SELECT workspace_id FROM one LIMIT 1)
  LIMIT 3
),
deal_rows AS (
  SELECT * FROM (VALUES
    (1, 'Deal Acme', 'Formation leadership', 'Lead', 5000),
    (2, 'Deal Globex', 'Accompagnement stratégie', 'Qualification', 12000),
    (3, 'Deal Soylent', 'Formation produit', 'Proposition', 8000)
  ) AS t(rn, name, description, stage, value)
)
INSERT INTO deals (workspace_id, client_id, name, description, stage, value, currency, owner_id, created_by)
SELECT one.workspace_id, co.id, dr.name, dr.description, dr.stage::deal_stage, dr.value, 'EUR', one.user_id, one.user_id
FROM one
JOIN clients_ordered co ON true
JOIN deal_rows dr ON dr.rn = co.rn;
