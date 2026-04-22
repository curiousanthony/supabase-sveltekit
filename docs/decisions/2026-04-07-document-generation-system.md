# Document Generation System — Design Decisions

**Date**: 2026-04-07
**Status**: Accepted
**Context**: Brainstorming session to design the full document generation system for formations. 3 of 7 document types are implemented (convention, convocation, certificat). 4 are stubs. Multiple specialist subagents (Qualiopi expert, UX designer, product analyst) contributed.
**Participants**: User + orchestrated subagent team (Qualiopi, UX, product, data model)

---

## 1. Scope: Which Document Types to Build

**Decision**: Implement **feuille_emargement**, **devis**, and **ordre_mission** in the first chunk. **Defer attestation** to a future chunk that includes a proper evaluation tracking system.

**Rationale**: Attestation requires per-learner evaluation results (compétences acquises, résultats individuels — articles L.6353-1, R.6353-1). The current schema has no structured evaluation data; questionnaires are external URLs (Google Forms). Building attestation without real evaluation data would produce a legally incomplete document. The other 3 types can be built from data that already exists in the schema.

**Consequence**: A future "Evaluation Tracking" feature is a prerequisite for attestation. See §10 below.

---

## 2. Document Lifecycle: Rich States with Automatic Transitions

**Decision**: Use document-type-specific status values, but make **nearly all transitions automatic** (inferred from system events). Marie never manually sets document states — she manages actions (generate, send, mark signed), and the system infers the state.

### Status Sets per Document Type

**Convention / Ordre de mission** (contractual documents):

- `généré` → `envoyé` → `signé` → `archivé`
- `généré → envoyé`: automatic when email sent (formation_emails record created)
- `envoyé → signé`: automatic when related quest sub-action "Obtenir la signature" completed
- `signé → archivé`: automatic when parent quest marked "Terminé"

**Devis** (commercial document):

- `généré` → `envoyé` → `accepté` | `refusé` | `expiré`
- `généré → envoyé`: automatic when email sent
- `envoyé → accepté`: **manual** — Marie clicks "Devis accepté" (business decision learned from client). Triggers convention quest unlock.
- `envoyé → refusé`: **manual** — Marie clicks "Devis refusé"
- `envoyé → expiré`: automatic after configurable validity period (default 30 days)

**Feuille d'émargement** (compliance document):

- `généré` → `signatures_en_cours` → `signé` → `archivé`
- `généré → signatures_en_cours`: automatic when first digital signature collected for the séance
- `signatures_en_cours → signé`: automatic when all expected signatures collected (all émargement rows have `signedAt`)
- `signé → archivé`: automatic when émargement quest completed

**Convocation / Certificat** (existing types, informational documents):

- `généré` → `envoyé` → `archivé`
- All automatic.

**What "draft" means**: There is no explicit "brouillon" state. All documents start as `généré`. If Marie wants to review before sending, she simply doesn't send yet. The quest system tracks whether the send step is completed; the document doesn't need a separate "draft" flag.

**Alternatives considered**:

- UX designer proposed 3 flat states (Généré/Envoyé/Archivé) for all types → rejected because `signé` and `accepté/refusé` are meaningful business events that quests and automations depend on.
- Qualiopi expert proposed 5-6 states with manual transitions → rejected because Marie shouldn't manage document states; the system should infer them.

---

## 3. Feuille d'Émargement: Dual-Mode PDF

**Decision**: Generate **two types of PDF** based on timing and modality, using the existing digital émargement system as the primary signing mechanism.

### Mode 1: Pre-Session Blank Sheet (`emargement_blank`)

- **When generated**: Auto-generated J-1 (24h before séance start) via scheduled trigger
- **For whom**: Présentiel and Hybride modalities only (Distanciel skipped — physical signing impossible)
- **Content**: Pre-filled header (formation name, date, location, horaires, formateur name) + list of apprenants with empty signature cells, split by period (matin/après-midi) per the AM/PM splitting logic
- **Purpose**: Formateur prints it for physical backup. Digital system remains primary.
- **Footer note**: "Cette feuille est un support complémentaire. Les signatures numériques font foi."

### Mode 2: Post-Session Proof (`emargement_proof`)

- **When generated**: Auto-generated after séance ends + all digital signatures collected for that séance
- **For all modalities**: Présentiel, Distanciel, Hybride
- **Content**: Same structure as Mode 1, but signature cells show:
  - Digital signatures: "Signé numériquement le [timestamp]" + signature image thumbnail if captured
  - Unsigned: "Non signé" (in red)
- **Purpose**: Audit-ready proof of attendance for OPCO/Qualiopi auditors
- **Stored as**: `formation_documents` with `type: 'feuille_emargement'`, `relatedSeanceId` set

### Qualiopi Compliance (Q11)

Feuille d'émargement must contain: organisme identity (raison sociale, NDA, adresse), stagiaire identity + signature per demi-journée, formateur identity + signature, intitulé de la formation, dates + horaires, lieu, durée en heures.

**Important**: The digital émargement system already satisfies Q11 (timestamped digital signatures with IP tracking). The PDF is a convenience/archive format, not the source of truth. The `emargements` table is the source of truth.

---

## 4. Devis: Content and Pricing Architecture

**Decision**: Devis PDF generated from formation data + workspace-level financial defaults.

### Pricing Data Model

**Workspace-level defaults** (set once, apply to all formations):

- `tvaRate` (numeric, default 20.0 — some OF are TVA-exonérés at 0%)
- `defaultPaymentTerms` (text, e.g. "30 jours fin de mois, par virement bancaire")
- `defaultDevisValidityDays` (integer, default 30)

**Formation-level** (already exists or to add):

- `prixPublic` (numeric) — programme catalogue price (informational)
- `prixConvenu` (numeric) — actual negotiated price for this formation (may differ from deal or prixPublic). **New field** to add.
- `duree` (integer) — already exists
- Number of participants: count of `formation_apprenants` rows (fix the convention bug at the same time)

**Computed on the PDF** (not stored):

- Prix HT = `prixConvenu` (or `prixPublic` if no negotiated price)
- TVA = Prix HT × workspace `tvaRate` / 100
- Prix TTC = Prix HT + TVA
- Prix par jour = Prix HT / nombre de jours (computed from `duree`)
- Validité = date de génération + workspace `defaultDevisValidityDays`

### Devis PDF Content (Qualiopi Q1)

Required by law: organisme identity (raison sociale, SIRET, NDA, adresse), client identity (nom, adresse), intitulé, dates, durée en heures, nombre de stagiaires, lieu, coût pédagogique (HT + TTC + détail), conditions de paiement, conditions d'annulation, durée de validité, date d'émission.

---

## 5. Ordre de Mission: Content and Data Sources

**Decision**: Generated per formateur per formation, using data from `formation_formateurs` (which already stores `tjm`, `numberOfDays`, `deplacementCost`, `hebergementCost`).

### Data Sources

- Formateur identity: `formateurs` → `users` (nom, prénom)
- Financial terms: `formation_formateurs` (tjm, numberOfDays, déplacement, hébergement) — **already in schema**
- Formation details: name, dates, location, programme summary
- Workspace identity: standard org header

### Ordre de Mission PDF Content (Qualiopi Q17, Q21, Q27)

Required: organisme identity, formateur identity, mission (intitulé + contenu + public), dates + horaires + nombre de jours, lieu, conditions financières (TJM + montant total HT + frais), obligations du formateur (respect programme, émargements, bilan), date d'émission + zone de signature.

**Note on TJM sensitivity**: The Qualiopi expert flagged TJM as sensitive. However, `formation_formateurs.tjm` already exists in the schema as a formation-specific field. No additional storage needed. Access control (who can see TJM) is a permissions concern, not a document generation concern.

---

## 6. Convention Bug Fix + Pricing

**Decision**: Fix the participant count in `document-generator.ts` (convention case).

**Current bug**: `contacts.findMany({ where: eq(contacts.id, formationId) })` — compares contact PK to formation ID. Always returns 0 or wrong results.

**Fix**: Query `formation_apprenants` where `formationId` matches, count rows.

**Also**: Wire `prixConvenu` (or `prixPublic` fallback) into the convention's `pricing.prixTotal` instead of hardcoded `null`.

**Pricing note from brainstorm**: The linked programme has a `prixPublic` (catalogue price), but sometimes the salesperson negotiates a different price in the Deal. `prixConvenu` captures the actual agreed price. The priority is: `prixConvenu` > `prixPublic` > null (show "à définir" on PDF).

---

## 7. Auto-Generation vs Manual Generation

**Decision**: Start with **manual generation** for all types (Marie clicks "Générer" in Documents tab). Auto-generation is a **separate chunk** (Chunk 3) to implement later.

**When auto-generation is built (Chunk 3)**:

- Feuille d'émargement blank: auto J-1 before séance (présentiel/hybride)
- Feuille d'émargement proof: auto after all signatures collected
- Other types: remain manual (convention, devis, ordre de mission all require Marie's judgment on timing)

---

## 8. Regeneration: Prompt-Based

**Decision**: When formation data changes after a document was generated, show a **banner** on the Documents tab: "Les données de la formation ont changé depuis la génération de ce document — Régénérer ?"

- **Not** silent auto-regeneration (too complex for v1, risk of replacing something Marie customized)
- **Not** manual-only (Marie might not notice data changed)
- If document status is `envoyé` or later: prompt says "Ce document a déjà été envoyé. Régénérer et renvoyer ?"

**Implementation detail**: Compare `formation.updatedAt` vs `document.generatedAt`. If formation is newer, show the prompt. (Chunk 2 scope, not Chunk 1.)

---

## 9. Devis ↔ Deal Relationship

**Decision**: Defer deal-level devis generation to **Chunk 4**. For Chunk 1, devis is generated only from the Formation side.

### Context

The app has a Deals feature (stages: Suspect → … → Gagné/Perdu). `closeAndCreateFormation` converts a won deal into a formation. Currently no devis is generated during the deal phase.

### Future Design (Chunk 4)

The commercial devis and the Qualiopi devis are the **same document** in 95% of cases. The recommended flow:

1. Deal stage "Négociation" → Marie generates devis from Deal
2. Devis stored as `formation_documents` with nullable `dealId`
3. Marie sends devis to client
4. Client accepts → Deal won → Formation created via `closeAndCreateFormation`
5. Existing devis is linked to the new formation, `devis` quest auto-completed
6. Marie can regenerate from Formation if terms changed

**Schema change needed** (Chunk 4): Add nullable `dealId` to `formation_documents` or a linking mechanism.

### For Now (Chunk 1)

- Formation without a Deal: Marie generates devis from the Formation Documents tab
- Formation from a Deal: `devis` quest starts "Pas commencé" → Marie generates from Formation
- This is suboptimal (redundant work) but acceptable for v1

---

## 10. Attestation: Deferred — Requires Evaluation Tracking

**Decision**: Do NOT implement attestation PDF in the near-term chunks. It is blocked by a missing feature: **per-learner structured evaluation results**.

### Gap Analysis

Attestation de fin de formation (articles L.6353-1, R.6353-1) must mention:

- Résultats de l'évaluation des acquis (per learner)
- Compétences acquises (individual, not generic)

Current schema has:

- `biblio_questionnaires` with external URLs (Google Forms) — no stored results
- `quest_documents` for generic PDF uploads — not queryable per learner
- `modules.modaliteEvaluation` — metadata only (QCM/QCU/Pratique/Projet)
- No per-learner evaluation fields on `contacts` or `formation_apprenants`

### Future Feature: Evaluation Tracking

When built, this feature should add:

- Per-learner, per-module evaluation results (structured: acquis / en cours / non acquis, or score-based)
- Integration with questionnaire system (even if results remain external, capture a summary)
- Attestation PDF then pulls individual results into the document

### Current Questionnaire System (Gap Analysis)

- `biblio_questionnaires` stores only `titre`, `type` (Test de niveau / Quiz / Audit des besoins), and `url_test` (external URL)
- Linked to programmes via `biblio_programme_questionnaires` and to modules via `biblio_module_questionnaires`
- When a programme is attached to a formation, module-level questionnaire links are copied to `module_questionnaires` (formation-specific)
- **No answers, scores, or results are stored** — everything happens in external tools (Google Forms, Tally)
- Quest sub-actions for evaluations are `confirm-task` and `upload-document` — generic PDF upload, not structured data

The user noted: "Currently questionnaires point to external URLs like Google Forms where learners answer quizzes. Is it related?" — **Yes, directly related.** The attestation needs per-learner results that the questionnaire system currently cannot provide.

### Brainstorming Needed (Future Session)

Before implementing evaluation tracking + attestation, the following must be brainstormed:

- Should results be entered manually by Marie or imported from external tools?
- What granularity? Per-module? Per-objective? Per-competency?
- Should the questionnaire system evolve to capture results internally (built-in quiz builder)?
- How does this interact with the `evaluation_acquis_fin` quest?
- Is there a lightweight middle ground (e.g. Marie enters "acquis / en cours / non acquis" per learner per module)?

---

## 11. Documents Tab UX Improvements (Chunk 2 Scope)

### Decisions Made (to implement in Chunk 2)

**Contextual generation prompts**: When Marie navigates to Documents tab from a quest CTA, show a contextual banner at the top: "Le devis est prêt à être généré — [Générer le devis →]". The system knows which document is needed from the quest context (query param `?quest=devis`).

**Phase grouping**: Documents grouped by quest phase (Conception / Déploiement / Évaluation) instead of a flat list. Per-learner documents (convocation ×5) collapsed under a group row.

**Error states with fix paths**: If generation fails due to missing data, show: "Impossible de générer le devis — Information manquante : Durée du programme — [Compléter dans Programme →]". CTA navigates to the right tab with the field pre-focused.

### Brainstorming Needed (Future Session)

Before implementing Chunk 2, further brainstorm:

- Exact layout of phase groups (visual design, expand/collapse behavior)
- Batch generation for per-learner documents (generate all convocations at once)
- Quest → Documents tab deep-link protocol (query params, scroll behavior, highlighting)
- Whether "Envoyé" status should be tracked on the document or only in `formation_emails`
- The "régénérer" prompt UI (banner position, dismiss behavior)

---

## 12. Email Gaps Discovered

### Missing Reminder Templates

The quest system defines `reminderEmailType` values (`devis_relance`, `convention_relance`, `ordre_mission_relance`) that are **not** in `EMAIL_TYPE_TO_TEMPLATE`. When used, they fall back to the `analyse-besoins` template — wrong template sent.

**Fix needed**: Add these to the template map and create corresponding Postmark templates via `setup-postmark-templates.ts`.

### `ctaUrl` Not Passed in Quest Emails

`sendQuestEmail` in `suivi/+page.server.ts` builds a template model without `ctaUrl`. Many Postmark templates expect `{{#ctaUrl}}` blocks. Emails may render without their CTA button.

**Fix needed**: Pass appropriate `ctaUrl` (e.g. link to the signing page, document download, questionnaire URL) based on email type.

### Priority

These email fixes are **independent** of document generation and can be addressed in any chunk or as standalone fixes.

---

## 13. Workspace Financial Defaults (Schema Addition)

**Decision**: Add workspace-level financial fields to support devis generation and other document types.

**New fields on `workspaces` table**:

- `tvaRate` — numeric, default 20.0
- `defaultPaymentTerms` — text, default "30 jours fin de mois, par virement bancaire"
- `defaultDevisValidityDays` — integer, default 30
- `defaultCancellationTerms` — text, default null (optional boilerplate for conventions/devis)

**New field on `formations` table**:

- `prixConvenu` — numeric, nullable (the actual negotiated price, may differ from `prixPublic`)

---

## 14. Implementation Chunks (Ordered)

### Chunk 1: Core PDF Templates + Convention Fix

- Implement `feuille_emargement` (Mode 2 proof only — Mode 1 blank deferred to Chunk 3 auto-generation)
- Implement `devis` PDF template
- Implement `ordre_mission` PDF template
- Fix convention `nbParticipants` bug
- Wire convention pricing from formation data
- Add `prixConvenu` to formations schema
- Add workspace financial defaults (tvaRate, paymentTerms, validityDays)
- Update `GENERATABLE_TYPES` in Documents tab UI if needed
- Follow existing patterns: pdfmake builder in `document-templates/`, switch case in `document-generator.ts`

### Chunk 2: Document Lifecycle States + Documents Tab UX

- Implement rich status per document type (§2 above)
- Automatic status transitions (email sent → envoyé, quest completed → signé)
- Contextual generation prompts on Documents tab
- Phase grouping in Documents tab
- Error states with fix paths
- Regeneration prompt ("Les données ont changé")
- **Requires further UX brainstorming before implementation** (see §11)

### Chunk 3: Auto-Generation Triggers

- Feuille d'émargement blank (Mode 1) auto-generated J-1 for présentiel/hybride
- Feuille d'émargement proof (Mode 2) auto-generated after all signatures
- Scheduled job infrastructure (SvelteKit cron or Supabase pg_cron)
- **Requires further brainstorming**: cron approach, notification UX for auto-generated docs

### Chunk 4: Deal Devis + Formation Inheritance

- Devis generation from Deal detail page
- `closeAndCreateFormation` inherits devis + auto-completes quest
- `dealId` on `formation_documents` (or linking mechanism)
- "Hérité du deal" badge in Documents tab
- **Requires further brainstorming**: Deal documents UI, what other deal-level documents might exist

### Chunk 5: Attestation + Evaluation Tracking (Future)

- Per-learner evaluation results schema
- Integration with questionnaire system
- Attestation PDF with individual competency results
- **Requires extensive brainstorming** before any implementation (see §10)

---

## 15. Decisions NOT Yet Made (Require Future Brainstorming)

These topics were identified during this session but deferred for focused brainstorming in future sessions:

1. **Evaluation tracking data model** — granularity, manual vs imported results, questionnaire evolution
2. **Documents tab detailed UX** — exact layout, batch generation, deep-link protocol, animation/highlighting
3. **Auto-generation infrastructure** — cron mechanism (SvelteKit scheduled functions vs Supabase pg_cron vs edge functions)
4. **Deal documents UI** — how the Deal detail page surfaces document generation
5. **Devis accepté/refusé UX** — where exactly Marie clicks (quest sub-action? Documents tab? Both?), and what happens to formation status
6. **Document versioning** — when Marie regenerates, replace or keep history? (Current code replaces.)
7. **Émargement Mode 1 (blank) distribution** — email to formateur J-1? Download from app? Both?
8. **Signature overlay on PDFs** (pdf-lib) — for signed convention/ordre de mission return, timing TBD

---

## 16. Cross-Specialist Collaboration Protocol

During this brainstorming session, specialist subagents (Qualiopi, UX, product) sometimes reached contradictory conclusions (e.g. document lifecycle complexity). The resolution protocol used:

1. Each specialist produces findings independently
2. The orchestrator identifies tensions between specialists
3. A synthesis subagent receives both positions and produces a consensus recommendation
4. The user makes the final call on unresolved tensions

**Action item**: Update the team-driven-development skill or team orchestrator rule to formalize this "cross-pollination" step — after parallel subagents return, if tensions exist, launch a synthesis subagent that receives all prior outputs and must produce a single recommendation before presenting to the user.

---

*This document supersedes the document generation sections of `.cursor/plans/formation_documents_&_ux_dd1d82b4.plan.md` for design decisions. The plan file retains value for implementation details not covered here.*