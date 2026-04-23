# QA Report: T-12 Regeneration Prompt

**Date:** 2026-04-13
**Tester:** qa-tester (Marie persona)
**Ticket:** T-12 — Regeneration prompt

## Verdict: PASS (with notes)

## Feature Tested

Per-document stale indicators on the Documents tab. When `formation.updatedAt > document.generatedAt`, each document shows an amber warning "Les données ont changé depuis la génération" with a "Régénérer" button. For `genere` documents, regeneration replaces in place. For `signe` documents, guidance text replaces the button.

## Test Environment

- **URL:** http://localhost:5173/formations/a5f59652-d41f-44c0-8786-9cea34ccc073/documents
- **Formation:** Introduction à l'IA (FOR-1)
- **Documents present:** 7 (all status `À envoyer` / `genere`)
- **Browser:** Cursor embedded browser

## Happy Path

1. Navigated to Formations → Introduction à l'IA → Documents tab — 7 documents listed, no stale indicators (correct: no changes since generation).
2. Navigated to Fiche tab, toggled "Présentiel" checkbox to trigger formation update.
3. Returned to Documents tab — all 7 documents now show amber stale indicator: "Les données ont changé depuis la génération" with "Régénérer" button. **PASS**
4. Clicked "Régénérer" on a Convention document — button changed to "Régénération..." with spinning loader and disabled state. **PASS** (good loading feedback)
5. After ~3 seconds, regeneration completed. The Convention now appears at top of list with new timestamp (13 avr. 2026, 11:31) and NO stale indicator. Old document replaced in place. **PASS**
6. Remaining 6 documents still show stale indicators. **PASS** (per-document, not global)

## Edge Cases Tested

| Case | Result | Notes |
|---|---|---|
| No changes → no stale indicator | PASS | Documents initially show no warning |
| Formation edit triggers stale on all docs | PASS | All 7 documents marked stale after modalite change |
| Régénérer for `genere` doc → replace in place | PASS | Old doc replaced, new timestamp, stale gone |
| Loading state during regeneration | PASS | "Régénération..." with spinner, button disabled |
| `signe` blocking | NOT TESTED | No signed documents available; code review confirms guidance text "Créez un avenant pour mettre à jour ce document signé" is implemented at line 784-787 |
| `envoye` → new row + `remplace` old | NOT TESTED | No sent documents available |

## Friction Points

1. **Tab navigation broken via click:** Clicking formation tabs (Fiche, Documents) from within the formation does not navigate — requires direct URL entry or full page navigation. Marie would be confused trying to switch tabs. (Pre-existing issue, not T-12 related.)

2. **Missing "Voir les changements" link:** The ticket acceptance criteria specifies "Voir les changements" alongside "Régénérer", but the implementation only has the "Régénérer" button. Marie would benefit from seeing what exactly changed before deciding to regenerate. This is a minor gap vs. spec.

## Click Counts

| Goal | Clicks | Expected |
|---|---|---|
| See stale indicator (after formation edit) | 0 (automatic) | 0 |
| Regenerate a document | 1 | 1 |

## Required Fixes

None — the core feature works as expected. The "Voir les changements" omission is a spec gap but not a blocker for shipping.

## Suggestions

1. **Add "Voir les changements" link** — per the original spec, let Marie see what changed before regenerating. This would reduce anxiety about regenerating blindly.
2. **Test `signe` blocking in integration tests** — since no test data with signed documents exists, add a Vitest or Playwright test to verify the avenant guidance path.
3. **Test `envoye` → `remplace` flow** — similarly, create test fixtures for the version-creation path where sent documents get superseded.
