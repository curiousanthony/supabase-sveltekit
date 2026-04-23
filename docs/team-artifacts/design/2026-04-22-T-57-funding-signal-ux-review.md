# T-57 — Funding Signal Placement (Phase 1B redo)

**Date:** 2026-04-22
**Author:** ux-designer subagent
**Ticket:** T-57 — Persistent funding signal across formation sub-routes
**Supersedes:** §"Cross-tab: read-only financing chip" of `2026-04-21-formation-fiche-finances-ux-review.md`
**Builds on:** `docs/team-artifacts/analysis/2026-04-22-T-57-funding-signal-placement.md` (8 candidates A–H, 5 questions Q1–Q5, both stakeholder concerns validated)

---

## 1. TL;DR

- **Recommended composite:** **D (Finances-tab funding adornment) + F (promoted Aperçu funding card)**. D delivers glanceability from any sub-route via the existing tab strip; F gives Marie full readability on the page she lands on every morning.
- **Rejected primary headline:** the April-21 chip in the SiteHeader. The analyst's evidence (header is `shrink-0` at fixed `--header-height`, statut Badge + HudBanner already saturate the warm-color palette) makes that placement structurally unsafe. We do not need to relitigate it.
- **Rejected secondary:** Option **H (HudBanner idle fallback)** — tempting on real-estate grounds but it dual-purposes a slot whose semantic contract today is "active quest / waiting / celebration". Marie would learn one mental model, then the row would disappear the moment a quest activates → **Banner Blindness + Zeigarnik conflict**. We surface H only as a stakeholder-elective alternative.
- **Acceptance criterion needs an amendment.** The existing wording ("from any formation sub-route") is satisfiable by D alone (color-coded indicator on the always-visible Finances tab). "Full posture (sources, statut, reste à charge) without scrolling on every tab" is **not** achievable without re-introducing a header chip or new sticky band — both rejected. The signal is operational, not Qualiopi-mandatory (analyst §3), so amending is safe.
- **No code changes recommended yet.** Plan creation is gated on user decisions to Q1 (scope), Q2 ("at a glance" definition), and Q5 (D+F composite acceptance). Q3 and Q4 the team can settle internally.
- **Mobile parity is preserved.** D adds a 6 px dot/icon to a tab that already exists; the Aperçu card already stacks on `<sm`. Zero header overflow risk on iPhone SE.
- **Implementation surface is small** (≤ 1 day): extend `nav-tabs.svelte`'s `dot` prop to accept a `funding` variant, thread `fundingSummary` through the formation `+layout.server.ts`, and replace the Aperçu "Résumé financier" card body with the funding-summary tiles already designed for T-FN-4.

---

## 2. Marie persona micro-recap

Marie manages 10–20 formations in parallel and gets interrupted by the phone every ~7 minutes. She lives with latent Qualiopi audit anxiety. When a client asks "où en est-on sur le financement de la formation Atlas ?", she needs an answer in **one glance, ≤ 3 seconds**, regardless of which sub-route she happens to be on. She does **not** need a price-table on every tab — she needs a confidence signal that tells her whether to trust her memory or click through. Anything that adds noise to her chrome (more colored pills, more sticky bands) increases cognitive load without raising her confidence.

---

## 3. Evaluation of the 8 candidates

> Verdicts: ✓ Adopt · ~ Conditional · ✗ Reject. Reasoning leans on the analyst's collision/header analysis (cited inline) — not restated.

### A. Chip inline next to `statut` Badge in SiteHeader — **✗ Reject**
The placement the stakeholder originally rejected. Analyst §2.1 quantifies the negative space on a 375 px viewport (-73 px before overflow, name already truncating); §2.2 enumerates 5 real-world states where the chip stacks against the statut Badge **and** the HudBanner border in the same color family. Hick's-Law cost (one more decision in the densest scan zone of the screen) is real. No mitigation makes this safe without giving up the FOR-id, ProgressRing, or one of the action buttons — all higher-utility elements per Marie's daily workflow.

### B. Compound "Statut + Financement" badge — **✗ Reject**
Tempting on width grounds (replaces the existing Badge) but creates a **two-axis pill** that violates one-signal-per-element. Marie would have to learn that the *left half* of the pill is workflow phase and the *right half* is funding — a recognition-vs-recall regression precisely in the area she scans most. Screen-reader announcement becomes a comma-separated string ("En cours, partiellement financé") that fuses two unrelated decisions. Reject on cognitive load, even though the geometry technically works.

### C. New 4th sticky band between NavTabs and HudBanner — **✗ Reject**
On Aperçu (where HudBanner is often the `phase_complete` celebration or null) this would push Marie's actual content below the fold on mobile (analyst notes 3 sticky bands on mobile = ~40 % of viewport eaten before content). Also ships unconditionally even when zero funding sources exist → **wasted real-estate at peak stress**. This is the worst trade in the candidate set.

### D. Adornment inside the Finances tab pill in NavTabs — **✓ Adopt (primary glanceability)**
The tab strip is the only chrome surface that is **already sticky on every sub-route** AND already conveys per-tab status via the `dot` prop (5 of 9 tabs use it today: Suivi, Séances, Formateurs, Apprenants, Finances). Extending it for funding state is a **0-cost pattern reuse** for the user. We propose a colored 6 px dot — the existing primitive — repurposed semantically, plus an `aria-label` augmentation on the tab anchor. It does not collide with the HudBanner border (different DOM region) nor with the statut Badge (different chrome). Mobile-safe (the tab is already in a horizontal-scroll container). Limit: no quantitative "600 €" — solved by composing with F.

### E. Persistent right-side mini-card / sidebar widget (≥ lg) — **~ Conditional**
Useful as a power-user enhancement on `≥ xl` once T-FN-4 ships, because the funding cockpit is content-rich. But it requires a layout-shell change for one signal, and on `lg` (≈1024–1280 px) it eats main-content width that the dense Aperçu and Finances pages cannot spare. Defer to a follow-up ticket; not part of T-57.

### F. Promoted Aperçu funding card — **✓ Adopt (secondary, full readability)**
Aperçu is Marie's morning landing per H5 of the April-21 review. Today, the "Résumé financier" card on Aperçu reads `montantAccorde` (single scalar, doomed by T-FN-1 schema migration). Replacing it with the canonical funding-summary tiles (Total formation · Financé · Reste à charge · Statut global, deep-link to Finances) gives Marie complete posture without leaving her landing page. **Zero header risk, zero color-collision risk, zero mobile overflow.** Combined with D, it satisfies "at a glance" interpreted as "≤ 1 navigation hop from any tab".

### G. Read-only summary in More-options dropdown — **✗ Reject**
Hidden behind a 3-dots icon that Marie associates with destructive or rare actions ("Archiver", "Supprimer", "Copier les informations"). She has zero motivation to open it for a status check — this is a discoverability black hole. Useful as a **tertiary fallback** if we ever wanted the data accessible via keyboard menu, but does not earn a slot in T-57.

### H. HudBanner idle-state funding fallback — **✗ Reject (with caveat)**
Geometrically the cheapest solution: re-use a slot that's already there when nothing else is showing. But:
1. **Semantic-contract erosion.** The HudBanner today means "your attention is needed here, now". Repurposing the slot for a passive status row teaches Marie that the banner is *sometimes* informational and *sometimes* directive → her reflex to scan it for urgency degrades. Banner Blindness sets in.
2. **Disappearance volatility.** The funding signal would vanish the moment any quest activates — exactly when Marie is most stressed and most needs stable signals. **Zeigarnik effect**: she'd remember the funding info she briefly saw and feel a nagging sense of unfinished business when it disappears.
3. **Color carve-out is fragile.** Even with a neutral slate left-border, on the Aperçu page Marie's eye would still bind the row to "HudBanner" → category confusion.

If the user explicitly asks for chrome-level visibility on every tab (i.e. answers Q2 with "must be visible without scrolling on Séances/Documents/etc."), H is the least bad of the chrome options — but we should warn about the semantic cost.

---

## 4. Recommended composite

**Primary: D (Finances-tab funding adornment)**
**Secondary: F (Aperçu funding card upgraded to canonical summary)**

Why this beats the analyst's pre-tagged D+H pair:

| Criterion | D + F (recommended) | D + H (analyst's safe pair) |
|---|---|---|
| Header height | unchanged | unchanged |
| Color collision with statut Badge / HudBanner | none | low (slate border carve-out) |
| Mobile (375 px) | unchanged | adds a row when idle |
| HudBanner semantic integrity | preserved | **eroded** (dual-purpose slot) |
| "At a glance" from Séances tab | dot color only (color = statut) | dot + idle row (when no quest) |
| Quantitative "reste à charge" visible from any tab | requires hover / tap | partial (only when banner idle) |
| Discoverability | medium (relies on dot) | medium (banner row is unfamiliar role) |
| Implementation cost | small | small + HudBanner refactor |

The deciding lens is **Marie's mental model**: she already trusts the tab strip as "where notifications live" (5 dots today). Pushing one more semantic onto that surface is a far cleaner extension than mutating the HudBanner contract. F simultaneously upgrades a card that needed replacement anyway (T-FN-1 makes `montantAccorde` obsolete), so the F work is partially backfill, not net-new chrome.

**Recommended hover/focus enhancement on D (small, in-scope):** when Marie focuses or hovers the Finances tab, surface a 1-line tooltip (`Tooltip` shadcn primitive) reading e.g. *"Partiellement financé · 600 € reste à charge"*. This converts the dot-only signal into a 2-tier disclosure (color → text) without occupying chrome real-estate or making the indicator itself heavier. This is the only piece beyond pure dot styling.

---

## 5. ASCII mockups (recommended composite)

### 5.1 NavTabs — Finances tab today vs. with funding adornment

**Today** (Finances tab, `dot: overdueInvoices`):
```
… │ 📁 Documents │ 💼 Finances•│
                            ^red dot when overdueInvoices === true
```

**After D** (Finances tab, `dot` extended with a `funding` variant):
```
Statut: Partiellement financé (amber)
… │ 📁 Documents │ 💼 Finances🟡│         ← amber dot, derived from fundingSummary.statutGlobal
                          ↑ (focus / hover) ↓ Tooltip
                       ┌────────────────────────────────────┐
                       │ Partiellement financé              │
                       │ 600 € reste à charge               │
                       └────────────────────────────────────┘

Statut: Entièrement financé (green)
… │ 📁 Documents │ 💼 Finances🟢│         ← green dot, no tooltip body line beyond statut

Statut: En attente (amber)            ← same amber dot family as Partiel; differentiation via tooltip text
… │ 📁 Documents │ 💼 Finances🟡│
                       ┌────────────────────────────────────┐
                       │ En attente d'accord                │
                       │ 1 200 € en cours d'instruction     │
                       └────────────────────────────────────┘

Statut: Sans financement (zero sources)
… │ 📁 Documents │ 💼 Finances  │         ← no dot at all (clean), tab still navigable

Statut: prixConvenu null AND no sources
… │ 📁 Documents │ 💼 Finances  │         ← no dot (per analyst §5.4 — avoid "free" vs "unfunded" confusion)
```

**Color rules (extends `nav-tabs.svelte` `dotClass`):**
| `statutGlobal` | dot color | Tailwind |
|---|---|---|
| Entièrement financé | green | `bg-emerald-500` |
| Partiellement financé | amber | `bg-amber-500` |
| En attente | amber | `bg-amber-500` (same family — differentiated in tooltip) |
| Sans financement | none | dot suppressed |

The amber here is the same amber used for `dot === 'warning'` and the HudBanner `action_*` border, but **on a different DOM surface** (tab pill, not banner left-border) → no adjacency = no collision. The existing `overdueInvoices` red dot takes priority when both are true (red > amber > green); rationale: an overdue invoice is action-required, funding status is informational.

**Mobile (`<sm`)**: identical. The dot is already 6 px (`size-1.5`); the tooltip degrades to a long-press popover via the existing tooltip primitive's mobile behavior. No layout change.

---

### 5.2 Aperçu page — "Résumé financier" card today vs. promoted funding card

**Today** (`+page.svelte` lines 323–375, single column on mobile, half-width on `md`):
```
┌─ 💼 Résumé financier              [Voir les finances] ┐
│                                                       │
│  Montant accordé                                      │
│  18 000 €  [Accordé]                                  │
│                                                       │
│  Coûts formateurs                                     │
│  6 400 €                                              │
│                                                       │
│  Marge                                                │
│  11 600 €  (montant − coûts formateurs)               │
└───────────────────────────────────────────────────────┘
```

**After F** (still half-width on `md`, full-width on `<sm`; uses canonical `getFundingSummary`):
```
┌─ 💼 Financement                  [Voir les finances →]┐
│                                                       │
│  ┌──────────────┬──────────────┬──────────────────┐   │
│  │ Total        │ Financé      │ Reste à charge   │   │
│  │ 18 000 €     │ 12 000 €     │ 6 000 €          │   │
│  │              │ 67 %         │ Apprenant 6 000 €│   │
│  └──────────────┴──────────────┴──────────────────┘   │
│                                                       │
│  🟡 Partiellement financé                             │
│     · OPCO Atlas — Accordé partiel                    │
│     · CPF — En attente                                │
│                                                       │
│  Marge prévisionnelle (revenus − coûts) : 5 600 €     │
└───────────────────────────────────────────────────────┘
```

**Mobile (`<sm`)**: tiles stack 2×1 on the first row, "Reste à charge" on its own row beneath (per April-21 review §"Mobile"). Status pill goes full-width. List of sources is truncated to first 2 + "… +N autres" link.

**Empty state — zero sources, prixConvenu set**:
```
┌─ 💼 Financement                  [Voir les finances →]┐
│  ⚪ Sans financement                                   │
│                                                       │
│  Prix convenu : 18 000 € — aucun financeur saisi.     │
│  [+ Ajouter une source de financement]   ←— deep-link │
└───────────────────────────────────────────────────────┘
```

**Empty state — zero sources AND prixConvenu null** (per analyst §5.4):
```
┌─ 💼 Financement                  [Voir les finances →]┐
│  Aucune information de tarification renseignée.       │
│  Rendez-vous sur la Fiche pour saisir le prix convenu │
│  ou sur Finances pour ajouter un financeur.           │
└───────────────────────────────────────────────────────┘
```
(No status pill, no color — avoids implying "unfunded" when the formation may simply be internal/free.)

---

### 5.3 NavTabs in context (combined view, full sticky stack on Suivi tab)

```
┌ SiteHeader [Sidebar][← Retour][Atlas DevOps Q3]  FOR-1234  [En cours] ⌾ ProgressRing [⎘][⏱][⋮]
├─ NavTabs (sticky)
│  Aperçu  Fiche  Suivi• Programme  Séances•  Formateurs  Apprenants  Documents  Finances🟡
├─ HudBanner (sticky, conditional)
│  ▌ Action requise : Téléverser CV de Mme Durand (Conception)        [Formateurs]
└─ <main content>
```

Marie on Suivi sees the amber 🟡 on Finances → mental model: "financement pas encore complet, mais pas urgent". She doesn't have to navigate. If she needs the number, she focuses or hovers the tab → tooltip. If she needs full breakdown, one click to Finances. **0–1–2 click ladder, smallest at the most frequent need.**

---

## 6. Behavioral psychology rationale

- **Hick's Law.** Adding zero new chrome elements; we extend an existing affordance (the tab dot). Marie's decision count when scanning chrome is unchanged.
- **Fitts's Law.** The Finances tab is already in the primary navigation; the dot enlarges the *perceptual* target without changing the click target. On hover, the tooltip is a no-cost disclosure.
- **Cognitive Load Theory.** We avoid asking Marie to hold two semantic axes in one element (rejecting Option B). The tab dot is a single binary fact: "is there something noteworthy on Finances?". The funding question and the overdue-invoice question both fold into "is the tab dotted?", with detail on focus.
- **Zeigarnik effect.** Option H would create a vanishing fact (visible only when no quest); the user's mind would keep an open loop. D + F never disappears, so no loop.
- **Peak-End rule.** Marie's worst micro-moment in the funding-check journey today is "I'm on Séances and I need to check funding" → 4 clicks + scroll. Under D+F, that becomes "glance at the tab" (positive, instant). The morning landing on Aperçu now ends with the funding card delivering full reassurance — a positive end frame.
- **Goal Gradient.** The progress percent on the Aperçu card (e.g. "67 %") gives Marie a tangible sense of forward motion as financement closes in on `prixConvenu`. The dot color shift from amber → green is the goal-completion reward.
- **Loss Aversion.** Reste à charge is framed as an unsettled balance, never as "loss" or "manque" — keeps Marie's emotional valence neutral. Dot uses amber (neutral attention) not red (alarm) until something is genuinely overdue (the existing red `overdueInvoices` dot semantics).
- **Banner Blindness.** Resisted by *not* placing funding in the HudBanner — Marie's banner-scan reflex stays calibrated to "urgent action".

---

## 7. A11y, mobile, edge cases

### Screen-reader announcements

**Finances tab (D), full pattern in `nav-tabs.svelte`:**
- `Sans financement` (no dot): `aria-label="Finances"` (default)
- `Entièrement financé`: `aria-label="Finances. Financement entièrement couvert."`
- `Partiellement financé`: `aria-label="Finances. Partiellement financé, 600 euros restent à charge."`
- `En attente`: `aria-label="Finances. En attente d'accord, 1 200 euros en cours d'instruction."`
- When `overdueInvoices === true` (red dot wins): `aria-label="Finances. Facture en retard."` (funding status moves to the tooltip body only).

The aria-label is built server-side in `+layout.server.ts` so screen-reader users get the same fact at the same moment as sighted users (no hydration flash, no "loading…" intermediate read).

**Aperçu funding card (F):** standard `Card` semantics. The status pill is a `role="status"` with text `"Statut : Partiellement financé"`. The tile labels and currency values are read in DOM order. The "Voir les finances →" anchor is a normal link.

### Keyboard activation

- Finances tab: Enter / Space already navigate (existing `<a>` element). Tooltip opens on focus (shadcn `Tooltip` default behavior). No new bindings.
- Aperçu card "Voir les finances →" link: Enter navigates. The "+ Ajouter une source de financement" CTA in the empty state is a standard button → Enter / Space submits.

### Mobile (375 px)

- Tab dot: 6 px, unchanged. Touch target = full tab pill (≥ 44 px tall via `py-2` + icon row). Tooltip degrades to long-press popover.
- Aperçu card: tiles stack 2×1, then full-width "Reste à charge" tile, status pill full-width, sources list truncates to 2.
- No header changes → zero risk of overflow on iPhone SE (analyst §2.1 confirmed).

### Empty state — zero funding sources

- D: dot **suppressed** (no color). Rationale: a grey dot would just be noise; the absence of color *is* the signal "rien à signaler", which is operationally accurate.
- F: explicit empty card with copy *"Sans financement"* + CTA *"+ Ajouter une source de financement"* (deep-links to `/finances#sources` — focuses the new-source dialog if T-FN-4 supports a `?new=true` query param).
- Tooltip on D in this state: no tooltip (nothing to disclose).

### Empty state — `prixConvenu` null AND no sources

Per analyst §5.4: D shows no dot, F shows the muted "tarification non renseignée" copy without status colors. Avoids the "free internal training vs unfunded" ambiguity.

### Interaction with HudBanner `phase_complete`

D is on the tab strip; HudBanner green border lives below NavTabs. Different DOM zones, different surfaces. **No adjacency collision.** A formation that is `Terminée` (green statut Badge) + `phase_complete` (green HudBanner border) + `Entièrement financé` (green dot on Finances tab) shows three separate green tokens — but they are **spatially distributed across three chrome layers, not stacked in one row**. The eye reads them as "everything is settled", which is accurate.

### Loading / SSR

- `getFundingSummary` is a pure function (no DB call inside). The formation `+layout.server.ts` already loads enough to compute it; we add `fundingSources` to the layout query and pass `fundingSummary` to NavTabs and Aperçu. The dot color and aria-label are baked in at SSR — **no hydration flash, no shimmer, no "loading…"**.
- Aperçu card: also SSR. If the tile values change after a Finances mutation, SvelteKit's `invalidate` already covers it (the existing `Voir les finances` link uses goto + return-here pattern in T-52).

---

## 8. Answers to Q1–Q5

**Q1 — Scope: cross-tab or Aperçu-first?**
**Proposed answer:** *Cross-tab via tab adornment (D), full detail on Aperçu (F).* This is a hybrid: the cross-tab signal exists on every sub-route (the Finances tab is always in the strip), but the rich representation is reserved for Aperçu. Acceptance criterion should be amended from "from any sub-route" → **"glanceable from any sub-route via the tab adornment; full posture on Aperçu and Finances"**.
🟢 **Stakeholder call.** Send to user via AskQuestion.

**Q2 — What does "at a glance" mean?**
**Proposed answer:** *Color-coded indicator visible without scrolling on every sub-route is sufficient; quantitative breakdown can require one focus / hover or one navigation.* This matches analyst §3 (operational, not Qualiopi-mandatory) and respects mobile constraints. If the user defines "at a glance" as "the literal euro amount must be visible on Séances, Documents, etc.", the chrome cost rises sharply — only Option H survives, with the semantic cost noted in §3.
🟢 **Stakeholder call.** Send to user.

**Q3 — Information density on the signal?**
**Proposed answer:** *(a) on D: statut color only (no inline text); on the tooltip / aria-label: statut label + reste à charge total. On F: full canonical summary including per-payer split.* Source count is omitted from D (no width budget); it's available on F in the sources list.
⚪ **Team-internal.** Bake into the plan; flag in synthesis but no blocker if user agrees direction.

**Q4 — Is HudBanner idle-state safe to extend?**
**Proposed answer:** **No.** HudBanner's contract is "your attention is needed". Extending it for passive status erodes that reflex (see §3, Option H). Recommend leaving HudBanner quest-only.
⚪ **Team-internal.** State the recommendation; only escalate if the user proposes Option H.

**Q5 — D + F as the deliverable?**
**Proposed answer:** **Yes** — explicitly with the recommended D + F composite. Optional small enhancement: tooltip on focus / hover of the Finances tab to surface reste à charge text.
🟢 **Stakeholder call.** This is the headline question to confirm.

---

## 9. Plan scaffold (DRAFT — pending Q1, Q2, Q5)

> Do **not** finalize until the user confirms the composite. Implementer should not pick this up.

```yaml
---
title: "T-57 — Funding signal via Finances-tab adornment + Aperçu card"
date: 2026-04-22
ticket: T-57
ref: docs/team-artifacts/design/2026-04-22-T-57-funding-signal-ux-review.md
status: DRAFT — pending user decisions on Q1, Q2, Q5
target:
  - src/lib/components/nav-tabs.svelte
  - src/routes/(app)/formations/[id]/+layout.server.ts
  - src/routes/(app)/formations/[id]/+layout.svelte
  - src/routes/(app)/formations/[id]/+page.svelte (Aperçu card)
tasks:
  - id: layout-server-load-funding-summary
    title: "Layout loader: include fundingSources + computed fundingSummary"
    status: pending
  - id: nav-tabs-funding-dot-variant
    title: "NavTabs: extend dot prop with 'funding' variant + color rules"
    status: pending
  - id: nav-tabs-funding-tooltip
    title: "NavTabs: optional tooltip on focus/hover (statut + reste à charge text)"
    status: pending
  - id: nav-tabs-funding-aria-label
    title: "NavTabs: SSR aria-label augmentation for screen readers"
    status: pending
  - id: nav-tabs-priority-rule
    title: "NavTabs: priority logic when both overdue (red) and funding (amber) apply"
    status: pending
  - id: apercu-funding-card-promotion
    title: "Aperçu: replace 'Résumé financier' body with canonical funding-summary tiles"
    status: pending
  - id: apercu-funding-empty-states
    title: "Aperçu: implement Sans-financement and prixConvenu-null empty states"
    status: pending
  - id: ticket-acceptance-amendment
    title: "T-57: amend acceptance criterion to match composite scope (Q1)"
    status: pending
  - id: qa-mobile-and-a11y
    title: "QA: mobile (375 px) + screen-reader announcement parity"
    status: pending
```

(Per-task implementation steps, code snippets, and testing checklist will be authored once the user confirms.)

---

## 10. Out-of-scope / future

- **T-58 follow-up — `≥ xl` persistent funding sidebar (Option E).** Once T-FN-4 ships and Marie has multi-source funding lines, a right-rail recap on wide screens could fold per-source dossier-ref shortcuts into the chrome. Defer — single-display feedback first.
- **T-59 follow-up — funding tab adornment for Documents.** When a `convention` document is blocked by missing `prixConvenu` (T-FN-10 preflight), a contextual dot on the Documents tab is logically equivalent to the funding dot on Finances. Pattern is the same; defer until preflight ships.
- **T-60 follow-up — funding-source-aware quest in HudBanner.** If a CPF dossier hits a 30-day pending threshold, this is a *real* quest (action required) and belongs in the HudBanner — but as an `action_*` quest with the existing semantic, not as a passive funding row. Belongs in the funding-source state-machine ticket, not T-57.
- **Workspace-wide funding analytics.** "Show me all formations 'Sans financement' across the org" is a list-page filter, not a per-formation chrome signal. Out of T-57; should land alongside the formations list refresh.

---

## Appendix — concrete acceptance criterion rewording proposal

Current (T-57.md, lines 23–28):

> Marie can read funding posture (source(s), reste à charge, statut global) **at a glance from any formation sub-route**

Proposed amendment (pending Q1):

> Marie can identify funding posture **at a glance from any formation sub-route** via the Finances tab adornment (color = `statutGlobal`); full posture (sources, reste à charge breakdown, status) is visible without scrolling on the Aperçu page and on the Finances page.
