---
name: Formation Details Phase 2
overview: 'Make all 8 Formation detail tabs fully operational: Seances (calendar/list + CRUD + signature pad), Apprenants (full CRUD + attendance), Programme (module CRUD + sync/unsync), Formateurs (cost tracking + doc badges + session assignment), Finances (cost breakdown + invoicing), quest document uploads, quest comments, audit history panel, and Apercu mini-actions.'
todos:
  - id: data-model
    content: 'Migration + Drizzle schema: extend emargements (signature fields), seances (modality_override), quest_sub_actions (document_required, accepted_file_types), formation_formateurs (TJM, days, expenses). New tables: quest_documents, quest_comments, formation_invoices, formation_cost_items. Create Supabase Storage buckets (quest-documents, formation-invoices, emargement-signatures).'
    status: pending
  - id: document-infra
    content: Create src/lib/services/document-service.ts (upload/download/delete for quest docs, invoices, signatures). Create src/lib/components/custom/file-upload.svelte (drag-and-drop + picker, type validation, progress, preview). Create src/lib/components/custom/signature-pad.svelte (canvas-based, touch + mouse, PNG export).
    status: pending
  - id: seances-tab
    content: Replace Seances stub with dual view (Calendar + List toggle, localStorage memory). SessionCalendar (custom month grid, click date to create, auto-navigate to next session). SessionList (grouped by date, emargement bars). SessionDialog (date, times, module required, formateur, modality override, location/room for Presentiel). Create/Edit/Delete server actions. Emargement participant assignment step after session creation.
    status: pending
  - id: signature-pad-page
    content: 'New public route /emargement/[token]: standalone page (no login). Load emargement by token, show formation name + session date + learner name. SignaturePad canvas, store PNG in Supabase Storage + record IP + user agent + timestamp. Already-signed state. Server action for signature submission.'
    status: pending
  - id: apprenants-tab
    content: "Replace Apprenants stub with full CRUD. Combobox search existing contacts + 'Create new' option (full contact form dialog). Per-learner row: name, email, company, attendance rate, document status badges, test result badges. Mid-formation add dialog (select future sessions). Soft remove (keep past emargements). Server actions: addLearner, removeLearner, createContact."
    status: pending
  - id: programme-tab
    content: 'Replace Programme read-only with full module CRUD. Editable module cards (title, duration, objectifs). Drag-and-drop reorder (desktop) + up/down buttons (mobile). Add/remove modules. Sync banner when linked programme has local changes (Update source / Create new / Detach). Module deletion cascade dialog (delete or reassign linked sessions). Save as programme button. Server actions: addModule, updateModule, deleteModule, reorderModules, syncToSource, createNewProgramme, detachProgramme.'
    status: pending
  - id: formateurs-tab
    content: 'Enhance Formateurs tab. In-tab combobox search to add formateurs (with Mentore Marketplace teaser in results). Per-formateur cost card: TJM, days, total, optional deplacement/hebergement (Presentiel/Hybride only). Document verification badges per formateur (CV, diplomes, NDA, URSSAF from documents_formateur quest). Per-session assignment: dropdown to assign formateur to specific sessions, auto-add to formation. Server actions: updateFormateurCosts, assignFormateurToSession, removeFormateurFromSession.'
    status: pending
  - id: finances-tab
    content: 'Replace Finances stub with 3-section layout. Revenue: inline-editable montant/financement fields. Costs: fixed categories (formateur auto-calc, salle/materiel editable, deplacement auto-calc from formateurs), subtotals, margin. Invoices: CRUD list with dialog (number, date, amount, recipient, status, due date, PDF upload, notes). Notification dot for overdue invoices. Server actions: updateCostItem, createInvoice, updateInvoice, deleteInvoice.'
    status: pending
  - id: quest-docs-comments
    content: 'Enable document uploads in quest workspace per sub-action. Update formation-quests.ts sub-action definitions with documentRequired + acceptedFileTypes for key quests (convention, ordre_mission, documents_formateur, etc.). Upload zone in workspace: FileUpload component, required docs block sub-action completion. Quest comments section below sub-actions: text input + append-only timestamped list with author. Server actions: uploadDocument, deleteDocument, addComment.'
    status: pending
  - id: history-panel
    content: 'Create src/lib/services/audit-log.ts with logAuditEvent() helper. Wire into ALL server actions across ALL tabs. Create history-sheet.svelte (shadcn Sheet from right). Timeline: icon per event type, actor avatar + name, relative timestamp, description. Wire History button in site-header.svelte. Extend +layout.server.ts to load audit log entries.'
    status: pending
  - id: apercu-notifications
    content: "Add mini-action buttons to Apercu dashboard cards ('+ Ajouter une seance', '+ Ajouter un apprenant'). Update summary cards with real attendance rates, cost totals, session counts. Add 3 new notification dots: Formateurs (missing docs), Apprenants (unsigned emargements), Finances (overdue invoices). Compute in +layout.server.ts, pass to +layout.svelte."
    status: pending
isProject: false
---

# Formation Details Page -- Phase 2

Full specification: [.cursor/plans/formation-details-phase2.md](.cursor/plans/formation-details-phase2.md)
Phase 1 spec (for reference): [.cursor/plans/formation-details-phase1.md](.cursor/plans/formation-details-phase1.md)

## Phasing

- **Phase 2a** (critical daily ops): Data model, Documents infra, Seances, Signature pad, Apprenants, Programme
- **Phase 2b** (financial + polish): Formateurs, Finances, Quest docs/comments, History, Apercu updates

## Architecture Overview

```mermaid
flowchart TD
    subgraph phase2a [Phase 2a - Critical Daily Ops]
        DataModel["Data Model Migration"]
        DocInfra["Document Infrastructure"]
        Seances["Seances: Calendar + List + CRUD"]
        SignPad["Signature Pad: Public Page"]
        Apprenants["Apprenants: Full CRUD"]
        Programme["Programme: Module CRUD + Sync"]
    end

    subgraph phase2b [Phase 2b - Financial and Polish]
        Formateurs["Formateurs: Costs + Docs + Sessions"]
        Finances["Finances: Costs + Invoicing"]
        QuestDocs["Quest Docs + Comments"]
        History["History Sheet Panel"]
        Apercu["Apercu: Mini-actions + Dots"]
    end

    DataModel --> DocInfra
    DocInfra --> Seances
    DocInfra --> SignPad
    Seances --> Apprenants
    Apprenants --> Programme
    Programme --> Formateurs
    Formateurs --> Finances
    Finances --> QuestDocs
    QuestDocs --> History
    History --> Apercu
```

## Data Model

Extend existing tables + 4 new tables. See spec sections 1a-1i.

- **Extend** `emargements`: `signature_image_url`, `signature_token`, `signer_ip`, `signer_user_agent`
- **Extend** `seances`: `modality_override`
- **Extend** `quest_sub_actions`: `document_required`, `accepted_file_types`
- **Extend** `formation_formateurs`: `tjm`, `number_of_days`, `deplacement_cost`, `hebergement_cost`
- **New** `quest_documents`: one document per sub-action, stored in Supabase Storage
- **New** `quest_comments`: team notes per quest (append-only)
- **New** `formation_invoices`: invoice tracking with PDF upload
- **New** `formation_cost_items`: fixed categories (formateur, salle, materiel, deplacement)

Key files:

- [src/lib/db/schema/seances.ts](src/lib/db/schema/seances.ts) -- extend emargements + seances
- [src/lib/db/schema/formations.ts](src/lib/db/schema/formations.ts) -- extend quest_sub_actions + formation_formateurs, add new tables
- New migration in `supabase/migrations/`

## Document Infrastructure

- 3 Supabase Storage buckets: `quest-documents`, `formation-invoices`, `emargement-signatures`
- New service: `src/lib/services/document-service.ts` (upload, download, delete helpers)
- New component: `src/lib/components/custom/file-upload.svelte` (drag-and-drop + picker, type validation, progress)
- New component: `src/lib/components/custom/signature-pad.svelte` (canvas-based, touch + mouse)

## Seances Tab

Dual view (Calendar + List) with localStorage toggle. Default list, remember preference.

- **Calendar**: custom month grid, click date to create, auto-navigate to next session month. Desktop only.
- **List**: enhanced stub, grouped by date, emargement progress bars
- **Create/Edit dialog**: date, times, module (required), formateur, modality override, location/room (Presentiel only)
- **Emargement**: after session create, "Assign participants" step (all pre-selected). Auto-generate signature tokens.
- **Delete**: hard delete with warning if signatures exist

Key files:

- [src/routes/(app)/formations/[id]/seances/+page.svelte](<src/routes/(app)/formations/[id]/seances/+page.svelte>) -- replace stub
- New `+page.server.ts` -- `createSession`, `updateSession`, `deleteSession`, `updateEmargementParticipants`

## Signature Pad Page

Public standalone route at `/emargement/[token]` (no login required).

- Shows: formation name, session date/time, learner name
- Canvas signature pad, "Signer" button
- Stores: PNG in Supabase Storage, IP + user agent in DB
- Already-signed state shows stored signature

Key files:

- New `src/routes/emargement/[token]/+page.svelte`
- New `src/routes/emargement/[token]/+page.server.ts`

## Apprenants Tab

- Add via combobox search (existing contacts) or create new (full contact form in dialog)
- Per learner: name, email, company, attendance rate, document status badges, test result badges
- Mid-formation add: dialog asking which future sessions to include
- Remove: soft (keep past emargements for Qualiopi compliance)

Key files:

- [src/routes/(app)/formations/[id]/apprenants/+page.svelte](<src/routes/(app)/formations/[id]/apprenants/+page.svelte>) -- replace stub
- New `+page.server.ts` -- `addLearner`, `removeLearner`, `createContact`

## Programme Tab

- Full module CRUD: add, edit inline (title, duration, objectifs), remove, reorder
- Reorder: drag-and-drop (desktop) + up/down buttons (mobile)
- Sync banner when linked programme has local changes: Update source / Create new / Detach
- Module deletion cascade: ask about linked sessions (delete or reassign)
- "Save as programme" button when unlinked

Key files:

- [src/routes/(app)/formations/[id]/programme/+page.svelte](<src/routes/(app)/formations/[id]/programme/+page.svelte>) -- replace read-only
- [src/routes/(app)/formations/[id]/programme/+page.server.ts](<src/routes/(app)/formations/[id]/programme/+page.server.ts>) -- replace empty load

## Formateurs Tab Enhanced

- Add: in-tab combobox search with Mentore Marketplace teaser
- Cost card per formateur: TJM, days, total, optional deplacement/hebergement (Presentiel/Hybride only)
- Document verification badges: CV, diplomes, NDA, URSSAF (from documents_formateur quest)
- Per-session assignment: assign formateur to specific sessions, auto-add to formation

Key files:

- [src/routes/(app)/formations/[id]/formateurs/+page.svelte](<src/routes/(app)/formations/[id]/formateurs/+page.svelte>) -- enhance
- [src/routes/(app)/formations/[id]/formateurs/+page.server.ts](<src/routes/(app)/formations/[id]/formateurs/+page.server.ts>) -- add cost + assignment actions

## Finances Tab Full

3 sections: Revenue (inline-editable from formation record), Costs (fixed categories + auto-calculated formateur totals), Invoices (CRUD with PDF upload).

- Invoice tracking: number, date, amount, recipient, status, due date, payment date, PDF upload, notes
- Notification dot: overdue invoices

Key files:

- [src/routes/(app)/formations/[id]/finances/+page.svelte](<src/routes/(app)/formations/[id]/finances/+page.svelte>) -- replace stub
- New `+page.server.ts` -- `updateCostItem`, `createInvoice`, `updateInvoice`, `deleteInvoice`

## Quest Documents and Comments

- Document upload zones per sub-action in quest workspace (Actions tab)
- Per-sub-action config in quest templates: `documentRequired`, `acceptedFileTypes`
- Required docs block sub-action completion until uploaded
- Quest comments section below sub-actions (append-only, with author + timestamp)

Key files:

- [src/routes/(app)/formations/[id]/actions/+page.svelte](<src/routes/(app)/formations/[id]/actions/+page.svelte>) -- add upload zones + comments
- [src/routes/(app)/formations/[id]/actions/+page.server.ts](<src/routes/(app)/formations/[id]/actions/+page.server.ts>) -- add `uploadDocument`, `deleteDocument`, `addComment`
- [src/lib/formation-quests.ts](src/lib/formation-quests.ts) -- add `documentRequired` + `acceptedFileTypes` to sub-action definitions

## History Panel

- Header History button opens shadcn Sheet from right (replace placeholder toast)
- Timeline: icon per event type, actor avatar + name, relative timestamp, description
- Audit log helper: `src/lib/services/audit-log.ts` -- `logAuditEvent()` called from all server actions
- Events logged: field changes, quest completions, session CRUD, learner/formateur changes, financial updates, document uploads, comments

Key files:

- [src/lib/components/site-header.svelte](src/lib/components/site-header.svelte) -- wire History button
- New `src/lib/components/formations/history-sheet.svelte`
- New `src/lib/services/audit-log.ts`
- [src/routes/(app)/formations/[id]/+layout.server.ts](<src/routes/(app)/formations/[id]/+layout.server.ts>) -- load audit log

## Apercu Updates

- Mini-action buttons on dashboard cards: "+ Ajouter une seance", "+ Ajouter un apprenant"
- Updated summary data: real attendance rates, cost totals, session counts
- 3 new notification dots: Formateurs (missing docs), Apprenants (unsigned emargements), Finances (overdue invoices)

Key files:

- [src/routes/(app)/formations/[id]/+page.svelte](<src/routes/(app)/formations/[id]/+page.svelte>) -- add mini-actions + update cards
- [src/routes/(app)/formations/[id]/+layout.svelte](<src/routes/(app)/formations/[id]/+layout.svelte>) -- add new dot props
- [src/routes/(app)/formations/[id]/+layout.server.ts](<src/routes/(app)/formations/[id]/+layout.server.ts>) -- compute new notification dots

## New Files (18)

- `src/lib/services/document-service.ts`
- `src/lib/services/audit-log.ts`
- `src/lib/components/custom/file-upload.svelte`
- `src/lib/components/custom/signature-pad.svelte`
- `src/lib/components/formations/session-calendar.svelte`
- `src/lib/components/formations/session-list.svelte`
- `src/lib/components/formations/session-dialog.svelte`
- `src/lib/components/formations/emargement-manager.svelte`
- `src/lib/components/formations/module-card.svelte`
- `src/lib/components/formations/module-list.svelte`
- `src/lib/components/formations/formateur-cost-card.svelte`
- `src/lib/components/formations/formateur-search.svelte`
- `src/lib/components/formations/invoice-dialog.svelte`
- `src/lib/components/formations/invoice-list.svelte`
- `src/lib/components/formations/history-sheet.svelte`
- `src/lib/components/formations/history-entry.svelte`
- `src/routes/emargement/[token]/+page.svelte`
- `src/routes/emargement/[token]/+page.server.ts`
- 1 migration in `supabase/migrations/`

## Modified Files (17)

- Schema: `seances.ts`, `formations.ts`, `index.ts`, relations file
- Quest templates: `formation-quests.ts`
- Header: `site-header.svelte`
- Layout: `+layout.svelte`, `+layout.server.ts`
- Pages: `seances/+page.svelte`, `apprenants/+page.svelte`, `programme/+page.svelte`, `formateurs/+page.svelte`, `finances/+page.svelte`, `actions/+page.svelte`
- Server: `seances/+page.server.ts` (new), `apprenants/+page.server.ts` (new), `programme/+page.server.ts`, `formateurs/+page.server.ts`, `finances/+page.server.ts` (new), `actions/+page.server.ts`
- Overview: `+page.svelte`
