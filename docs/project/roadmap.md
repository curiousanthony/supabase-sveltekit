# Roadmap

High-level product direction for Mentore Manager.

## Current Focus: Document Generation System

**Branch**: `feat/formations-v2`  
**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md`

### Immediate — Chunk 1 Bug Fixes + Tech Debt

Price formatting bug on generated documents (P1), timezone-safe date/time formatting (P1), plus code quality improvements from reviewer audit (exhaustive switch, typed pdfmake import, optimized DB query). See `docs/project/current-sprint.md` for full list.

### Chunk 2 — Document Lifecycle States + Documents Tab UX (next)

Rich document statuses per type (automatic transitions), contextual generation prompts, phase grouping, regeneration prompts, error states with fix paths. **Requires further UX brainstorming before implementation.**

**Prerequisite**: Chunk 1 (documents must exist to have lifecycle).

### Chunk 3 — Auto-Generation Triggers

Feuille d'émargement auto J-1 (présentiel blank), auto post-session (proof), scheduled job infrastructure. **Requires brainstorming on cron approach.**

**Prerequisite**: Chunk 1 (PDF templates) + Chunk 2 (lifecycle states for auto-transitions).

### Chunk 4 — Deal Devis + Formation Inheritance

Generate devis from Deal detail page. `closeAndCreateFormation` inherits devis + auto-completes quest. **Requires brainstorming on Deal documents UI.**

**Prerequisite**: Chunk 1 (devis PDF template).

### Chunk 5 — Attestation + Evaluation Tracking (future)

Per-learner evaluation results schema, attestation PDF with individual competency data. **Requires extensive brainstorming** — data model, questionnaire evolution, manual vs import.

**Prerequisite**: Evaluation tracking feature (does not exist yet).

## Parallel Tracks (Independent of Chunks)

- **Postmark webhooks** — Delivery/bounce tracking. Independent of document generation.
- **RLS hardening** — `formation_documents` table and `formation-documents` storage bucket need workspace-scoped policies (currently permissive).

## Future

- **E-mail produit unifié** — Invitations workspace, parcours CRM sur Postmark.
- **Signature overlay sur PDF** (`pdf-lib`) — Apposition de signatures sur convention/ordre de mission retournés signés.
- **Alignement spec suivi** — Envoi auto `reglement_interieur`, écarts spec vs code.

## Completed Milestones

- **Chunk 1 — Core PDF Templates + Convention Fix (2026-04-08)** — 3 nouveaux PDF (`feuille_emargement`, `devis`, `ordre_mission`), convention corrigée (participants + tarifs), schéma `prixConvenu` + workspace defaults, emails relance + `ctaUrl`, sécurité (enrollment checks). Voir `docs/project/shipped.md`.
- **Vague 2 — Séances + émargement (2026 Q2)** — Décisions: `docs/decisions/2026-04-02-wave2-seances-emargement-decisions.md`. Découpe AM/PM, module–formateur, émargement formateur, Postmark (individuel + masse), création par lot, UX calendrier.
- **E-mails formation via Postmark** — Templates séances (liens signature) + suivi (quêtes) ; journalisation `formation_emails`.
- **Documents formation (partiel)** — Convention, convocation, certificat (PDF + stockage) ; onglet Documents et actions serveur pour tous les types déclarés.

---

*Dernière mise à jour : 2026-04-08 — Chunk 1 terminé, focus sur bug fixes + préparation Chunk 2.*
