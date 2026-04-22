# T-14 — Batch Generation: Test Plan

**Date:** 2026-04-20
**Ticket:** T-14
**Author:** test-engineer
**Status:** RED — all failing tests written; awaiting implementation

---

## 1. Feature

`generateForAll` server action for batch generation of `convocation` / `certificat` documents across all eligible learners in a formation. Includes per-learner email preflight (new `contactEmail` field on `PreflightContext`), formation-level prereq gate, audit logging with shared `batchId`, idempotency (skip `envoye`), cancellation signal, and concurrency cap of 3.

---

## 2. Edge Cases Enumerated

- **No workspace** → 401 (session-less caller)
- **Session missing** → 401 (workspace found but no user in session)
- **Formation not owned** → 403 (workspace mismatch)
- **Invalid type** → 400 (`type` is not `convocation` or `certificat`)
- **Formation-level prereq fails** → 400 with `formationBlocks` payload (e.g. unsigned convention for convocation; no per-learner loop entered)
- **Warnings not acknowledged** → 400 (OPCO/NDA warning requires ack before batch)
- **Happy path: N learners, all ready** → N `done` results, N audit rows, shared `batchId`
- **Idempotency: learner with `envoye` doc** → `skipped, reason: already_sent`, no `generateDocument` call
- **Per-learner email missing (`null`)** → `failed`, `blockingIds: ['email_apprenant_manquant']`
- **Per-learner email empty string** → same as `null` (treat as missing)
- **Audit log failure** → result for that learner is `failed, reason: 'audit_log_failed'` (NOT silently swallowed — architect caveat 1)
- **Cancellation (AbortSignal aborted mid-batch)** → only in-flight learners complete; remaining absent from results
- **Concurrency cap** → peak concurrent `generateDocument` invocations ≤ 3 with 7 learners
- **`certificat` + no email** → no email block (certificat does not check email — cross-type isolation)
- **Formation-mode semantics preserved** → `convocation` without `contactId` still uses `hasLearnerWithEmail` aggregate

---

## 3. Test Suites

### Suite A — `src/lib/preflight/document-preflight.test.ts` (extended)

New `describe('evaluatePreflight — per-learner mode (batch)')` block, 6 tests:

| Test name | Validates |
|---|---|
| `convocation + contactId + contactEmail: null → BLOCK with per-learner message` | New per-learner email check; message must be "L'apprenant n'a pas d'adresse e-mail" |
| `convocation + contactId + valid contactEmail → no email block` | Per-learner mode: valid email clears email block |
| `convocation + NO contactId + hasLearnerWithEmail: true → no block (formation-mode preserved)` | Backward compat: single-doc UI mode unchanged |
| `convocation + NO contactId + hasLearnerWithEmail: false → BLOCK (formation-mode preserved)` | Backward compat: formation-aggregate block still fires |
| `convocation + contactId + contactEmail: '' → BLOCK` | Empty string treated as missing email |
| `certificat + contactId + contactEmail: null → no email block` | Cross-type: certificat does not check email |

**Currently failing: 3** (tests 1, 2, 5 — because `contactEmail` is not yet on `PreflightContext` and logic doesn't use it)
**Currently passing: 3** (tests 3, 4, 6 — verify backward-compat / cross-type isolation)

### Suite B — `src/routes/(app)/formations/[id]/documents/generate-for-all.test.ts` (new)

`describe('generateForAll server action')`, 13 tests:

| Test name | Validates |
|---|---|
| `returns 401 when no workspace` | `getUserWorkspace` returns null gate |
| `returns 401 when session is missing` | `safeGetSession` returns no user gate |
| `returns 403 when formation not owned by workspace` | Ownership guard |
| `returns 400 when type is not convocation or certificat` | Input validation |
| `returns 400 with formationBlocks when formation-level prereq fails` | Formation-gate fires before loop; `formationBlocks` in response |
| `returns 400 when warnings present and not all acknowledged` | Warning-ack gate |
| `loops through eligible learners and calls generateDocument for each ready learner` | Happy path: N done results |
| `skips learner with existing envoye document` | Idempotency skip |
| `records failed for learner with no email` | Per-learner email preflight → `failed` + `blockingIds` |
| `writes one audit log row per done result with same shared batchId` | Audit logging contract |
| `caveat-1: when logAuditEvent rejects, learner is failed with reason audit_log_failed` | Architect caveat 1 — audit failure not silent |
| `cancellation: when signal is aborted, remaining learners not in results` | AbortSignal respects mid-batch |
| `concurrency: with 7 learners, peak concurrent calls is ≤ 3` | Inline 3-slot pool |

**Currently failing: 13/13** — `generateForAll` is not yet in `actions`

---

## 4. Coverage Gaps (intentional)

- **Playwright E2E** — No `playwright.config.ts` found at repository root; no `e2e/` or `tests/` directory exists. **Playwright spec NOT written** — no infrastructure to invent. Blocker reported to orchestrator.
- **Replace-in-place (`genere` doc)** — the idempotency "replace genere" path is partially covered by the skip test; a dedicated test for `REPLACE_IF_STATUS` logic would require mocking `db.delete` call verification. Deferred as a follow-up test once implementation is in place.
- **Warning ack happy path** — only the "ack missing" → 400 branch is tested. The "ack provided → proceeds" path is exercised implicitly by the happy-path tests (no warnings in base fixture).
- **`BatchGenerateDialog.svelte`** — UI component tests are out of scope for the red phase; the plan marks them as optional MVP.

---

## 5. Playwright Status

**No Playwright setup detected.** `playwright.config.ts` does not exist; neither an `e2e/` nor a `tests/` folder is present. The E2E spec for the happy-path batch flow **was not written**. Creating it would require inventing infrastructure not sanctioned by the project.

**Action required by orchestrator:** Add Playwright configuration before the E2E spec can be written. Once `playwright.config.ts` exists, the spec should be placed at `e2e/batch-generate-convocations.spec.ts` and cover the happy path described in Task 10 of the plan.

---

## 6. Test File Paths

- `src/lib/preflight/document-preflight.test.ts` — extended (6 new tests in new describe block)
- `src/routes/(app)/formations/[id]/documents/generate-for-all.test.ts` — created (13 tests)

---

## 7. Run Commands

```bash
# Preflight tests (3 failing / 48 total)
bun run test src/lib/preflight/document-preflight.test.ts

# Server action tests (13 failing / 13 total)
bunx vitest run "generate-for-all"
```
