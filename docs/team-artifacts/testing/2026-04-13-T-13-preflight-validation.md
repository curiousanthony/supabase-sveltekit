# T-13 — Preflight Validation: Test Plan

**Date**: 2026-04-13
**Ticket**: T-13
**File**: `src/lib/preflight/document-preflight.test.ts`

---

## Feature

Pre-flight validation module `src/lib/preflight/document-preflight.ts` — shared client/server rules that block or warn before document generation.

---

## Edge Cases Enumerated

1. Missing client for any document type (devis, convention) — legally required → **block**
2. OPCO financing present but workspace NDA number absent → **warn** for devis, **block** for certificat
3. B2C (Particulier client) + formation starts in < 10 days → retractation **warn**
4. B2C + formation starts in ≥ 10 days → no retractation
5. B2C + no dateDebut → no retractation (cannot compute)
6. Entreprise client + imminent start → no retractation (B2C rule does not apply)
7. Convention: no accepted devis → **prerequisite** (generation blocked, no field focus)
8. Feuille d'émargement: no seanceId → **block** to Séances tab
9. Convocation: no learner with email → **block** to Apprenants tab
10. Convocation: convention not signed → **prerequisite** (no focusKey)
11. Certificat: unsigned émargements → **block**
12. Certificat: OPCO + no NDA → **block** (stricter than devis)
13. Prerequisite items must never carry `focusKey` (plan constraint)
14. `assertPreflightOrThrow` must throw on any block or prerequisite item
15. `assertPreflightOrThrow` must NOT throw on warn-only result
16. `assertPreflightOrThrow` must NOT throw on empty result
17. Cross-type isolation: rules for type A must not fire for type B
18. `blockingCount` = count of block + prerequisite; `warningCount` = count of warn only

---

## Test Suites

### `src/lib/preflight/document-preflight.test.ts`

| Test group | Tests | Validates |
|---|---|---|
| `PreflightItem shape` | 2 | Required fields present; prerequisite has no focusKey |
| `evaluatePreflight return shape` | 3 | Returns `items`, `blockingCount`, `warningCount`; counts are accurate |
| `evaluatePreflight — devis` | 8 | Missing client → block on fiche; OPCO+no NDA → warn (not block); NDA present → no warn; non-OPCO → no warn; B2C in 8d → warn; B2C in 15d → no warn; Entreprise → no warn; null dateDebut → no warn |
| `evaluatePreflight — convention` | 5 | No accepted devis → prerequisite; prerequisite has no focusKey; missing client → block; all present → no blocking; prerequisite counted in blockingCount |
| `evaluatePreflight — feuille_emargement` | 3 | No seanceId → block on seances tab; block has hrefPath with 'seances'; seanceId present → no blocking |
| `evaluatePreflight — convocation` | 4 | No email → block to apprenants; unsigned convention → prerequisite; prerequisite has no focusKey; both OK → no blocking |
| `evaluatePreflight — certificat` | 4 | Unsigned émargements → block; OPCO+no NDA → block; OPCO+NDA+signed → no blocking; Inter+no NDA+signed → no blocking |
| `evaluatePreflight — cross-type isolation` | 2 | Devis doesn't produce seance block; feuille_emargement doesn't produce prerequisite |
| `assertPreflightOrThrow` | 5 | Throws on block items; throws on prerequisite items; no throw on warn-only; no throw on empty; error contains diagnostic info |

**Total**: 36 test cases

---

## Coverage Gaps

- **Server action integration** (`documents/+page.server.ts` calling `assertPreflightOrThrow`): deferred — requires testing the SvelteKit server action layer; too much mock surface for pure TDD phase. Implementer should add integration tests once server action exists.
- **`suivi/+page.server.ts` parity** (Task 6): same deferral — pure unit logic is covered; server-layer integration test to be added when `suivi-parity` task is implemented.
- **UI rendering** of checklist items: covered by QA phase (Playwright + Marie persona), not Vitest.
- **Concurrent generation** (race condition): not applicable to pure preflight logic; relevant to DB transaction layer (existing `document-lifecycle.test.ts` covers this).
- **`ordre_mission`**: not in the T-13 testing checklist; no special preflight rules identified in plan.

---

## Test File Paths

- `src/lib/preflight/document-preflight.test.ts` — **36 tests, all RED (module does not exist yet)**
