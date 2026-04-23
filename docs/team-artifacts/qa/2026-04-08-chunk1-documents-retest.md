# QA Acceptance Report — Document Generation (Chunk 1) — Retest

**Date**: 2026-04-08
**Tester**: Marie (persona-based acceptance test)
**Verdict**: **FAIL** — Previous "Client requis" error is fixed, but a new "Invalid image format" error blocks ALL document generation. No error feedback shown to user.

---

## 1. Verdict

**FAIL** — The two originally reported bugs have been partially addressed:
- **"Client requis" error**: FIXED — Convention and Devis no longer throw this error.
- **"PdfPrinter is not a constructor"**: FIXED — This error no longer occurs.

However, a **new blocking error** has been introduced: all document types now fail with `Invalid image: Error: Unknown image format` in pdfmake. The PDF generator crashes when trying to render an image (likely the organization logo) that is not in a valid dataURL or file path format. No document is produced, and — critically — **no error toast or feedback** is shown to Marie. The silent failure problem persists.

---

## 2. Feature Tested

- Document generation for all 6 document types on 2 formations
- UI: dropdown, dialog pickers, loading states, error feedback
- Server-side: PDF generation via pdfmake

---

## 3. Test Environment

- **URL**: http://localhost:5173
- **Browser**: Cursor embedded browser (Chromium)
- **User**: Anthony Russo (Directeur) — logged in
- **Formations tested**:
  - "Introduction à l'IA" (FOR-1) — `a5f59652-d41f-44c0-8786-9cea34ccc073`
  - "Test Email" (FOR-2) — `e7e920a4-7a04-4ae5-b235-df302ebc2074`

---

## 4. Happy Path

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| 1 | Navigate to formation detail | No 500 errors | **PASS** — Both formations load correctly |
| 2 | Navigate to Documents tab | Tab loads | **PASS** — Via direct URL and tab click |
| 3 | See empty state | Helpful message | **PASS** — "Aucun document généré." with guidance text |
| 4 | Open "Générer un document" dropdown | All 6 types listed | **PASS** — Convention, Convocation, Certificat, Devis, Ordre de mission, Feuille d'émargement |
| 5 | Click "Convention" | Document generates, toast shown, list updates | **FAIL** — Server error: Invalid image format. No toast. No document. |
| 6 | Click "Devis" | Document generates | **FAIL** — Same error |
| 7 | Click "Feuille d'émargement" + select séance + click Générer | Document generates | **FAIL** — Same error |
| 8 | Click "Convocation" + select apprenant + click Générer | Document generates | **FAIL** — Same error |
| 9 | Click "Ordre de mission" + select formateur + click Générer | Document generates | **FAIL** — Same error |

---

## 5. Document Types Tested

| Document Type | Formation | Picker Dialog | Loading State | Generation Result | Server Error |
|---|---|---|---|---|---|
| Convention | FOR-1 | N/A (direct) | Not visible | **FAIL** | Invalid image format |
| Devis | FOR-1 | N/A (direct) | Not visible | **FAIL** | Invalid image format |
| Feuille d'émargement | FOR-1 | Séance picker — **PASS** | "Génération..." — **PASS** | **FAIL** | Invalid image format |
| Convocation | FOR-1 | Apprenant picker — **PASS** | "Génération..." — **PASS** | **FAIL** | Invalid image format |
| Ordre de mission | FOR-1 | Formateur picker — **PASS** | "Génération..." — **PASS** | **FAIL** | Invalid image format |
| Convention | FOR-2 | N/A (direct) | Not visible | **FAIL** | Invalid image format |

---

## 6. What Was Fixed (vs Previous Report)

| Previous Issue | Status |
|---|---|
| "Client requis pour générer une convention/devis" even when formation had a company linked | **FIXED** — No longer occurs |
| "PdfPrinter is not a constructor" | **FIXED** — No longer occurs |
| Document generation fails silently (no toast, no document) | **NOT FIXED** — Still no error feedback to user |

---

## 7. New Issue Found

### CRITICAL: Invalid image format crashes PDF generation

**Error** (from server terminal):
```
[generateDocument] type=convention formationId=... error: Error: Invalid image: Error: Unknown image format.
Images dictionary should contain dataURL entries (or local file paths in node.js)
    at PDFDocument.provideImage (pdfmake/js/PDFDocument.js:98:13)
    at DocMeasure.measureImage (pdfmake/js/DocMeasure.js:123:34)
```

**Root cause**: The `document-generator.ts` is passing an image (likely the organization logo) to pdfmake in an unsupported format. pdfmake requires images as either:
- A data URL (e.g., `data:image/png;base64,...`)
- A local file path (in Node.js)

The image being passed is neither. It may be a raw URL, a Supabase Storage URL, or binary data without the correct header.

**Impact**: 100% of document generation attempts fail. No document can be produced.

**Affects**: All 6 document types, both formations tested.

---

## 8. Friction Points

1. **Silent failure persists (BLOCKING)**: When generation fails, Marie sees no toast, no error message, nothing. For dialog-based types (Feuille d'émargement, Convocation, Ordre de mission), the dialog stays open and the "Générer" button returns to its enabled state. Marie has zero indication that something went wrong.

2. **Dropdown requires two interactions**: The "Générer un document" dropdown button doesn't open on first click — it requires clicking to focus, then pressing Enter (or a second click). This is the same issue from the previous test; may be a browser automation artifact.

3. **Loading state only visible on dialog types**: For Convention and Devis (no dialog), there is no visible loading indicator. For dialog types, the "Génération..." disabled state works correctly.

---

## 9. Click Counts

| Goal | Expected clicks | Actual clicks | Notes |
|------|----------------|---------------|-------|
| Open generation dropdown | 1 | 2 (click + Enter) | Same as previous test |
| Generate Convention | 2 (dropdown + type) | 2 | POST fires but fails |
| Generate Feuille d'émargement | 4 (dropdown + type + séance + Générer) | 4 | Correct flow, generation fails |
| Generate Ordre de mission | 4 (dropdown + type + formateur + Générer) | 4 | Correct flow, generation fails |
| Generate Convocation | 4 (dropdown + type + apprenant + Générer) | 4 | Correct flow, generation fails |

---

## 10. UI Elements Working Correctly

Despite generation failing, the following UI elements work as expected:

- **Dropdown menu**: All 6 document types present with correct icons
- **Séance picker**: Shows séances with date + title, disabled Générer button until selection
- **Apprenant picker**: Shows 2 apprenants (John Doe, Antho Test)
- **Formateur picker**: Shows 2 formateurs (Anthony Russo, Murielle Gontrand)
- **Loading state**: "Génération..." with disabled button on dialog-based types
- **Empty state**: Clean centered layout with guidance text
- **Deep linking**: `/formations/[id]/documents` loads correctly
- **No browser console errors**: Only standard Vite connection logs

---

## 11. Required Fixes (before shipping)

### CRITICAL: Fix image format in document-generator.ts

The organization logo (or any image) passed to pdfmake must be a valid data URL or local file path.

**Suggested fix**: In `document-generator.ts`, when loading the logo:
1. If fetching from Supabase Storage URL, download the image and convert to a base64 data URL: `data:image/png;base64,{base64data}`
2. If using a local file, use `fs.readFileSync()` to get the buffer and convert to data URL
3. If the logo is optional, add a try/catch around image loading and omit it gracefully if unavailable

### CRITICAL: Show error toast on generation failure

When the server action returns a failure, the client must show an error toast. Marie should see something like: "Impossible de générer le document. Veuillez réessayer ou contacter le support."

---

## 12. Suggestions (non-blocking)

1. **Add loading state for direct-generation types**: Convention and Devis generate without a dialog. Add a brief spinner or disable the dropdown during generation.

2. **Close dialog on failure with error toast**: Instead of leaving the dialog open after a failed generation, close it and show an error toast.

3. **Log more context in error messages**: Include which image failed, the image source/path, to make debugging faster.
