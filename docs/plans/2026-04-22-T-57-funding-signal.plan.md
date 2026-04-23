---
title: "T-57 — Funding signal via Finances-tab adornment + Aperçu card"
date: 2026-04-22
ticket: T-57
ref: docs/team-artifacts/design/2026-04-22-T-57-funding-signal-ux-review.md
analysis_ref: docs/team-artifacts/analysis/2026-04-22-T-57-funding-signal-placement.md
target:
  - src/lib/components/nav-tabs.svelte
  - src/routes/(app)/formations/[id]/+layout.server.ts
  - src/routes/(app)/formations/[id]/+layout.svelte
  - src/routes/(app)/formations/[id]/+page.svelte
tasks:
  - id: layout-server-load-funding-summary
    title: "Layout loader: include fundingSources + computed fundingSummary"
    status: pending
  - id: nav-tabs-funding-dot-variant
    title: "NavTabs: extend dot prop with funding variants + color rules + priority"
    status: pending
  - id: nav-tabs-funding-tooltip
    title: "NavTabs: tooltip on focus/hover (statut + reste à charge)"
    status: pending
  - id: nav-tabs-funding-aria-label
    title: "NavTabs: SSR aria-label augmentation for screen readers"
    status: pending
  - id: apercu-funding-card-promotion
    title: "Aperçu: replace Résumé financier card body with canonical funding-summary tiles"
    status: pending
  - id: apercu-funding-empty-states
    title: "Aperçu: implement Sans-financement and prixConvenu-null empty states"
    status: pending
  - id: qa-mobile-and-a11y
    title: "QA: mobile (375 px) + screen-reader announcement parity"
    status: pending
---

# T-57 — Funding signal via Finances-tab adornment + Aperçu card

Implements the **D + F composite** chosen by the user on 2026-04-22. The April-21 SiteHeader chip is rejected (header bloat + color collision); see `docs/team-artifacts/analysis/2026-04-22-T-57-funding-signal-placement.md` §2 for the full rationale and `docs/team-artifacts/design/2026-04-22-T-57-funding-signal-ux-review.md` §5 for the visual mockups.

User decisions (recorded in ticket log):
- **Q1 (scope)**: amend acceptance criterion to "glanceable from any sub-route via the Finances-tab adornment; full posture on Aperçu and Finances".
- **Q2 (density)**: color-only on cross-tab + tooltip on focus/hover for the euro amount.
- **Q5 (composite)**: D + F.

The signal is operational only — not Qualiopi-load-bearing (analyst §3). All schema work is shipped (T-52 — `getFundingSummary` is pure and reusable).

---

## Task 1: Layout loader — include `fundingSources` + computed `fundingSummary` `[layout-server-load-funding-summary]`

**Problem**: The formation layout loader doesn't currently fetch funding sources or compute the summary needed by the Finances-tab dot, the tab tooltip, the SSR aria-label, and the Aperçu card. Loading once at the layout level avoids 4 separate per-consumer fetches and ensures all surfaces stay in sync.

**Implementation**:

1. **Edit** `src/routes/(app)/formations/[id]/+layout.server.ts`. Add `fundingSources: true` to the existing `with` block of `db.query.formations.findFirst` (around line 218, between `dealsFromFormation` and `auditLog`):

   ```ts
   fundingSources: {
     columns: {
       id: true,
       sourceType: true,
       payerType: true,
       status: true,
       requestedAmount: true,
       grantedAmount: true
     }
   },
   ```

   The `formations.fundingSources` relation already exists in `src/lib/db/relations.ts` line 227 (`fundingSources: many(formationFundingSources)`).

2. **Import** the summary helper at the top of the file (next to the other `$lib/services/*` imports):

   ```ts
   import { getFundingSummary, type FundingSummary } from '$lib/services/funding-summary';
   ```

3. **Compute** the summary after the existing `formationData` block (around line 248):

   ```ts
   const fundingSummary: FundingSummary = getFundingSummary(
     formation.fundingSources ?? [],
     formation.prixConvenu
   );
   const hasPrixConvenu = formation.prixConvenu != null && Number(formation.prixConvenu) > 0;
   const hasFundingSources = (formation.fundingSources?.length ?? 0) > 0;
   ```

4. **Return** `fundingSummary`, `hasPrixConvenu`, `hasFundingSources` from the existing `return { ... }` (around line 338). Order them next to `overdueInvoices` so the contract is co-located with the other tab-signal flags:

   ```ts
   return {
     formation,
     pageName: formation.name ?? 'Formation',
     header,
     overdueQuests,
     missingSignatures,
     missingFormateurDocs,
     unsignedEmargements,
     overdueInvoices,
     fundingSummary,
     hasPrixConvenu,
     hasFundingSources,
     questProgress: questProgressData,
     programmeSourceUpdatedSinceLink,
     complianceWarnings
   };
   ```

**Key constraints**:
- Use the existing relation; do **not** add a new `db.query.formationFundingSources.findMany(...)` — it would be a redundant round-trip.
- Do **not** mutate `formation.fundingSources` after the relation load — `getFundingSummary` is pure, treat its output as the canonical surface.
- `prixConvenu` is `numeric` in Postgres → arrives as a string. `getFundingSummary` already normalises via `toNumber()`. Don't pre-cast.
- Keep `STATUT_COLORS` and the `header` block untouched — funding has nothing to do with `formation.statut`; keep semantics separate.

**Testing checklist**:
- [ ] `bun run check` (or `bunx svelte-kit sync && bunx svelte-check`) passes — return-shape change has no downstream type breakage.
- [ ] Open a formation with zero funding sources: `fundingSummary.statutGlobal === 'Sans financement'`, no extra DB rows in dev console.
- [ ] Open a formation with multiple sources mixing `Pressenti`, `Accordé`, `Versé`: percentCovered + statutGlobal match the Finances tab values exactly (parity with T-52 loader).
- [ ] Network tab shows a single formation query (no extra round-trip).

---

## Task 2: NavTabs — extend `dot` prop with funding variants + priority resolver `[nav-tabs-funding-dot-variant]`

**Problem**: The `dot` prop on `nav-tabs.svelte` currently accepts `boolean | 'warning' | 'info'` and renders red / amber / blue. Funding state needs two new colors (green for `Entièrement financé`, amber for `Partiellement financé` + `En attente`) and we need an explicit priority rule so an overdue invoice (red) wins over a funding signal on the same tab.

**Implementation**:

1. **Edit** `src/lib/components/nav-tabs.svelte`. Extend the `TabItem.dot` type (line 12):

   ```ts
   type DotVariant = 'warning' | 'info' | 'danger' | 'funding-amber' | 'funding-green';

   type TabItem = {
     label: string;
     icon?: Component;
     href?: string;
     value?: string;
     dot?: boolean | DotVariant;
     /** Optional override for the per-tab `aria-label` (e.g. "Finances. Partiellement financé, 600 euros restent à charge."). Falls back to `label` + ", notification." when undefined. */
     ariaLabel?: string;
   };
   ```

2. **Update** `dotClass` (line 79) to map every variant explicitly:

   ```ts
   function dotClass(dot: TabItem['dot']): string {
     if (dot === 'warning') return 'bg-amber-500';
     if (dot === 'info') return 'bg-blue-500';
     if (dot === 'danger') return 'bg-destructive';
     if (dot === 'funding-amber') return 'bg-amber-500';
     if (dot === 'funding-green') return 'bg-emerald-500';
     return 'bg-destructive';
   }
   ```

   `funding-amber` and `warning` deliberately share the same colour: differentiation lives in the tooltip and the aria-label, never in the dot pixel.

3. **Update** the `<span class="sr-only">Notification</span>` line (lines 119 and 141): when an `ariaLabel` is provided on the tab, the parent `<a>`/`<button>` already has `aria-label` (see Task 4) and the dot's `<span class="sr-only">` becomes redundant. Suppress it when `tab.ariaLabel` is set:

   ```svelte
   {#if tab.dot}
     <span
       class={cn(
         'absolute right-1 top-1.5 size-1.5 shrink-0 rounded-full',
         dotClass(tab.dot)
       )}
       aria-hidden="true"
     ></span>
     {#if !tab.ariaLabel}
       <span class="sr-only">Notification</span>
     {/if}
   {/if}
   ```

4. **Create** the priority resolver next to where `tabs` is built. Add it inside the `+layout.svelte` `<script>` block (Task 4) — keep `nav-tabs.svelte` itself ignorant of business semantics. Helper signature:

   ```ts
   import type { StatutGlobal } from '$lib/services/funding-summary';

   type FinancesDot = 'danger' | 'funding-amber' | 'funding-green' | undefined;

   function resolveFinancesDot(
     overdueInvoices: boolean,
     statutGlobal: StatutGlobal,
     hasContext: boolean
   ): FinancesDot {
     if (overdueInvoices) return 'danger';
     if (!hasContext) return undefined;
     switch (statutGlobal) {
       case 'Entièrement financé': return 'funding-green';
       case 'Partiellement financé':
       case 'En attente': return 'funding-amber';
       case 'Sans financement': return undefined;
     }
   }
   ```

   `hasContext = hasPrixConvenu || hasFundingSources` — when both are absent we suppress the dot entirely (analyst §5.4: "free internal training vs unfunded" disambiguation).

**Key constraints**:
- Do **not** introduce a new sticky band, a new component, or a new color token. Reuse `bg-amber-500` and `bg-emerald-500` (already in the design system).
- Priority order is **fixed**: `overdueInvoices` (red) > funding amber > funding green > none. Never green over red.
- The `dot` prop must remain backward-compatible: existing `dot: true` and `dot: 'warning' | 'info'` consumers stay valid.
- The `Notification` SR string is a fallback only — never let both it and a custom `aria-label` announce on the same control (double-read).

**Testing checklist**:
- [ ] All existing dot usages still render (Suivi `overdueQuests`, Séances `missingSignatures`, Formateurs `missingFormateurDocs`, Apprenants `unsignedEmargements`, Finances `overdueInvoices`).
- [ ] `funding-green` produces an emerald 6 px dot; `funding-amber` produces an amber 6 px dot.
- [ ] `resolveFinancesDot(true, 'Entièrement financé', true) === 'danger'` (overdue wins).
- [ ] `resolveFinancesDot(false, 'Sans financement', false) === undefined` (no dot when no pricing context).
- [ ] `resolveFinancesDot(false, 'Sans financement', true) === undefined` (no dot when only price set, no sources — analyst §5.2 says the empty-state CTA lives on the Aperçu card, not on the tab).

---

## Task 3: NavTabs — tooltip on focus/hover for the Finances tab `[nav-tabs-funding-tooltip]`

**Problem**: The dot conveys color only. Marie needs the euro amount on demand without leaving the current sub-route. Per Q2 decision, that disclosure is gated on focus/hover via shadcn `Tooltip`.

**Implementation**:

1. **Verify** `src/lib/components/ui/tooltip/index.ts` exists (it does — `tooltip-content.svelte`, `tooltip-trigger.svelte` are present). No `bunx shadcn-svelte add tooltip` step needed.

2. **Decide where the wrapper lives.** Two viable options; pick (b) for minimal blast radius:

   - (a) Wrap inside `nav-tabs.svelte` per-tab when `tab.tooltip` is provided → adds a generic `tooltip` prop to every consumer of NavTabs.
   - (b) **Wrap only the Finances tab in `+layout.svelte`** by composing NavTabs with the Tooltip primitives at the layout level. The cleanest path is to pass a Svelte snippet for the Finances tab content. **However**, NavTabs as written doesn't accept per-tab snippets. Pragmatic compromise: add a thin `tooltip?: { title: string; subtitle?: string }` field to `TabItem` and wrap the rendered `<a>`/`<button>` in `<Tooltip.Root><Tooltip.Trigger asChild>...</Tooltip.Trigger><Tooltip.Content>...</Tooltip.Content></Tooltip.Root>` only when `tab.tooltip` is present.

   Implementing (b)-pragmatic in `nav-tabs.svelte`:

   ```ts
   // Add to TabItem:
   tooltip?: { title: string; subtitle?: string };
   ```

   ```svelte
   <!-- Wrap the <a>/<button> when tab.tooltip exists -->
   {#if tab.tooltip}
     <Tooltip.Root>
       <Tooltip.Trigger>
         {#snippet child({ props })}
           <!-- existing <a> or <button>, spread {...props} -->
         {/snippet}
       </Tooltip.Trigger>
       <Tooltip.Content side="bottom" class="text-xs">
         <p class="font-medium">{tab.tooltip.title}</p>
         {#if tab.tooltip.subtitle}
           <p class="text-muted-foreground">{tab.tooltip.subtitle}</p>
         {/if}
       </Tooltip.Content>
     </Tooltip.Root>
   {:else}
     <!-- existing <a>/<button> as today -->
   {/if}
   ```

   Imports at the top of `nav-tabs.svelte`:

   ```ts
   import * as Tooltip from '$lib/components/ui/tooltip/index.js';
   ```

3. **Build the tooltip in `+layout.svelte`** (Task 4): only on the Finances tab, only when `fundingSummary` is non-null and the tab does **not** have an overdue-invoice `danger` dot (when overdue wins, the tooltip shifts to the overdue context — see below).

   Tooltip content matrix:

   | Dot | Title | Subtitle |
   |---|---|---|
   | `funding-green` | `Entièrement financé` | `Total : 18 000 €` (or omit) |
   | `funding-amber` (Partiellement) | `Partiellement financé` | `600 € reste à charge` |
   | `funding-amber` (En attente) | `En attente d'accord` | `1 200 € en cours d'instruction` |
   | `danger` (overdue wins) | `Facture en retard` | (no funding subtitle) |
   | undefined dot | (no tooltip) | — |

   Subtitle copy uses `Intl.NumberFormat('fr-FR').format(amount)` + ` €`. The "en cours d'instruction" amount is `fundingSummary.totalRequested - fundingSummary.totalGranted` summed across pending sources.

**Key constraints**:
- Inherit `Tooltip` primitive defaults: no custom `z-index`, no portal override, no `delayDuration` change. Mobile long-press is the existing primitive's default behaviour — do not implement custom touch handling.
- Tooltip content must **never** wrap longer than ~32 characters per line on mobile — keep title + subtitle compact.
- The tooltip must not appear when `dot === undefined` and the tab is otherwise plain — that would be noise.
- Do not add `cursor-help` styling — Marie clicks the tab to navigate; the tooltip is a passive enhancement, not an interactive surface.

**Testing checklist**:
- [ ] Hover the Finances tab on desktop: tooltip appears after default delay (~200 ms) with correct title + subtitle.
- [ ] Tab through the navigation with keyboard (Tab key): tooltip appears on focus, dismisses on blur.
- [ ] Click the Finances tab: navigation proceeds normally; tooltip dismisses.
- [ ] Long-press the Finances tab on iPhone (375 px): tooltip appears.
- [ ] When `overdueInvoices === true`: tooltip reads "Facture en retard"; funding info is announced in the aria-label only (Task 4).

---

## Task 4: NavTabs — SSR aria-label augmentation `[nav-tabs-funding-aria-label]`

**Problem**: Sighted users get the dot color + tooltip on focus. Screen-reader users currently get a generic "Notification" string and no funding context. We must give them the same fact at the same moment, baked in at SSR (zero hydration flash).

**Implementation**:

1. **Edit** `src/routes/(app)/formations/[id]/+layout.svelte` `<script>` block. Import the helper + types and build the per-tab `dot`, `tooltip`, and `ariaLabel` for the Finances tab.

   ```ts
   import type { StatutGlobal, FundingSummary } from '$lib/services/funding-summary';

   const fundingSummary = $derived<FundingSummary | null>(data?.fundingSummary ?? null);
   const hasPrixConvenu = $derived<boolean>(data?.hasPrixConvenu ?? false);
   const hasFundingSources = $derived<boolean>(data?.hasFundingSources ?? false);
   const fundingContext = $derived(hasPrixConvenu || hasFundingSources);

   type FinancesDot = 'danger' | 'funding-amber' | 'funding-green' | undefined;

   function resolveFinancesDot(
     overdue: boolean,
     statut: StatutGlobal,
     hasCtx: boolean
   ): FinancesDot {
     if (overdue) return 'danger';
     if (!hasCtx) return undefined;
     if (statut === 'Entièrement financé') return 'funding-green';
     if (statut === 'Partiellement financé') return 'funding-amber';
     if (statut === 'En attente') return 'funding-amber';
     return undefined;
   }

   const eur = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €';

   const financesDot = $derived(
     resolveFinancesDot(overdueInvoices, fundingSummary?.statutGlobal ?? 'Sans financement', fundingContext)
   );

   const financesTooltip = $derived.by(() => {
     if (!fundingSummary || !fundingContext) return undefined;
     if (overdueInvoices) return { title: 'Facture en retard' };
     const reste = Math.round(fundingSummary.resteACharge.total);
     const pendingDelta = Math.max(0, fundingSummary.totalRequested - fundingSummary.totalGranted);
     switch (fundingSummary.statutGlobal) {
       case 'Entièrement financé':
         return { title: 'Entièrement financé' };
       case 'Partiellement financé':
         return { title: 'Partiellement financé', subtitle: `${eur(reste)} reste à charge` };
       case 'En attente':
         return { title: "En attente d'accord", subtitle: `${eur(pendingDelta)} en cours d'instruction` };
       case 'Sans financement':
         return undefined;
     }
   });

   const financesAriaLabel = $derived.by(() => {
     if (overdueInvoices) return 'Finances. Facture en retard.';
     if (!fundingSummary || !fundingContext) return undefined; // falls back to "Finances"
     const reste = Math.round(fundingSummary.resteACharge.total);
     const pendingDelta = Math.max(0, fundingSummary.totalRequested - fundingSummary.totalGranted);
     switch (fundingSummary.statutGlobal) {
       case 'Entièrement financé':
         return 'Finances. Financement entièrement couvert.';
       case 'Partiellement financé':
         return `Finances. Partiellement financé, ${eur(reste).replace(' €', ' euros')} restent à charge.`;
       case 'En attente':
         return `Finances. En attente d'accord, ${eur(pendingDelta).replace(' €', ' euros')} en cours d'instruction.`;
       case 'Sans financement':
         return undefined;
     }
   });
   ```

2. **Update** the existing `tabs` derivation (line 26 in `+layout.svelte`). Replace the Finances entry only:

   ```ts
   { href: basePath + '/finances', label: 'Finances', icon: Wallet, dot: financesDot, tooltip: financesTooltip, ariaLabel: financesAriaLabel }
   ```

3. **Edit** `src/lib/components/nav-tabs.svelte`. Add `aria-label={tab.ariaLabel}` to both the `<a>` (line 102) and the `<button>` (line 123). When `tab.ariaLabel` is undefined the attribute is simply omitted (Svelte serialises `undefined` as no attribute).

**Key constraints**:
- The aria-label must include the **euro amount** in a screen-reader-friendly form ("600 euros" not "600 €" — the symbol may be read as "Euro sign" or skipped entirely depending on the user's reader). The `.replace(' €', ' euros')` is the simplest path.
- Do not announce funding info when `overdueInvoices === true` — the overdue invoice is the urgent fact; funding is a secondary state. Announcing both fuses two semantics into one control.
- Do not announce "Sans financement" as a screen-reader fact — it's an absence, not a state worth interrupting the user with. Default `aria-label="Finances"` is sufficient.
- This logic lives in `+layout.svelte` (business knowledge), not in `nav-tabs.svelte` (presentation).

**Testing checklist**:
- [ ] VoiceOver (macOS) reads "Finances. Partiellement financé, 600 euros restent à charge." when focusing the Finances tab on a partially-funded formation.
- [ ] VoiceOver reads "Finances. Facture en retard." (no funding info) when an invoice is overdue, regardless of funding state.
- [ ] On `Sans financement` formations: VoiceOver reads "Finances" (default), no extra clause.
- [ ] No "Notification" string is read after the augmented aria-label (Task 2 suppressed the redundant `<span class="sr-only">`).
- [ ] First page render in DevTools "Disable JavaScript" mode: aria-label is already in the HTML (SSR proven).

---

## Task 5: Aperçu — replace Résumé financier card body with canonical funding-summary tiles `[apercu-funding-card-promotion]`

**Problem**: The Aperçu page's "Résumé financier" card today reads `formation.montantAccorde` — a single scalar from the legacy single-source funding model that T-FN-1 deprecated. We replace its body with the canonical `fundingSummary` tiles per UX review §5.2 while keeping the existing `Card.Root` shell and the "Voir les finances" CTA.

**Implementation**:

1. **Edit** `src/routes/(app)/formations/[id]/+page.svelte`. Import:

   ```ts
   import Badge from '$lib/components/ui/badge/badge.svelte';
   import type { FundingSummary } from '$lib/services/funding-summary';
   ```

2. **Add** derivations near the top of the script block (next to the existing `montant`, `totalFormateurCost`, `marge`):

   ```ts
   const fundingSummary = $derived<FundingSummary | null>(data?.fundingSummary ?? null);
   const hasPrixConvenu = $derived<boolean>(data?.hasPrixConvenu ?? false);
   const hasFundingSources = $derived<boolean>(data?.hasFundingSources ?? false);
   const fundingSourcesList = $derived(
     (formation?.fundingSources ?? []).slice(0, 3) // top 3, "+N autres" link if more
   );
   const fmtEur = (n: number) =>
     new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €';

   const statutBadgeVariant = $derived.by(() => {
     switch (fundingSummary?.statutGlobal) {
       case 'Entièrement financé':
         return { class: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100', icon: '🟢' };
       case 'Partiellement financé':
       case 'En attente':
         return { class: 'bg-amber-100 text-amber-900 hover:bg-amber-100', icon: '🟡' };
       default:
         return { class: 'bg-muted text-muted-foreground', icon: '⚪' };
     }
   });
   ```

   Recompute `marge` to use `fundingSummary.totalGranted` instead of the legacy `montant`:

   ```ts
   const margePrev = $derived(
     fundingSummary != null && totalFormateurCost != null
       ? fundingSummary.totalGranted - totalFormateurCost
       : null
   );
   ```

3. **Replace** the body of the existing card at lines 323–375. Keep the `Card.Root` + `Card.Header` (with the existing "Voir les finances" anchor — relabel its visible text to "Voir les finances →") + `Card.Content`. Inside `Card.Content`, render the new layout:

   ```svelte
   <Card.Content class="space-y-4">
     {#if !hasPrixConvenu && !hasFundingSources}
       <!-- Empty state delegated to Task 6 -->
       <p class="text-sm text-muted-foreground">
         Aucune information de tarification renseignée. Rendez-vous sur la
         <a href="/formations/{formationId}/fiche" class="underline">Fiche</a>
         pour saisir le prix convenu ou sur
         <a href="/formations/{formationId}/finances" class="underline">Finances</a>
         pour ajouter un financeur.
       </p>
     {:else if !hasFundingSources}
       <!-- Empty state delegated to Task 6 -->
     {:else}
       <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
         <div class="rounded-md border p-3">
           <p class="text-xs text-muted-foreground">Total</p>
           <p class="mt-1 text-lg font-semibold tabular-nums">
             {hasPrixConvenu ? fmtEur(Number(formation?.prixConvenu ?? 0)) : '—'}
           </p>
         </div>
         <div class="rounded-md border p-3">
           <p class="text-xs text-muted-foreground">Financé</p>
           <p class="mt-1 text-lg font-semibold tabular-nums">
             {fmtEur(fundingSummary?.totalGranted ?? 0)}
           </p>
           {#if hasPrixConvenu && (fundingSummary?.percentCovered ?? 0) > 0}
             <p class="text-xs text-muted-foreground">
               {Math.round(fundingSummary?.percentCovered ?? 0)} %
             </p>
           {/if}
         </div>
         <div class="rounded-md border p-3">
           <p class="text-xs text-muted-foreground">Reste à charge</p>
           <p class="mt-1 text-lg font-semibold tabular-nums">
             {fmtEur(fundingSummary?.resteACharge.total ?? 0)}
           </p>
           {#if (fundingSummary?.resteACharge.byPayer.apprenant ?? 0) > 0}
             <p class="text-xs text-muted-foreground">
               Apprenant {fmtEur(fundingSummary?.resteACharge.byPayer.apprenant ?? 0)}
             </p>
           {/if}
         </div>
       </div>

       <div role="status" class="flex items-center gap-2">
         <span aria-hidden="true">{statutBadgeVariant.icon}</span>
         <Badge class={statutBadgeVariant.class}>
           Statut : {fundingSummary?.statutGlobal}
         </Badge>
       </div>

       {#if fundingSourcesList.length > 0}
         <ul class="space-y-1 text-sm">
           {#each fundingSourcesList as src (src.id)}
             <li class="flex items-center justify-between">
               <span class="text-muted-foreground">· {src.sourceType}</span>
               <span class="text-xs">{src.status}</span>
             </li>
           {/each}
           {#if (formation?.fundingSources?.length ?? 0) > fundingSourcesList.length}
             <li>
               <a
                 href="/formations/{formationId}/finances"
                 class="text-xs text-primary underline-offset-4 hover:underline"
               >
                 +{(formation?.fundingSources?.length ?? 0) - fundingSourcesList.length} autres
               </a>
             </li>
           {/if}
         </ul>
       {/if}

       {#if margePrev != null}
         <p class="border-t pt-3 text-xs text-muted-foreground">
           Marge prévisionnelle (revenus − coûts) :
           <span class="ml-1 font-semibold tabular-nums" class:text-green-600={margePrev > 0} class:text-red-600={margePrev < 0}>
             {fmtEur(margePrev)}
           </span>
         </p>
       {/if}
     {/if}
   </Card.Content>
   ```

   Update the `Card.Title` icon if needed (Wallet stays). Optionally rename "Résumé financier" → "Financement" to match T-53 Finances tab section names. Coordinate copy with the user only if uncertain — default to **"Financement"** (matches the Finances tab title and the underlying data domain).

4. **Remove** the now-orphaned `montant` derivation if no other consumer references it. Search the file with Grep before deleting.

**Key constraints**:
- Keep the `Card.Root` and `Card.Header` shells unchanged (size, border, layout) so the Aperçu grid spacing doesn't shift.
- Do **not** introduce a separate `<FundingCard>` component for this iteration — inlining is fine for one consumer. Refactor only if T-FN follow-ups need the same body elsewhere.
- The "Voir les finances →" CTA must remain a plain `<a>` (no Button) to match the Aperçu card visual language.
- French strings: "Financement", "Total", "Financé", "Reste à charge", "Statut : {fr label}", "Marge prévisionnelle (revenus − coûts)". No English fallback strings.

**Testing checklist**:
- [ ] Card title reads "Financement" with the Wallet icon; "Voir les finances →" link works.
- [ ] On a formation with prix + multi-source funding: 3 tiles render, statut pill correct color, sources list shows top 3 with "+N autres" link if applicable.
- [ ] On `Entièrement financé`: green pill, no "reste à charge" warning text.
- [ ] On `Partiellement financé`: amber pill, "Apprenant {X €}" line under "Reste à charge" when applicable.
- [ ] Marge prévisionnelle uses `totalGranted`, not the deleted `montant`.
- [ ] Card height visually matches the adjacent Aperçu cards (Séances, Apprenants) at `md+` breakpoints.

---

## Task 6: Aperçu — empty states `[apercu-funding-empty-states]`

**Problem**: When a formation has no funding sources (and possibly no `prixConvenu` either), the canonical 3-tile layout would render zeros and a misleading "Sans financement" pill that conflates "free internal training" with "unconfigured". Per analyst §5.4, we render two distinct empty states and **never** a "Sans financement" pill on Aperçu.

**Implementation**:

The two `{#if}` branches are already scaffolded inside `Card.Content` in Task 5. Implement their content explicitly:

1. **Branch A — `prixConvenu` set, zero sources**:

   ```svelte
   {:else if !hasFundingSources}
     <div class="space-y-2">
       <p class="text-sm">
         <span class="font-medium">Prix convenu :</span>
         <span class="tabular-nums">{fmtEur(Number(formation?.prixConvenu ?? 0))}</span>
         <span class="text-muted-foreground"> — aucun financeur saisi.</span>
       </p>
       <a
         href="/formations/{formationId}/finances?new=true"
         class="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
       >
         <Plus class="size-3.5" />
         Ajouter une source de financement
       </a>
     </div>
   ```

   The `?new=true` query parameter is a deep-link convention; if `/finances` does not yet read it, append a `## log` note that this is a follow-up (Task 6 file change is still safe — the link will simply land on `/finances` and work). Do **not** add the query reader in this ticket.

2. **Branch B — both `prixConvenu` and sources absent**: already implemented in Task 5 (the muted "Aucune information de tarification renseignée" copy with two inline links). No status pill, no color, no CTA prefilled.

3. **Verify** the existing `Plus` icon import at the top of the file is reused; it already comes from `@lucide/svelte/icons/plus`.

**Key constraints**:
- Branch B must NOT show the 🟡 / 🟢 / ⚪ pill. The absence-of-color is the signal.
- Branch A's CTA is a plain link, not a Button — Aperçu cards keep visual restraint; the loud CTA lives on the Finances tab itself.
- Do not invent placeholder sources or stub data. The empty state is the truth.

**Testing checklist**:
- [ ] Create a formation with `prixConvenu = 5000` and zero funding sources → Branch A renders with the link.
- [ ] Create a formation with `prixConvenu = null` and zero funding sources → Branch B renders, no pill, no color.
- [ ] Click "Ajouter une source de financement" → lands on `/formations/{id}/finances` (the dialog auto-open is a follow-up).

---

## Task 7: QA — mobile + a11y parity `[qa-mobile-and-a11y]`

**Problem**: The chosen composite has zero header impact — but the dot, tooltip, aria-label, and Aperçu tiles must all behave correctly on iPhone-SE width (375 px) and with assistive tech. This task is a Browser-MCP checklist for the qa-tester subagent.

**Verification matrix** (each row is a separate manual check):

| # | Surface | Viewport | Tool | Expected |
|---|---|---|---|---|
| 1 | Finances tab dot | 1440 px desktop | Visual | Amber dot on partially-funded formation; emerald on fully-funded; none on Sans financement (with no price). |
| 2 | Finances tab dot priority | 1440 px | Visual | Red dot wins when an invoice is overdue, regardless of funding statut. |
| 3 | Tooltip | 1440 px desktop | Hover | Tooltip appears after ~200 ms with title + euro subtitle; dismisses on mouseleave. |
| 4 | Tooltip — keyboard | 1440 px | Tab key | Tooltip appears on focus; dismisses on blur; no scroll jump. |
| 5 | Tab navigation | 1440 px | Click | Clicking Finances tab navigates without showing tooltip after navigation. |
| 6 | aria-label | 1440 px | VoiceOver | Reads full French sentence including "euros" word; matches per-state copy from Task 4. |
| 7 | aria-label — overdue | 1440 px | VoiceOver | Reads "Finances. Facture en retard." with NO funding clause. |
| 8 | aria-label — Sans financement | 1440 px | VoiceOver | Reads "Finances" only (no extra clause). |
| 9 | Mobile dot | 375 px (iPhone SE) | Visual | Dot remains 6 px, visible, not clipped by tab pill border. |
| 10 | Mobile tooltip | 375 px | Long-press | Tooltip appears; dismisses on tap-outside. |
| 11 | Mobile Aperçu tiles | 375 px | Visual | 3 tiles stack to 1 column (`grid-cols-1`); statut pill full-width; sources list visible. |
| 12 | Aperçu empty Branch A | 1440 px | Visual | "Prix convenu : X € — aucun financeur saisi." + Ajouter link visible. |
| 13 | Aperçu empty Branch B | 1440 px | Visual | Muted "Aucune information de tarification renseignée." copy, no pill, no colors. |
| 14 | SSR | 1440 px | View source | aria-label and dot color are present in initial HTML (no JS-only hydration). |

**Key constraints**:
- Do not pass QA if any aria-label is missing the funding amount on a partially-funded formation.
- Do not pass QA if the tooltip blocks the tab click target on mobile.
- Do not pass QA if the Aperçu card height jumps between empty and populated states (causes layout shift).

**Testing checklist** (qa-tester deliverable):
- [ ] All 14 rows of the matrix pass on the running dev server (`bun run dev`).
- [ ] No console errors / warnings introduced by the new components.
- [ ] Lighthouse a11y score on the Aperçu page does not regress (compare before/after the change).
- [ ] One screenshot per state captured for the QA report: desktop dot, mobile dot, tooltip, Aperçu populated, Aperçu Branch A, Aperçu Branch B.

---

## Out-of-scope / future tickets

Per the UX review §10:

- **Right-rail funding widget (Option E) for ≥xl screens** — defer; create a follow-up ticket if Marie's usage telemetry shows persistent demand.
- **Funding-aware Documents tab adornment** — when a `convention` is preflight-blocked by missing `prixConvenu`, the Documents tab could carry a similar dot. Pattern is identical; create a follow-up after T-59 ships.
- **CPF dossier 30-day pending quest** — that's a real action (HudBanner `action_*`), not a passive funding signal; belongs in the funding state-machine ticket, not T-57.
- **`?new=true` deep-link to open the funding-source dialog** — referenced by Task 6 Branch A but the reader lives on the Finances tab; create as a small T-FN follow-up.
