---
title: "Formations Detail — HUD Banner & Suivi Tab: Design Decisions"
version: "1.0"
date: "2026-03-24"
status: "validated"
authors: ["Anthony (product)", "Claude (design reasoning)"]
references:
  - "/docs/qualiopi-formation-workflow.md"
  - "/docs/foundations/mentore-manager-formations-ux-foundations.md"
tags: ["formations", "ux", "hud", "suivi", "qualiopi", "design-system"]
---

# Formations Detail — HUD Banner & Suivi Tab: Design Decisions

## Context

This document captures the validated design direction for the **Actions/Compliance layer** of the Formations detail page. It is the source of truth for implementation planning, agent tasking, and team alignment.

The core problem this solves: Marie (our primary user) is reactive, anxious, and cognitively overloaded. She manages 10–20 formations simultaneously. Every existing tool forces her to hunt through tabs or checklists to discover what needs doing. This system must do the opposite — it must always tell her what to do next, and then get out of her way.

---

## 1. Validated Architecture: Three Co-existing Layers

The design uses three distinct, non-competing layers. Each has a single responsibility.

### Layer 1 — The HUD Banner (always present)

A persistent, slim strip fixed between the tab bar and the tab content. It is part of the page layout — it does not float, it does not overlap content, it does not hide anything. It is always visible on every tab.

**Its single responsibility:** answer the question *"What is the single most important thing to do right now in this formation, and where do I go to do it?"*

It does not change content when Marie switches tabs. It is a GPS, not a contextual assistant. See Section 3 for full behavioral specification.

### Layer 2 — Contextual inline actions (within each tab)

Each tab already contains the objects that need action. Actions live inline within those tabs — not in a separate panel.

- On **Séances**: a session row with a missing attendance sheet shows `⚠ Feuille manquante · [+ Uploader]` inline
- On **Formateurs**: an educator card with missing documents shows `2 documents manquants · [Compléter le dossier]` inline
- On **Documents**: missing docs have an upload CTA directly in the row

The tab is the action surface. The banner tells Marie which tab to go to; the tab handles the doing. This eliminates all back-and-forth navigation.

### Layer 3 — Suivi tab (deliberate journal)

A renamed and repositioned "Actions" tab. Its responsibility is **not** to drive workflow — that is the banner's job. Suivi is consulted deliberately, primarily for:

1. Full compliance overview before an audit
2. Historical record of what was done, when, and by whom
3. Horizon view of upcoming items not yet unlocked

Suivi is read-mostly. Its CTAs link to the relevant tab (`→ Voir dans Séances`) rather than duplicating action surfaces. It is a map, not a cockpit.

---

## 2. What Was Explicitly Rejected and Why

These were considered and ruled out. They must not re-emerge in implementation.

| Rejected Pattern | Why |
|---|---|
| **Floating side panel** | Pushes content or hides it. Forces constant collapse/expand. Creates "is there something behind this?" anxiety. |
| **Context-aware banner** (content changes per tab) | Fails the core navigation promise. Marie would have to click through every tab to discover what's missing in each. Removes the "you don't need to explore" guarantee. |
| **Global compliance percentage** as the primary signal | Measures time passing, not Marie's work. A formation with 100% of Conception done is not "33% compliant" — it is on track. Showing a low number when nothing can be done creates false anxiety. |
| **Massive checklist** | Violates Hick's law and Fitts's law. Overwhelm and paralysis. |
| **Quest tracker as primary action surface** | Required constant tab navigation to perform the actual actions. The actions must live where the objects live. |

---

## 3. HUD Banner: Full Behavioral Specification

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Aperçu  Fiche  Programme  Séances  Formateurs  Apprenants  Documents  Suivi │  ← tab bar
├─────────────────────────────────────────────────────────────────────────────┤
│  [PHASE PILL]  [STATUS ICON]  [MESSAGE]  ·  [SECONDARY COUNT CHIP]  [CTA]  │  ← HUD banner
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        [active tab content]                                 │
│                                                                             │
```

The banner is a single horizontal line, approximately 44px tall. It has a left-bordered color accent (4px) that reflects the current state color. Background is always white/near-white — never the state color itself (avoids aggression for amber/red states).

### Banner States

There are exactly four states. Each has a distinct color, icon, copy pattern, and CTA behavior.

---

#### State 1 — Action disponible (single)

Shown when exactly one action is available on the critical path.

```
│ ● Conception  ⚡ Envoyer la convocation aux stagiaires              [→ Séances] │
```

- Left pill: current phase name, neutral stone color
- Icon: `⚡` (urgency without alarm — this is actionable, not broken)
- Message: plain language description of the action. No Qualiopi jargon.
- CTA: tab name in brackets, navigates to that tab. Tab name only, not a full sentence.

---

#### State 2 — Actions disponibles (concurrent)

Shown when 2–4 actions are available simultaneously and Marie can choose their order.

```
│ ● Conception  ⚡ Envoyer la convocation aux stagiaires   +2 autres →   [→ Séances] │
```

- Primary action and CTA as above — chosen by priority logic (see Section 4)
- `+2 autres →` is a small chip, not a button. Clicking it reveals a micro-popover:

```
  ┌──────────────────────────────────────────────────┐
  │  Aussi disponibles maintenant :                  │
  │  · Préparer la logistique         [→ Séances]   │
  │  · Affecter le formateur          [→ Formateurs] │
  │                                                  │
  │  Ces actions peuvent se faire dans               │
  │  l'ordre de votre choix.                        │
  └──────────────────────────────────────────────────┘
```

The last line — *"dans l'ordre de votre choix"* — is mandatory copy. It signals empowerment, not overwhelm. The popover is dismissed by clicking anywhere outside it.

---

#### State 3 — En attente externe (active wait)

Shown when Marie has completed her part but is blocked on an external party (OPCO, client signature, students returning a test).

```
│ ● Conception  ⏳ En attente de l'accord OPCO · Relancé il y a 5 jours   [Relancer] │
```

- Color: calm blue — waiting is not a problem, it is a state
- Icon: `⏳`
- Optional CTA: "Relancer" — soft action, not urgent
- If no external action is possible: CTA is absent entirely

---

#### State 4 — Phase complète / en attente du démarrage (time-locked)

Shown when all Conception tasks are done but the formation start date has not arrived — or when Déploiement is locked because the formation physically hasn't started yet.

```
│ ✓ Conception complète · Formation dans 8 jours · Vous pouvez souffler.          │
```

- Color: green
- No CTA
- No percentage, no count, no pending items
- Copy is warm and human. "Vous pouvez souffler." is not optional — it is the emotional payload of this state. Marie needs explicit permission to feel relief.

> **Design rule:** This state must feel like a reward, not a pause before the next alarm. It is the most important emotional beat in the entire banner system.

---

### What the Banner Never Does

- Never shows a compliance percentage
- Never changes its content based on which tab is active
- Never shows more than one primary action
- Never shows more than 4 items in the concurrent popover
- Never uses Qualiopi indicator numbers or regulatory terminology in user-facing copy
- Never uses red color for the active-wait state — red is reserved for genuinely overdue/blocked situations

---

## 4. Critical Path Priority Logic

When multiple actions are available concurrently, the banner must choose one as primary. The priority order is:

1. **Overdue deadline** — any action past its due date takes top priority regardless of other factors
2. **Qualiopi criticality** — actions flagged `is_critical: true` in `/docs/qualiopi-formation-workflow.md` rank above non-critical ones
3. **Dependency fan-out** — whichever action unblocks the most subsequent quests ranks higher (e.g., Q05 Convention unblocks Q06, Q08, Q09b simultaneously — it ranks above Q09c which unblocks only one path)
4. **Deadline proximity** — soonest due date wins
5. **Phase order** — earlier in the dependency tree wins as a tiebreaker

This logic is deterministic. It must produce the same result given the same formation state. It should be implemented as a pure function: `getPrimaryAction(formationState) → Quest | null`.

---

## 5. Lock Types: Hard vs. Soft

Not all blocked quests are the same. The system must distinguish them.

### Hard locks

Technically impossible without prior data. The data literally does not exist yet.

**Example:** Q17 (Certificat de réalisation) cannot be generated without completed émargements from Q11. There is no workaround — the content of the certificate depends on that data.

**UI behavior:** The action in its tab shows a calm explanation, not an error: *"Disponible une fois les émargements de toutes les séances collectés."* No CTA.

### Soft locks

Sequentially recommended but not technically dependent. Marie could fill in the data early if she has it.

**Example:** Q09c (Affectation du formateur) is recommended after Q03, but the educator might already be decided on day one.

**UI behavior:** The action in its tab appears in a subdued/dimmed state with a one-click override: *"Cette étape est généralement faite après la validation du programme. Renseigner quand même →"*

One deliberate click unlocks it. No confirmation modal. The click itself is the acknowledgment.

### Out-of-order completions in Suivi

When Marie completes a soft-locked quest early, Suivi displays it honestly:

```
Q09c — Affectation du formateur    ✓ Complété · Anticipé
```

The `Anticipé` tag is non-judgmental — it means "done ahead of schedule", which is positive framing. Hovering/tapping shows: *"Complété avant la finalisation du programme — aucun impact sur la conformité."*

The banner is unaffected by early completions. It continues walking the critical path from the remaining genuine blockers.

---

## 6. Suivi Tab: Structure and Scope

### Purpose

Suivi is the **honest mirror** of the formation's compliance journey. It does not drive workflow. It records reality.

### Three sections

**En cours / À faire** — quests that are currently actionable or active. This is the shortest section in normal use. Each item links to its relevant tab. This section is never the primary entry point for action — the banner already surfaced these.

**Bloquées / En attente** — quests that are locked (hard or soft) or waiting on an external party. Shows the reason and, for soft locks, the override option.

**Historique** — completed quests, in reverse chronological order. Shows who completed it, when, and whether it was completed in order or anticipé. This is the audit trail.

### What Suivi does NOT contain

- Its own upload or form interfaces — these live in the relevant tabs
- A compliance percentage as a headline — if a score appears at all, it is scoped to the current phase only, and only as secondary information
- Any navigation that contradicts the banner — Suivi's "→ Voir dans Séances" links and the banner's CTAs must always agree

### Visual language

Quests in Suivi are displayed as a flat list grouped by phase, not as cards or accordions. Status is communicated through a left-border color and a small status chip — consistent with the banner's color system. The list is scannable in seconds, not interactive.

---

## 7. Naming and Copy Conventions

These apply to all user-facing text in the banner and Suivi.

| Concept | Use this | Never use this |
|---|---|---|
| The three phases | Conception, Déploiement, Évaluation | Phase 1/2/3, any Qualiopi indicator numbers |
| A task to complete | "action", "étape" | "quête", "quest", "tâche" (too project-manager) |
| Waiting on someone | "En attente de [personne/organisme]" | "Bloqué par", "dépend de" |
| Done ahead of schedule | "Anticipé" | "Hors séquence", "Non standard" |
| Everything is fine | "Vous pouvez souffler", "Tout est en ordre" | "68% conforme", "Aucune anomalie détectée" |
| An overdue item | "À régulariser" | "En retard", "Dépassé", "Overdue" |

---

## 8. Next Steps: What Remains to Be Thought Through

The following items are not yet resolved. They require collaborative design sessions with Anthony before any implementation planning begins.

An agent tasked with moving this forward **must use its interactive questioning capability to work through these items with Anthony one at a time**, iteratively, rather than making assumptions. The goal of each session is a decision, not a list of options.

---

### 8.1 — Hard vs. Soft Lock Classification for All 30 Quests

**What's needed:** A definitive classification of every quest in `/docs/qualiopi-formation-workflow.md` as either a hard lock or soft lock relative to each of its dependencies.

**Why it matters:** This directly determines what Marie can do early vs. what the system genuinely prevents. Getting it wrong in either direction is costly — too many hard locks creates frustration, too few creates data integrity problems.

**Questions to work through with Anthony:**
- For each dependency pair (e.g., Q09c depends on Q03): is the dependency truly technical (the data from Q03 is needed to complete Q09c), or is it only sequential by best practice?
- Are there any quests where the lock type should vary by formation type (intra vs. inter, OPCO vs. CPF)?
- Should the override UI for soft locks require a reason/note for audit trail purposes?

---

### 8.2 — The Critical Path Algorithm: Edge Cases

**What's needed:** Decisions on how the priority logic (Section 4) behaves in edge cases.

**Why it matters:** The algorithm must be deterministic and feel fair to Marie. If it consistently picks the wrong "primary" action, the banner loses trust.

**Questions to work through with Anthony:**
- What happens when two actions are equally critical, have the same deadline, and unblock the same number of quests? Is there a final tiebreaker, or does it not matter?
- When a formation is in Déploiement and Q11 (émargement) is a recurring daily action, how does the banner handle it? Does it surface it every day, or only when a session just occurred and the sheet hasn't been uploaded within N hours?
- How does the banner behave for the long-tail Évaluation quests (Q21 at +60 days, Q22 at +90 days)? Does it go quiet until the time window opens, then re-activate?

---

### 8.3 — The "Suivi" Tab: Scope for MVP vs. Later

**What's needed:** A clear decision on what Suivi shows at launch vs. what can wait.

**Why it matters:** Suivi can become a rich audit-preparation tool over time, but building too much at once delays the banner (which is the higher-priority feature).

**Questions to work through with Anthony:**
- Is the historical audit trail (who did what, when) a launch requirement, or is it a V2 feature? Does the current data model support it?
- Should Suivi show the full 30-quest list at launch, or only the quests applicable to this specific formation (filtering by type, financing, etc.)?
- Is the phase-scoped compliance indicator (showing e.g. "Conception: 9/13 étapes complètes") wanted in Suivi at launch, or does it risk reintroducing the percentage anxiety problem?

---

### 8.4 — The Concurrent Action Popover: Mobile Behavior

**What's needed:** A decision on how the `+N autres →` pattern behaves on smaller screens.

**Why it matters:** The popover pattern works well on desktop. On mobile (or a narrow browser window), a popover anchored to the banner may overflow or feel jarring.

**Questions to work through with Anthony:**
- Is mobile a real concern for the initial release, or is this a desktop-first tool?
- If mobile matters: should the popover become a bottom sheet on small screens, or should concurrent actions be collapsed into the Suivi tab entirely on mobile?

---

### 8.5 — Phase Transition Moments

**What's needed:** Decisions on the UX beat when a phase completes and the next one unlocks.

**Why it matters:** Phase transitions are the highest-emotion moments in the compliance journey. Getting them right builds the feeling of progress and momentum that the entire product philosophy depends on.

**Questions to work through with Anthony:**
- When Conception completes: is there a one-time celebration moment (animation, modal, toast) or does the banner quietly shift to the time-locked green state?
- When Déploiement unlocks (formation start date arrives): does anything proactively notify Marie, or does she discover it the next time she opens the formation?
- When the final quest in Évaluation is completed: what does "audit-ready" look like? Is there a distinct visual state for a formation with a 100% complete dossier?

---

### 8.6 — External Waiting States: Automation Potential

**What's needed:** A decision on how much the system can track and automate for external waits.

**Why it matters:** The "en attente externe" banner state implies the system knows who is being waited on and when the wait started. This requires data the system might not have.

**Questions to work through with Anthony:**
- For Q07 (Accord OPCO): does the system know when Q06 was submitted, and can it calculate "relancé il y a 5 jours" automatically?
- Should the system support sending reminders directly (e.g., "Relancer l'OPCO" triggers an email), or does "Relancer" simply prompt Marie to do it manually?
- Are there external waits that should automatically escalate (e.g., if OPCO hasn't responded after 15 days, the banner shifts from blue to amber)?

---

*End of document. All design decisions above section 8 are validated and should be treated as requirements, not proposals. Section 8 items are open questions to be resolved before implementation planning.*
