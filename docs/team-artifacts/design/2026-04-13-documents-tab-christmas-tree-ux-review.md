# Documents Tab UX Review — "Christmas Tree" Problem

**Date**: 2026-04-13
**Reviewer**: UX Designer (behavioral psychology lens)
**Component**: `src/routes/(app)/formations/[id]/documents/+page.svelte`
**Persona**: Marie, 34, admin manager — manages 10–20 formations, interrupted constantly, latent audit anxiety

---

## TL;DR

1. **Three independent warning systems** (compliance banners, generation prompts, stale indicators) all compete for attention using red/amber, diluting signal meaning — Marie can't distinguish "your business is at risk" from "you could regenerate this"
2. **Per-card stale indicators are pure noise** when most/all docs are stale (common after editing formation details) — N identical amber bars create a wall of amber
3. **Phase badges in flat view are clutter** — Marie chose flat view because she cares about urgency, not audit phases; phase context belongs in the grouped view
4. **Compliance warnings occupy disproportionate space** — two full-width red banners above the fold push the actual content below the fold
5. **Most important recommendation**: Consolidate stale indicators into a single global banner with "Tout régénérer", and visually separate the three warning tiers (critical → actionable → informational)

---

## Personas & Hypotheses

**Marie** opens the Documents tab after editing formation details. She expects to see her documents and quickly act on what needs attention.

- **H1**: When confronted with 2 red banners + 1 amber prompt + N amber stale bars, Marie experiences cognitive freeze (Hick's Law — too many competing signals)
- **H2**: The repeated stale indicators create "banner blindness" — after seeing the same amber bar 3+ times, Marie stops reading them entirely
- **H3**: Phase badges in flat view add ~20% visual noise without aiding Marie's primary task (urgency triage)
- **H4**: The cumulative emotional impact is anxiety amplification (Emotional Valence) — the UI looks like everything is broken when in reality it's a routine data refresh

---

## Click-Path Analysis

### Goal: "Understand what needs my attention"

| Step | Current | Ideal | Friction |
|------|---------|-------|----------|
| 1. Scan page | Eyes bounce between 5+ colored elements | One consolidated warning area, then clean list | **Cognitive** — too many entry points |
| 2. Read compliance warning | Read 2 separate banners | Read 1 consolidated banner | **Temporal** — 2× reading time |
| 3. Find actionable docs | Scroll past banners + prompts to reach cards | Cards visible above the fold | **Motor/Visual** — excessive scrolling |
| 4. Assess stale state | Read identical amber bar on every card | See one banner: "5 docs à régénérer" | **Cognitive** — repetitive parsing |
| 5. Regenerate stale docs | Click "Régénérer" on each card individually | Click "Tout régénérer" once | **Motor/Temporal** — N clicks vs 1 |

**Current**: ~8 visual elements to parse before reaching first actionable doc
**Ideal**: ~3 visual elements (consolidated warning → prompt → doc list)

---

## Findings

### 🔴 Critical: Signal Dilution Through Color Overload

**Location**: Entire Documents tab above the fold
**Persona**: Marie
**Observed**: Red compliance banners (2) + amber generation prompt (1) + amber status badges on cards + amber stale indicator bars under cards = 6+ colored elements visible simultaneously
**Expected**: Clear visual hierarchy where red = "stop and fix this", amber = "consider acting"
**Mechanism**: When everything is highlighted, nothing is highlighted. Hick's Law predicts decision paralysis when options are undifferentiated. The Peak-End Rule means Marie's memory of this tab will be "overwhelming wall of warnings"
**Emotional Impact**: 5/5 — the UI communicates "everything is broken" when in reality only the compliance items are critical
**Recommendation**: Establish strict color tiers. Red reserved exclusively for compliance blockers. Amber used sparingly for a single actionable prompt. Stale indicators downgraded to neutral/muted unless the doc has already been sent (where staleness has consequences)

### 🟠 Major: Per-Card Stale Indicators Create Repetitive Noise

**Location**: `isDocStale()` check renders amber bar inside every card (line 778–806)
**Persona**: Marie
**Observed**: When formation data changes (common!), every generated document shows an identical amber bar: "Les données ont changé depuis la génération → Régénérer"
**Expected**: One clear notification that formation data changed, with a single bulk action
**Mechanism**: Zeigarnik Effect — each stale indicator is an open loop. 7 open loops = cognitive overload. After the 2nd identical bar, the brain disengages (habituation/banner blindness)
**Emotional Impact**: 4/5 — repetitive warnings feel like nagging, contradicting the "encouraging, not nagging" principle (UX Foundation §4.4)
**Recommendation**: When ≥2 docs are stale, show a single banner below the filter bar: "N documents ont des données modifiées depuis la dernière modification de la formation → [Tout régénérer]". Keep per-card indicator only when exactly 1 doc is stale, or when a doc was already sent (staleness matters more)

### 🟠 Major: Phase Badges Are Clutter in Flat View

**Location**: Phase badge inside docCard (line 692–696)
**Persona**: Marie
**Observed**: Every doc card shows a muted "Conception" / "Déploiement" / "Évaluation" badge next to the status badge
**Expected**: In flat (urgency-sorted) view, phase is secondary context that doesn't need constant visibility
**Mechanism**: Cognitive Load Theory — each badge is a chunk to process. Two badges per card × N cards = 2N extra chunks. The decision doc (§4) says "small muted labels" but even muted labels consume visual bandwidth
**Emotional Impact**: 2/5 — not anxiety-inducing but contributes to the "busy" feeling
**Recommendation**: Hide phase badges in flat view entirely. They become column headers in "Grouper par phase" mode, which is their natural home. This removes ~30% of per-card visual noise

### 🟡 Minor: Compliance Warnings Take Disproportionate Space

**Location**: Compliance warnings section (line 605–629)
**Persona**: Marie
**Observed**: Each warning is a full-width banner with background color, icon, and text. Two warnings = ~100px of vertical space before any documents
**Expected**: Compliance warnings important but compact — they shouldn't push the document list below the fold
**Mechanism**: Fitts's Law — the primary action area (document cards) is pushed further from the user's entry point. The warnings are visible but non-actionable from this tab (convention and devis need to be sent/signed)
**Emotional Impact**: 3/5 — seeing two red banners immediately creates stress before Marie even sees her documents
**Recommendation**: Consolidate into a single compact warning with a left border accent (not full background). List issues as bullet points. E.g.: one red-bordered card with "2 problèmes de conformité" and sub-items. Saves ~50% vertical space

### 🟡 Minor: "Tous" Filter Badge Uses Red When Active

**Location**: Filter bar, line 552–558
**Persona**: Marie
**Observed**: The "Tous" badge uses the default variant (solid/dark) when active, creating another strong visual element at the top
**Expected**: Active filter state should be visible but calm — it's a UI control, not a warning
**Mechanism**: Red near the top of the page primes Marie to expect problems (color association bias)
**Emotional Impact**: 1/5 — minor but contributes to overall visual weight
**Recommendation**: Use a neutral active state (e.g. outline with subtle fill) instead of the default solid badge

### 🔵 Polish: "Régénérer" Button Low Contrast on Amber Background

**Location**: Stale indicator bar action button (line 789–803)
**Persona**: Marie
**Observed**: Amber-outlined button on amber background — low contrast makes the CTA less discoverable
**Expected**: Clear action affordance that stands out from the warning background
**Mechanism**: Fitts's Law — low-contrast targets are functionally smaller
**Emotional Impact**: 1/5
**Recommendation**: Use a solid/default button variant inside warning bars for higher contrast

---

## Prioritized Recommendations

1. **Consolidate stale indicators into global banner** — when ≥2 docs are stale, replace per-card bars with one banner + "Tout régénérer". Biggest single improvement: removes N amber bars, adds 1
2. **Hide phase badges in flat view** — show only in "Grouper par phase" mode. Removes 2 visual elements per card
3. **Consolidate compliance warnings** — merge into single compact banner with left-border accent and bullet points
4. **Downgrade stale indicator visual weight** — when only 1 doc is stale, use muted/neutral styling instead of amber (amber reserved for unsent docs where staleness has compliance implications)
5. **Add "Tout régénérer" bulk action** — server action that regenerates all stale, non-signed documents in one click
6. **Soften filter bar active state** — neutral instead of solid/dark for "Tous" badge
7. **Improve CTA contrast in warning bars** — solid button variant inside colored backgrounds
