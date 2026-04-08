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

## Chunk 1: Core PDF Templates + Convention Fix — `[DONE]` 2026-04-08

**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md` §1–6, §13  
**All items shipped.** See `docs/project/shipped.md` for details.

## Bugs & Tech Debt (from Chunk 1 review)

| Status      | Item                                                                                                          | Priority | Notes                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `[SPRINT]`  | **BUG: Price formatting broken on documents** — amounts show "2/ 600€" instead of "2 600,00 €"               | P1       | Likely in `devis.ts` and/or convention pricing section                                           |
| `[SPRINT]`  | Add `timeZone: 'Europe/Paris'` to all `toLocaleTimeString`/`toLocaleDateString` calls in doc templates        | P1       | Cloud hosts run UTC — session times will be wrong in PDFs                                        |
| `[SPRINT]`  | Exhaustive switch for `DocumentType` in `document-generator.ts`                                               | P2       | No `default` branch — new types won't trigger compile errors                                     |
| `[SPRINT]`  | Type the pdfmake import (`esmRequire('pdfmake/js/index.js')` returns `any`)                                   | P2       | Add local interface for type safety                                                              |
| `[SPRINT]`  | Optimize certificat emargements query — filter by `formationId` at DB level                                   | P2       | Fetches ALL emargements for a contact, filters in JS — should use join                           |
| `[BACKLOG]` | Logo WebP/SVG → PNG conversion for professional PDFs                                                          | P3       | Currently skipped; PDFKit only supports PNG/JPEG                                                 |
| `[BACKLOG]` | RLS: scope `formation_documents` table policies to workspace                                                  | P2       | Pre-existing — currently `USING (true) WITH CHECK (true)`                                        |
| `[BACKLOG]` | RLS: scope `formation-documents` storage bucket to workspace                                                  | P2       | Pre-existing — currently permissive                                                              |

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
| `[DONE]`    | Add missing reminder templates (`devis_relance`, `convention_relance`, `ordre_mission_relance`) to `EMAIL_TYPE_TO_TEMPLATE` + Postmark | —  | Shipped 2026-04-08 (Chunk 1) |
| `[DONE]`    | Pass `ctaUrl` in `sendQuestEmail` based on email type                                       | —        | Shipped 2026-04-08 (Chunk 1) |
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

*Dernière mise à jour : 2026-04-08 — Chunk 1 terminé, bugs et tech debt ajoutés suite à revue de code.*
