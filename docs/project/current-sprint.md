# Current Sprint

Active sprint items and progress.

**Sprint**: Chunk 1 — Core PDF Templates + Convention Fix
**Branch**: `feat/formations-v2`
**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md` §1–6, §13

## Goals

1. **3 new PDF types** — `feuille_emargement` (proof mode), `devis`, `ordre_mission` — following existing pdfmake patterns.
2. **Convention fix** — Correct participant count + wire real pricing.
3. **Schema additions** — `prixConvenu` on formations, workspace financial defaults.

## Items

| Status      | Item                                                          | Priority | Notes                                                   |
| ----------- | ------------------------------------------------------------- | -------- | ------------------------------------------------------- |
| `[SPRINT]`  | `feuille_emargement` proof PDF template                       | P1       | Post-séance. Données: séance + émargements signés.      |
| `[SPRINT]`  | `devis` PDF template                                          | P1       | Formation + client + pricing + workspace defaults.      |
| `[SPRINT]`  | `ordre_mission` PDF template                                  | P1       | Formateur + formation + TJM/frais.                      |
| `[SPRINT]`  | Fix convention `nbParticipants`                               | P1       | `formation_apprenants` count, not broken query.         |
| `[SPRINT]`  | Wire convention pricing (`prixConvenu` / `prixPublic`)        | P1       | Currently hardcoded `null`.                             |
| `[SPRINT]`  | Schema: `prixConvenu` on `formations`                         | P1       | Drizzle migration.                                      |
| `[SPRINT]`  | Schema: workspace financial defaults                          | P1       | `tvaRate`, `defaultPaymentTerms`, `defaultDevisValidityDays`. |
| `[SPRINT]`  | Update `GENERATABLE_TYPES` in Documents tab UI                | P1       | Add `feuille_emargement` to dropdown.                   |

## Definition of Done

- All 3 new PDF types generate a valid, downloadable PDF from the Documents tab
- Convention PDF shows correct participant count and real pricing
- Workspace settings page exposes financial defaults (or migration seeds sensible defaults)
- Existing tests pass; new template builders have basic test coverage
- Documents tab lets Marie generate all 6 implemented types (convention, convocation, certificat, feuille_emargement, devis, ordre_mission)

## What Comes After (Do NOT Start Without Brainstorming)

- **Chunk 2**: Document lifecycle states + Documents tab UX — requires UX brainstorming session
- **Chunk 3**: Auto-generation triggers — requires cron infrastructure decision
- See `docs/project/backlog.md` for full chunk breakdown

## Retrospective

*À compléter en fin de sprint.*

---

*Dernière mise à jour : 2026-04-07.*
