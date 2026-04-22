---
title: "Suivi Tab & HUD Banner — Implementation Design Spec"
version: "1.0"
date: "2026-03-24"
status: "validated"
parent: "formations-actions-hud-design.md"
authors: ["Anthony (product)", "Claude (design)"]
tags: ["formations", "suivi", "hud", "qualiopi", "design-spec"]
---

# Suivi Tab & HUD Banner — Implementation Design Spec

This document is the **implementation-ready spec** derived from the validated UX foundations in `formations-actions-hud-design.md`. It resolves all open questions from Section 8 of that document and captures every design decision made during brainstorming. Treat this as the single source of truth for building the feature.

**This spec supersedes the parent document** wherever they differ — specifically: banner height (52px vs parent's 44px), removal of ⚡ icon (parent §3 still shows it), and Historique scope (MVP excludes "who completed it" — see §5 Section 4).

**Mockup reference:** `docs/mockups/suivi-tab-mockup.html` (validated v2)

---

## 1. Implementation Approach

**Approach A (modified):** Build in three sequential phases on a shared foundation.

### Phase 0 — Priority Engine & Lock System (shared library)
Build `getPrimaryAction()`, hard/soft lock classification, and the quest state categorization logic as pure functions in `src/lib/`. Both the HUD banner and the Suivi tab depend on this.

### Phase 1 — Suivi Tab Refactor
Rename the existing "Actions" tab to "Suivi" — both the tab label **and the route** (from `[id]/actions/` to `[id]/suivi/`). Update all internal links and navigation references. Restructure the quest board into the validated 4-section read-mostly layout. Remove inline editing from Suivi — all action happens in the relevant tabs via navigation links.

### Phase 2 — HUD Banner
Add the persistent banner component to `[id]/+layout.svelte`, between the tab bar and tab content. Implement all 4 banner states using data from Phase 0.

### Phase 3 — Inline Contextual Actions (future)
Add contextual alerts and inline action CTAs within each tab (Séances, Formateurs, Documents, etc.). Not in scope for this spec.

**Build methodology:** TDD (test-driven development). Write tests first for the priority engine, lock classification, and state categorization.

---

## 2. Hard vs. Soft Lock Classification

Every dependency pair in `QUEST_TEMPLATES` is classified as either **Hard** (technically impossible without prior data) or **Soft** (recommended sequence, overridable by Marie with one click).

### Conception Phase

| Quest | Depends on | Lock Type |
|-------|-----------|-----------|
| `analyse_besoins` | `verification_infos` | Soft |
| `programme_modules` | `verification_infos` | Soft |
| `devis` | `programme_modules` | **Hard** |
| `convention` | `devis` | **Hard** |
| `demande_financement` | `convention` | **Hard** |
| `accord_opco` | `demande_financement` | **Hard** |
| `session_edof` | `convention` | **Hard** |
| `convocations` | `convention` | Soft |
| `reglement_interieur` | `convocations` | Soft |
| `test_positionnement` | `analyse_besoins` | Soft |
| `preparation_logistique` | `convention` | Soft |
| `affectation_formateur` | `programme_modules` | Soft |
| `ordre_mission` | `convention` | Soft |

### Déploiement Phase (all Hard — temporal/physical gates)

| Quest | Depends on | Lock Type |
|-------|-----------|-----------|
| `accueil_lancement` | `programme_modules` | **Hard** |
| `accueil_lancement` | `convention` | **Hard** |
| `accueil_lancement` | `preparation_logistique` | **Hard** |
| `accueil_lancement` | `verification_infos` | Soft |
| `accueil_lancement` | `convocations` | Soft |
| `accueil_lancement` | `documents_formateur` | Soft |
| `emargement` | `accueil_lancement` | **Hard** |
| `animation_pedagogique` | `accueil_lancement` | **Hard** |
| `evaluations_formatives` | `animation_pedagogique` | **Hard** |
| `suivi_absences` | `emargement` | **Hard** |
| `adaptation_formation` | `evaluations_formatives` | **Hard** |

### Évaluation Phase

| Quest | Depends on | Lock Type |
|-------|-----------|-----------|
| `satisfaction_chaud` | `emargement` | Soft |
| `evaluation_acquis_fin` | `evaluations_formatives` | Soft |
| `certificat_realisation` | `emargement` | **Hard** |
| `attestation` | `evaluation_acquis_fin` | **Hard** |
| `attestation` | `certificat_realisation` | Soft |
| `facturation` | `certificat_realisation` | **Hard** |
| `justificatifs_opco` | `facturation` | **Hard** |
| `satisfaction_froid` | `satisfaction_chaud` | Soft |
| `evaluation_transfert` | `satisfaction_froid` | Soft |
| `bilan_formateur` | `satisfaction_chaud` | Soft |
| `amelioration_continue` | `satisfaction_chaud` | **Hard** |
| `amelioration_continue` | `satisfaction_froid` | Soft |
| `amelioration_continue` | `bilan_formateur` | Soft |
| `cloture_archivage` | `satisfaction_chaud`, `evaluation_acquis_fin`, `certificat_realisation`, `attestation`, `facturation`, `bilan_formateur`, `amelioration_continue` | **Hard** (all 7) |

### Lock UI Behavior

**Hard lock:** Quest row is dimmed. Shows "🔒 Verrouillé" badge. Hovering the badge reveals a tooltip explaining when the step unlocks (e.g., "Cette étape sera disponible au début de la formation, le 12 avril."). No CTA, no override.

**Soft lock:** Quest row is dimmed. Shows explanatory text instead of a badge (e.g., "Après les convocations"). Shows an "Anticiper cette étape" override link. One click unlocks it — no confirmation modal, no required note. The click itself is the acknowledgment. When clicked, the system records `softLockOverriddenAt` on the quest row and the quest moves to the "En cours / À faire" section. This override persists across page reloads.

**Soft lock override in Historique:** When Marie completes a soft-locked quest early, Historique shows it as "✓ Anticipé" (positive framing). Hovering shows: "Complété avant [dependency] — aucun impact sur la conformité."

---

## 3. Critical Path Priority Algorithm

The function `getPrimaryAction(formationState) → Quest | null` determines which single action the HUD banner displays. It is a pure, deterministic function.

### Priority cascade (5 levels)

1. **Overdue deadline** — any action past its due date takes top priority
2. **Qualiopi criticality** — quests with `criticalForQualiopi: true` (canonical field name from `QUEST_TEMPLATES` in `formation-quests.ts`) rank above non-critical
3. **Dependency fan-out** — whichever action unblocks the most subsequent quests ranks higher
4. **Deadline proximity** — soonest due date wins
5. **Phase order / orderIndex** — earlier in dependency tree wins as final tiebreaker

### Edge cases

**Émargement (recurring daily action):** Not surfaced in the banner every day. Only appears when a séance date has passed AND signatures are still missing after 24 hours. The banner shows: "3 signatures manquantes · Séance du 15 mars" with a CTA to send reminders. After Marie sends reminders, transitions to waiting state. Clears when all signatures arrive.

**Long-tail Évaluation quests (J+60, J+120):** After all immediate post-formation tasks complete, banner goes to green/quiet state: "Tout est en ordre · Prochaine étape dans X jours · Vous pouvez souffler." When the time window approaches (7 days before), banner re-activates with the new action. The "X jours" is calculated once at transition, not a live countdown.

**True ties:** Phase order (`orderIndex`) is the final deterministic tiebreaker. In practice, ties through the full 5-level cascade are extremely rare.

---

## 4. HUD Banner Specification

### Layout

A persistent strip fixed between the tab bar and the tab content. Part of the page layout in `[id]/+layout.svelte`. Always visible on every tab. Does not change content based on which tab is active. Height: ~52px. Left-bordered color accent (4px) reflecting the current state color. Background: white/near-white.

### Four states

#### State 1 — Action disponible (single)
- Left border: amber
- Content: `[PHASE PILL] [MESSAGE] [CTA BUTTON]`
- No icon (no thunder emoji anywhere)
- CTA: solid dark button with tab name ("Séances", "Formateurs", etc.)

#### State 2 — Actions disponibles (concurrent, 2–4)
- Same as State 1, plus a "+N autres →" chip between message and CTA
- Clicking the chip opens a micro-popover listing the other actions with their own tab CTAs
- Popover footer: "Ces actions peuvent se faire dans l'ordre de votre choix." (mandatory copy)
- Popover dismissed by clicking outside
- On mobile (< 640px): popover becomes a bottom sheet (vaul-svelte drawer pattern)

#### State 3 — En attente externe
- Left border: blue
- Content: `[PHASE PILL] ⏳ [MESSAGE with elapsed time] [RELANCER CTA]`
- CTA: outlined/soft button style (not solid), labeled "Relancer"
- "Relancer" opens a pre-filled email compose. After sending, system records timestamp
- If no external action possible: CTA absent entirely
- Shows "Relancé il y a X jours" or "Aucune relance depuis X jours"

#### State 4 — Phase complète / en attente du démarrage
- Left border: green
- Content: `✓ [MESSAGE]`
- No CTA, no phase pill
- Copy options:
  - Phase done, formation soon: "Conception complète · Formation dans X jours · Vous pouvez souffler."
  - All immediate tasks done, long-tail pending: "Tout est en ordre · Prochaine étape dans X jours · Vous pouvez souffler."

#### Overdue items

When a quest is past its due date, it is still displayed as State 1 (action disponible) but with modified copy using "À régulariser" instead of the normal action description. The left border remains amber — red is reserved for genuinely broken/error states, not overdue items. The overdue flag is the highest priority in the cascade (§3), so it will always surface as the primary action.

### What the banner never does

- Never shows a compliance percentage
- Never changes content based on which tab is active
- Never shows more than one primary action
- Never shows more than 4 items in the concurrent popover
- Never uses Qualiopi indicator numbers in user-facing copy
- Never uses red for active-wait state
- Never shows ⚡ or any thunder icon

---

## 5. Suivi Tab Design

### Purpose

Quick status check for Marie. Shows everything at a glance with links to go act. Read-mostly — no inline editing, no upload forms, no action surfaces. All action happens in the relevant tabs via navigation CTAs.

### Filtering

Only shows quests applicable to this specific formation (filtered by `applicableTo` matching formation type and funding). Non-applicable quests are hidden entirely.

### Phase Progress Cards (top of tab)

Three cards in a horizontal grid. Each card shows:
- **Phase name** (Conception, Déploiement, Évaluation) + info icon (i)
- **Subtitle** explaining the phase in plain language:
  - Conception: "Préparation du dossier"
  - Déploiement: "Pendant la formation"
  - Évaluation: "Suivi post-formation"
- **Date range** (e.g., "1 mars → 11 avril")
- **Step count** (e.g., "7 / 10 étapes") — counts, not percentages
- **Progress bar** — amber for active phase, green for done, gray for future
- **Contextual countdown**:
  - Active conception: "Formation dans X jours"
  - Future déploiement: "Commence dans X jours"
  - Active déploiement: "En cours · Jour X/Y"
  - Future évaluation: "Commence dans X jours"
- **Info tooltip** on hover (i icon): plain-language description of what the phase covers

On mobile: cards stack vertically (1 column).

### Four sections

#### Section 1 — En cours / À faire
Quests that are currently actionable (all dependencies met, status is "Pas commencé" or "En cours"). Each row:
- Quest title (left)
- "À faire" status badge (right-aligned column, amber pill)
- Tab CTA button (right-aligned column, bordered pill: "Séances", "Formateurs", etc.)

This section is short in normal use — the banner already surfaced these.

#### Section 2 — En attente
Quests waiting on an external party (OPCO, client, learners). Each row:
- Quest title
- "En attente" status badge (blue pill)
- "Relancé il y a X jours" text
- "Relancer" CTA button (blue outlined pill)

"Relancer" opens the send-email compose flow. After sending, system records timestamp.

#### Section 3 — À venir
Future steps — both soft-locked and hard-locked quests. Visual treatment within:
- **Soft locks:** dimmed row, no badge, explanatory text right-aligned (e.g., "Après les convocations"), "Anticiper cette étape" override link
- **Hard locks:** dimmed row, "🔒 Verrouillé" badge with hover tooltip, no CTA
- **Collapsed group:** When many hard-locked evaluation quests exist, show a collapsed row: "+ X étapes d'évaluation (après la formation)"

#### Section 4 — Historique
Completed quests in reverse chronological order. Each row:
- Quest title
- "✓ Complété" or "✓ Anticipé" status badge (green pill)
- Completion date

**MVP scope decision:** The parent spec (§6) describes Historique as showing "who completed it, when, and whether it was completed in order or anticipé." For MVP, we intentionally exclude the "who" field — Marie is the primary (often sole) user completing quests, so this data has low value until multi-user workflows exist. The "who" column is a V2 audit trail feature. The `formationAuditLog` table already captures actor data for when this is needed.

### Quest row layout

CSS Grid with 3 columns: `1fr auto auto`. This ensures status badges and CTAs align in invisible vertical columns across all rows. Left border color accent (3px) per row matches the state:
- Amber: actionable
- Blue: waiting
- Gray (solid): locked / soft-locked
- Green: completed / anticipated

### CTA behavior — deep-linking with auto-focus

When Marie clicks a tab CTA (e.g., "Séances"), she is navigated to the relevant tab with the specific quest context. The destination tab should:
1. Scroll to the relevant section/item
2. Auto-focus and/or pulse-animate the fields or buttons that need attention
3. Minimize cognitive load — Marie should be able to act without reading

This creates the "teenager clicking through" experience: guided, frictionless, no thinking required.

**Mechanism:** Navigation uses a query parameter (e.g., `?quest=convocations`) that the destination tab reads to identify the target element. A Svelte store or `$page.url.searchParams` drives the scroll-to and pulse animation on mount. The query param is cleaned from the URL after the animation fires (via `replaceState`).

### What Suivi does NOT contain

- Its own upload or form interfaces
- A compliance percentage as a headline
- Any navigation that contradicts the banner
- Inline editing or inline sub-action forms
- The quest board card layout from the current Actions tab

---

## 6. External Waiting — Companion Tracking

The system acts as Marie's memory for external waits. Manual tracking with time elapsed display.

- When Marie marks a quest as "en attente," the system records the timestamp
- When Marie sends a reminder via "Relancer," the system records that timestamp
- HUD banner shows: "En attente de l'accord OPCO · Relancé il y a X jours"
- If Marie hasn't relanced in a while: "Aucune relance depuis X jours"
- No auto-emails, no auto-escalation — Marie decides when and how to follow up
- The system is a companion that keeps track, not an automator
- "Relancer" opens the existing `send-email` inline flow with: recipient pre-filled (e.g., OPCO contact), subject pre-filled with formation reference, body template referencing the pending item. Uses the `SendEmailConfig` pattern from `formation-quests.ts` (`reminderEmailType` field on `WaitExternalConfig`)

---

## 7. Phase Transition Celebrations

Three tiers of celebration, proportional to the achievement. No confetti. All animations are smooth CSS transitions/keyframes.

### Tier 1 — Individual quest completion
- Subtle, satisfying completion sound (soft chime)
- Quest card/row animates smoothly to completed state (gentle scale-up then settle, border color transition)
- Quick, tactile, non-intrusive

### Tier 2 — Phase completion
- Warm achievement sound (resolved chord, soft "level up" tone)
- Achievement toast slides in (builds on existing `level-up-toast.svelte` pattern):
  - Icon animation (checkmark drawing itself, or phase badge gaining a glow)
  - Copy: "Conception complète" with subtext "Toutes les étapes de conception sont terminées."
- HUD banner smoothly transitions to green (color morph, text fade)
- Toast auto-dismisses after ~5 seconds

### Tier 3 — Formation fully audit-ready (`cloture_archivage` done)
- Bigger celebration: more prominent toast or "achievement unlocked" moment
- Distinct, warm sound
- Copy: "Dossier complet · Cette formation est prête pour l'audit."
- Feels earned, warm, final — like finishing a game

### Sound design
- All sounds are optional (respect system mute settings)
- Sounds are subtle, not loud or gamey
- Musical, not notification-like

---

## 8. Naming and Copy Conventions

From the parent spec, plus additions from brainstorming:

| Concept | Use this | Never use this |
|---------|----------|----------------|
| The three phases | Conception, Déploiement, Évaluation | Phase 1/2/3, Qualiopi indicator numbers |
| A task to complete | "action", "étape" | "quête", "quest", "tâche" |
| Waiting on someone | "En attente de [personne/organisme]" | "Bloqué par", "dépend de" |
| Done ahead of schedule | "Anticipé" | "Hors séquence", "Non standard" |
| Everything is fine | "Vous pouvez souffler", "Tout est en ordre" | "68% conforme", "Aucune anomalie" |
| An overdue item | "À régulariser" | "En retard", "Dépassé", "Overdue" |
| Soft-locked quest | [explanatory text, e.g., "Après les convocations"] | "Soft lock", "Flexible", "Optionnel" |
| Hard-locked quest | "Verrouillé" (with tooltip) | "Hard lock", "Bloqué" |
| Override action | "Anticiper cette étape" | "Débloquer", "Forcer", "Override" |
| Banner CTA | Tab name only ("Séances", "Formateurs") | Full sentences, arrows before text |
| Thunder/urgency icon | None — never use ⚡ anywhere | ⚡, 🔥, ⚠️ |

---

## 9. Mobile Behavior

Mobile is a real concern — Marie sometimes checks on her phone.

- **Phase progress cards:** Stack vertically (1 column) on screens < 640px
- **Quest rows:** Stack columns vertically (title, then badge, then CTA on new line)
- **HUD banner:** Wraps content, maintains readability
- **Concurrent action popover:** Becomes a bottom sheet (vaul-svelte drawer pattern) on screens < 640px
- **Tab bar:** Horizontally scrollable (existing behavior)

---

## 10. Data Model Implications

### New fields needed

- `formationActions.waitStartedAt` — timestamp when quest was marked as "en attente"
- `formationActions.lastRemindedAt` — timestamp of last manual reminder
- `formationActions.anticipatedAt` — timestamp if quest was completed out of soft-lock sequence
- `formationActions.softLockOverriddenAt` — timestamp when Marie clicked "Anticiper cette étape" to unlock a soft-locked quest before its dependencies were met (persists across reloads)

### New column on dependency definition

Each dependency pair in `QUEST_TEMPLATES` needs a `lockType: 'hard' | 'soft'` field. This can be added as a property on the dependency entries or as a separate lookup map. Lock types are **fixed** — they do not vary by formation type (Intra/Inter) or funding type (OPCO/CPF). The classification in §2 applies universally.

### Quest state categorization

A quest can be in one of these states (for Suivi display):

```typescript
type QuestDisplayState =
  | 'actionable'     // dependencies met, status "Pas commencé" or "En cours"
  | 'waiting'        // marked as waiting on external party
  | 'soft_locked'    // has unmet soft dependencies (overridable)
  | 'hard_locked'    // has unmet hard dependencies (not overridable)
  | 'completed'      // status "Terminé", completed in order
  | 'anticipated';   // status "Terminé", completed out of soft-lock sequence
```

---

## 11. Notes for Auto-Actions & Document Sources

Some quests don't require Marie to upload anything because the app generates or auto-sends documents from formation data:

- **`reglement_interieur`**: auto-sent via email (Postmark API) to all relevant parties when convocations are complete. **Auto-completes** — no manual confirmation by Marie needed. The document source is the learning center's règlement intérieur, uploaded once in the **Bibliothèque** (`/bibliotheque`) — see §11a below.
- **Generated documents** (devis, convention, convocation, certificat, attestation, facture, ordre de mission): generated from formation data, no manual upload needed.
- **External documents** (OPCO agreement): require manual upload by Marie.
- **Formateur documents** (CV, diplômes, NDA/URSSAF/SIRET): managed in the CRM, not uploaded per-formation — see §11b below.

### 11a. Bibliothèque — Global Document Templates (dependency, out of scope)

The `/bibliotheque` route should provide a sub-section where users can upload global document templates that apply across all formations (e.g., règlement intérieur, livret d'accueil). When the app needs such a document for a formation, it pulls it from the Bibliothèque.

- If the user has uploaded a custom document for règlement intérieur in the Bibliothèque, that is what gets auto-sent.
- If no custom document exists, the app could propose a default template (future feature).
- Marie should be able to preview the document in the **Documents tab** of the Formation page, with a preview UI similar to Google Drive or macOS Finder (thumbnail + preview panel).

**This Bibliothèque sub-route is a prerequisite** for the `reglement_interieur` auto-completion. If it doesn't exist when Suivi ships, the quest falls back to a manual flow (Marie uploads the document per-formation).

### 11b. Formateur Documents — CRM Integration

Documents scoped to formateurs (CV, diplômes, justificatifs URSSAF/SIRET/NDA) are **not uploaded per-formation**. They live on the formateur's profile in the CRM at `/contacts/formateurs/[id]`.

When the `documents_formateur` quest is active in a formation:
- The Suivi tab (and the Formateurs tab) shows the **required document status for each assigned formateur** — which documents are present and which are missing.
- Each missing document has a CTA that navigates Marie to the formateur's CRM profile (`/contacts/formateurs/[id]`) where she can upload the missing ones.
- After uploading in the CRM, Marie navigates back to the Formation page, and the quest status updates automatically (the system checks the formateur's document completeness in real-time).

This means the `documents_formateur` quest's completion is **derived** from the formateur profiles in the CRM, not from uploads within the formation itself.

---

## 12. Rejected Patterns (carried from parent spec + new)

| Rejected | Why |
|----------|-----|
| Floating side panel | Pushes/hides content, creates "is there something behind this?" anxiety |
| Context-aware banner (changes per tab) | Fails the GPS navigation promise |
| Global compliance percentage | Measures time, not Marie's work. Creates false anxiety |
| Massive checklist | Hick's law + Fitts's law violation |
| ⚡ thunder icon | Creates false urgency on every actionable item. Amber border is sufficient |
| "Soft lock" / "Flexible" badge text | English jargon or confusing within "À venir" section |
| Dashed borders for soft locks | Visually ugly and inconsistent with design system |
| Arrow before CTA text ("→ Séances") | Inconsistent and visually noisy |
| Link-styled CTAs (underlined text) | Inconsistent with button-styled CTAs elsewhere |
| Inline editing in Suivi tab | Suivi is a map, not a cockpit — action surfaces live in their respective tabs |

---

*End of spec. This document supersedes Section 8 of `formations-actions-hud-design.md` — all open questions are now resolved.*
