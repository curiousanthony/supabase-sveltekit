-- Bibliothèque (Library) feature: reference data, library modules/programmes, formation/deal extensions

-- Enum for module evaluation mode (per-module, Qualiopi)
DO $$ BEGIN
  CREATE TYPE modalites_evaluation AS ENUM (
    'QCM de fin de formation',
    'Mise en situation pratique',
    'Étude de cas complexe',
    'Entretien avec le formateur'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Reference data (workspace-scoped)
CREATE TABLE IF NOT EXISTS target_publics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS prerequisites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Library modules (templates)
CREATE TABLE IF NOT EXISTS library_modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  titre text NOT NULL,
  duree_hours numeric NOT NULL,
  objectifs_pedagogiques text NOT NULL,
  modalite_evaluation modalites_evaluation NOT NULL
);

-- Library programmes (templates)
CREATE TABLE IF NOT EXISTS library_programmes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  titre text NOT NULL,
  duree integer NOT NULL,
  topic_id uuid REFERENCES thematiques(id) ON UPDATE CASCADE ON DELETE SET NULL,
  modalite modalites NOT NULL,
  objectifs text
);

-- Extend modules (formations) with per-module evaluation
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS objectifs_pedagogiques text,
  ADD COLUMN IF NOT EXISTS modalite_evaluation modalites_evaluation;

-- Extend deals with optional library programme link
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS library_programme_id uuid REFERENCES library_programmes(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Junction: library programme <-> target publics
CREATE TABLE IF NOT EXISTS library_programme_target_publics (
  library_programme_id uuid NOT NULL REFERENCES library_programmes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  target_public_id uuid NOT NULL REFERENCES target_publics(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE(library_programme_id, target_public_id)
);

-- Junction: library programme <-> prerequisites
CREATE TABLE IF NOT EXISTS library_programme_prerequisites (
  library_programme_id uuid NOT NULL REFERENCES library_programmes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  prerequisite_id uuid NOT NULL REFERENCES prerequisites(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE(library_programme_id, prerequisite_id)
);

-- Junction: library programme <-> library modules (ordered)
CREATE TABLE IF NOT EXISTS library_programme_modules (
  library_programme_id uuid NOT NULL REFERENCES library_programmes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  library_module_id uuid NOT NULL REFERENCES library_modules(id) ON UPDATE CASCADE ON DELETE CASCADE,
  order_index integer NOT NULL
);

-- Junction: formation <-> target publics
CREATE TABLE IF NOT EXISTS formation_target_publics (
  formation_id uuid NOT NULL REFERENCES formations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  target_public_id uuid NOT NULL REFERENCES target_publics(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Junction: formation <-> prerequisites
CREATE TABLE IF NOT EXISTS formation_prerequisites (
  formation_id uuid NOT NULL REFERENCES formations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  prerequisite_id uuid NOT NULL REFERENCES prerequisites(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_target_publics_workspace_id ON target_publics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prerequisites_workspace_id ON prerequisites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_library_modules_workspace_id ON library_modules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_library_programmes_workspace_id ON library_programmes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_library_programme_modules_programme ON library_programme_modules(library_programme_id);
CREATE INDEX IF NOT EXISTS idx_formation_target_publics_formation ON formation_target_publics(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_prerequisites_formation ON formation_prerequisites(formation_id);
