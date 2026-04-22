-- Chunk 1: Add prixConvenu to formations + workspace financial defaults

ALTER TABLE "formations"
  ADD COLUMN "prix_convenu" numeric(12, 2);

ALTER TABLE "workspaces"
  ADD COLUMN "tva_rate" numeric(5, 2) DEFAULT '20.00',
  ADD COLUMN "default_payment_terms" text DEFAULT '30 jours fin de mois, par virement bancaire',
  ADD COLUMN "default_devis_validity_days" integer DEFAULT 30,
  ADD COLUMN "default_cancellation_terms" text;
