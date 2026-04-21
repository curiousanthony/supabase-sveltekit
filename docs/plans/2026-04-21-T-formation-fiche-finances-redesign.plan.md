---
title: "Formation Fiche + Finances redesign"
date: 2026-04-21
ticket: T-50..T-61
v1_decisions:
  reste_a_charge: per-payer (apprenant / entreprise / OF) from V1
  tjm_orphan_handling: drop silently (no warning, no placeholder row)
  formation_type_split: defer to T-61 (P3) — quest engine audit required first, per-quest fix
  pedagogique_objectifs: roll-up only on Fiche (read-only), edit per-module on Programme tab
agent_loading_protocol:
  rationale: |
    This master plan is ~1000 lines covering 12 tickets (T-50..T-61). Loading it whole into every
    implementer subagent wastes ~85% of context. Use lazy extraction.
  ticket_to_task_map:
    T-50: [schema-funding-sources]
    T-51: [schema-drop-tjm-formateur]
    T-52: [backend-finances-loader, backend-funding-actions, service-funding-summary]
    T-53: [ui-finances-revenus-rebuild, ui-finances-synthesis-tile, ui-onboarding-empty-state]
    T-54: [ui-fiche-restructure, ui-fiche-pedagogique, ui-fiche-tarification, ui-fiche-referencement-collapsed, ui-fiche-remove-financement]
    T-55: [schema-pedagogique-fields]
    T-56: [schema-accessibility-fields, ui-fiche-accessibility]
    T-57: [ui-header-financing-chip]
    T-58: [help-popovers-codes]
    T-59: [preflight-extend]
    T-60: [ui-finances-migration-banner]
    T-61: [formation-type-split-audit]
  extraction_pattern: |
    When the orchestrator (or implementer) is about to work on a single ticket, extract ONLY that
    ticket's task sections instead of reading the whole file:

    # Get the list of task ids for ticket T-XX from the front-matter map above, then for each:
    awk '/^## Task [0-9]+: .*\[task-id-here\]/,/^---$/' \
        docs/plans/2026-04-21-T-formation-fiche-finances-redesign.plan.md

    Plus the front-matter (lines 1-110) for cross-cutting v1_decisions and dependency graph.
ref: docs/team-artifacts/design/2026-04-21-formation-fiche-finances-ux-review.md
analysis_ref: docs/team-artifacts/analysis/2026-04-21-formation-fiche-audit.md
target:
  - src/routes/(app)/formations/[id]/fiche/+page.svelte
  - src/routes/(app)/formations/[id]/fiche/+page.server.ts
  - src/routes/(app)/formations/[id]/finances/+page.svelte
  - src/routes/(app)/formations/[id]/finances/+page.server.ts
  - src/routes/(app)/formations/[id]/+layout.svelte
  - src/lib/db/schema/formations.ts
  - src/lib/db/schema/funding-sources.ts
  - src/lib/db/schema/enums.ts
  - src/lib/db/schema/workspaces.ts
  - src/lib/db/relations.ts
  - src/lib/preflight/document-preflight.ts
  - src/lib/services/funding-summary.ts
tasks:
  - id: schema-funding-sources
    title: "Create formation_funding_sources table + enums + invoice FK"
    status: pending
    blocked_by: []
    ticket: T-50
  - id: schema-pedagogique-fields
    title: "Schema: codeRs, codeCpfFiche, niveauQualification, certificateur, dateEnregistrementRncp"
    status: pending
    blocked_by: []
    ticket: T-55
  - id: schema-accessibility-fields
    title: "Schema: workspace + formation accessibility (referent handicap)"
    status: pending
    blocked_by: []
    ticket: T-56
  - id: schema-drop-tjm-formateur
    title: "Drop formations.tjm_formateur with safe data migration"
    status: pending
    blocked_by: [schema-funding-sources]
    ticket: T-51
  - id: backend-finances-loader
    title: "Finances loader returns funding lines + computed totals"
    status: pending
    blocked_by: [schema-funding-sources]
    ticket: T-52
  - id: backend-funding-actions
    title: "Funding source CRUD actions on Finances + invoice fundingSourceId link"
    status: pending
    blocked_by: [backend-finances-loader]
    ticket: T-52
  - id: service-funding-summary
    title: "Extract funding summary derivation to $lib/services/funding-summary.ts"
    status: pending
    blocked_by: [schema-funding-sources]
    ticket: T-52
  - id: ui-finances-synthesis
    title: "Finances UI: synthesis card (Total / Financé / Reste à charge / Statut global)"
    status: pending
    blocked_by: [backend-funding-actions, service-funding-summary]
    ticket: T-53
  - id: ui-finances-funding-card
    title: "Finances UI: multi-source funding card + add/edit/delete dialog"
    status: pending
    blocked_by: [ui-finances-synthesis]
    ticket: T-53
  - id: ui-invoice-fk-picker
    title: "Finances invoice dialog: link to funding source picker"
    status: pending
    blocked_by: [ui-finances-funding-card]
    ticket: T-53
  - id: ui-fiche-remove-financement
    title: "Fiche UI: remove Financement card + tjmFormateur, drop allowedFields"
    status: pending
    blocked_by: [schema-drop-tjm-formateur]
    ticket: T-54
  - id: ui-fiche-pedagogique
    title: "Fiche UI: new Pédagogique card with explicit Save semantics"
    status: pending
    blocked_by: [ui-fiche-remove-financement]
    ticket: T-54
  - id: ui-fiche-tarification
    title: "Fiche UI: new Tarification card (prixPublic + prixConvenu)"
    status: pending
    blocked_by: [ui-fiche-remove-financement]
    ticket: T-54
  - id: ui-fiche-referencement-collapsed
    title: "Fiche UI: Référencement collapsible card with toggle + popovers"
    status: pending
    blocked_by: [ui-fiche-remove-financement, schema-pedagogique-fields]
    ticket: T-54
  - id: ui-fiche-accessibility
    title: "Fiche UI: Logistique accessibility sub-card (workspace default + override)"
    status: pending
    blocked_by: [schema-accessibility-fields]
    ticket: T-56
  - id: ui-header-financing-chip
    title: "Formation header: read-only financing chip (cross-tab)"
    status: pending
    blocked_by: [service-funding-summary]
    ticket: T-57
  - id: help-popovers-fr
    title: "French popover micro-copy: Code RNCP / RS / CPF"
    status: pending
    blocked_by: [ui-fiche-referencement-collapsed]
    ticket: T-58
  - id: preflight-extend
    title: "Preflight: block convention without prixConvenu, warn programme without objectifs/publicVise"
    status: pending
    blocked_by: [ui-fiche-pedagogique, ui-fiche-tarification]
    ticket: T-500
  - id: ui-finances-migration-banner
    title: "Finances one-time migration banner"
    status: pending
    blocked_by: [ui-finances-funding-card]
    ticket: T-501
  - id: tech-debt-formation-type-split
    title: "Split formationType enum: Intra/Inter/Sur-mesure + cpfEligible boolean"
    status: pending
    blocked_by: [schema-funding-sources, backend-finances-loader]
    ticket: T-502
---

# Formation Fiche + Finances Redesign — Implementation Plan

This plan implements the design recorded in `docs/team-artifacts/design/2026-04-21-formation-fiche-finances-ux-review.md`, grounded in the analyst audit at `docs/team-artifacts/analysis/2026-04-21-formation-fiche-audit.md`.

**Sequencing principle:** schema → backend → service → Finances UI → Fiche UI → cross-tab → polish. The dependency graph in the YAML above is the source of truth.

**French/English convention:** All user-facing copy (labels, placeholders, popovers, toasts, banner copy) is in French. All code, comments, identifiers, and this document are in English.

---

## Task 1: Create `formation_funding_sources` table + enums + invoice FK `[schema-funding-sources]`

**Problem:** The current single-row financing model on `formations` (`typeFinancement`, `montantAccorde`, `financementAccorde`) cannot express multi-source funding, partial grants, status lifecycle, or per-source dossier references. The `typesFinancement` enum also conflates financing with delivery format (`Intra`, `Inter`).

**Implementation:**

1. **New file** `src/lib/db/schema/funding-sources.ts`:
   ```ts
   import { pgEnum, pgTable, uuid, text, numeric, date, timestamp, foreignKey, index } from 'drizzle-orm/pg-core';
   import { formations } from './formations';

   export const fundingSourceType = pgEnum('funding_source_type', [
     'CPF', 'CPF_Transition',
     'OPCO_PDC', 'OPCO_Alternance', 'OPCO_ProA', 'OPCO_AFEST',
     'FranceTravail_AIF', 'FranceTravail_POEI', 'FranceTravail_POEC',
     'Region', 'FSE', 'FNE_Formation', 'TransitionsPro_CTP',
     'AGEFICE', 'FIFPL', 'FAFCEA',
     'EmployeurDirect', 'AutoFinancement', 'Autre'
   ]);

   export const fundingSourceStatus = pgEnum('funding_source_status', [
     'Pressenti', 'Demandé', 'Accordé', 'Refusé', 'Versé', 'Annulé'
   ]);

   export const formationFundingSources = pgTable('formation_funding_sources', {
     id: uuid().defaultRandom().primaryKey().notNull(),
     formationId: uuid('formation_id').notNull(),
     source: fundingSourceType().notNull(),
     payerLabel: text('payer_label'),
     requestedAmount: numeric('requested_amount', { precision: 12, scale: 2 }),
     grantedAmount: numeric('granted_amount', { precision: 12, scale: 2 }),
     status: fundingSourceStatus().default('Pressenti').notNull(),
     decisionDate: date('decision_date'),
     expectedPaymentDate: date('expected_payment_date'),
     dossierReference: text('dossier_reference'),
     notes: text(),
     createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
     updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
   }, (t) => [
     foreignKey({
       columns: [t.formationId],
       foreignColumns: [formations.id],
       name: 'formation_funding_sources_formation_id_fkey'
     }).onUpdate('cascade').onDelete('cascade'),
     index('formation_funding_sources_formation_id_idx').on(t.formationId)
   ]);
   ```

2. **Edit** `src/lib/db/schema/formations.ts` — add `fundingSourceId` nullable FK to `formationInvoices`:
   ```ts
   fundingSourceId: uuid('funding_source_id'),
   // … then in the constraints array:
   foreignKey({
     columns: [table.fundingSourceId],
     foreignColumns: [formationFundingSources.id],
     name: 'formation_invoices_funding_source_id_fkey'
   }).onUpdate('cascade').onDelete('set null'),
   ```

3. **Edit** `src/lib/db/relations.ts` to wire the new table to `formations` (one-to-many) and to `formationInvoices` (many-to-one).

4. **Edit** `src/lib/db/schema/index.ts` to re-export from `funding-sources.ts`.

5. **Migration file** `supabase/migrations/{ts}_funding_sources.sql`:
   - `CREATE TYPE funding_source_type AS ENUM (...)`
   - `CREATE TYPE funding_source_status AS ENUM (...)`
   - `CREATE TABLE formation_funding_sources (...)` with FK + index
   - `ALTER TABLE formation_invoices ADD COLUMN funding_source_id UUID NULL REFERENCES formation_funding_sources(id) ON DELETE SET NULL`
   - **Data migration block** (idempotent):
     ```sql
     INSERT INTO formation_funding_sources (id, formation_id, source, granted_amount, status, created_at)
     SELECT
       gen_random_uuid(),
       id,
       CASE type_financement
         WHEN 'CPF'  THEN 'CPF'::funding_source_type
         WHEN 'OPCO' THEN 'OPCO_PDC'::funding_source_type
         ELSE 'EmployeurDirect'::funding_source_type
       END,
       montant_accorde,
       CASE WHEN financement_accorde THEN 'Accordé'::funding_source_status ELSE 'Demandé'::funding_source_status END,
       NOW()
     FROM formations
     WHERE type_financement IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM formation_funding_sources fs WHERE fs.formation_id = formations.id);
     ```
   - **Do NOT drop** `type_financement`, `montant_accorde`, `financement_accorde` yet — leave for one release cycle.

6. **Down migration**: drop column, drop table, drop enums.

**Key constraints:**
- Migration must be **idempotent** (re-runnable in CI / preview branches).
- ON DELETE CASCADE from formations is intentional — funding lines belong to the formation lifecycle.
- ON DELETE SET NULL from invoices keeps invoice history intact when a funding source is deleted.
- Don't touch `formations.tjm_formateur` here — that's `schema-drop-tjm-formateur`.

**Testing checklist:**
- [ ] Migration runs cleanly on a fresh Supabase reset.
- [ ] Migration runs cleanly on a dump containing existing formations with all enum values.
- [ ] Re-running migration is a no-op (no duplicate rows, no errors).
- [ ] `bun run db:generate` shows expected diff; `bun run db:push` (preview) succeeds.
- [ ] Drizzle types build without errors.

---

## Task 2: Schema for missing référencement & pédagogique fields `[schema-pedagogique-fields]`

**Problem:** RS, CPF fiche, niveau qualification and certificateur are absent from the schema; pédagogique fields exist but lack a UI counterpart.

**Implementation:**

1. **Edit** `src/lib/db/schema/formations.ts` — add columns to `formations`:
   ```ts
   codeRs: text('code_rs'),
   codeCpfFiche: text('code_cpf_fiche'),
   niveauQualification: integer('niveau_qualification'),
   certificateur: text(),
   dateEnregistrementRncp: date('date_enregistrement_rncp'),
   ```
2. **Migration file** `supabase/migrations/{ts}_referencement_fields.sql`:
   ```sql
   ALTER TABLE formations
     ADD COLUMN code_rs TEXT,
     ADD COLUMN code_cpf_fiche TEXT,
     ADD COLUMN niveau_qualification INTEGER CHECK (niveau_qualification IS NULL OR (niveau_qualification BETWEEN 1 AND 8)),
     ADD COLUMN certificateur TEXT,
     ADD COLUMN date_enregistrement_rncp DATE;
   ```

**Key constraints:**
- `niveau_qualification` constrained to 1–8 (EQF/RNCP scale).
- All nullable — most formations won't fill them.

**Testing checklist:**
- [ ] CHECK constraint rejects `0` and `9`.
- [ ] Drizzle infers correct types.

---

## Task 3: Schema for accessibility (workspace default + per-formation override) `[schema-accessibility-fields]`

**Problem:** Qualiopi ind. 26 mandates a named accessibility referent for every OF; today neither workspace nor formation has the field.

**Implementation:**

1. **Edit** `src/lib/db/schema/workspaces.ts`:
   ```ts
   defaultReferentHandicap: text('default_referent_handicap'),
   defaultDispositionsHandicap: text('default_dispositions_handicap'),
   ```
2. **Edit** `src/lib/db/schema/formations.ts`:
   ```ts
   referentHandicap: text('referent_handicap'),
   dispositionsHandicap: text('dispositions_handicap'),
   ```
3. **Migration**: `ALTER TABLE workspaces ADD …` and `ALTER TABLE formations ADD …`. All nullable.

**Key constraints:**
- Empty per-formation values mean "use workspace default" — never overwrite at write time.

**Testing checklist:**
- [ ] Drizzle schema diff matches migration output.

---

## Task 4: Drop `formations.tjm_formateur` with safe data migration `[schema-drop-tjm-formateur]`

**Problem:** Redundant with `formation_formateurs.tjm`; semantically ambiguous when multiple formateurs are assigned.

**Implementation:**

1. **Pre-migration audit script** (add to `scripts/db-audits/audit-tjm-formateur.ts`):
   ```ts
   // Find formations where tjm_formateur is set but no formation_formateurs row exists.
   // Print warning; require human resolution before running migration.
   ```
2. **Migration file** `supabase/migrations/{ts}_drop_tjm_formateur.sql`:
   ```sql
   -- Backfill: when a formation has tjm_formateur AND has formation_formateurs rows where tjm IS NULL
   UPDATE formation_formateurs ff
   SET tjm = f.tjm_formateur
   FROM formations f
   WHERE ff.formation_id = f.id
     AND f.tjm_formateur IS NOT NULL
     AND ff.tjm IS NULL;

   -- Now drop the column.
   ALTER TABLE formations DROP COLUMN tjm_formateur;
   ```
3. **Edit** `src/lib/db/schema/formations.ts` — remove `tjmFormateur` from columns.
4. **Edit** `src/routes/(app)/formations/[id]/fiche/+page.server.ts` — remove `'tjmFormateur'` from `allowedFields` and the `parseFloat` branch.

**Key constraints:**
- DO NOT proceed if audit script finds orphans — fail loudly.
- Down migration must re-add column as nullable (no data restore possible — accept).

**Testing checklist:**
- [ ] Finances `formateursCost` derivation produces same totals before/after on seed data.
- [ ] No remaining references to `tjmFormateur` in codebase (`rg` grep).

---

## Task 5: Finances loader returns funding lines + computed totals `[backend-finances-loader]`

**Problem:** Finances `+page.server.ts` doesn't load funding sources or expose derived totals.

**Implementation:**

1. **Edit** `src/routes/(app)/formations/[id]/finances/+page.server.ts`:
   ```ts
   import { formationFundingSources } from '$lib/db/schema';
   import { computeFundingSummary } from '$lib/services/funding-summary';

   // inside load()
   const fundingSources = await db.query.formationFundingSources.findMany({
     where: eq(formationFundingSources.formationId, params.id),
     orderBy: (fs, { asc }) => [asc(fs.createdAt)]
   });

   const formation = await db.query.formations.findFirst({
     where: eq(formations.id, params.id),
     columns: { id: true, prixConvenu: true, prixPublic: true }
   });

   const summary = computeFundingSummary(formation, fundingSources);

   return { invoices, costItems, fundingSources, summary };
   ```

**Key constraints:**
- Use `prixConvenu` if present, else fall back to `prixPublic` (with `isEstimate: true` flag in summary).
- Workspace ownership check unchanged.

**Testing checklist:**
- [ ] Loader returns shape matching client expectations (no `any`).
- [ ] Empty funding source list returns `summary` with all zero values + `statutGlobal: 'Sans financement'`.

---

## Task 6: Funding source CRUD actions + invoice FK link `[backend-funding-actions]`

**Problem:** No actions to create/edit/delete funding sources or to link invoices to a source.

**Implementation:**

1. **Edit** `src/routes/(app)/formations/[id]/finances/+page.server.ts` — add three actions:
   ```ts
   createFundingSource: async ({ request, locals, params }) => { /* … */ },
   updateFundingSource: async ({ request, locals, params }) => { /* … */ },
   deleteFundingSource: async ({ request, locals, params }) => { /* … */ },
   ```
   Each:
   - Verifies workspace ownership via `verifyFormationOwnership`.
   - Reads `source`, `payerLabel`, `requestedAmount`, `grantedAmount`, `status`, `decisionDate`, `expectedPaymentDate`, `dossierReference`, `notes`.
   - Validates `source` against the enum (`fundingSourceType.enumValues`); `status` similarly.
   - Numerics: parse with `parseFloat`, validate ≥ 0.
   - On success: call `logAuditEvent` with `actionType: 'funding_source_created' | 'updated' | 'deleted'`.

2. **Extend** `createInvoice` and `updateInvoice` to accept optional `fundingSourceId`:
   ```ts
   const fundingSourceId = formData.get('fundingSourceId')?.toString() || null;
   if (fundingSourceId) {
     // Verify it belongs to this formation
     const fs = await db.query.formationFundingSources.findFirst({
       where: and(
         eq(formationFundingSources.id, fundingSourceId),
         eq(formationFundingSources.formationId, params.id)
       ),
       columns: { id: true }
     });
     if (!fs) return fail(400, { message: 'Source de financement invalide' });
   }
   // pass fundingSourceId in the insert/update set
   ```

**Key constraints:**
- All mutations write audit log entries (mandatory for Qualiopi traceability).
- Validation errors return French messages (`'Statut invalide'`, `'Montant invalide'`).
- Status transition is not enforced server-side (V1) — UI guides Marie via field gating.

**Testing checklist:**
- [ ] Cross-workspace mutation attempts return 403.
- [ ] Invoice with foreign-formation `fundingSourceId` returns 400.
- [ ] Audit log entries appear with correct `entityType`/`entityId`.

---

## Task 7: Funding summary service `[service-funding-summary]`

**Problem:** Derived totals (`Total financé`, `Reste à charge`, `Statut global`) are needed in two places (Finances synthesis card + header chip) — extract.

**Implementation:**

1. **New file** `src/lib/services/funding-summary.ts`:
   ```ts
   import type { InferSelectModel } from 'drizzle-orm';
   import { formationFundingSources } from '$lib/db/schema';

   type FundingSource = InferSelectModel<typeof formationFundingSources>;
   type FormationLite = { prixConvenu: string | null; prixPublic: string | null };

   export type StatutGlobal = 'Entièrement financé' | 'Partiellement financé' | 'En attente' | 'Sans financement';

   export interface FundingSummary {
     totalFormation: number;
     totalFormationIsEstimate: boolean;
     totalDemande: number;
     totalAccorde: number;
     totalVerse: number;
     totalFinance: number; // accorde + verse
     resteACharge: number;
     percentCovered: number;
     statutGlobal: StatutGlobal;
   }

   export function computeFundingSummary(
     formation: FormationLite | null | undefined,
     sources: FundingSource[]
   ): FundingSummary { /* … */ }
   ```
2. Status rules (in this exact order):
   - No sources → `Sans financement`
   - All sources `Versé` AND total ≥ formation total → `Entièrement financé`
   - Any source `Demandé` or `Pressenti` AND nothing accordé → `En attente`
   - Otherwise → `Partiellement financé`

**Key constraints:**
- Pure function, no DB access.
- Numbers: parse `Numeric` strings with `Number()`, default 0.
- Unit-test with at least 6 fixtures (no source / one Pressenti / one Accordé full / two sources partial / fully Versé / over-funded).

**Testing checklist:**
- [ ] Vitest covers each `StatutGlobal` branch.
- [ ] `percentCovered` capped at 100 when over-funded? Decision: **no**, expose true ratio so UI can flag over-funding (rare but real).

---

## Task 8: Finances UI — synthesis card `[ui-finances-synthesis]`

**Problem:** Current "Revenus" card shows 3 tiles based on the deprecated single-row model. Replace with summary derived from funding sources.

**Implementation:**

1. **Edit** `src/routes/(app)/formations/[id]/finances/+page.svelte`:
   - Remove the existing Revenus card (lines 162–200).
   - Add a new card at the top:
   ```svelte
   <Card.Root>
     <Card.Header>
       <Card.Title class="flex items-center gap-2">
         <Wallet class="size-4" />
         Synthèse financière
       </Card.Title>
     </Card.Header>
     <Card.Content>
       <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
         <KpiTile label="Total formation" value={fmtCurrency(summary.totalFormation) + ' €'} hint={summary.totalFormationIsEstimate ? 'Prix public (estimation)' : 'Prix convenu'} />
         <KpiTile label="Financé" value={fmtCurrency(summary.totalFinance) + ' €'} />
         <KpiTile label="Reste à charge à recouvrer" value={fmtCurrency(summary.resteACharge) + ' €'} tone={resteATone(summary)} />
         <KpiTile label="Statut" badge={statutBadge(summary.statutGlobal)} />
       </div>
     </Card.Content>
   </Card.Root>
   ```
2. `KpiTile` may be inlined initially (no need to extract a component if only used here).
3. `resteATone()`: returns `muted` when 0, `amber` when > 0 and `% < 30`, `destructive` only when `% < 50`. Never red on small percentages — that's loss-aversion overreach.

**Key constraints:**
- Mobile breakpoints: `grid-cols-2 sm:grid-cols-4`. Tiles must be readable at 360px viewport.
- Phrasing: "Reste à charge à recouvrer" (action-oriented), never "Manque à gagner" (defeatist).
- Statut badge colors per design: green / amber / blue / grey.

**Testing checklist:**
- [ ] Renders correctly on 360px viewport.
- [ ] Dark mode contrasts for badges meet WCAG AA.
- [ ] Empty funding source list → status badge shows "Sans financement" (grey).
- [ ] Over-funded edge case (% > 100) renders without breaking layout.

---

## Task 9: Finances UI — multi-source funding card `[ui-finances-funding-card]`

**Problem:** No UI to manage multi-source funding lines.

**Implementation:**

1. Add a new card after Synthèse:
   ```svelte
   <Card.Root>
     <Card.Header class="flex-row items-center justify-between space-y-0">
       <Card.Title class="flex items-center gap-2">
         <Banknote class="size-4" />
         Sources de financement
         {#if fundingSources.length > 0}
           <Badge variant="secondary" class="ml-1">{fundingSources.length}</Badge>
         {/if}
       </Card.Title>
       <Button size="sm" onclick={openNewFunding}>
         <Plus class="mr-1 size-4" />
         Ajouter une source de financement
       </Button>
     </Card.Header>
     <Card.Content>
       {#if fundingSources.length === 0}
         <EmptyState
           icon={Banknote}
           title="Aucune source de financement"
           description="Ajoutez les financeurs (CPF, OPCO, employeur…) pour suivre votre dossier."
           cta={{ label: 'Ajouter une source', onclick: openNewFunding }}
         />
       {:else}
         <div class="space-y-2">
           {#each fundingSources as fs (fs.id)}
             <FundingRow {fs} onEdit={openEditFunding} onDelete={openDeleteFunding} />
           {/each}
         </div>
       {/if}
     </Card.Content>
   </Card.Root>
   ```
2. `FundingRow` (inline or extracted) — two-line layout on mobile, single-line on desktop:
   - Line 1: source label + payer + status badge
   - Line 2: `Demandé · Accordé · Décision JJ/MM/AAAA · Réf : XXXXX`
3. Add the `Dialog` for create/edit with the 9 fields per design spec. Source select is a `Combobox` (`Popover` + `Command`) using a static array of canonical sources mapped to French labels:
   ```ts
   const SOURCE_OPTIONS = [
     { value: 'CPF', label: 'CPF — Compte Personnel de Formation', defaultPayer: 'Caisse des Dépôts' },
     // … one per analyst §1.2 entry
   ];
   ```
4. Smart defaults inside the dialog:
   - When `source` changes to `CPF` → set `payerLabel = 'Caisse des Dépôts'` (read-only-on-display, editable on click).
   - When `source = 'EmployeurDirect'` → `payerLabel = formation.company?.name ?? ''`.
   - When `status` advances to `Accordé`, focus jumps to the `decisionDate` input.
5. Validation in the `<form use:enhance>`: required = `source`, `status`. `decisionDate` required when status ∈ {Accordé, Refusé, Versé}.

**Key constraints:**
- shadcn-svelte components only (Card, Dialog, Combobox via Popover+Command, Badge, Button, Separator, Input, Select, Textarea).
- French labels everywhere; English in code.
- Status badge color map identical to `StatutGlobal` rules.

**Testing checklist:**
- [ ] Add source → list updates without page reload (`use:enhance` + `update()`).
- [ ] Edit then cancel → no DB write.
- [ ] Delete with linked invoice → invoice's `fundingSourceId` becomes null (DB), invoice list still renders.
- [ ] Dialog `Esc` closes without save; `Cmd+Enter` submits.
- [ ] Mobile: 360px viewport, dialog scrolls internally.

---

## Task 10: Invoice dialog — link to funding source picker `[ui-invoice-fk-picker]`

**Problem:** Invoices can't be reconciled with funding sources.

**Implementation:**

1. In the Invoice `Dialog` form (`+page.svelte`), add a new field block after the `recipient` row:
   ```svelte
   {#if fundingSources.length > 0}
     <div class="space-y-1.5">
       <Label for="inv-funding">Lier à une source de financement</Label>
       <Select.Root type="single" bind:value={invFundingSourceId} name="fundingSourceId">
         <Select.Trigger id="inv-funding" class="w-full">
           {fundingSourceLabel(invFundingSourceId) ?? 'Aucune (paiement client direct)'}
         </Select.Trigger>
         <Select.Content>
           <Select.Item value="">Aucune</Select.Item>
           {#each fundingSources as fs (fs.id)}
             <Select.Item value={fs.id}>{sourceLabelShort(fs)}</Select.Item>
           {/each}
         </Select.Content>
       </Select.Root>
     </div>
   {/if}
   ```
2. Ensure `openNewInvoice` and `openEditInvoice` set `invFundingSourceId` correctly (existing invoice value or `''`).

**Key constraints:**
- Field hidden when no funding sources exist (don't show empty selects).
- Empty value = nullable FK on backend.

**Testing checklist:**
- [ ] Create invoice without picking → `funding_source_id IS NULL`.
- [ ] Edit invoice and switch source → DB updated.

---

## Task 11: Fiche — remove Financement card + tjmFormateur `[ui-fiche-remove-financement]`

**Problem:** Financing leaves Fiche entirely. `tjmFormateur` was misplaced; section creates cognitive noise.

**Implementation:**

1. **Edit** `src/routes/(app)/formations/[id]/fiche/+page.svelte`:
   - Delete the entire "Section 3: Financement" `Card.Root` block (lines 695–812).
   - Remove `TYPEFINANCEMENT_OPTIONS` constant.
   - Remove `openFinancementPopover` state.
2. **Edit** `src/routes/(app)/formations/[id]/fiche/+page.server.ts`:
   - Remove from `allowedFields`: `'typeFinancement'`, `'montantAccorde'`, `'financementAccorde'`, `'tjmFormateur'`.
   - Remove the `if (field === 'financementAccorde')` and `tjmFormateur` parseFloat branches.
   - In `recalculateActionDueDates` — `typeFinancement` may still be referenced by quest engine; **don't break it** in this task — leave the read of `typeFinancement` unchanged (deprecated columns remain readable).

**Key constraints:**
- Quest engine continues to work because deprecated DB columns are still readable.
- After this task, the only remaining reference to legacy financing on Fiche must be the read-only chip (next tasks).

**Testing checklist:**
- [ ] Fiche page renders without console errors.
- [ ] Quest engine due-date recalculation still runs when `dateDebut`/`dateFin` change.
- [ ] No 500s when saving any remaining Fiche field.

---

## Task 12: Fiche — Pédagogique card `[ui-fiche-pedagogique]`

**Problem:** `prerequis` and `publicVise` are invisible (no UI control). `objectifs` exists at both formation level AND module level — asking Marie to fill both is redundant; module-level `objectifs` (entered on Programme tab) is the canonical source. `modaliteEvaluation` does NOT exist on the `formations` table (lives only per-module on `modules.modaliteEvaluation`).

**Decision (revised after stakeholder review):**
- Keep `prerequis` + `publicVise` as editable fields on Fiche (only place to fill them).
- Replace formation-level `objectifs` with a **read-only roll-up** aggregating `modules[].objectifs` from the Programme tab, with a deep-link "Modifier dans Programme →".
- Drop `modaliteEvaluation` from the Fiche entirely (the field doesn't exist on `formations`).
- Document templates (convention, programme PDF) keep reading from module-level objectifs.

**Implementation:**

1. Add a new `Card.Root` between "Référencement" and "Logistique":
   ```svelte
   <Card.Root>
     <Card.Header>
       <Card.Title>Pédagogique</Card.Title>
     </Card.Header>
     <Card.Content class="flex flex-col gap-6">
       <ObjectifsRollup
         modules={formation?.modules ?? []}
         programmeHref="../programme"
       />
       <PedagogiqueTextarea
         field="prerequis"
         label="Prérequis"
         placeholder="Connaissances ou compétences attendues avant la formation…"
         current={formation?.prerequis ?? null}
         onSave={(val) => saveField('prerequis', val)}
       />
       <PedagogiqueTextarea
         field="publicVise"
         label="Public visé"
         placeholder="À qui s'adresse cette formation (ex : développeurs juniors, RH, …)"
         current={formation?.publicVise ?? null}
         onSave={(val) => saveField('publicVise', val)}
       />
     </Card.Content>
   </Card.Root>
   ```
2. `ObjectifsRollup` (read-only summary component, ~40 lines):
   - When `modules.length === 0` → empty state: *"Aucun objectif défini. Ajoutez des modules dans le Programme."* + button linking to `../programme`.
   - When `modules.length > 0` → show count badge ("4 objectifs définis dans le Programme"), then list the first 3 module-level objectifs (truncated to 1 line each), then a small CTA link "Modifier dans Programme →".
   - No edit affordance on this card — it's strictly a read-only window into Programme data.
3. `PedagogiqueTextarea` (inline component, ~30 lines): toggle between read mode (rendered text, edit pencil) and edit mode (Textarea + "Enregistrer" / "Annuler" buttons). **No blur-save** — explicit commit per UX rationale.
4. Add `'prerequis'`, `'publicVise'` to `allowedFields` in `+page.server.ts`. Do **NOT** add `'objectifs'` or `'modalitesEvaluation'` (former is read-only roll-up, latter doesn't exist on formations).
5. Loader (`+layout.server.ts`) must include `formation.modules` with at least `id`, `objectifs`, `name`, `orderIndex` so the roll-up can render without an extra fetch.

**Key constraints:**
- `ObjectifsRollup` is read-only by design — preventing the duplicate-data problem at the source.
- Save semantics for `prerequis` / `publicVise`: explicit button (not blur). Toast "✓ Enregistré" on success — Peak-End moment of relief.
- `Esc` cancels edit, restoring previous value.
- Min 4 rows, autoresize via `field-sizing-content` CSS or by binding `rows` to line count.
- French placeholders give Marie a starting frame (rich placeholder is a teaching tool).
- Cross-tab consistency: when modules change in Programme, Fiche roll-up must reflect via `invalidateAll` after Programme mutations (already pattern in Programme tab).

**Testing checklist:**
- [ ] `prerequis` and `publicVise` save → DB updated, toast appears, returns to read mode.
- [ ] Cancel → DB unchanged.
- [ ] Marker `data-preflight-target="prerequis"`, `id="preflight-prerequis"`, same for `publicVise`.
- [ ] `ObjectifsRollup` empty state renders when formation has no modules and points to Programme.
- [ ] `ObjectifsRollup` count badge matches `modules.filter(m => m.objectifs).length`.
- [ ] Adding a module objectif in Programme → Fiche roll-up updates after navigation back.

---

## Task 13: Fiche — Tarification card `[ui-fiche-tarification]`

**Problem:** `prixPublic` and `prixConvenu` invisible.

**Implementation:**

1. Add a `Card.Root` titled "Tarification" within or just after the "Client / commercial" section. Two numeric fields using the existing inline-cell pattern (`startEdit`/`handleBlur`):
   - `prixPublic` — placeholder "Tarif affiché sur la fiche CPF / mentions légales"
   - `prixConvenu` — placeholder "Tarif convenu avec le client (mention obligatoire dans la convention)"
2. Read-only financing chip placed **above** the price fields:
   ```svelte
   <FinancingChip {summary} href="../finances" />
   ```
   (`summary` available via parent layout per task `service-funding-summary` and `ui-header-financing-chip`.)
3. Add `'prixPublic'` and `'prixConvenu'` to `allowedFields`. Both parse as `parseFloat` ≥ 0; `null` when empty.

**Key constraints:**
- French formatting on display: `Number(val).toLocaleString('fr-FR') + ' €'` matching existing `fmtCurrency`.
- Tag both inputs with `data-preflight-target="prixConvenu"` and `id="preflight-prixConvenu"`.

**Testing checklist:**
- [ ] Saving 1500 → display "1 500 €".
- [ ] Empty input → DB null, display placeholder.

---

## Task 14: Fiche — Référencement collapsible card `[ui-fiche-referencement-collapsed]`

**Problem:** RNCP/RS/CPF cryptic and shown for all formations.

**Implementation:**

1. Add a `Card.Root` **between** "Identification" and "Pédagogique":
   ```svelte
   <Card.Root>
     <Card.Header class="flex-row items-center justify-between space-y-0">
       <Card.Title>Référencement</Card.Title>
       <div class="flex items-center gap-2">
         <Label for="ref-toggle" class="text-sm font-normal">Cette formation prépare-t-elle à une certification ?</Label>
         <Switch id="ref-toggle" bind:checked={isCertifying} />
       </div>
     </Card.Header>
     {#if isCertifying}
       <Card.Content class="flex flex-col gap-4">
         <CodeFieldWithPopover field="codeRncp" label="Code RNCP" placeholder="Ex : RNCP35584" popoverKey="rncp" />
         <CodeFieldWithPopover field="codeRs" label="Code RS" placeholder="Ex : RS5692" popoverKey="rs" />
         <CodeFieldWithPopover field="codeCpfFiche" label="Identifiant Mon Compte Formation" placeholder="Ex : 1234567890" popoverKey="cpf" />
         <NiveauQualificationSelect />
         <CertificateurInput />
         <DateEnregistrementRncpInput />
       </Card.Content>
     {/if}
   </Card.Root>
   ```
2. `isCertifying` is a `$derived` from "any of these fields is non-null", with a writable wrapper for the toggle. When toggling OFF, **do not** clear values — just hide. Toggling ON re-reveals previously entered values (defensive against accidental clicks).
3. Move `codeRncp` away from the "Informations générales" card.
4. Add `'codeRs'`, `'codeCpfFiche'`, `'niveauQualification'`, `'certificateur'`, `'dateEnregistrementRncp'` to `allowedFields`. `niveauQualification` parses as int 1–8.

**Key constraints:**
- Toggle question framing: "Cette formation prépare-t-elle à une certification ?" (NOT "Avancé"). The question itself is the teaching moment.
- Hidden state keeps stored values (never destructive).

**Testing checklist:**
- [ ] Loading formation with `codeRncp` set → toggle is ON by default.
- [ ] Toggle off then back on → previous values still present.
- [ ] Niveau outside 1–8 rejected with French error toast.

---

## Task 15: Fiche — Logistique accessibility sub-card `[ui-fiche-accessibility]`

**Problem:** Qualiopi ind. 26 referent + dispositions absent.

**Implementation:**

1. Add a sub-section inside the "Logistique" card (or new "Logistique & accessibilité"):
   ```svelte
   <div class="rounded-lg border bg-muted/20 p-4">
     <button class="flex items-center justify-between w-full text-left" onclick={() => accessibilityOpen = !accessibilityOpen}>
       <div class="flex items-center gap-2">
         <CheckCircle class="size-4 text-muted-foreground" />
         <span class="text-sm">Référent : {effectiveReferent} — {hasOverride ? 'dispositions spécifiques' : 'dispositions standard'}</span>
       </div>
       <ChevronDown class={cn('size-4 transition-transform', accessibilityOpen && 'rotate-180')} />
     </button>
     {#if accessibilityOpen}
       <div class="mt-4 space-y-3">
         <p class="text-xs text-muted-foreground">Par défaut (paramètres organisme) : {workspace.defaultReferentHandicap ?? 'non renseigné'}</p>
         <Switch label="Cette formation a des dispositions spécifiques" bind:checked={hasOverride} />
         {#if hasOverride}
           <!-- referentHandicap input + dispositionsHandicap textarea -->
         {/if}
       </div>
     {/if}
   </div>
   ```
2. Pass `workspace` (with default referent) from `load()` (extend Fiche loader).
3. Add `'referentHandicap'`, `'dispositionsHandicap'` to `allowedFields`.

**Key constraints:**
- Empty per-formation values mean "use workspace default" — server must NEVER overwrite formation values to defaults; the read-side resolution (`effectiveReferent`) handles the fallback.
- If workspace default is also empty, render an inline prompt: "Renseignez le référent handicap dans Paramètres → Organisme" with link.

**Testing checklist:**
- [ ] No workspace default + no override → "non renseigné" + CTA visible.
- [ ] Override toggled then field filled → DB stores override; chip updates.

---

## Task 16: Formation header — read-only financing chip `[ui-header-financing-chip]`

**Problem:** Financing status invisible from non-Finances tabs.

**Implementation:**

1. **Edit** `src/routes/(app)/formations/[id]/+layout.svelte` (or whichever layout renders the formation header). Add the chip near the formation title / status:
   ```svelte
   <FinancingChip {summary} href="/formations/{formation.id}/finances" />
   ```
2. **Edit** `src/routes/(app)/formations/[id]/+layout.server.ts` to load funding sources + summary:
   ```ts
   const fundingSources = await db.query.formationFundingSources.findMany({
     where: eq(formationFundingSources.formationId, params.id)
   });
   const summary = computeFundingSummary(formation, fundingSources);
   return { formation, summary };
   ```
3. New component `src/lib/components/formations/financing-chip.svelte`:
   - Renders a `<a>` with role-styled chip.
   - Color rules: green (Entièrement financé), amber (Partiellement financé / En attente), grey (Sans financement).
   - Shows: source label (most-significant payer) + status + reste à charge in € when > 0.
   - `aria-label`: "Statut du financement : {statutGlobal}, reste à charge : N euros. Voir le détail."

**Key constraints:**
- Chip is **always read-only** — no inline edit, no popover form.
- On hover/focus, suffix `Voir le détail →`.
- Don't load funding sources twice (Finances tab already loads them in its own loader; layout load is its own context).

**Testing checklist:**
- [ ] Chip visible on Fiche, Finances, Suivi, Documents tabs.
- [ ] Click navigates to Finances.
- [ ] Keyboard focus visible (focus ring), screen reader announces statutGlobal.

---

## Task 17: French popovers for Code RNCP / RS / CPF `[help-popovers-fr]`

**Problem:** Codes are cryptic for Marie.

**Implementation:**

1. Inside the `CodeFieldWithPopover` component used by Référencement, render a `Popover` triggered by an `Info` icon next to the label:
   ```svelte
   <div class="flex items-center gap-1.5">
     <Label for={`fld-${field}`}>{label}</Label>
     <Popover.Root>
       <Popover.Trigger><Info class="size-3.5 text-muted-foreground hover:text-foreground" /></Popover.Trigger>
       <Popover.Content class="w-80 text-sm space-y-2" align="start">
         {@render popoverContent(popoverKey)}
       </Popover.Content>
     </Popover.Root>
   </div>
   ```
2. `popoverContent` snippet returns the verbatim French copy from the UX review for `rncp` | `rs` | `cpf`. External links use `target="_blank" rel="noopener noreferrer"`.

**Key constraints:**
- No "Attention", "Important", "Obligatoire" in popover body — explanatory only.
- All three popovers have the same visual rhythm (title bold / description / link).
- `aria-describedby` connects the input to the popover content for screen readers.

**Testing checklist:**
- [ ] Popover keyboard-accessible (`Tab` → `Enter` opens).
- [ ] Link opens in new tab.
- [ ] Tooltip closes on `Esc`.

---

## Task 18: Preflight extension `[preflight-extend]`

**Problem:** Convention can be generated without `prixConvenu` (legal). Programme can be generated when no module has `objectifs` defined and when `publicVise` is null (Qualiopi). Note: formation-level `objectifs` is NOT used here — `objectifs` is read from `modules[].objectifs`.

**Implementation:**

1. **Edit** `src/lib/preflight/document-preflight.ts`:
   - Extend `PreflightFormation` interface with:
     - `prixConvenu: string | null`
     - `publicVise: string | null`
     - `modules: Array<{ objectifs: string | null }>` (subset of module data needed for aggregation)
   - In `evaluatePreflight`, add inside the `convention` block:
     ```ts
     if (!formation.prixConvenu) {
       items.push({
         id: 'prix_convenu_manquant',
         severity: 'block',
         kind: 'data',
         messageFr: 'Prix convenu non renseigné — mention obligatoire dans la convention de formation (Article L6353-1)',
         fixLabelFr: 'Renseigner le prix convenu sur la fiche',
         tab: 'fiche',
         hrefPath: `${base(formationId)}/fiche?preflightFocus=prixConvenu`,
         focusKey: 'prixConvenu'
       });
     }
     const hasAnyModuleObjectifs = formation.modules.some((m) => m.objectifs && m.objectifs.trim().length > 0);
     if (!hasAnyModuleObjectifs) {
       items.push({
         id: 'objectifs_modules_manquants_convention',
         severity: 'warn',
         kind: 'data',
         messageFr: 'Aucun module ne définit d\u2019objectifs pédagogiques — recommandé dans la convention',
         fixLabelFr: 'Compléter les objectifs des modules dans le Programme',
         tab: 'programme',
         hrefPath: `${base(formationId)}/programme`,
         focusKey: 'programme-modules'
       });
     }
     ```
   - Add a new `programme` block (if not yet present) with similar warnings:
     - same `hasAnyModuleObjectifs` check → `warn` for programme generation (focusKey: `programme-modules`).
     - `publicVise IS NULL` → `warn` for programme (focusKey: `publicVise`, deep-link to Fiche).
2. **Update all callers** that build `PreflightFormation` (loaders that compute preflight) to include `prixConvenu`, `publicVise`, and the modules subset (project `id, objectifs` from `modules` table joined on formationId).

**Key constraints:**
- `prixConvenu` is `block` — Article L6353-1 is non-negotiable.
- Module objectifs / `publicVise` are `warn` — generation still possible, Marie sees friction without being forced to stop.
- Module objectifs preflight deep-links to Programme tab (NOT Fiche), since that's where Marie edits per-module objectifs. The Fiche `ObjectifsRollup` is read-only.
- `focusKey` values must match `data-preflight-target` and `id="preflight-{key}"` in markup (Fiche for `prixConvenu`/`publicVise`, Programme tab list anchor for `programme-modules`).

**Testing checklist:**
- [ ] Convention with null `prixConvenu` → `blockingCount === 1`, generation refused.
- [ ] Programme with all modules having null `objectifs` → `warningCount === 1`, generation allowed.
- [ ] Programme with at least one module having `objectifs` → no warning for that check.
- [ ] Click on `programme-modules` preflight item → Programme tab opens (NOT Fiche).
- [ ] Click on `prixConvenu` / `publicVise` preflight items → Fiche opens at correct field, focused.

---

## Task 19: Migration banner on Finances `[ui-finances-migration-banner]`

**Problem:** Marie returns to Finances and the layout has changed; she needs orientation.

**Implementation:**

1. In `src/routes/(app)/formations/[id]/finances/+page.svelte`, mount a one-time banner above the synthesis card:
   ```svelte
   {#if showMigrationBanner}
     <div class="rounded-lg border bg-primary/5 border-primary/20 px-4 py-3 flex items-start gap-3">
       <Sparkles class="size-4 text-primary mt-0.5 shrink-0" />
       <div class="flex-1 text-sm">
         <p class="font-medium">Le financement a déménagé ici</p>
         <p class="text-muted-foreground mt-1">
           Vous trouvez désormais le suivi multi-payeurs, les statuts par source et les dossiers dans cet onglet. La Fiche reste votre référence pour l'identité de la formation.
         </p>
       </div>
       <Button variant="ghost" size="sm" onclick={dismissBanner}>J'ai compris</Button>
     </div>
   {/if}
   ```
2. State logic:
   ```ts
   const KEY = 'finances-redesign-banner-v1-dismissed';
   let showMigrationBanner = $state(false);
   onMount(() => { showMigrationBanner = !localStorage.getItem(KEY); });
   function dismissBanner() {
     localStorage.setItem(KEY, '1');
     showMigrationBanner = false;
     // best-effort fetch to log dismissal in audit log
   }
   ```
3. Optional: server-side audit log entry on dismissal (POST to a small action). Per-user-per-workspace.

**Key constraints:**
- Never blocks layout when dismissed.
- Don't re-render after dismiss within same session.

**Testing checklist:**
- [ ] First visit → banner shown.
- [ ] Dismiss → banner hidden + localStorage set.
- [ ] Reload → banner stays hidden.

---

## Task 20: Split `formationType` enum `[tech-debt-formation-type-split]`

**Problem:** `'CPF'` value conflates eligibility with format and confuses the quest engine semantics.

**Implementation:**

1. **Quest engine audit first** — `rg "type === 'CPF'"` and `rg "typeFinancement"` in `src/lib/formation-quests`. Determine whether the branch should switch on `cpfEligible: boolean` or on `funding_source_type IN ('CPF', 'CPF_Transition')`. Decision per analyst Q3 — confirm with human if unclear.
2. **Schema**:
   - Add `cpf_eligible BOOLEAN DEFAULT FALSE NOT NULL` to `formations`.
   - Migrate enum: `ALTER TYPE formation_type ADD VALUE 'Sur-mesure'`. (Postgres can't drop enum values cleanly — keep `'CPF'` for one cycle.)
   - Data migration: `UPDATE formations SET cpf_eligible = TRUE, type = 'Inter' WHERE type = 'CPF'` (or 'Intra' depending on a heuristic — analyst Q3 settles this).
3. **Code**:
   - Update `TYPE_OPTIONS` in Fiche to `['Intra', 'Inter', 'Sur-mesure']`.
   - Add a `Switch` field "Éligible CPF" near `type` (or in Référencement card if `isCertifying`).
   - Update quest engine signature accordingly.
4. **Defer dropping the enum value** to a follow-up (Postgres enum value drop = recreate enum).

**Key constraints:**
- Behind feature-flag if quest audit reveals breaking changes.
- Acceptance test: any formation that previously triggered CPF-related quests still triggers them after migration.

**Testing checklist:**
- [ ] Existing CPF formations migrated correctly.
- [ ] Quest engine returns identical quest set on test fixtures pre/post.
- [ ] UI option "CPF" no longer present; "Sur-mesure" present.

---

## Global Testing Checklist

### Happy path
- [ ] Marie creates a formation → opens Fiche → fills Identification → toggles Référencement on → fills RNCP + RS → fills Pédagogique prerequis + publicVise → fills prixConvenu → opens Programme tab → fills module objectifs → opens Fiche again and sees the ObjectifsRollup populated → opens Finances → adds CPF source (Pressenti) → adds Employeur source → updates statuses → invoices linked.
- [ ] Header chip reflects status across tabs.

### Edge cases
- [ ] Formation with zero funding sources: chip says "Sans financement", synthesis tile says "0 €", reste à charge muted.
- [ ] Formation over-funded: percent > 100 doesn't break layout; status remains "Entièrement financé".
- [ ] Formation with `prixPublic` set but `prixConvenu` null: synthesis falls back to prixPublic with "estimation" hint.
- [ ] Marie deletes a funding source linked to an invoice: invoice survives, link nulled, no error.

### Compliance
- [ ] Convention generation refused when `prixConvenu IS NULL` (preflight block).
- [ ] Programme generation warns when no module has `objectifs` (deep-link to Programme tab) or when `publicVise` is null (deep-link to Fiche).
- [ ] OPCO without NDA still warns on devis, blocks on certificat (existing behavior preserved).

### Accessibility
- [ ] All inputs reachable by Tab.
- [ ] Popovers open with `Enter`, close with `Esc`.
- [ ] Synthesis badges meet WCAG AA contrast in light + dark.
- [ ] Funding row delete dialog focus-trapped, returns focus to row on close.
- [ ] Touch targets ≥ 44×44px on action icons (mobile).

### Mobile (≤ 640px)
- [ ] Synthesis tiles stack 2×2.
- [ ] Funding rows render two lines.
- [ ] Dialog scrolls internally, footer always visible.
- [ ] Header chip truncates gracefully (max 1 line, ellipsis on overflow).

### Migration & data integrity
- [ ] DB migrations idempotent (run twice → same state).
- [ ] Data migration covers every legacy enum value.
- [ ] Quest engine due-date recalc unaffected by financing model change (uses deprecated columns until task 20 ships).
- [ ] No production formation loses pédagogique data (existing values preserved).

### Audit trail
- [ ] Every funding source create/update/delete writes a `formation_audit_log` row.
- [ ] Banner dismissal writes one audit entry per user.
- [ ] Invoice update with funding link change records the change.
