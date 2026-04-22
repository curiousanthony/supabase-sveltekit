# UX Review: T-14 — Batch Generation for Per-Learner Documents

**Date:** 2026-04-20
**Designer:** ux-designer
**Ticket:** T-14
**Persona:** Marie, 34, admin manager at a French training organization (OF)
**Refs:**
- Ticket: `docs/project/tickets/T-14.md`
- Decision: `docs/decisions/2026-04-09-chunk2-document-lifecycle-ux.md` §8
- Product analysis: `docs/team-artifacts/product/2026-04-20-T-14-batch-generation-analysis.md`
- Plan output: `docs/plans/2026-04-20-T-14-batch-generation.plan.md`

---

## TL;DR

- **Marie's mental model is per-formation, not per-learner.** "I have 12 convocations to send" is one task — turning it into 12 clicks is the friction we are removing. The batch CTA must live where the count lives: on the type-group card.
- **Partial failures are the make-or-break moment.** A red wall of 4 errors at the end of a 25-second wait will undo all the trust we built. Frame as "8 réussies, 4 à compléter" with one-click `[Compléter →]` per learner via the existing T-13 `?preflightFocus=…&returnTo=…` pattern.
- **One warning acknowledgement per batch, never per-learner.** Marie will not check 12 boxes that say the same thing. Acknowledgement is a batch-level decision, audit trail records it N times (per-document) — collapse the UX, preserve the audit.
- **Use a dialog with a live per-learner row state machine** (pending → generating → done/failed). It is the only surface that can hold a 25-second wait, a per-learner failure list, and the [Compléter →] resume links without breaking Marie's focus.
- **No rollback on cancel; idempotency on retry.** If Marie closes the dialog mid-run, server stops the loop, completed PDFs stay. Re-clicking "Générer pour tous" simply skips already-`genere`/`envoye` learners. Nothing duplicates.

**Single most important recommendation:** Treat the batch as a *progressive job with a result panel*, not a confirmation→action→toast flow. The dialog is the workspace where Marie watches, recovers, and re-runs.

---

## Personas & Hypotheses

### Marie's opening state ("I have 12 convocations to send")

- Formation `Excel pour débutants — Cohorte mai` starts in 4 days.
- Suivi tab nudged her: "11 apprenants en attente de convocation". She clicks it, lands on Documents tab.
- She sees the **Convocations** group card: "Convocations (1/12 envoyées)". One was generated as a test 2 weeks ago.
- **Cognitive state:** mild urgency, not panicked. She wants the action to be obvious and finite. She does NOT want to click 11 individual cards.

### Hypotheses (testable)

| H | Prediction | How we'd validate |
|---|------------|-------------------|
| H1 | Marie will look at the group card *first* (it has the count she's worried about). | Click-tracking: first click on Documents tab when count > 1 lands on group card 80%+ |
| H2 | Marie will close the progress dialog if it sits at "Génération en cours…" with no per-learner motion for >5s. | Session replay: dialog dismiss rate during long-running batch |
| H3 | If partial failures show clear `[Compléter →]` links, Marie will fix and retry rather than asking the formateur for help. | Funnel: % of batches with failures → % that complete via retry |
| H4 | Per-learner warning ack would cause Marie to abandon the batch. | A/B against single-ack: completion rate |

### Zeigarnik effect — the open loop

After a partial-failure batch, Marie has 4 unfinished tasks "in working memory" — one per failed learner. The Zeigarnik tension stays open until each is closed. The UI must:
1. Show the open count *prominently* on the group card after the batch ("4 à compléter").
2. Let her close them *one by one*, with each fix → return → resume loop being self-contained (T-13 banner does this, we just need to scope the resume to remaining failures).
3. When all 4 are closed, *celebrate*: group card flips to "Convocations (12/12 générées)" — Peak-End rule says the end frame matters more than the wait.

---

## Click-Path Analysis

### Today (per-document), 12 convocations

| Step | Clicks |
|------|--------|
| Open Documents tab | 1 |
| Open generate dropdown × 12 | 12 |
| Pick "Convocation" × 12 | 12 |
| Pick learner in dialog × 12 | 12 |
| Generate × 12 | 12 |
| **Total** | **49 clicks, ~6–8 minutes** |

### After T-14, happy path

| Step | Clicks |
|------|--------|
| Open Documents tab | 1 |
| Click "Générer pour tous" on Convocations card | 1 |
| Confirm dialog: ack 0–1 warning + "Générer" | 1–2 |
| Wait ~15–25s | 0 |
| Close dialog after success | 1 |
| **Total** | **4–5 clicks, ~30 seconds** |

### After T-14, mixed (8 ready / 4 blocked, then fix all)

| Step | Clicks |
|------|--------|
| Initial batch | 4 |
| Click `[Compléter →]` for learner 1 → fix email → click "Reprendre la génération des convocations" → land back on Documents tab with PreflightResumeBanner scoped to remaining failures | 3 |
| Repeat for 3 more learners | 9 |
| Final retry batch (4 left) | 2 |
| **Total** | **~18 clicks, ~3 minutes** |

**Friction types removed:** *Cognitive* (dropdown navigation × 12), *Motor* (49 → 5 in happy path), *Temporal* (single 25s wait vs 12 sequential dialogs).

---

## CTA Placement — Decision

### Primary: Group card header (as recommended by product-analyst §6)

```
┌─ Convocations (3/12 envoyées) ────── [Régénérer] [Générer pour tous] ▾─┐
│   ⚠ 9 convocations à envoyer                                           │
└────────────────────────────────────────────────────────────────────────┘
```

- Right-aligned, secondary outlined button (becomes filled-primary if 0 documents exist for the type).
- Label adapts: **"Générer pour tous"** (no docs yet) → **"Générer pour les 9 restants"** (mixed) → **"Régénérer pour tous"** (all already exist; amber outlined).
- Visible *without* expanding the group — Marie shouldn't have to expand to find the action she came for.

### Secondary: "Générer un document" dropdown

Add **"Pour tous les apprenants"** as the *first* item in any per-learner type submenu (Convocation, Certificat). Discoverability for users who default to the dropdown.

### NOT placed

- Not on individual per-learner doc rows (clutter, redundant with group action).
- Not as a global page-level button (ambiguous which doc type).
- Not in the Suivi tab (out of scope; Suivi can deep-link via existing `?quest=…`).

---

## Per-Learner Progress UI — Dialog over inline

**Decision: Modal dialog with live per-learner rows.**

Rejected: inline expansion of the group card. Reasons:
1. Marie may scroll away during the 25s wait — modal anchors attention.
2. The result list with per-learner `[Compléter →]` links needs scrollable real estate.
3. Keyboard focus trap during a destructive-ish action is good UX (prevents accidental tab change).

### Dialog structure

```
┌─ Générer 12 convocations ──────────────────────────────[X]─┐
│                                                            │
│  Cela peut prendre jusqu'à 30 secondes.                    │
│                                                            │
│  [▓▓▓▓▓▓▓░░░░░] 7 / 12 apprenants prêts                   │  ← T-43-aligned wording
│                                                            │
│  ✓ Marie Dubois            généré                          │
│  ✓ Karim Mansour           généré                          │
│  ⟳ Aïcha Benali            génération…                     │
│  ⏳ Jean Dupont             en attente                      │
│  ⏳ Sofia Garcia            en attente                      │
│  ⏳ …                                                       │
│                                                            │
│  [Annuler]                                                 │
└────────────────────────────────────────────────────────────┘
```

### Per-learner row state machine

| State | Icon | Color | Transition trigger |
|-------|------|-------|--------------------|
| `pending` | ⏳ Clock | muted | initial |
| `generating` | ⟳ Loader (spin) | blue | server starts this learner |
| `done` | ✓ Check | green | server emits success |
| `failed` | ⚠ AlertTriangle | red | preflight block or generation error |
| `skipped` | ⊘ MinusCircle | muted | already-`envoye` document exists (idempotency) |

### Result panel (after batch completes)

```
┌─ Résultat ────────────────────────────────────────────────┐
│  ✓ 8 convocations générées                                │
│  ⊘ 1 déjà envoyée (ignorée)                               │
│  ⚠ 3 à compléter                                          │
│                                                           │
│  ⚠ Jean Dupont — e-mail manquant       [Compléter →]      │
│  ⚠ Aïcha Benali — e-mail manquant      [Compléter →]      │
│  ⚠ Sofia Garcia — e-mail manquant      [Compléter →]      │
│                                                           │
│  [Fermer]   [Réessayer pour les 3 restants]               │
└───────────────────────────────────────────────────────────┘
```

- Reframe failure positively: count of successes first, problems second.
- "[Compléter →]" navigates to `/formations/[id]/apprenants?preflightFocus=email&focusContactId=<id>&returnTo=/formations/[id]/documents?resumeBatch=convocation`.
- "Réessayer pour les 3 restants" re-opens the dialog with only the 3 failed learners pre-loaded.

---

## Partial-Failure Recovery Loop — Detailed

### Step 1: Fix link

Each failed-row link encodes:
- `preflightFocus=<focusKey>` (e.g. `email`) — existing T-13 mechanism
- `focusContactId=<uuid>` — **new param** for the apprenants page to scroll to a *specific learner* row
- `returnTo=/formations/[id]/documents?resumeBatch=convocation`

### Step 2: Apprenants tab

- Page reads `focusContactId` and scrolls to that learner's row (highlight 1.5s).
- `PreflightResumeBanner` shows: "Reprendre la génération des convocations →" (existing component, no change needed beyond ensuring it works on apprenants tab — confirm via `<PreflightResumeBanner />` import).
- Marie fills the email, saves.

### Step 3: Return to Documents tab

- Banner click → `returnTo` path → Documents tab loads with `?resumeBatch=convocation`.
- Documents tab `onMount` reads `resumeBatch` → opens batch dialog scoped to *remaining failed learners*. (Server re-evaluates preflight per-learner, so the just-fixed learner now passes.)
- Optional polish: toast "Données mises à jour pour Jean Dupont — prêt à générer".

**Key constraint:** The fix-link `returnTo` MUST pass T-13's open-redirect protection (`PreflightResumeBanner.svelte` lines 19–30). Confirmed: same-origin path-only is enforced.

---

## Single Batch-Level Warning Acknowledgement

The single-doc dialog requires checking each `warn`-severity item before the Générer button enables. For batch:

- Warnings are evaluated **once at the formation level** (e.g. `nda_manquant` for OPCO devis, `retractation_delai` for B2C). Per-learner data warnings are not in the current rule set — if any are introduced, they aggregate.
- The confirm dialog shows a single section: **"Avant de continuer"** with each warning + a *single* "Je comprends et je souhaite continuer" checkbox at the bottom.
- The checkbox state is sent as `warningsAcknowledged=<comma-separated ids>` on submit (matches existing single-doc pattern).
- The audit log writes this acknowledgement N times — once per generated document — so the audit trail remains per-document granular even though the UX is single-shot.

---

## Cancellation Behavior

- "Annuler" button on the progress dialog sets a client-side `cancelled = true` flag and aborts the in-flight `fetch` via `AbortController`.
- Server-side: each per-learner iteration checks `if (request.signal.aborted) break` before starting the next learner. **Already-completed documents stay in the DB** (no rollback — Marie's work is preserved).
- Confirm dialog before destructive close mid-batch: *"Annuler la génération ? Les documents déjà créés seront conservés."*
- Closing the dialog via [X] or Escape triggers the same cancel flow (no silent abandonment).

---

## Empty States

### 1. Formation has 0 enrolled learners

- "Générer pour tous" button is **disabled** with tooltip: *"Aucun apprenant inscrit — ajoutez des apprenants pour générer."*
- Below the disabled button, a small inline link: *"→ Ajouter des apprenants"* → `/formations/[id]/apprenants`.

### 2. All learners already have a current `envoye`/`signe`/`archive` document

- Button label changes to **"Régénérer pour tous"** (amber outlined).
- Tooltip: *"Toutes les convocations ont déjà été envoyées. Les régénérer remplacera les versions actuelles."*
- Click opens a confirm dialog with stronger wording (the T-12 replacement semantics apply).

### 3. All learners ineligible (no contact / blocked at formation-level prereq)

- Button stays enabled.
- On click, the dialog opens directly in the result-panel state with all 12 rows showing the failure reason, no progress phase.
- Banner inside dialog: *"Aucune convocation ne peut être générée — corrigez les blocages ci-dessous."*

### 4. Formation-level prerequisite fails (certificat: emargements not all signed)

- "Générer pour tous" remains visible but the confirm dialog opens with a single *prerequisite* card *(not 12 rows)*: *"Les feuilles d'émargement ne sont pas toutes signées."* + `[Compléter dans Séances →]`.
- This avoids 12 identical row failures with the same cause.

---

## Wording (French, action-oriented)

| Surface | French copy |
|---------|-------------|
| CTA (no docs) | **Générer pour tous** |
| CTA (mixed remaining) | **Générer pour les {n} restants** |
| CTA (all exist) | **Régénérer pour tous** |
| Dropdown item | **Pour tous les apprenants** |
| Confirm dialog title | **Générer {n} convocations ?** |
| Confirm body | *Cela peut prendre jusqu'à 30 secondes.* |
| Confirm button | **Lancer la génération** |
| Progress label | **{x} / {y} apprenants prêts** *(aligned with T-43 "X sur Y" pattern)* |
| Result success | **{n} convocations générées** |
| Result skipped | **{n} déjà envoyée(s) — ignorée(s)** |
| Result failures | **{n} à compléter** *(NOT "{n} erreurs")* |
| Per-learner failure | *e-mail manquant* / *contact incomplet* / *no learner data* |
| Fix link | **Compléter →** |
| Retry button | **Réessayer pour les {n} restants** |
| Cancel confirm | *Annuler la génération ? Les documents déjà créés seront conservés.* |
| Disabled tooltip (0 learners) | *Aucun apprenant inscrit — ajoutez des apprenants pour générer.* |

**Tone discipline:** Failure copy never uses "erreur" or "échec". Always action-oriented ("à compléter", "à corriger"). The Peak-End rule: the last copy Marie reads after a partial batch should describe *what to do next*, not *what went wrong*.

---

## Accessibility & Mobile

- Dialog: focus trap, `aria-busy="true"` during generation, `aria-live="polite"` region announcing state changes ("8 sur 12 prêts").
- Per-learner row icons all paired with text labels (no icon-only state).
- Touch targets: `[Compléter →]` links min 44px tap area on mobile.
- Mobile: dialog full-screen below `sm` breakpoint; result panel scrolls vertically.
- `prefers-reduced-motion`: replace spinner with static "…" indicator on `generating` rows.

---

## Findings (sorted by severity)

### 🔴 Critical

**C1 — `evaluatePreflight` checks aggregate `hasLearnerWithEmail`, not per-learner.**
- Location: `src/lib/preflight/document-preflight.ts:152`.
- Persona affected: Marie (silent compliance gap — she would not see this).
- Observed: a formation with 11 apprenants having emails and 1 without will *pass* the formation-level check, generating a convocation for the 1 without an email.
- Mechanism: preflight context lacks `contactEmail` field for per-learner semantics.
- Emotional impact: 5/5 (delayed discovery — Marie sends 12 documents, 1 silently has no recipient, leading to Qualiopi audit gap).
- Recommendation: extend `PreflightContext` with `contactEmail?: string | null` and add a per-learner check inside the convocation rule. Mirrored in plan task `extend-preflight-context`.

### 🟠 Major

**M1 — Apprenants tab does not implement `?preflightFocus=` scroll/focus.**
- Location: `src/routes/(app)/formations/[id]/apprenants/+page.svelte` (no preflightFocus handler exists; only `fiche/+page.svelte:237` has it).
- Persona affected: Marie clicking `[Compléter →]` will land on Apprenants tab with no visual cue where to look.
- Recommendation: replicate the `onMount` focus pattern from `fiche/+page.svelte`. Plan task `per-learner-fix-links` covers this.

**M2 — No idempotency guard against double-click / two-tab races.**
- Recommendation: client-side disable button on click + server-side skip if a `genere`/`envoye` document already exists for that learner+type within the current batch evaluation. Plan task `idempotency`.

**M3 — A 12-document batch can exceed SvelteKit's default request timeout if generation is sequential.**
- Recommendation: bounded parallel pool (3 slots). Plan task `concurrency-cap`.

### 🟡 Minor

**m1 — "Régénérer" label colocated with "Générer pour tous" on the group card may confuse users.**
- Recommendation: when both apply (some sent, some missing), show "Générer pour les {n} restants" as primary and demote "Régénérer" to a kebab menu.

**m2 — No keyboard shortcut to dismiss the result panel after a fully-successful batch.**
- Recommendation: Escape key closes; auto-focus on "Fermer".

### 🔵 Polish

**P1 — Subtle confetti or success pulse on group card when batch completes 100%.** Reinforces Peak-End rule. Optional.
**P2 — Persist a "last batch" record on the formation (timestamp + count) so Marie can see "Last batch: 12 convocations le 18 mai".** Future ticket.

---

## Prioritized Recommendations

1. **Fix C1** (`contactEmail` per-learner preflight) — without this, batch generates documents for learners with no email recipient, a Qualiopi audit gap. Non-negotiable.
2. **Implement the dialog with live per-learner rows + result panel + `[Compléter →]` fix loop.** This is the core feature.
3. **Single batch-level warning acknowledgement** with N audit-log entries. Resolves the warning-friction tension cleanly.
4. **Add `?focusContactId=` support to Apprenants tab** so the existing T-13 fix-loop mechanism scopes to a specific learner.
5. **Bounded parallel pool (3) + per-learner skip on existing `envoye`** — protects against timeout and double-click duplicates.
6. **Empty state: 0 learners → disabled button with tooltip and add-learner shortcut.**
7. **All wording aligned with T-43** (`X / Y apprenants prêts`).

---

## Future considerations (out of T-14 scope)

- Persistent batch history record for audit-trail UX.
- Email-send batch action (after all convocations generated → "Envoyer les 12 par email").
- Background queue + push notification when generation > 60s.
- Per-learner inclusion checkbox in the confirm dialog (e.g. "exclude these 2 dropouts from this batch").

---
