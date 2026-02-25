-- Expand contact_role enum with comprehensive company role options
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'PDG / Président';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Directeur Général';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Directeur des Ressources Humaines';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Responsable Formation';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Directeur Commercial';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Responsable Commercial';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Directeur Marketing';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Directeur Financier';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Directeur des Opérations';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Directeur Technique';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Office Manager';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Assistante de Direction';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Chef de Projet';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Responsable des Achats';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Consultant';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Gérant';
ALTER TYPE "public"."contact_role" ADD VALUE IF NOT EXISTS 'Associé';
