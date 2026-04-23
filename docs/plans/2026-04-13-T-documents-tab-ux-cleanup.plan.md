---
title: "Documents Tab UX Cleanup — Christmas Tree Fix"
date: 2026-04-13
ref: docs/team-artifacts/design/2026-04-13-documents-tab-christmas-tree-ux-review.md
target: src/routes/(app)/formations/[id]/documents/+page.svelte
tasks:
  - id: stale-banner
    title: "Consolidate stale indicators into a global banner"
    status: done
  - id: bulk-regenerate
    title: "Add Tout régénérer server action"
    status: done
  - id: hide-phase-flat
    title: "Hide phase badges in flat view"
    status: done
  - id: consolidate-warnings
    title: "Consolidate compliance warnings into compact banner"
    status: done
  - id: filter-active-style
    title: "Soften filter bar active badge style"
    status: done
  - id: cta-contrast
    title: "Improve CTA contrast inside warning bars"
    status: done
---

# Documents Tab UX Cleanup — Christmas Tree Fix

All work targets `src/routes/(app)/formations/[id]/documents/+page.svelte` unless noted.

---

## Task 1: Consolidate Stale Indicators into Global Banner `[stale-banner]`

**Problem**: When formation data changes, every generated document shows an identical amber "Les données ont changé" bar — creating a wall of amber noise.

**Implementation**:

1. Add a derived `staleDocuments` that filters `filteredDocuments` where `isDocStale(doc) && doc.effectiveStatus !== 'remplace'`:
   ```ts
   const staleDocuments = $derived(
     filteredDocuments.filter((d) => isDocStale(d) && d.effectiveStatus !== 'remplace')
   );
   const staleRegenerableDocuments = $derived(
     staleDocuments.filter((d) => d.effectiveStatus !== 'signe')
   );
   ```

2. Add a new banner section **between the contextual prompts and the document list** (after line 665). Render only when `staleDocuments.length >= 2`:
   ```svelte
   {#if staleDocuments.length >= 2}
     <div class="flex items-center gap-3 rounded-lg border border-muted bg-muted/30 px-4 py-3">
       <RefreshCcw class="size-4 shrink-0 text-muted-foreground" />
       <p class="flex-1 text-sm text-muted-foreground">
         {staleDocuments.length} documents ont des données modifiées depuis la dernière mise à jour
       </p>
       {#if staleRegenerableDocuments.length > 0}
         <Button variant="outline" size="sm" onclick={regenerateAllStale} disabled={regeneratingAll}>
           {#if regeneratingAll}
             <Loader2 class="mr-1.5 size-3 animate-spin" />
             Régénération...
           {:else}
             <RefreshCcw class="mr-1.5 size-3" />
             Tout régénérer ({staleRegenerableDocuments.length})
           {/if}
         </Button>
       {/if}
     </div>
   {/if}
   ```

3. **Modify the per-card stale indicator** (line 778): add condition to only show when `staleDocuments.length < 2`:
   ```svelte
   {#if isDocStale(doc) && doc.effectiveStatus !== 'remplace' && staleDocuments.length < 2}
   ```

4. **Visual design**: Use `border-muted bg-muted/30 text-muted-foreground` (neutral, not amber). Stale data is informational, not urgent. Reserve amber for status badges on unsent docs.

**Key constraint**: Signed documents (`signe`) must NOT be included in bulk regeneration — show a note: "N documents signés nécessitent un avenant".

---

## Task 2: Add "Tout régénérer" Server Action `[bulk-regenerate]`

**Problem**: No server action exists for bulk regeneration.

**Implementation**:

1. In `+page.server.ts`, add a `regenerateAll` form action:
   ```ts
   regenerateAll: async ({ request, locals, params }) => {
     // Get all stale, non-signed documents for this formation
     // Call the same regeneration logic used by regenerateDocument
     // Return { regeneratedCount, skippedCount }
   }
   ```

2. In the page component, add:
   ```ts
   let regeneratingAll = $state(false);

   async function regenerateAllStale() {
     regeneratingAll = true;
     const body = new FormData();
     try {
       const response = await fetch('?/regenerateAll', { method: 'POST', body });
       const result = deserialize(await response.text());
       if (result.type === 'success') {
         const data = result.data as { regeneratedCount: number; skippedCount: number };
         toast.success(`${data.regeneratedCount} document(s) régénéré(s)`);
         if (data.skippedCount > 0) {
           toast.info(`${data.skippedCount} document(s) signé(s) ignoré(s)`);
         }
         await invalidateAll();
       } else if (result.type === 'failure') {
         toast.error((result.data as { message?: string })?.message ?? 'Erreur');
       }
     } catch (err) {
       toast.error(err instanceof Error ? err.message : 'Erreur de régénération');
     } finally {
       regeneratingAll = false;
     }
   }
   ```

3. The server action should:
   - Query all documents where `formation.updatedAt > document.generatedAt`
   - Filter out `signe`, `remplace`, and `archive` statuses
   - Regenerate each in sequence (reuse existing `regenerateDocument` logic)
   - Return counts

---

## Task 3: Hide Phase Badges in Flat View `[hide-phase-flat]`

**Problem**: Phase badges ("Conception", "Évaluation") on every card add visual noise when the user chose flat urgency-sorted view.

**Implementation**:

1. Wrap the phase badge block (line 692–696) with a `groupByPhase` guard:
   ```svelte
   {#if phase && groupByPhase}
     <Badge variant="outline" class="shrink-0 text-[10px] text-muted-foreground">
       {PHASE_LABELS[phase]}
     </Badge>
   {/if}
   ```

2. **Rationale**: In flat view, sort order already communicates urgency. Phase context is only useful when viewing by phase. When `groupByPhase` is true, the phase headers provide context so per-card badges become complementary (keep them).

**Note**: Actually, when `groupByPhase` is true, the phase is already in the group header — so badges are redundant there too. However, keeping them in grouped view avoids confusion in expanded groups. Acceptable trade-off.

---

## Task 4: Consolidate Compliance Warnings `[consolidate-warnings]`

**Problem**: Multiple full-width red banners push document content below the fold and amplify anxiety.

**Implementation**:

1. Replace the current per-warning banner loop (line 605–629) with a consolidated compact card:
   ```svelte
   {#if complianceWarnings.length > 0}
     <div
       role="alert"
       class="flex items-start gap-3 rounded-lg border-l-4 border-l-red-500 bg-red-50/50 px-4 py-3 dark:bg-red-950/20"
     >
       <AlertTriangle class="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
       <div class="min-w-0 flex-1">
         {#if complianceWarnings.length === 1}
           <p class="text-sm font-medium text-red-900 dark:text-red-100">
             {complianceWarnings[0].message}
           </p>
         {:else}
           <p class="text-sm font-medium text-red-900 dark:text-red-100">
             {complianceWarnings.length} problèmes de conformité
           </p>
           <ul class="mt-1 space-y-0.5">
             {#each complianceWarnings as warning (warning.documentType)}
               <li class="text-sm text-red-800 dark:text-red-200">• {warning.message}</li>
             {/each}
           </ul>
         {/if}
       </div>
     </div>
   {/if}
   ```

2. **Visual design**: Left border accent (`border-l-4 border-l-red-500`) instead of full background fill. Reduced background opacity (`bg-red-50/50`). This signals importance without screaming.

3. **Vertical space savings**: 2 banners → 1 compact card. Saves ~40px.

---

## Task 5: Soften Filter Bar Active Badge Style `[filter-active-style]`

**Problem**: The "Tous" badge uses solid dark variant when active, adding visual weight at the top.

**Implementation**:

1. Change the active "Tous" badge (line 553–557) from `variant="default"` to a custom active style:
   ```svelte
   <Badge
     variant={statusFilter === 'all' ? 'secondary' : 'outline'}
     class="cursor-pointer transition-colors {statusFilter === 'all' ? 'font-semibold' : ''}"
   >
     Tous
   </Badge>
   ```

2. `variant="secondary"` gives a subtle filled background without the high-contrast solid dark. `font-semibold` maintains visual distinction for the active state.

---

## Task 6: Improve CTA Contrast Inside Warning Bars `[cta-contrast]`

**Problem**: Amber-outlined button on amber background has low contrast.

**Implementation**:

1. In the stale indicator bar's "Régénérer" button (line 789–803), when it remains visible (for the single-stale-doc case), change the button styling:
   ```svelte
   <Button
     variant="secondary"
     size="sm"
     class="h-7 shrink-0 cursor-pointer gap-1 text-xs"
     ...
   >
   ```

2. `variant="secondary"` (neutral background) provides better contrast against the amber container than an amber-on-amber outline button.

3. Apply the same principle to the generation prompt "Générer" button (line 652–660): swap from amber outline to `variant="secondary"`.

---

## Implementation Order

Execute in this order for incremental improvement and clean diffs:

1. `[hide-phase-flat]` — smallest change, immediate visual improvement
2. `[consolidate-warnings]` — restructures top of page
3. `[stale-banner]` + `[bulk-regenerate]` — biggest impact, these go together
4. `[filter-active-style]` + `[cta-contrast]` — polish pass

## Testing Checklist

- [ ] With 0 stale docs: no stale banner, no per-card indicators
- [ ] With 1 stale doc: per-card indicator shown (muted style), no global banner
- [ ] With 3+ stale docs: global banner shown with count + "Tout régénérer", no per-card indicators
- [ ] With 1 signed stale doc among 3 stale: banner says "Tout régénérer (2)", signed doc excluded
- [ ] Compliance warnings: single consolidated card with bullet points when 2+ warnings
- [ ] Phase badges: hidden in flat view, visible in grouped view
- [ ] "Tous" filter badge: uses secondary variant when active
- [ ] Bulk regenerate: regenerates all eligible docs, shows success/skip counts
- [ ] Dark mode: all new/modified elements render correctly
- [ ] Mobile: stale banner and consolidated warnings responsive
