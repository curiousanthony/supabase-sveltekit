-- Part 1: Add new enum types and expand statuts_formation
-- Must be in separate transaction so new values are committed before use

DO $$ BEGIN
  CREATE TYPE "formation_type" AS ENUM ('Intra', 'Inter', 'CPF');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "action_status" AS ENUM ('Pas commencé', 'En cours', 'Terminé');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "action_etape" AS ENUM (
    'Récapitulatif',
    'Convention et programme',
    'Audit des besoins',
    'Convocations',
    'Test de positionnement',
    'Certificat de réalisation',
    'Questionnaires de satisfaction',
    'Émargement',
    'Ordre de mission',
    'Formateur',
    'Facturation',
    'Récap final'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'statuts_formation' AND e.enumlabel = 'En cours'
  ) THEN
    EXECUTE $$ALTER TYPE "statuts_formation" ADD VALUE IF NOT EXISTS 'À traiter' BEFORE 'En cours'$$;
    EXECUTE $$ALTER TYPE "statuts_formation" ADD VALUE IF NOT EXISTS 'Signature convention' BEFORE 'En cours'$$;
    EXECUTE $$ALTER TYPE "statuts_formation" ADD VALUE IF NOT EXISTS 'Financement' BEFORE 'En cours'$$;
    EXECUTE $$ALTER TYPE "statuts_formation" ADD VALUE IF NOT EXISTS 'Planification' BEFORE 'En cours'$$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'statuts_formation' AND e.enumlabel = 'Terminée'
  ) THEN
    EXECUTE $$ALTER TYPE "statuts_formation" ADD VALUE IF NOT EXISTS 'Archivée' AFTER 'Terminée'$$;
  END IF;
END $$;
