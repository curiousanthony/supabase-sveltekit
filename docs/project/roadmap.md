# Roadmap

High-level product direction for Mentore Manager.

## Current Focus: Document Generation System

**Branch**: `feat/formations-v2`  
**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md`

### Chunk 1 — Core PDF Templates + Convention Fix (next)

Implement the 3 remaining PDF types (`feuille_emargement`, `devis`, `ordre_mission`), fix the convention participant count bug, wire pricing into convention/devis. Add schema fields: `formations.prixConvenu`, workspace financial defaults (`tvaRate`, `defaultPaymentTerms`, `defaultDevisValidityDays`). Follow existing pdfmake patterns.

**Prerequisite**: None — data already available in schema (+ small schema additions above).

### Chunk 2 — Document Lifecycle States + Documents Tab UX

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

- **Email fixes** — Add missing reminder templates to `EMAIL_TYPE_TO_TEMPLATE`, pass `ctaUrl` in quest emails. Can ship anytime.
- **Postmark webhooks** — Delivery/bounce tracking. Independent of document generation.

## Future

- **E-mail produit unifié** — Invitations workspace, parcours CRM sur Postmark.
- **Signature overlay sur PDF** (`pdf-lib`) — Apposition de signatures sur convention/ordre de mission retournés signés.
- **Alignement spec suivi** — Envoi auto `reglement_interieur`, écarts spec vs code.

## Completed Milestones

- **Vague 2 — Séances + émargement (2026 Q2)** — Décisions: `docs/decisions/2026-04-02-wave2-seances-emargement-decisions.md`. Découpe AM/PM, module–formateur, émargement formateur, Postmark (individuel + masse), création par lot, UX calendrier.
- **E-mails formation via Postmark** — Templates séances (liens signature) + suivi (quêtes) ; journalisation `formation_emails`.
- **Documents formation (partiel)** — Convention, convocation, certificat (PDF + stockage) ; onglet Documents et actions serveur pour tous les types déclarés.

---

*Dernière mise à jour : 2026-04-07 — restructuré en chunks suite au brainstorming document generation.*
