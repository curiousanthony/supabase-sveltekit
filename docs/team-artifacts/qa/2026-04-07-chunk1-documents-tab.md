# QA Acceptance Report — Document Generation (Chunk 1)

**Date**: 2026-04-07
**Tester**: Marie (persona-based acceptance test)
**Verdict**: **FAIL** — UI structure is correct but document generation silently fails

---

## 1. Verdict

**FAIL** — The Documents tab UI is well-structured and all new document types are present with correct pickers. However, actual document generation fails silently: clicking "Convention" or "Devis" triggers a POST that returns HTTP 200 but no document row appears in the database. No error toast is shown to the user. Marie would be confused — she clicked "Générer", nothing happened, and no feedback explains why.

---

## 2. Feature Tested

- Documents tab on formation detail page
- "Générer un document" dropdown with all 6 document types
- Séance picker for Feuille d'émargement
- Formateur picker for Ordre de mission
- Direct generation for Convention and Devis (no picker needed)
- Empty state display
- Navigation and general stability

---

## 3. Test Environment

- **URL**: http://localhost:5173
- **Browser**: Cursor embedded browser (Chromium)
- **User**: Anthony Russo (Directeur) — logged in
- **Formations tested**:
  - "Test Email" (FOR-2) — `e7e920a4-7a04-4ae5-b235-df302ebc2074` — 1 apprenant, 1 séance, 1 formateur
  - "Introduction à l'IA" (FOR-1) — `a5f59652-d41f-44c0-8786-9cea34ccc073` — 2 apprenants, 3 séances, 1 formateur

---

## 4. Happy Path

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| 1 | Navigate to `/formations` | See formation list | **PASS** — Kanban view with 2 formations |
| 2 | Navigate to formation detail | Formation loads without 500 | **PASS** — Both formations load correctly |
| 3 | Click "Documents" tab | Documents tab opens | **PASS** — Tab loads via direct URL |
| 4 | See empty state | Helpful message shown | **PASS** — "Aucun document généré. Utilisez le bouton « Générer un document »..." |
| 5 | Open "Générer un document" dropdown | All 6 types listed | **PASS** — Convention, Convocation, Certificat, Devis, Ordre de mission, Feuille d'émargement |
| 6 | Click "Convention" | Document generates, toast confirms, list updates | **FAIL** — POST returns 200 but no document appears, no toast, no feedback |
| 7 | Click "Devis" | Document generates | **FAIL** — Same silent failure as Convention |

---

## 5. Edge Cases Tested

### Séance picker (Feuille d'émargement) — PASS
- Dialog opens with title "Générer : Feuille d'émargement"
- Description says "Sélectionnez la séance concernée."
- Séance picker shows available séance: "07 avr. 2026 — Test e-mail"
- "Générer" button is **disabled** until a séance is selected
- After selecting séance, "Générer" button becomes enabled
- "Annuler" button works correctly

### Formateur picker (Ordre de mission) — PASS
- Dialog opens with title "Générer : Ordre de mission"
- Description says "Sélectionnez le formateur concerné."
- Formateur picker shows "Anthony Russo"
- "Générer" button is **disabled** until a formateur is selected

### Empty state — PASS
- Clean, centered layout with document icon
- French text: "Aucun document généré."
- Guidance text: "Utilisez le bouton « Générer un document » pour créer votre premier document."

### Communications section — PASS
- Shows collapsed section with count badge (8 for FOR-2, 6 for FOR-1)
- Expand/collapse toggle works

### Direct URL / deep linking — PASS
- `/formations/[id]/documents` loads correctly when accessed directly
- No 500 errors, page renders fully

### Browser console — PASS
- No JavaScript errors
- Only standard vite connection logs

---

## 6. Friction Points

1. **Silent generation failure (BLOCKING)**: When Marie clicks "Convention" or "Devis", the generation POST fires (HTTP 200) but no document appears and no error message is shown. Marie has zero feedback about what happened. She would repeatedly try clicking, growing increasingly frustrated.

2. **Dropdown requires two interactions**: The "Générer un document" dropdown button doesn't open on first mouse click — it requires focusing first, then pressing Enter (or a second click). This may be a browser automation artifact, but worth verifying in a real browser. If real, it adds friction to every document generation.

3. **Tab navigation via click doesn't work reliably**: Clicking tab links (Aperçu, Fiche, Documents, etc.) in the formation header didn't trigger navigation — only direct URL navigation worked. This is likely a pre-existing issue or browser automation limitation, not specific to this feature.

---

## 7. Click Counts

| Goal | Expected clicks | Actual clicks | Notes |
|------|----------------|---------------|-------|
| Navigate to Documents tab | 1 (click tab) | 1 via direct URL | Tab click didn't work in automation |
| Open generation dropdown | 1 | 2 (click + Enter) | Possible automation artifact |
| Generate Convention | 2 (dropdown + type) | 2 | POST fires but fails silently |
| Generate Feuille d'émargement | 4 (dropdown + type + séance + Générer) | 4 | Correct flow, disabled until ready |
| Generate Ordre de mission | 4 (dropdown + type + formateur + Générer) | 4 | Correct flow, disabled until ready |

---

## 8. Screenshots

Screenshots were captured during testing at:
- Documents tab empty state with filters
- "Générer un document" dropdown showing all 6 types
- Feuille d'émargement dialog with séance picker
- "Introduction à l'IA" Documents tab

---

## 9. Required Fixes (before shipping)

### CRITICAL: Document generation fails silently
- **Symptom**: POST to `?/generateDocument` returns HTTP 200 but no document row is created. No error toast shown.
- **Impact**: The core feature (generating documents) does not work.
- **Likely cause**: The `generateDocument` function in `document-generator.ts` may be throwing an error that gets caught by the try/catch and returned as `fail(500)`, but the client-side `submitGenerate` may not be handling the `failure` result type properly. Alternatively, the Supabase Storage upload or database insert may be failing silently.
- **Action**: Debug the `generateDocument` server function. Add `console.error` logging in the catch block of the `generateDocument` action. Verify the Supabase Storage bucket exists and has correct RLS policies.

---

## 10. Suggestions (non-blocking)

1. **Add loading state for direct generation**: When clicking Convention or Devis (no picker dialog), there's no visual indication that generation is in progress. Consider showing a brief spinner or disabling the dropdown button during generation.

2. **Add error feedback**: If generation fails, show a clear French error message explaining what went wrong (e.g., "Impossible de générer le document. Vérifiez que la formation a un client associé." for devis without a client).

3. **Séance picker — show empty state message**: If a formation has no séances, the picker would show an empty dropdown. Consider showing a message like "Aucune séance disponible. Ajoutez d'abord une séance." with a link to the Séances tab.

4. **Same for formateur picker**: If no formateur is assigned, show a helpful empty state.

5. **Consider grouping document types**: The dropdown has 6 items already and will grow. Consider grouping: "Documents contractuels" (Convention, Devis, Ordre de mission) vs "Documents administratifs" (Convocation, Certificat, Feuille d'émargement).
