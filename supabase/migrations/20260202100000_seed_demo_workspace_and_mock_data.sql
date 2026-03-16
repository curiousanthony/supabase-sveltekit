-- Seed a demo workspace + demo user and mock data for remote/production testing.
-- Idempotent: safe to run multiple times. Use fixed UUIDs for demo workspace and user.
-- To access this data: add your auth user to the workspace "Espace démo" (see docs).

-- Demo workspace and user (fixed UUIDs for idempotency)
INSERT INTO workspaces (id, name)
VALUES ('b0000001-0000-4000-8000-000000000001'::uuid, 'Espace démo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, created_at)
VALUES ('b0000002-0000-4000-8000-000000000002'::uuid, 'demo@example.com', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO workspaces_users (workspace_id, user_id, role)
VALUES ('b0000001-0000-4000-8000-000000000001'::uuid, 'b0000002-0000-4000-8000-000000000002'::uuid, 'owner')
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Formateur users (if not already present from 20260130120000)
INSERT INTO users (id, email, created_at)
VALUES
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'formateur1@seed.local', now()),
  ('a0000002-0000-4000-8000-000000000002'::uuid, 'formateur2@seed.local', now())
ON CONFLICT (id) DO NOTHING;

-- Formateurs (2 rows)
INSERT INTO formateurs (user_id, ville, description, taux_horaire_min, taux_horaire_max, rating)
SELECT u.id, 'Paris', 'Formateur expert – management et leadership', 200, 400, 4.5
FROM users u
WHERE u.id = 'a0000001-0000-4000-8000-000000000001'::uuid
  AND NOT EXISTS (SELECT 1 FROM formateurs f WHERE f.user_id = u.id);
INSERT INTO formateurs (user_id, ville, description, taux_horaire_min, taux_horaire_max, rating)
SELECT u.id, 'Lyon', 'Formateur – digital et stratégie', 180, 380, 4.2
FROM users u
WHERE u.id = 'a0000002-0000-4000-8000-000000000002'::uuid
  AND NOT EXISTS (SELECT 1 FROM formateurs f WHERE f.user_id = u.id);

-- Clients (3 rows) for demo workspace only when not already present
INSERT INTO clients (workspace_id, created_by, type, legal_name, email)
SELECT
  'b0000001-0000-4000-8000-000000000001'::uuid,
  'b0000002-0000-4000-8000-000000000002'::uuid,
  v.type::type_client,
  v.legal_name,
  v.email
FROM (VALUES
  ('Entreprise', 'Acme Corp', 'contact@acme.example.com'),
  ('Entreprise', 'Globex Corporation', 'info@globex.example.com'),
  ('Particulier', 'Jean Dupont', 'jean.dupont@example.com')
) AS v(type, legal_name, email)
WHERE NOT EXISTS (
  SELECT 1 FROM clients c
  WHERE c.workspace_id = 'b0000001-0000-4000-8000-000000000001'::uuid
  LIMIT 1
);

-- Formations (3 rows) for demo workspace only when not already present
INSERT INTO formations (workspace_id, created_by, name, description, duree, modalite, statut, id_in_workspace, type_financement)
SELECT
  'b0000001-0000-4000-8000-000000000001'::uuid,
  'b0000002-0000-4000-8000-000000000002'::uuid,
  v.name,
  v.description,
  v.duree,
  v.modalite::modalites,
  v.statut::statuts_formation,
  v.id_in_workspace,
  v.type_financement::types_financement
FROM (VALUES
  ('Formation Leadership', 'Pilotage d’équipe et prise de décision', 14, 'Présentiel', 'En cours', 1, 'Intra'),
  ('Formation Excel avancé', 'Tableaux croisés, formules, macros', 7, 'Hybride', 'En attente', 2, 'CPF'),
  ('Anglais business', 'Communication professionnelle en anglais', 21, 'Distanciel', 'Terminée', 3, 'OPCO')
) AS v(name, description, duree, modalite, statut, id_in_workspace, type_financement)
WHERE NOT EXISTS (
  SELECT 1 FROM formations f
  WHERE f.workspace_id = 'b0000001-0000-4000-8000-000000000001'::uuid
  LIMIT 1
);

-- Deals seed removed (no sample deals for demo workspace)
