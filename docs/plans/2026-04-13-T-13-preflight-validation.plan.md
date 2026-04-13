---
title: "T-13 — Pre-flight validation before document generation"
date: 2026-04-13
ticket: T-13
ref: docs/team-artifacts/design/2026-04-13-T-13-preflight-validation-ux.md
target: src/routes/(app)/formations/[id]/documents/+page.svelte
tasks:
  - id: preflight-rules-module
    title: "Add shared preflight rules + server validation helper"
    status: done
  - id: generate-dialog-checklist
    title: "Insert checklist step in Documents generate flow (block/warn/prerequisite)"
    status: done
  - id: deep-links-focus
    title: "Deep-link protocol to tabs with field focus"
    status: done
  - id: resume-generation
    title: "Return-to-generation flow after fix (URL + banner)"
    status: done
  - id: warn-confirm-audit
    title: "Warning override confirm + formation_audit_log"
    status: done
  - id: suivi-parity
    title: "Align Suivi generateQuestDocument with same preflight"
    status: done
---

# T-13 — Pre-flight validation before document generation

**Context**: Today `openGenerate()` in `documents/+page.svelte` either opens a small dialog (contact/formateur/séance) or calls `submitGenerate()` immediately. There is no readiness checklist. Server action `generateDocument` in `documents/+page.server.ts` calls `generateDocument()` from `$lib/services/document-generator` without structured pre-checks.

**Non-goals (this ticket)**: Full T-14 batch UI; attestation generation UI if type remains non-generatable.

---

## Task 1 — Shared preflight rules module `[preflight-rules-module]`

**Problem**: Rules must be identical on client (UX) and server (security). Duplicated logic drifts.

**Implementation**:

1. Add `src/lib/preflight/document-preflight.ts` (or `$lib/preflight/index.ts`) exporting:
   - Types: `PreflightSeverity = 'block' | 'warn' | 'prerequisite'`; `PreflightItem = { id: string; severity; kind: 'data' | 'prerequisite'; messageFr: string; fixLabelFr: string; tab: 'fiche' | 'seances' | 'apprenants' | 'suivi' | 'documents'; hrefPath: string; focusKey?: string }`.
   - `evaluatePreflight(formation, workspace, context): { items: PreflightItem[]; blockingCount; warningCount }` where `context` includes `documentType`, optional `contactId`, `formateurId`, `seanceId`, and quest/document status flags from loaders.
2. Encode the **matrix** from the UX review (blocking / warning / prerequisite defaults). Map OPCO detection to existing formation fields (e.g. `typeFinancement` — use same values as elsewhere in app).
3. Add `assertPreflightOrThrow` (or return `{ ok: false, items }`) used by `documents/+page.server.ts` **and** `suivi/+page.server.ts` `generateQuestDocument` so bypassing UI never generates illegal docs.
4. Unit tests in `src/lib/preflight/document-preflight.test.ts`: one case per document type for block, warn, prerequisite.

**Key constraints**:

- Prerequisite rows **must not** use `focusKey` — they link to Suivi or Documents with quest/devis anchors.
- B2C rétractation: if client is personne physique and days to `dateDebut` < 10, emit **warn** item `retractation_delai` with confirm in UI.

---

## Task 2 — Generate dialog checklist `[generate-dialog-checklist]`

**Problem**: Marie needs visibility before POST; primary CTA must reflect block state.

**Implementation** (`documents/+page.svelte`):

1. When user picks a type from **Générer un document**, set `generateType` and open a **single dialog** (extend existing Dialog or merge flows):
   - **Step A**: If type needs contact/formateur/séance, keep current selectors **above** or **within** the same dialog.
   - **Step B**: Always show **checklist** derived from `evaluatePreflight` using current `data` + selected IDs (reactive `$derived`).
2. **Header**: `Prêt à générer — X sur Y éléments` (Y = applicable rows for this type only — not all formation issues).
3. **Rows**:
   - **Data / block**: `CircleAlert` + text "Manquant — {message}" + link `Compléter — {label}` → `goto(href)` (see task 3).
   - **Data / warn**: `AlertTriangle` + "Attention — {message}"; no link required unless fixable on Fiche.
   - **Prerequisite**: `Lock` or `ListChecks` + message + link e.g. `Valider le devis dans le Suivi →` → `/formations/[id]/suivi?highlight=...` (use existing Suivi patterns if any).
4. **Primary button**: **Générer** disabled if any `block` or `prerequisite`; if only `warn`, enabled only after checkbox `J'ai pris connaissance des avertissements` **or** secondary modal confirm (pick one pattern — prefer checkbox inline for fewer clicks).
5. **Icons + text**: Do not rely on green/red alone; use `Check` + "Prêt" for OK rows.

**Key constraints**:

- Disabled **Générer**: `aria-describedby` pointing to `id="preflight-summary"` live region: "Génération impossible : N blocage(s)."
- Each fix link: `aria-label` = full French sentence (e.g. `Compléter le client sur la fiche formation`).

---

## Task 3 — Deep links + field focus `[deep-links-focus]`

**Problem**: "[Compléter →]" must land on the right tab **and** focus the right control.

**Implementation**:

1. Define a **stable map** `FOCUS_REGISTRY: Record<string, { tab, elementId }>` in `document-preflight.ts` or a small `preflight-focus.ts`. Add matching `id` or `data-preflight-target` attributes on:
   - `fiche/+page.svelte` (client, dates, price, objectifs, etc.)
   - `seances/+page.svelte` (séance list / create)
   - `apprenants/+page.svelte` (learner email)
2. URL shape: `/formations/[id]/fiche?preflightFocus=client` (single query param enum). On `onMount` / `$effect` in target page: `document.getElementById(...)` → `scrollIntoView({ block: 'center' })` → `focus()`.
3. **Prerequisite** links: `/formations/[id]/suivi` with optional `?quest=q04` if such param exists; else scroll to devis section — reuse `quest` param convention from Documents (`page.url.searchParams`).

**Key constraints**:

- If element missing (conditional UI), fall back to toast `Impossible d'afficher le champ — ouvrez l'onglet Fiche` and still switch tab.

---

## Task 4 — Return-to-generation `[resume-generation]`

**Problem**: Analyst Q2 — after fix, Marie must resume without hunting.

**Implementation**:

1. When user clicks a fix link, **before navigation**, `sessionStorage.setItem('preflightResume', JSON.stringify({ formationId, documentType, contactId?, seanceId?, ts }))` **or** use URL-only approach:
   - Fix link includes `returnTo=/formations/[id]/documents?resumeGenerate=convention` (encoded).
2. On `documents/+page.svelte` `$effect` on load: if `page.url.searchParams.get('resumeGenerate') === documentType` **or** sessionStorage matches formation, **open generate dialog** with that type pre-selected and checklist refreshed (after `invalidateAll` from parent layout).
3. Optional **sticky banner** on non-Documents tabs when `preflightResume` is set: "Poursuivre la génération du {label} — [Retour aux documents →]" linking to documents URL with `resumeGenerate`.

**Key constraints**:

- Clear resume token after successful generation or explicit dismiss.
- Works with browser back button (prefer URL param over storage alone if possible; storage as fallback).

---

## Task 5 — Warning override + audit `[warn-confirm-audit]`

**Problem**: Analyst Q4 — trace "proceed despite warning".

**Implementation**:

1. On submit with unresolved **warn** items only: pass `warningsAcknowledged: string[]` (item ids) in `FormData` to `generateDocument`.
2. In `+page.server.ts`, after successful generation, if array non-empty, insert `formation_audit_log` row:
   - `actionType`: `'document_generation_warnings_overridden'`
   - `entityType`: `'formation_document'` or `'formation'`
   - `newValue`: JSON string `{ documentType, warningIds: [...] }` (schema has no JSON column — use `newValue` text; keep payload small).
3. If insert fails, still allow generation but log server console (degraded mode).

**Key constraints**: Do not log for zero-warning happy path.

---

## Task 6 — Suivi parity `[suivi-parity]`

**Problem**: `suivi/+page.server.ts` `generateQuestDocument` must call the same preflight guard.

**Implementation**:

1. Import shared evaluator; return `fail(400, { message, preflightItems })` with French message if blocked.
2. Optionally return structured items for future Suivi UI; minimum is server enforcement + toast on client.

---

## Testing checklist

- [ ] **Devis**: missing client → block + link to Fiche; with client → generate.
- [ ] **Convention**: devis not accepté → prerequisite row, no field focus link; after accept → data rules apply.
- [ ] **Feuille d'émargement**: no séance → block; link to Séances.
- [ ] **Convocation**: missing email → block to Apprenants; convention unsigned → prerequisite.
- [ ] **Certificat**: unsigned émargements → block.
- [ ] **OPCO financing** + missing NDA → certificat blocked; devis only warns.
- [ ] **B2C** + formation in 8 days → rétractation warning → confirm → generates + audit if other warns present.
- [ ] **Return**: fix field → navigate back → checklist opens / banner works; **Générer** enables when resolved.
- [ ] **A11y**: VoiceOver reads summary; checklist rows have visible text labels; contrast OK in dark mode.
- [ ] **Mobile**: dialog scrollable; buttons reachable.
- [ ] **Bypass**: POST without UI still blocked by server preflight.
