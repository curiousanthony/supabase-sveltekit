# Backlog

All work items for Mentore Manager, tagged by status and priority.

## Status Tags

- `[BACKLOG]` — not yet scheduled
- `[SPRINT]` — in current sprint
- `[IN PROGRESS]` — actively being worked on
- `[DONE]` — completed, not yet deployed
- `[SHIPPED]` — deployed to production
- `[CANCELLED]` — no longer needed

## Priority Levels

- **P0** — Critical, blocks other work
- **P1** — High priority, current sprint
- **P2** — Medium, next sprint
- **P3** — Low, someday/maybe

---

## Chunk 1: Core PDF Templates + Convention Fix

**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md` §1–6, §13

| Status      | Item                                                                                                  | Priority | Notes                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `[SPRINT]`  | Schema: add `prixConvenu` (numeric, nullable) to `formations`                                         | P1       | Actual negotiated price; distinct from `prixPublic` (catalogue price)                              |
| `[SPRINT]`  | Schema: add workspace financial defaults (`tvaRate`, `defaultPaymentTerms`, `defaultDevisValidityDays`, `defaultCancellationTerms`) | P1 | Set once, used by devis + convention PDFs |
| `[SPRINT]`  | Fix convention `nbParticipants` bug — query `formation_apprenants` not `contacts.id = formationId`    | P1       | `document-generator.ts` convention case                                                            |
| `[SPRINT]`  | Wire convention pricing from formation data (`prixConvenu` or `prixPublic` fallback) instead of `null` | P1      | Same file, convention case                                                                         |
| `[SPRINT]`  | Implement `feuille_emargement` PDF template (Mode 2: post-session proof with signature data)          | P1       | Per-séance, per-period (AM/PM). Shows digital signature timestamps. See decisions §3               |
| `[SPRINT]`  | Implement `devis` PDF template                                                                        | P1       | Uses workspace financial defaults + `prixConvenu`. See decisions §4                                |
| `[SPRINT]`  | Implement `ordre_mission` PDF template                                                                | P1       | Per-formateur per-formation. Uses `formation_formateurs` TJM data. See decisions §5                |
| `[SPRINT]`  | Update `GENERATABLE_TYPES` and pickers in Documents tab UI for new types                              | P1       | `feuille_emargement` needs séance picker; `ordre_mission` needs formateur picker (already exists)  |

## Chunk 2: Document Lifecycle States + Documents Tab UX

**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md` §2, §8, §11  
**Requires further brainstorming before implementation** (see decisions §11 + §15)

| Status      | Item                                                                                      | Priority | Notes                                                            |
| ----------- | ----------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `[BACKLOG]` | Implement rich status per document type (généré/envoyé/signé/accepté/refusé/archivé)      | P1       | Automatic transitions from system events; see decisions §2       |
| `[BACKLOG]` | Contextual generation prompts on Documents tab (quest-driven)                             | P1       | Banner: "Le devis est prêt à être généré" when quest context set |
| `[BACKLOG]` | Phase grouping in Documents tab (Conception / Déploiement / Évaluation)                   | P2       | Replaces flat list; per-learner docs collapsed                   |
| `[BACKLOG]` | Regeneration prompt ("Les données ont changé — Régénérer ?")                              | P2       | Compare `formation.updatedAt` vs `document.generatedAt`          |
| `[BACKLOG]` | Error states with fix paths ("Information manquante : X — [Compléter →]")                 | P2       | Navigate to correct tab with field focus                         |
| `[BACKLOG]` | Batch generation for per-learner documents (all convocations at once)                     | P2       | UX brainstorming needed                                          |

## Chunk 3: Auto-Generation Triggers

**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md` §3, §7  
**Requires further brainstorming**: cron approach, notification UX

| Status      | Item                                                                                        | Priority | Notes                                                               |
| ----------- | ------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `[BACKLOG]` | Auto-generate `emargement_blank` J-1 before séance (présentiel/hybride only)                | P2       | Mode 1 blank sheet for physical backup                              |
| `[BACKLOG]` | Auto-generate `emargement_proof` after all signatures collected for a séance                 | P2       | Mode 2 proof; status auto → `signé`                                 |
| `[BACKLOG]` | Scheduled job infrastructure (SvelteKit cron / Supabase pg_cron / edge functions)            | P2       | Approach TBD                                                        |
| `[BACKLOG]` | Notification UX for auto-generated documents ("Nouveau" badge, etc.)                         | P3       | Silent generation; discover in Documents tab                        |

## Chunk 4: Deal Devis + Formation Inheritance

**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md` §9  
**Requires further brainstorming**: Deal documents UI, other deal-level documents

| Status      | Item                                                                                   | Priority | Notes                                                              |
| ----------- | -------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `[BACKLOG]` | Add devis generation to Deal detail page (visible from "Négociation" stage)            | P2       | Same PDF template as formation devis                               |
| `[BACKLOG]` | Schema: add nullable `dealId` to `formation_documents` (or linking mechanism)          | P2       | Allows pre-formation documents                                     |
| `[BACKLOG]` | `closeAndCreateFormation` inherits devis + auto-completes `devis` quest                | P2       | Bridge deal → formation                                            |
| `[BACKLOG]` | "Hérité du deal" badge in Documents tab                                                | P3       | Visual indicator of document origin                                |

## Chunk 5: Attestation + Evaluation Tracking (Future)

**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md` §10  
**Requires extensive brainstorming** before any implementation

| Status      | Item                                                                                    | Priority | Notes                                                            |
| ----------- | --------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `[BACKLOG]` | Design per-learner evaluation results schema                                            | P2       | Granularity TBD (per-module? per-objective? score-based?)        |
| `[BACKLOG]` | Implement evaluation tracking feature                                                   | P2       | Manual entry vs import from external tools — TBD                 |
| `[BACKLOG]` | Implement `attestation` PDF template with individual evaluation results                 | P2       | Blocked by evaluation tracking; articles L.6353-1, R.6353-1      |
| `[BACKLOG]` | Questionnaire system evolution (capture results internally?)                            | P3       | Currently external URLs only                                     |

## Email Fixes (Independent — Any Chunk)

| Status      | Item                                                                                        | Priority | Notes                                                        |
| ----------- | ------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| `[SHIPPED]` | Envoi liens émargement (apprenant + formateur) via templates Postmark                       | —        | `seances/+page.server.ts`                                    |
| `[SHIPPED]` | Envoi e-mails quête suivi via `sendQuestEmail` + `EMAIL_TYPE_TO_TEMPLATE`                   | —        | `suivi/+page.server.ts`                                      |
| `[BACKLOG]` | Add missing reminder templates (`devis_relance`, `convention_relance`, `ordre_mission_relance`) to `EMAIL_TYPE_TO_TEMPLATE` + Postmark | P1 | Currently falls back to wrong template |
| `[BACKLOG]` | Pass `ctaUrl` in `sendQuestEmail` based on email type                                       | P1       | Many templates expect `{{#ctaUrl}}` but get none             |
| `[BACKLOG]` | Webhook Postmark (delivery, bounce, spam) → mise à jour `formation_emails.status`           | P2       | Pas d'endpoint webhook dans le dépôt                         |
| `[BACKLOG]` | Brancher ou retirer `sendFormationEmail` (HTML brut) — aucun appel route                    | P3       | `email-service.ts`                                           |
| `[BACKLOG]` | Unifier envoi invitation workspace sur Postmark (optionnel)                                 | P3       | Aujourd'hui token + copie lien                               |

## Other

| Status      | Item                                                                     | Priority | Notes                                                             |
| ----------- | ------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------- |
| `[BACKLOG]` | Vérifier / implémenter envoi auto `reglement_interieur` (spec suivi HUD) | P2       | `docs/specs/formations/2026-03-24-suivi-tab-hud-banner-design.md` |
| `[BACKLOG]` | Apposition signatures sur PDF (`pdf-lib`)                                | P3       | Deferred; timing TBD                                              |

## Hors périmètre Postmark (information)

- E-mails **Supabase Auth** (reset, confirmation, etc.) restent gérés par Supabase, pas Postmark.

---

*Dernière mise à jour : 2026-04-07 — restructuré en chunks suite à la session brainstorming (`docs/decisions/2026-04-07-document-generation-system.md`).*
