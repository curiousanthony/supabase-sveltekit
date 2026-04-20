# QA Report: T-13 Pre-flight Validation

**Date:** 2026-04-20  
**Tester:** qa-tester (Marie persona)  
**Ticket:** T-13 — Error states with fix paths (pre-flight validation before document generation)

---

## Verdict: FAIL

**Reason:** Critical bug C1 — `clientId` vs `companyId` field mismatch causes ALL B2B formations to display a false "Client non renseigné" blocking error, preventing generation of Devis, Convention, Convocation, and Certificat even when an enterprise client is correctly linked via the Fiche form.

---

## Feature Tested

Pre-flight validation checklist displayed before document generation. Shows green/red indicators for readiness (block/warn/prerequisite), "[Compléter →]" deep links to the correct tab with field focus, blocking vs warning distinction, and a resume-generation flow after fixing data.

---

## Test Environment

- **URL:** [http://localhost:5173/formations/a5f59652-d41f-44c0-8786-9cea34ccc073/documents](http://localhost:5173/formations/a5f59652-d41f-44c0-8786-9cea34ccc073/documents)
- **Formation:** Introduction à l'IA (FOR-1) — OPCO, Signature convention status
- **Formation data:** Client (ENTREPRISE): Acme Inc., Type financement: OPCO, 7 existing documents
- **Branch:** feat/formations-v2 (commits a45226b + 160c983)
- **Browser:** Cursor embedded browser

---

## Happy Path

1. Navigated to Documents tab → 7 documents visible, "2 problèmes de conformité" banner shown. ✓
2. Clicked "Générer un document" → Dropdown opens with 6 document types: Convention, Convocation, Certificat de réalisation, Devis, Ordre de mission, Feuille d'émargement. ✓
3. Selected **Devis** → Preflight dialog opened instantly with title "Générer : Devis", description "Génération impossible : 1 blocage." ✓
4. Dialog shows 2 checklist rows:
  - BLOCK (red circle icon): "Client non renseigné" + link "Compléter le client sur la fiche formation ↗"
  - WARN (yellow triangle icon): "Numéro NDA manquant — requis pour un financement OPCO" + link "Compléter le NDA dans les paramètres ↗"
5. "Générer" button correctly disabled (`aria-disabled`, confirmed in accessibility tree). **Visual styling issue noted — see M1.**
6. Clicked fix link "Compléter le client sur la fiche formation" → navigated to Fiche tab. ✓
7. URL became: `…/fiche?preflightFocus=client&returnTo=%2F…%2Fdocuments%3FresumeGenerate%3Ddevis` — deep link URL format correct. ✓
8. Fiche tab opened and scrolled to "CLIENT (ENTREPRISE)" field (field is focused in viewport). ✓
9. **CRITICAL FINDING (C1)**: The CLIENT (ENTREPRISE) field already shows "Acme Inc." — yet the preflight showed "Client non renseigné". Investigation revealed: the Fiche form stores the B2B client in `formation.companyId` (FK to `companies` table), but the preflight checks `formation.clientId` (FK to `clients` table). These are different fields. For B2B formations using the Fiche combobox, `clientId` remains null while `companyId` holds the enterprise client. The preflight false positive persists even after a company IS linked.
10. Navigated to `…/documents?resumeGenerate=devis` → dialog auto-reopened with "Devis" type pre-selected. ✓ (Resume flow via URL works.)

---

## Edge Cases Tested


| Case                                            | Result  | Notes                                                                                                                                                                                                    |
| ----------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Devis — missing client                          | PARTIAL | BLOCK shown, fix link present. But false positive: client field IS populated via `companyId`. See C1.                                                                                                    |
| Devis — OPCO, missing NDA                       | PASS    | WARN shown with yellow triangle icon. Count = "1 blocage" (only BLOCK items count). Fix link present.                                                                                                    |
| Convention — devis not accepté (prerequisite)   | PASS    | Prerequisite row shows lock icon + "Le devis doit être accepté avant de générer la convention" + "Valider le devis dans le Suivi →". No `preflightFocus` in link. Correctly not a field-level deep link. |
| Convention — client missing                     | PARTIAL | Same C1 false positive.                                                                                                                                                                                  |
| Feuille d'émargement — no séance selected       | PASS    | Block row "Aucune séance sélectionnée" shown. Fix link "Créer ou sélectionner une séance ↗" present. Disabled Générer button.                                                                            |
| Feuille d'émargement — séance selector dropdown | FAIL    | Dropdown expanded but listbox empty — no séance options appeared for a formation with an existing séance. See H2.                                                                                        |
| Convocation — missing client                    | PARTIAL | C1 false positive. Prerequisite "La convention doit être signée avant d'envoyer les convocations" shows correctly with "Valider la convention dans le Suivi →".                                          |
| Certificat — OPCO + missing NDA                 | PASS    | NDA escalates from WARN (on Devis) to BLOCK for Certificat: "Numéro NDA manquant — requis pour un financement OPCO (certificat)". Correct escalation.                                                    |
| Resume flow — `?resumeGenerate=devis`           | PASS    | Dialog auto-opens on page load with correct type pre-selected. URL param cleaned up after opening.                                                                                                       |
| Deep link URL format                            | PASS    | `?preflightFocus=client&returnTo=%2Fformations%2F…%2Fdocuments%3FresumeGenerate%3Ddevis` — correct encoding of returnTo.                                                                                 |
| Fix link accessible names                       | PASS    | Full French sentences used: "Compléter le client sur la fiche formation", "Valider le devis dans le Suivi →".                                                                                            |
| Dialog closes on Escape                         | PASS    | Escape key closes dialog.                                                                                                                                                                                |
| A11y — Tab navigation in dialog                 | PARTIAL | Tab focus moves through dialog elements (confirmed via accessibility tree states). Visual focus ring not clearly visible in screenshots — needs deeper VoiceOver/screen reader test.                     |
| B2C rétractation warning                        | SKIP    | No B2C formation (personne physique) available in test data.                                                                                                                                             |
| Warning confirm + audit log                     | SKIP    | No scenario achievable with warnings-only (no blocks) due to C1 false positive and unavailability of a clean test formation.                                                                             |
| Server bypass POST                              | SKIP    | Not tested — requires DevTools network interception. Server-side code review confirms `assertPreflightOrThrow` is called in `generateDocument` action.                                                   |
| Suivi parity                                    | SKIP    | Not tested — requires navigating to Suivi generate flow, out of scope for current session.                                                                                                               |
| Mobile viewport 375×667                         | SKIP    | Not tested.                                                                                                                                                                                              |
| Dark mode contrast                              | SKIP    | Not tested.                                                                                                                                                                                              |


---

## Friction Points

1. **Resume banner missing on Fiche tab.** After clicking the fix link and landing on Fiche, Marie has no visible reminder that she was mid-generation of a Devis. The URL has `returnTo=...` encoded but there's no banner. She must remember to navigate back herself. High friction for an interrupted user (Zeigarnik effect — exactly what the UX review warned about). [H1]
2. **Disabled "Générer" button is pink/active-looking.** The disabled state uses `aria-disabled` but the visual styling shows the button as pink/filled (same as the enabled state). First-time users won't know the button is non-functional. [M1]
3. **"Génération impossible : 2 blocages" conflates prerequisites with data blocks.** Marie would naturally ask "what are the 2 blocages?" and find one is a missing field (fix on Fiche) and one is a quest prerequisite (fix in Suivi). Different fixes, same label — adds cognitive load. [M2]
4. **Séance dropdown in Feuille d'émargement shows empty.** Marie needs to select a séance in the dialog to generate an émargement, but the dropdown has no options even though séances exist. She'd be stuck with no obvious next step other than the "Créer ou sélectionner une séance" link (which navigates away unnecessarily). [H2]
5. **"Créer ou sélectionner une séance" fix link navigates away when séance selector is in the same dialog.** The dialog already has a séance picker above the preflight checklist. The fix link that navigates to Séances tab is redundant and potentially confusing. [L2]

---

## Click Counts


| Goal                               | Clicks                          | Expected | Notes |
| ---------------------------------- | ------------------------------- | -------- | ----- |
| Open preflight checklist for Devis | 2 (Générer un document → Devis) | 2        | ✓     |
| Click fix link → navigate to Fiche | 1                               | 1        | ✓     |
| Resume generation after fix        | 0 (auto-opens via URL)          | 0        | ✓     |


---

## Screenshots


| Screenshot                          | Description                                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `page-2026-04-20T13-15-22-540Z.png` | Devis preflight dialog — 1 BLOCK (client) + 1 WARN (NDA OPCO). Générer disabled.                                  |
| `page-2026-04-20T13-16-35-882Z.png` | Fiche tab after fix link click — CLIENT field visible, URL shows `?preflightFocus=client&returnTo=…`              |
| `page-2026-04-20T13-23-07-533Z.png` | Resume flow — dialog auto-reopened via `?resumeGenerate=devis`.                                                   |
| `page-2026-04-20T13-24-21-105Z.png` | Convention preflight — 2 blocages (client BLOCK + devis prerequisite). "Valider le devis dans le Suivi →" link.   |
| `page-2026-04-20T13-25-45-809Z.png` | Feuille d'émargement — séance selector + "Aucune séance sélectionnée" block + "Créer ou sélectionner une séance". |
| `page-2026-04-20T13-29-49-274Z.png` | Certificat — OPCO NDA escalated to BLOCK: "requis pour un financement OPCO (certificat)".                         |


---

## Findings

### Critical


| ID  | Summary                                                                                  | Reproduction                                                                                                                                                                      | Impact                                                                                                  |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| C1  | **clientId vs companyId mismatch — false "Client non renseigné" for all B2B formations** | Open any B2B formation with company linked via Fiche → Générer un document → select Devis/Convention/Convocation/Certificat → preflight always shows "Client non renseigné" block | Breaks core functionality: generation of 4 document types is permanently blocked for all B2B formations |


**Root cause:** `evaluatePreflight` (in `src/lib/preflight/document-preflight.ts` line 69) checks `!formation.clientId`. The `PreflightFormation` object is built from `formation?.clientId` (in `documents/+page.svelte` line 179). However, the Fiche form's "CLIENT (ENTREPRISE)" combobox saves to `formation.companyId` (via `saveField('companyId', company.id)` in `fiche/+page.svelte` line 655), not `clientId`. For standard B2B formations, `clientId` is null and `companyId` holds the enterprise client. The preflight needs to check `clientId || companyId` (or the preflight formation object must include `companyId` and the rule must be updated).

**Fix required:** Update `PreflightFormation` interface to add `companyId: string | null`, pass `formation?.companyId ?? null` in `preflightFormation` derived state, and update the rule to `!formation.clientId && !formation.companyId`.

### High


| ID  | Summary                                                  | Reproduction                                                                                                                                                                     | Impact                                                                                                                            |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| H1  | **No sticky resume banner on non-Documents tabs**        | Click any fix link from preflight dialog → navigate to Fiche/Apprenants/etc. → no "Poursuivre la génération de X — [Retour →]" banner visible                                    | Marie loses generation context when interrupted. URL-based resume works if she remembers to go back, but no proactive affordance. |
| H2  | **Séance dropdown empty in Feuille d'émargement dialog** | FOR-1 has existing séances (evidenced by "Feuille d'émargement - 08/04/2026" document) → open Feuille d'émargement generate dialog → "Sélectionner une séance" dropdown is empty | Marie cannot select a séance and cannot generate a new émargement from the dialog.                                                |


### Medium


| ID  | Summary                                                                           | Impact                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1  | **Disabled "Générer" button looks visually active (pink/filled)**                 | Marie may click the button repeatedly, not realizing it's disabled. Accessibility tree confirms `aria-disabled` and `aria-describedby` are set, but visual styling misleads sighted users. |
| M2  | **"Génération impossible : N blocages" conflates prerequisites with data blocks** | Prerequisite items (quest completion) are counted in `blockingCount`, so "2 blocages" may include 1 data block + 1 prerequisite. Semantically different, same label.                       |


### Low


| ID  | Summary                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------- |
| L1  | No "X sur Y éléments prêts" progress counter in dialog header (minor UX review recommendation m1).               |
| L2  | "Créer ou sélectionner une séance" fix link navigates away when séance picker already exists in the same dialog. |


---

## Required Fixes (FAIL items)

1. **C1 — clientId/companyId mismatch** — Must fix before shipping. Preflight should check `formation.companyId` (the field actually used by the Fiche form for B2B clients) in addition to `clientId`. Failing this, every B2B formation will be permanently blocked from generating the 4 most critical document types.

---

## Suggestions (Non-blocking)

1. **Add resume banner [H1]** — Implement the sticky banner specified in the plan (optional but strongly recommended). Even a small pill/chip "↩ Retour à la génération du Devis" visible when `returnTo` is in URL would suffice.
2. **Fix séance dropdown [H2]** — Investigate why `seancesList` appears empty in the dialog for FOR-1. Check whether the layout query loads séance data accessible to the documents page.
3. **Fix disabled button styling [M1]** — Apply `opacity-50 cursor-not-allowed` or equivalent Tailwind classes to visually distinguish the disabled Générer button.
4. **Separate "blocages" from "prérequis" in count [M2]** — Consider separate counts: "1 données manquantes, 1 prérequis" or use different wording in the description.
5. **B2C rétractation test** — Create a test formation with type "Particulier" and `dateDebut` within 10 days to verify the warn row appears and confirm flow generates + audits.
6. **Server bypass test** — Add an E2E/Playwright test that POSTs directly to the `generateDocument` action with missing data to verify server-side preflight blocks correctly (T-13 plan item 9).

---

## Suggested Follow-up Tickets


| Priority         | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| P0 (same ticket) | Fix C1 — update `PreflightFormation` to include `companyId` and update block rule |
| P1 (new)         | Fix H2 — séance dropdown empty in generate dialog                                 |
| P2 (new)         | Implement resume banner on non-Documents tabs                                     |
| P3 (enhancement) | Visually distinguish disabled Générer button                                      |


---

## Log Entry