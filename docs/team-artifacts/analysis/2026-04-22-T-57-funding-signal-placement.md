# T-57 — Funding Signal Cross-Tab Placement Analysis

**Date:** 2026-04-22  
**Author:** product-analyst subagent  
**Ticket:** T-57 — Persistent funding signal across formation sub-routes  
**Audience:** UX Designer (Phase 1B) + orchestrator  
**Supersedes:** chip placement proposed in `2026-04-21-formation-fiche-finances-ux-review.md` §296–309  
**Prior artifacts:**

- `docs/team-artifacts/analysis/2026-04-21-formation-fiche-audit.md` (reused, not redone)
- `docs/team-artifacts/design/2026-04-21-formation-fiche-finances-ux-review.md` (UX review)

---

## 1. The User Need

Goal B from the April-21 UX review (lines 44–49): **"Vérifier le statut de financement avant un appel client."** Today, Marie must navigate to the Fiche, scroll to the bottom financing card, read a binary `montantAccorde` switch, and mentally compare it to the `prixConvenu` (which is not displayed on Fiche). That is 3–4 cognitive steps for a task Marie performs multiple times per day — whenever a client, OPCO contact, or colleague asks "where are we on the financing for that formation?". The question arises during any sub-route session: mid-séance entry, mid-document review, mid-suivi check. Marie cannot afford to lose context by navigating away.

The signal she needs is: **(a) what is the global status** (`statutGlobal`: Entièrement financé / Partiellement financé / En attente / Sans financement) and **(b) how much reste à charge is left**. Source names are secondary — she can click through for detail. The interaction target is `/formations/{id}/finances`.

---

## 2. Validating the Two Stakeholder Concerns

### 2.1 Header Height (Concern 1) — VALIDATED

The SiteHeader is declared at `src/lib/components/site-header.svelte` line 178:

```html
<header class="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center ...">
```

`h-(--header-height)` is a CSS-variable-based fixed height. The layout uses `shrink-0` — it will not compress. Growing the row requires changing the CSS variable itself, which would cascade to every page in the app. That is out of scope for T-57.

**What already lives in the single row (left → right):**


| Element                          | Sizing                                    | Notes                     |
| -------------------------------- | ----------------------------------------- | ------------------------- |
| Sidebar trigger                  | ~36px                                     | Always present            |
| Back button                      | ~70px (icon + label)                      | Shown on formation routes |
| Formation name (editable button) | `max-w-[200px] sm:max-w-[300px] truncate` | Already truncated         |
| FOR-id (mono)                    | `shrink-0 whitespace-nowrap text-sm`      | Immovable anchor          |
| `statut` Badge                   | ~80–120px depending on label              | See §2.2                  |
| `ml-auto` spacer                 | fills remaining                           |                           |
| ProgressRing                     | 28px × 28px                               | Fixed, `shrink-0`         |
| ButtonGroup (3 buttons)          | 3 × 36px + 2 × gap ≈ 116px                | Fixed, `shrink-0`         |


On a 375px (iPhone SE) viewport: sidebar (36) + back (~~70) + name (200 cap) + FOR-id (~~52) + Badge (~90) leaves approximately **−73px** before overflow — the name is already truncating hard. On desktop (1280px) there is ~100–140px of breathing room in the left section, but adding a chip with label ("OPCO Atlas — 600 € reste à charge") easily runs 180–220px, which overflows on all but the widest screens.

**To add the chip without growing the row, the team would have to:**

- Reduce formation name max-width by ~160px (destroying readability on medium screens), OR
- Remove the FOR-id (losing a key reference anchor), OR
- Remove the ProgressRing (removing quest-progress signal), OR
- Remove 1–2 action buttons (History or More-options)

None of these tradeoffs are acceptable. **Concern 1 is fully validated.**

---

### 2.2 Color Collision (Concern 2) — VALIDATED

#### Existing colored regions in the formation chrome today


| Element                                                              | Color(s)                                   | Semantic meaning             |
| -------------------------------------------------------------------- | ------------------------------------------ | ---------------------------- |
| `statut` Badge — "À traiter"                                         | neutral-400 (grey)                         | Formation not yet started    |
| `statut` Badge — "Signature convention"                              | orange-400                                 | Contract pending             |
| `statut` Badge — "Financement"                                       | yellow-400                                 | Funding phase active         |
| `statut` Badge — "Planification"                                     | purple-400                                 | Scheduling phase             |
| `statut` Badge — "En cours"                                          | blue-400                                   | Training in progress         |
| `statut` Badge — "Terminée"                                          | green-400                                  | Formation complete           |
| `statut` Badge — "Archivée"                                          | red-400                                    | Archived                     |
| HudBanner left-border `action_single` / `action_concurrent`          | amber-500                                  | Action required from Marie   |
| HudBanner left-border `waiting`                                      | blue-500                                   | Waiting for external party   |
| HudBanner left-border `phase_complete`                               | green-500                                  | Phase complete / celebration |
| NavTabs active-tab indicator                                         | primary (blue)                             | Current section              |
| NavTab `dot` prop (Suivi, Séances, Formateurs, Apprenants, Finances) | likely red/amber                           | Attention needed on tab      |
| ProgressRing fill                                                    | percentage-keyed (neutral → green at 100%) | Quest completion progress    |


#### Proposed funding chip colors (from April-21 review §304–307)


| `statutGlobal`        | Proposed chip color |
| --------------------- | ------------------- |
| Entièrement financé   | 🟢 Green            |
| Partiellement financé | 🟡 Amber            |
| En attente            | 🟡 Amber            |
| Sans financement      | ⚪ Grey              |


#### Collision table


| Formation state                            | statut Badge | HudBanner                  | Funding chip | Collision                                  |
| ------------------------------------------ | ------------ | -------------------------- | ------------ | ------------------------------------------ |
| Formation terminée + fully funded          | green-400    | green-500 (phase_complete) | 🟢 green     | **THREE green regions stacked** — critical |
| Formation "En cours" + partially funded    | blue-400     | blue-500 (waiting)         | 🟡 amber     | blue × blue × amber — blue overload        |
| Statut "Financement" + En attente          | yellow-400   | amber-500 (action)         | 🟡 amber     | yellow-orange-amber triplet — illegible    |
| Statut "Signature convention" + En attente | orange-400   | amber-500 (action)         | 🟡 amber     | orange-amber-amber triplet — illegible     |
| Statut "En cours" + Entièrement financé    | blue-400     | green-500 (phase_complete) | 🟢 green     | green × green collision                    |


The color collision is not a hypothetical edge case — it is the **most common real-world state**: a formation "En cours" (blue) with a pending OPCO grant (amber chip) appearing next to the HudBanner amber border creates an amber cluster with no semantic differentiation. **Concern 2 is fully validated.**

---

## 3. Qualiopi & Legal Lens

### Is the funding signal compliance-load-bearing?

**Relevant indicators:**

- **Ind. 19** (RNQ v9): The OF must inform the apprenant of the financial conditions. This is satisfied by the **convention document** (which draws from `prixConvenu` at document-generation time). It does NOT require a real-time UI signal on every tab.
- **Ind. 23**: Règlement intérieur — wholly unrelated to funding display.
- **Ind. 1**: Accessibility of formation information. Covered by the Finances tab itself.

**Verdict: the cross-tab funding signal is OPERATIONAL, not compliance-load-bearing.**

A Qualiopi auditor checks that the convention contains the prix convenu and the funding sources referenced — they do not audit whether Marie can read the `statutGlobal` from the Séances tab. The T-52 Finances redesign (already shipped) satisfies the compliance documentary requirement.

**Practical implication:** The signal can legitimately be scoped to **Aperçu + Finances only** without creating any Qualiopi gap. Cross-tab ubiquity is a UX convenience (reducing Marie's navigation cost), not a legal mandate. This materially changes the placement problem: instead of "how do we show this on every tab without breaking the header", the question becomes "how do we surface it on the tabs Marie most uses, without breaking anything".

Marie's morning pattern (per H5 in the UX review): she opens the formation list → clicks a formation → lands on Aperçu. The most impactful placement is therefore one that **shines on Aperçu** and is available on Finances, rather than one that must appear on Séances or Formateurs.

---

## 4. Alternative Placements

The following candidates are **enumerated for the UX designer to evaluate**, not prioritized here.

### A. Chip inline next to `statut` Badge in SiteHeader

- **What:** A colored `<a>` tag rendered as an additional badge action, inserted via `header.actions` after the statut Badge.
- **DOM location:** Left section of SiteHeader, inside `min-w-0 flex items-center gap-2`.
- **Displaces/competes:** Reduces effective formation name max-width; competes with statut Badge visually.
- **First-pass risks:** Header bloat (validated §2.1) ✗ | Color collision (validated §2.2) ✗ | Mobile overflow ✗ | Discoverability ✓

### B. Compound "Statut + Financement" badge replacing the standalone statut Badge

- **What:** A single compound element that shows formation statut AND funding status — e.g. a pill with two colored segments or a badge with a secondary label.
- **DOM location:** Same slot as current statut Badge (line 219–224 in site-header.svelte).
- **Displaces/competes:** Replaces the statut Badge entirely. Net width neutral if designed carefully.
- **First-pass risks:** Cognitive overload (two semantic axes in one pill) | Design complexity | Screen-reader complexity | But solves header bloat and avoids introducing a *new* color — the statut Badge was already there.

### C. A 4th sticky band between NavTabs and HudBanner

- **What:** A new `<div>` inserted between NavTabs and HudBanner inside the `sticky top-0 z-40` container in `+layout.svelte`.
- **DOM location:** `src/routes/(app)/formations/[id]/+layout.svelte` between lines 56–57.
- **Displaces/competes:** Stacks below NavTabs; pushes HudBanner further down; consumes ~36–40px permanently.
- **First-pass risks:** Sticky stack height increases unconditionally (even on Aperçu where HudBanner is absent, this band always shows) | On mobile, three sticky bands above content = Marie sees barely 40% of page content above the fold | HudBanner already fills this role for urgency | Risk: **HIGH**.

### D. Adornment inside the Finances tab pill in NavTabs (color-coded `dot` or `€` indicator)

- **What:** Extend the existing `dot` prop (already used on Suivi, Séances, Formateurs, Apprenants, Finances) to carry a color or symbol signaling funding state. For example: a small `€` icon with green/amber/grey color on the Finances tab label.
- **DOM location:** `tabs` array in `+layout.svelte` line 35 — add `fundingStatut` prop to the Finances tab; NavTabs component renders it.
- **Displaces/competes:** Nothing. The tab strip already has dot adornments. This extends an established pattern.
- **First-pass risks:** Low discoverability (Marie must glance at the tab strip; no text label) | Color dot only = no quantitative signal (no "600 €") | But aligns with existing interaction model | A11y: needs `aria-label` update on tab | Mobile: dots are small (risk on very small screens). Overall risk: **LOW**.

### E. Persistent right-side mini-card / sidebar widget (≥lg only)

- **What:** A compact fixed-position widget on the right edge of the viewport showing funding summary, visible only on ≥lg breakpoints. Collapses to nothing on mobile (zero mobile cost).
- **DOM location:** Would require a new slot in the formation layout or a portal-rendered component outside the main content flow.
- **Displaces/competes:** On ≥lg, may eat ~180–200px of content width or float over it. Requires layout restructuring.
- **First-pass risks:** Mobile: zero risk ✓ | Desktop: content width reduction or overlay | Implementation complexity (requires layout change to formation route shell) | Risk: **MEDIUM**.

### F. Aperçu dominant funding card (not cross-tab — scope reduction)

- **What:** On the Aperçu (`/formations/{id}`) page, promote funding summary to a first-class card — not a chip but a proper card above the fold. Marie lands here first; the card anchors her morning check-in.
- **DOM location:** `src/routes/(app)/formations/[id]/+page.svelte` — top of the Aperçu content area.
- **Displaces/competes:** Nothing in the header chrome. Just adds content to the Aperçu page.
- **First-pass risks:** Not cross-tab (Marie on Séances tab still has to navigate to check funding) | But per §3, this may be acceptable if funding signal is operational-only | Zero header/color risk ✓ | Discoverability: only when on Aperçu | Risk: **LOW** for implementation, **MEDIUM** for the "cross-tab at a glance" acceptance criterion.

### G. Read-only summary at the top of the More-options dropdown

- **What:** Inject a non-interactive `DropdownMenu.Label` or read-only section at the top of the existing "Plus d'options" menu (DotsVertical button, line 296–343 in site-header.svelte) summarizing funding state.
- **DOM location:** `src/lib/components/site-header.svelte` inside the DropdownMenu.Content block.
- **Displaces/competes:** Nothing — no header real-estate. The dropdown is already available.
- **First-pass risks:** Low discoverability (hidden behind "⋮" click) | Not glanceable | But useful as a secondary location if primary is Aperçu | A11y: needs `aria-readonly` / `role="status"` on the read-only item | Risk: **LOW** for implementation, but fails the "at a glance" acceptance criterion unless combined with another option.

### H. HudBanner fallback row (show funding state when no quest is active)

- **What:** When `hudState` is `null` (no active quest, no phase completion) the HudBanner renders nothing, leaving a gap. Fill that gap with a neutral "Financement" row showing `statutGlobal` + `resteACharge`. When a quest IS active, the quest takes priority — funding row disappears.
- **DOM location:** `src/lib/components/formations/hud-banner.svelte` — add a new `{:else}` branch after line 177.
- **Displaces/competes:** Uses the already-reserved HudBanner slot when idle. Does not add a new sticky band.
- **First-pass risks:** Not always visible (disappears when quest shows) | Acceptable for operational-only signal | Color: can use a neutral left-border (e.g. `border-l-slate-300`) that doesn't compete with amber/blue/green quest bands ✓ | Mobile: same height as current HudBanner rows, no overhead ✓ | Risk: **LOW**. Strongest candidate for maintaining existing chrome height.

---

## 5. Edge Cases the Team Must Consider

### 5.1 Mobile

The sidebar trigger alone occupies ~36px on mobile. The name is already capped at `max-w-[200px]`. Any solution that adds to the header left section will cause overflow on 375px viewports at the current truncation limits. Options D (tab dot) and H (HudBanner fallback) survive mobile without changes. Options B and E require explicit mobile handling.

### 5.2 Empty state — zero funding sources

When `getFundingSummary` receives an empty `fundingSources` array, it returns `statutGlobal: 'Sans financement'` and `resteACharge.total: 0`. The chip/widget should show a muted "Sans financement" state — NOT a CTA "+ Ajouter une source" (that is an action, not a signal; the acceptance criterion is read-only + link to Finances). The "add source" CTA belongs on the Finances tab itself.

### 5.3 Multi-source funding display (CPF + employer + OPCO)

`getFundingSummary` already aggregates to a single `statutGlobal` + total `resteACharge`. The cross-tab signal needs only these two values — individual source names are NOT required. A label like "Partiellement financé · 600 € reste à charge" is sufficient and fully derivable from the summary. No chip expansion, rotation, or truncation logic is needed.

### 5.4 Formations where funding is irrelevant

The `getFundingSummary` service handles `prixConvenu = null` by defaulting `totalFormation = 0`, which makes `percentCovered = 0` and `deriveStatutGlobal` returns `'Sans financement'` (no active sources). There is no explicit "free internal training" flag in the schema — the `Sans financement` state covers this. Recommend: if `prixConvenu` is null AND no funding sources exist, the widget shows nothing (null state) rather than "Sans financement" to avoid confusion between "free" and "unfunded".

### 5.5 HudBanner `phase_complete` green + Option H

If Option H (HudBanner fallback) is chosen: the `phase_complete` state already renders a green border row. The fallback funding row must **not** use green — use slate or a neutral. The priority order (quest > phase_complete > funding fallback) must be explicit in the `{#if}` / `{:else if}` chain.

---

## 6. Open Questions for the UX Designer (Phase 1B)

These questions require a decision before the plan can be written. Ordered by decision-blocking impact.

**Q1 — Scope: cross-tab or Aperçu-first?**
Section 3 establishes the signal is operational, not compliance-mandatory. Should the solution guarantee visibility from every tab (acceptance criterion as written), or should the team amend the acceptance criterion to "Aperçu + access via tab adornment on Finances"? This choice gates which candidates remain viable.

**Q2 — What does "at a glance" actually mean for Marie?**
Is it enough for the signal to be visible within 1 scroll on the current page (Aperçu card, Option F), or must it be visible immediately without scrolling from any tab (sticky/persistent)? Sticky means options within the header chrome (A, B, C, D) or a new sticky band (C, H). Aperçu-first means Option F is sufficient.

**Q3 — Acceptable information density on the signal?**
Does the cross-tab signal need to show (a) `statutGlobal` label only, (b) label + reste à charge total, or (c) label + reste à charge + source count? Each step adds ~60–90px to any inline element, directly affecting which placements survive mobile.

**Q4 — Is Option H (HudBanner idle state) a safe pattern to extend?**
The HudBanner currently has a clear semantic contract: it shows urgent quest state. Using it for funding info when idle changes that contract. Is the team comfortable with this dual purpose, or should the HudBanner remain quest-only?

**Q5 — Combined Option D + F: tab dot for signal, Aperçu card for detail?**
A composite approach: add a color-coded indicator to the Finances tab (Option D — already fits the established `dot` pattern) PLUS upgrade the Aperçu page's funding display (Option F). Marie gets glanceability from the tab strip on any route + full readability when she's where she usually starts. Is this combination acceptable as the T-57 deliverable?

---

## Summary


| Concern                                  | Verdict                                                              |
| ---------------------------------------- | -------------------------------------------------------------------- |
| Header height inflation                  | **VALIDATED** — no room in the single fixed row                      |
| Color collision                          | **VALIDATED** — up to 3 concurrent colored regions in adjacent zones |
| Compliance necessity cross-tab           | **NOT compliance-load-bearing** — operational signal only            |
| Recommended candidate range for Phase 1B | D + H, or D + F (designer to decide)                                 |


---

