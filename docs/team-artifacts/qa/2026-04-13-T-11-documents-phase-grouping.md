# QA Report: T-11 — Phase grouping in Documents tab

**Date:** 2026-04-13
**Tester:** qa-tester (Marie persona)
**Verdict:** PASS (with one criterion untestable due to data limitations)

## Feature Tested

Phase grouping in the Documents tab of formations: urgency sort, phase chips, grouper toggle, and per-learner collapsing.

## Test Environment

- **URL:** http://localhost:5173
- **Formations tested:** FOR-1 (Introduction à l'IA, 7 docs), FOR-2 (Test Email, 2 docs), FOR-3 (Deal exemple – Formation Excel, 0 docs)
- **Browser:** Chromium (automated via Browser MCP)

## Results by Acceptance Criterion

### AC1: Default view is flat list sorted by urgency — PASS

The default view displays documents as a flat list. All 7 documents on FOR-1 have "À envoyer" status, so cross-status urgency sorting (Action requise > À envoyer > En attente > Terminé > Remplacé) could not be fully differentiated. Within the same status, documents appear sorted by date (newest first). The flat list structure is correct.

**Note:** To fully verify multi-status sorting, test data with documents in different statuses would be needed.

### AC2: Phase chips — PASS

Every document row displays a muted badge next to the status badge. Verified mappings:

| Document type | Expected phase | Actual phase | Result |
|---|---|---|---|
| Certificat | Évaluation | Évaluation | ✅ |
| Convention (×2) | Conception | Conception | ✅ |
| Ordre de mission | Conception | Conception | ✅ |
| Convocation | Conception | Conception | ✅ |
| Feuille d'émargement | Déploiement | Déploiement | ✅ |
| Devis | Conception | Conception | ✅ |

Phase chips are visually muted (grey/outline) and clearly distinguishable from the colored status badges ("À envoyer" in amber).

### AC3: "Grouper par phase" toggle — PASS

- **Flat mode:** Button shows "Grouper par phase" with a Layers icon. Documents display in a single flat list.
- **Grouped mode (click):** Documents reorganize under phase headers:
  - **Conception 5** — Convention, Ordre de mission, Convocation, Devis, Convention
  - **Déploiement 1** — Feuille d'émargement
  - **Évaluation 1** — Certificat
- Button label changes to "Liste plate".
- **Toggle back (click again):** Returns to flat view. Button reverts to "Grouper par phase".
- Phase counts in headers are accurate.

### AC4: Per-learner collapsing — UNTESTABLE

None of the 3 formations contain multiple documents of the same type for different learners (e.g., multiple convocations or multiple certificats). FOR-1 has only 1 convocation (John Doe) and 1 certificat (Antho Test). This feature cannot be validated without richer test data.

**Recommendation:** Generate additional per-learner documents (e.g., convocations for both John Doe and Antho Test) to verify group rows like "Convocations (2/2 envoyées)" with chevron toggles.

## Edge Cases Tested

| Test | Result | Notes |
|---|---|---|
| Empty state (FOR-3, 0 docs) | ✅ Pass | Shows "Aucun document généré" with clear guidance to use the generate button. Toggle present but no "À envoyer" filter shown (correct). |
| Direct URL navigation | ✅ Pass | Navigating to `/formations/[id]/documents` loads the tab correctly with all filters and documents. |
| "À envoyer" filter | ✅ Pass | Shows count badge (7). Filtering works correctly. |
| Back button | ✅ Pass | Standard SvelteKit client-side navigation works. |

## Friction Points

1. **Toggle discoverability:** The "Grouper par phase" button is small text next to the filter pills. Marie might not notice it unless looking for it. However, the default flat view sorted by urgency is the primary view, and the toggle is a power-user feature — acceptable.

2. **All documents same status:** With all 7 documents at "À envoyer", Marie can't visually confirm urgency sort is working. The warning banners at the top ("Convention non signée, formation commencée" and "Devis non accepté, formation commencée") help prioritize, but these are separate from the sort order.

## Click Counts

| Goal | Clicks | Expected | Notes |
|---|---|---|---|
| View documents for a formation | 2 | 2 | Formation card → Documents tab |
| Toggle phase grouping | 1 | 1 | Single click on toggle button |
| Return to flat view | 1 | 1 | Single click on toggle button |

## Required Fixes

**None.** All testable acceptance criteria pass.

## Suggestions

1. **Seed test data for AC4 validation:** Create a formation with 3+ learners and generate convocations/certificats for each to validate per-learner collapsing in a follow-up QA pass.
2. **Seed multi-status data:** Generate some documents with different statuses (Terminé, En attente) to validate the full urgency sort order.
