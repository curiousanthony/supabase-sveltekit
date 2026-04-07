# Current Sprint

Active sprint items and progress.

**Sprint**: Document Generation — Chunk 1  
**Branch**: `feat/formations-v2`  
**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md`

## Goals

1. **3 new PDF types** — `feuille_emargement` (post-session proof), `devis`, `ordre_mission` are fully generatable from the Documents tab.
2. **Convention fix** — Correct participant count + wire real pricing data.
3. **Schema additions** — `formations.prixConvenu`, workspace financial defaults.

## Items

| Status      | Item                                                                 | Priority | Notes                                                          |
| ----------- | -------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| `[SPRINT]`  | Schema: `prixConvenu` on formations + workspace financial defaults   | P1       | Migration required                                             |
| `[SPRINT]`  | Fix convention `nbParticipants` (query `formation_apprenants`)       | P1       | `document-generator.ts`                                        |
| `[SPRINT]`  | Wire convention pricing (`prixConvenu` / `prixPublic` fallback)      | P1       | Same file + `convention.ts` template                           |
| `[SPRINT]`  | `feuille_emargement` PDF (Mode 2: proof with signature data)        | P1       | Per-séance, per-period. See decisions §3                       |
| `[SPRINT]`  | `devis` PDF template                                                 | P1       | Workspace defaults + formation pricing. See decisions §4       |
| `[SPRINT]`  | `ordre_mission` PDF template                                         | P1       | Per-formateur. `formation_formateurs` data. See decisions §5   |
| `[SPRINT]`  | Update Documents tab UI (pickers for séance / formateur)             | P1       | `GENERATABLE_TYPES`, `NEEDS_SEANCE`, `NEEDS_FORMATEUR`         |

## Email Fixes (can be included if capacity allows)

| Status      | Item                                                                                     | Priority | Notes                              |
| ----------- | ---------------------------------------------------------------------------------------- | -------- | ---------------------------------- |
| `[BACKLOG]` | Add `devis_relance`, `convention_relance`, `ordre_mission_relance` to template map       | P1       | Wrong template sent currently      |
| `[BACKLOG]` | Pass `ctaUrl` in `sendQuestEmail`                                                        | P1       | CTA buttons missing in emails      |

## Definition of Done

- All 3 new PDF types generate successfully from the Documents tab
- Convention PDF shows correct participant count and pricing
- Existing tests pass; new template builders have unit tests
- Documents tab UI allows selecting séance (for émargement) and formateur (for ordre de mission)

## What Comes Next (After This Sprint)

**Chunk 2**: Document lifecycle states + Documents tab UX improvements. **Requires further brainstorming** on: exact UX layout, batch generation, quest→Documents deep-link protocol, regeneration prompt design. See `docs/decisions/2026-04-07-document-generation-system.md` §11 and §15.

## Retrospective

*À compléter en fin de sprint.*

---

*Dernière mise à jour : 2026-04-07.*
