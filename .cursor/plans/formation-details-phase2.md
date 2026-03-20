# Formation Details Page — Phase 2

## Goal

Make all 8 tabs of the Formation detail page fully operational. Phase 1 delivered the quest tracker (Actions), dashboard (Apercu), inline editing (Fiche), header redesign, sound system, and creation wizard. Phase 2 delivers session management, learner management, programme editing, formateur cost tracking, financial invoicing, document uploads in quests, audit history, and quest-level comments.

## User Persona

Marie, a secretary at a Learning Center (centre de formation), manages 5–15 formations at a time. Her daily tasks include scheduling sessions, tracking attendance, adjusting programmes, managing learner rosters, and keeping financials up to date. The experience must remain fun, action-oriented, and instantly understandable.

---

## 1. Data Model Changes

### 1a. Extend `emargements` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `signature_image_url` | `text` | `NULL` | Path in Supabase Storage to the PNG signature |
| `signature_token` | `uuid` | `gen_random_uuid()` | Unique unguessable token for the public signature page |
| `signer_ip` | `text` | `NULL` | IP address of the signer (legal compliance) |
| `signer_user_agent` | `text` | `NULL` | Browser user agent of the signer |

**Index:** `signature_token` (unique).

### 1b. Extend `seances` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `modality_override` | `modalites` | `NULL` | Optional per-session modality override (NULL = inherit from formation) |

### 1c. Extend `quest_sub_actions` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `document_required` | `boolean` | `false` | Whether a document must be uploaded before this sub-action can be checked |
| `accepted_file_types` | `text[]` | `NULL` | Accepted MIME types (NULL = any, e.g. `['application/pdf']`) |

### 1d. Extend `formation_formateurs` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `tjm` | `numeric(10,2)` | `NULL` | Daily rate for this formateur on this specific formation |
| `number_of_days` | `numeric(5,1)` | `NULL` | Number of days worked |
| `deplacement_cost` | `numeric(10,2)` | `NULL` | Travel expenses (only for Presentiel/Hybride) |
| `hebergement_cost` | `numeric(10,2)` | `NULL` | Accommodation expenses (only for Presentiel/Hybride) |

### 1e. New table: `quest_documents`

```
quest_documents
├── id: uuid PK
├── sub_action_id: uuid FK → quest_sub_actions (CASCADE)
├── file_name: text NOT NULL
├── file_type: text NOT NULL (MIME type)
├── file_size: integer NOT NULL (bytes)
├── storage_path: text NOT NULL (Supabase Storage path)
├── uploaded_by: uuid FK → users
├── uploaded_at: timestamptz DEFAULT now()
└── created_at: timestamptz DEFAULT now()
```

**Constraint:** `UNIQUE (sub_action_id)` — one document per sub-action.

### 1f. New table: `quest_comments`

```
quest_comments
├── id: uuid PK
├── formation_action_id: uuid FK → formation_actions (CASCADE)
├── user_id: uuid FK → users
├── content: text NOT NULL
├── created_at: timestamptz DEFAULT now()
├── updated_at: timestamptz
```

**Index:** `(formation_action_id, created_at)`.

### 1g. New table: `formation_invoices`

```
formation_invoices
├── id: uuid PK
├── formation_id: uuid FK → formations (CASCADE)
├── invoice_number: text NOT NULL
├── date: date NOT NULL
├── amount: numeric(12,2) NOT NULL
├── recipient: text NOT NULL (client name or OPCO name)
├── recipient_type: text NOT NULL ('client' | 'opco')
├── due_date: date
├── status: text NOT NULL DEFAULT 'Brouillon' ('Brouillon' | 'Envoyée' | 'Payée' | 'En retard')
├── payment_date: date
├── document_url: text (Supabase Storage path for uploaded PDF)
├── notes: text
├── created_by: uuid FK → users
├── created_at: timestamptz DEFAULT now()
├── updated_at: timestamptz
```

**Indexes:** `formation_id`, `status`, `due_date`.

### 1h. New table: `formation_cost_items`

```
formation_cost_items
├── id: uuid PK
├── formation_id: uuid FK → formations (CASCADE)
├── category: text NOT NULL ('formateur' | 'salle' | 'materiel' | 'deplacement')
├── amount: numeric(12,2) NOT NULL DEFAULT 0
├── notes: text
├── updated_at: timestamptz DEFAULT now()
```

**Constraint:** `UNIQUE (formation_id, category)` — one row per category per formation.

### 1i. Files to change

- [`src/lib/db/schema/seances.ts`](src/lib/db/schema/seances.ts) — extend `emargements`, extend `seances`
- [`src/lib/db/schema/formations.ts`](src/lib/db/schema/formations.ts) — extend `questSubActions`, extend `formationFormateurs`, add `questDocuments`, `questComments`, `formationInvoices`, `formationCostItems`
- [`src/lib/db/schema/index.ts`](src/lib/db/schema/index.ts) — re-export new tables if in new files
- New migration file in `supabase/migrations/`
- Update Drizzle relations in the relations file for new FK relationships

---

## 2. Document Infrastructure

### 2a. Supabase Storage

Create two buckets:
- `quest-documents` — for files uploaded to quest sub-actions (convention PDFs, signed orders, etc.)
- `formation-invoices` — for uploaded invoice PDFs
- `emargement-signatures` — for signature PNG images

Buckets should be private (authenticated access only), except `emargement-signatures` which needs public read for the standalone signature page.

### 2b. New file: `src/lib/services/document-service.ts`

```typescript
interface UploadResult {
  storagePath: string;
  publicUrl?: string;
}

async function uploadQuestDocument(file: File, subActionId: string): Promise<UploadResult>
async function deleteQuestDocument(storagePath: string): Promise<void>
async function getQuestDocumentUrl(storagePath: string): Promise<string>
async function uploadInvoicePdf(file: File, invoiceId: string): Promise<UploadResult>
async function uploadSignatureImage(dataUrl: string, emargementId: string): Promise<UploadResult>
```

### 2c. New component: `src/lib/components/custom/file-upload.svelte`

Reusable file upload component:
- Drag-and-drop zone + file picker button
- Accepted file types prop (from quest template config)
- File size limit (10MB default)
- Upload progress indicator
- Preview for images/PDFs (thumbnail or icon)
- Delete button for existing uploads
- Props: `accept`, `maxSize`, `value` (current file), `onUpload`, `onDelete`, `disabled`

---

## 3. Seances Tab

### 3a. Dual View: Calendar + List

**Layout:** Toggle button group (Calendar | List) at top-right, remembered via localStorage key `formation-seances-view`. Default: list on first visit.

**Calendar view:** Custom lightweight month grid component.
- Header: `< Janvier 2026 >` with prev/next month navigation
- Auto-navigates to the month of the next/first session on mount
- Day cells show session count indicator (colored dot per session)
- Click a date → opens the Create Session dialog with that date pre-filled
- Click a session indicator → opens the Edit Session dialog
- Formation date range (dateDebut–dateFin) highlighted with subtle background
- Mobile: force list view (calendar is desktop-only via `hidden md:block`)

**List view:** Enhanced version of the current stub. Group sessions by date. Show all session details inline (time, module, formateur, location, emargement progress bar). Click a session → Edit dialog.

### 3b. Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SessionCalendar` | `src/lib/components/formations/session-calendar.svelte` | Month grid calendar |
| `SessionList` | `src/lib/components/formations/session-list.svelte` | Enhanced list view |
| `SessionDialog` | `src/lib/components/formations/session-dialog.svelte` | Create/Edit session dialog |
| `EmargementManager` | `src/lib/components/formations/emargement-manager.svelte` | Attendance management within session dialog/detail |
| `SignaturePad` | `src/lib/components/custom/signature-pad.svelte` | Canvas-based signature component |

### 3c. Session Dialog Fields

| Field | Type | Required | Conditional |
|-------|------|----------|-------------|
| Date | date picker | Yes | — |
| Start time | time picker | Yes | — |
| End time | time picker | Yes | — |
| Module | combobox (from formation modules) | Yes | — |
| Formateur | combobox (from formation formateurs) | No | — |
| Modality | select (Presentiel/Distanciel) | No | Default: formation modality |
| Location | text | No | Only when modality is Presentiel or Hybride |
| Room/Salle | text | No | Only when modality is Presentiel or Hybride |

After creation: "Assign Participants" step. All formation learners pre-selected, secretary unchecks those not attending. Creates emargement records with auto-generated signature tokens.

### 3d. Session Deletion

Hard delete with warning dialog: "Cette seance a X signatures. Supprimer quand meme ?" if any signatures exist.

### 3e. Emargement & Signature Pad

**Emargement link:** Each emargement record has a unique `signature_token`. The standalone signature page is at `/emargement/[token]` (public route, no login).

**Standalone signature page** (`src/routes/emargement/[token]/+page.svelte`):
- Shows: formation name, session date and time, learner name
- Canvas-based signature pad (touch + mouse support)
- "Signer" button → saves PNG to Supabase Storage, records IP + user agent + timestamp
- Success state: "Merci, votre emargement a ete enregistre"
- If already signed: show "Vous avez deja signe" with the stored signature image
- No login required, no complex security (simple UUID token for MVP)

**Server route** (`src/routes/emargement/[token]/+page.server.ts`):
- `load`: look up emargement by token, join seance + formation + contact data, return info for display
- `default` action: validate signature data, upload PNG to Storage, update emargement record (signedAt, signatureImageUrl, signerIp, signerUserAgent)

### 3f. Server Actions (`src/routes/(app)/formations/[id]/seances/+page.server.ts`)

- `createSession` — insert seance + create emargement records for selected learners
- `updateSession` — update seance fields
- `deleteSession` — hard delete with cascade on emargements
- `updateEmargementParticipants` — add/remove learners from a session's emargement list

### 3g. Mobile

On mobile (< 768px), force list view. Calendar toggle button hidden. Session dialog is full-screen sheet.

---

## 4. Apprenants Tab

### 4a. Layout

Current stub shows a read-only list. Replace with:
- Header: "Apprenants" + count badge + "Ajouter" button
- "Ajouter" opens a combobox search (search existing contacts) with "Creer un nouveau contact" option at bottom
- If "Creer un nouveau contact": opens full contact form in dialog (same fields as `/contacts/creer`)
- Per-learner row: name (link to /contacts/[id]), email, company, attendance rate (X/Y sessions), document status badges, test result badges

### 4b. Attendance Rate

Computed from emargement data: count of sessions where this learner has `signedAt` not null / total sessions where this learner has an emargement record.

### 4c. Document Status

Per learner, show badges for:
- Convocation: sent/not sent (derived from quest `convocations` sub-action status)
- Certificat de realisation: generated/not generated (derived from quest `certificat_realisation`)
- Attestation: generated/not generated (derived from quest `attestation`)

These are read-only indicators. Actual document management is via the quest system.

### 4d. Test Results

Per learner, show:
- Positionnement test: completed/pending (derived from quest `test_positionnement`)
- Final evaluation: score or completed/pending (derived from quest `evaluation_acquis_fin`)

### 4e. Adding Learner Mid-Formation

When a learner is added and sessions already exist, show dialog: "Ajouter [Name] aux seances a venir ?" with checkboxes for each future session (all pre-checked). Creates emargement records for selected sessions.

### 4f. Removing Learner

Confirmation dialog: "Retirer [Name] de cette formation ? Ses emargements seront conserves pour les seances passees." Soft removal: delete `formation_apprenants` record. Do NOT delete past emargement records (legal requirement for Qualiopi).

### 4g. Server Actions (`src/routes/(app)/formations/[id]/apprenants/+page.server.ts`)

- `addLearner` — insert formation_apprenants + optionally create emargement records for future sessions
- `removeLearner` — delete formation_apprenants (keep past emargements)
- `createContact` — insert new contact + add to formation in one transaction

---

## 5. Programme Tab

### 5a. Layout

Replace current read-only view with:
- Programme source info card (if linked to bibliotheque) — same as current but with sync banner
- Module list: editable, reorderable, with add/remove

### 5b. Module CRUD

Each module is a card with:
- Drag handle (desktop) + up/down buttons (mobile/accessibility)
- Editable title (inline, click-to-edit)
- Editable duration (inline, number input)
- Editable objectifs (inline, text area — optional)
- Delete button (with cascade warning if sessions are linked)
- Order index display

"Ajouter un module" button at the bottom of the list.

### 5c. Drag-and-Drop

Use a lightweight Svelte-compatible DnD library or custom implementation with HTML5 drag API. On reorder, update `order_index` for all affected modules via server action.

### 5d. Sync/Unsync Banner

When the formation has a `programme_source_id` AND the secretary has made local changes to modules (detected by comparing module data with the source programme's modules):

```
┌──────────────────────────────────────────────────────────────┐
│ ⚠ Ce programme a été modifié localement.                     │
│ [Mettre à jour le programme source] [Créer un nouveau] [Détacher] │
└──────────────────────────────────────────────────────────────┘
```

- **Mettre a jour le programme source**: update the bibliotheque programme's modules to match this formation's modules
- **Creer un nouveau programme**: create a new programme in the bibliotheque from this formation's current modules, update `programme_source_id`
- **Detacher**: set `programme_source_id = NULL`, modules remain as-is

Detection heuristic: compare module count, titles, durations, and order with the source programme. If any differ, show the banner.

### 5e. Module Deletion with Linked Sessions

When deleting a module that has sessions linked to it:

Dialog: "Ce module a X seances liees. Que souhaitez-vous faire ?"
- "Supprimer les seances aussi" — cascade delete sessions + their emargements
- "Reassigner a un autre module" — show module picker, update sessions' `module_id`
- "Annuler"

### 5f. "Save as Programme" Button

When modules exist and no programme source is linked, show: "Sauvegarder comme programme" button. Creates a new programme in the bibliotheque from the current modules and links it.

### 5g. Server Actions (`src/routes/(app)/formations/[id]/programme/+page.server.ts`)

- `addModule` — insert module with next `order_index`
- `updateModule` — update title, duration, objectifs
- `deleteModule` — delete with optional cascade/reassign
- `reorderModules` — update `order_index` for multiple modules
- `syncToSource` — update source programme's modules
- `createNewProgramme` — create biblio programme + link
- `detachProgramme` — set `programme_source_id = NULL`

---

## 6. Formateurs Tab Enhanced

### 6a. Add Formateur In-Tab

Replace the current "Ajouter" link (which redirects to `/contacts/formateurs`) with an in-tab combobox search:
- Search existing formateurs by name/email
- Show formateur card: name, avatar, thematiques, TJM range
- "Ajouter" button per result
- At the bottom of the results: subtle hint — "Bientot : trouvez le formateur ideal dans le Marketplace Mentore" with Mentore logo/icon

### 6b. Per-Formateur Cost Card

Each assigned formateur shows an expanded card:
- Avatar, name, email, contact link
- TJM field (inline editable, numeric)
- Number of days field (inline editable, numeric with 0.5 step)
- Auto-calculated total: TJM x days
- Optional fields (only when formation modality includes Presentiel/Hybride):
  - Deplacement (inline editable, numeric)
  - Hebergement (inline editable, numeric)
- Grand total per formateur
- Document verification badges (see below)
- Sessions assigned: list of sessions this formateur is teaching, with "Assigner a une seance" button

### 6c. Document Verification Badges

Derived from the `documents_formateur` quest's sub-actions and their uploaded documents:
- CV: ✓ (green) if sub-action "Verifier le CV" is completed and document uploaded, ✗ (red) otherwise
- Diplomes: ✓/✗
- NDA/Contrat: ✓/✗
- URSSAF/SIRET: ✓/✗

These are read-only indicators; the actual document management happens in the Actions tab quest workspace.

### 6d. Per-Session Assignment

"Assigner a une seance" opens a dropdown/popover listing all formation sessions (grouped by date). Selecting a session sets `seances.formateur_id` to this formateur. If the formateur is not yet on the formation, auto-add them to `formation_formateurs`.

### 6e. Server Actions (extend existing `+page.server.ts`)

- `addFormateur` — existing, keep as-is
- `removeFormateur` — existing, keep as-is
- `updateFormateurCosts` — update TJM, days, deplacement, hebergement on `formation_formateurs`
- `assignFormateurToSession` — update `seances.formateur_id`
- `removeFormateurFromSession` — set `seances.formateur_id = NULL`

---

## 7. Finances Tab Full

### 7a. Layout

3 sections in a single scrollable page:

```
┌──────────────────────────────────────┐
│  REVENUS                             │
│  Montant accordé: 12,000 €  [edit]   │
│  Type financement: OPCO              │
│  Statut: ✓ Accordé                   │
├──────────────────────────────────────┤
│  COUTS                               │
│  Formateur(s)    1,500 €  (auto)     │
│  Salle             800 €  [edit]     │
│  Matériel          200 €  [edit]     │
│  Déplacement       150 €  (auto)     │
│  ─────────────────────────           │
│  Total           2,650 €            │
│  Marge           9,350 € (78%)      │
├──────────────────────────────────────┤
│  FACTURES                            │
│  [+ Ajouter une facture]             │
│  FA-2026-042 | 12,000€ | Envoyée    │
│  FA-2026-043 |  3,200€ | Brouillon  │
└──────────────────────────────────────┘
```

### 7b. Revenue Section

Inline-editable fields pulling from the formation record:
- Montant accorde (already on `formations` table)
- Type financement (already on `formations` table)
- Financement accorde toggle (already on `formations` table)

Uses the same `updateField` server action pattern as the Fiche tab.

### 7c. Costs Section

**Formateur cost** is auto-calculated: sum of (TJM x days) for all formateurs in `formation_formateurs`. Read-only, with "Voir les formateurs" link.

**Deplacement cost** is auto-calculated: sum of `deplacement_cost + hebergement_cost` for all formateurs. Read-only.

**Salle and Materiel** are editable: stored in `formation_cost_items` table (one row per category per formation). Inline-editable numeric fields.

**Total** = sum of all cost categories. **Margin** = montant_accorde - total costs. Show margin percentage. Color: green if positive, red if negative.

### 7d. Invoices Section

List of `formation_invoices` records. Each row shows: number, date, amount, recipient, status badge, actions (edit, delete).

"Ajouter une facture" button opens a dialog:
- Invoice number (text, auto-suggest next number based on existing invoices)
- Date (date picker, default today)
- Amount (numeric)
- Recipient (text, auto-fill from formation client name)
- Recipient type (select: Client / OPCO)
- Due date (date picker)
- Status (select: Brouillon / Envoyee / Payee / En retard)
- PDF upload (file upload component, accepts PDF only)
- Notes (textarea)

Edit: same dialog, pre-filled. Delete: confirmation dialog.

**Notification dot on Finances tab:** when any invoice has status "En retard" (overdue based on due_date < today and status not "Payee").

### 7e. Server Actions (`src/routes/(app)/formations/[id]/finances/+page.server.ts`)

- `updateCostItem` — upsert `formation_cost_items` for a category
- `createInvoice` — insert `formation_invoices` + optional PDF upload
- `updateInvoice` — update invoice fields + optional PDF re-upload
- `deleteInvoice` — hard delete + delete PDF from storage

---

## 8. Quest Documents & Comments

### 8a. Quest Document Uploads

In [`src/routes/(app)/formations/[id]/actions/+page.svelte`](src/routes/(app)/formations/[id]/actions/+page.svelte), the quest workspace right panel currently shows a placeholder "Documents bientot disponibles". Replace with functional file upload per sub-action.

For each sub-action in the workspace:
- If the quest template defines `documentRequired: true` for that sub-action: show upload zone. The sub-action checkbox is disabled until a document is uploaded.
- If `documentRequired: false` but `acceptedFileTypes` is defined: show optional upload zone below the sub-action text.
- If neither: no upload zone (current behavior).

Upload zone: uses the `FileUpload` component. Shows uploaded file name + download link + delete button when a document exists.

### 8b. Quest Template Updates

Update [`src/lib/formation-quests.ts`](src/lib/formation-quests.ts) sub-action definitions to include `documentRequired` and `acceptedFileTypes` for relevant sub-actions. Key quests:

| Quest | Sub-action | documentRequired | acceptedFileTypes |
|-------|-----------|-----------------|-------------------|
| `convention` | "Collecter la signature" | `true` | `['application/pdf']` |
| `demande_financement` | "Soumettre le dossier" | `true` | `['application/pdf']` |
| `ordre_mission` | "Collecter la copie signee" | `true` | `['application/pdf']` |
| `documents_formateur` | "Verifier le CV" | `true` | `['application/pdf', 'image/*']` |
| `documents_formateur` | "Verifier les diplomes" | `true` | `['application/pdf', 'image/*']` |
| `documents_formateur` | "Confirmer NDA/URSSAF/SIRET" | `true` | `['application/pdf', 'image/*']` |
| `certificat_realisation` | "Generer les certificats" | `false` | `['application/pdf']` |
| `attestation` | "Generer les attestations" | `false` | `['application/pdf']` |
| `facturation` | "Generer la facture" | `false` | `['application/pdf']` |

### 8c. Quest Comments

Below the sub-actions list in the quest workspace, add a "Notes" section:
- Simple text input + "Ajouter" button
- List of comments: author avatar + name, timestamp, content
- No editing/deleting comments (append-only log)
- Stored in `quest_comments` table

### 8d. Server Actions (extend `actions/+page.server.ts`)

- `uploadDocument` — upload file to Supabase Storage, insert `quest_documents` record, optionally auto-check the sub-action
- `deleteDocument` — delete from storage + delete record, uncheck the sub-action if `documentRequired`
- `addComment` — insert `quest_comments` record

---

## 9. History Panel

### 9a. UI

The History button in [`src/lib/components/site-header.svelte`](src/lib/components/site-header.svelte) currently shows a placeholder toast. Replace with a functional shadcn Sheet (from right).

Sheet content:
- Header: "Historique" + close button
- Scrollable timeline (newest first)
- Each entry: icon (per event type), actor avatar + name, timestamp (relative: "il y a 2h"), description

### 9b. Event Types and Icons

| Event type | Icon | Description template |
|-----------|------|---------------------|
| `field_update` | Pencil | "[Actor] a modifie [field] de [old] a [new]" |
| `quest_completed` | CheckCircle | "[Actor] a termine la quete [quest title]" |
| `sub_action_toggled` | Check | "[Actor] a [coche/decoche] [sub-action title]" |
| `phase_completed` | Trophy | "Phase [phase name] terminee !" |
| `status_changed` | ArrowRightCircle | "[Actor] a change le statut a [new status]" |
| `session_created` | Calendar | "[Actor] a cree une seance le [date]" |
| `session_updated` | Calendar | "[Actor] a modifie la seance du [date]" |
| `session_deleted` | Trash | "[Actor] a supprime la seance du [date]" |
| `learner_added` | UserPlus | "[Actor] a ajoute [learner name]" |
| `learner_removed` | UserMinus | "[Actor] a retire [learner name]" |
| `formateur_added` | UserPlus | "[Actor] a assigne [formateur name]" |
| `formateur_removed` | UserMinus | "[Actor] a retire [formateur name]" |
| `document_uploaded` | FileUp | "[Actor] a ajoute un document a [quest/sub-action]" |
| `invoice_created` | Receipt | "[Actor] a cree la facture [number]" |
| `invoice_updated` | Receipt | "[Actor] a mis a jour la facture [number]" |
| `comment_added` | MessageSquare | "[Actor] a ajoute une note sur [quest title]" |
| `cost_updated` | Wallet | "[Actor] a modifie les couts ([category])" |
| `module_added` | BookOpen | "[Actor] a ajoute le module [title]" |
| `module_updated` | BookOpen | "[Actor] a modifie le module [title]" |
| `module_deleted` | BookOpen | "[Actor] a supprime le module [title]" |
| `emargement_signed` | FileSignature | "[learner] a signe l'emargement pour la seance du [date]" |

### 9c. Centralized Audit Helper

New file: `src/lib/services/audit-log.ts`

```typescript
interface AuditEntry {
  formationId: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

async function logAuditEvent(entry: AuditEntry): Promise<void>
async function getFormationHistory(formationId: string, limit?: number): Promise<AuditLogEntry[]>
```

Called from every server action that mutates formation data. Non-blocking (fire-and-forget or after response).

### 9d. Layout Server Data

Extend [`+layout.server.ts`](src/routes/(app)/formations/[id]/+layout.server.ts) to load audit log entries (last 50) and pass them to the layout for the History Sheet. Include the actor's user info (name, avatar) via join.

---

## 10. Apercu Dashboard Updates

### 10a. Mini-Actions

Add quick action buttons to dashboard cards:
- Participants card: "+ Ajouter un apprenant" button (links to Apprenants tab)
- Sessions card: "+ Ajouter une seance" button (links to Seances tab)
- Financial card: "Voir les finances" link

### 10b. Updated Summary Data

Cards now reflect real data from all tabs:
- **Participants card**: attendance rate (average % across all sessions)
- **Sessions card**: count of upcoming sessions, next session date
- **Financial card**: real costs breakdown (formateur + salle + materiel + deplacement), margin
- **Recent activity**: populated from `formation_audit_log` (last 5 entries)

### 10c. New Notification Dots

Extend the notification dot system to new tabs:
- **Formateurs tab**: dot when any formateur has missing documents (from `documents_formateur` quest)
- **Apprenants tab**: dot when any learner has unsigned emargements for past sessions
- **Finances tab**: dot when any invoice is overdue

Computation in `+layout.server.ts`, passed as boolean props to the layout.

---

## 11. Component Architecture Summary

### New Components (14)

| Component | Path |
|-----------|------|
| `SessionCalendar` | `src/lib/components/formations/session-calendar.svelte` |
| `SessionList` | `src/lib/components/formations/session-list.svelte` |
| `SessionDialog` | `src/lib/components/formations/session-dialog.svelte` |
| `EmargementManager` | `src/lib/components/formations/emargement-manager.svelte` |
| `SignaturePad` | `src/lib/components/custom/signature-pad.svelte` |
| `FileUpload` | `src/lib/components/custom/file-upload.svelte` |
| `ModuleCard` | `src/lib/components/formations/module-card.svelte` |
| `ModuleList` | `src/lib/components/formations/module-list.svelte` |
| `FormateurCostCard` | `src/lib/components/formations/formateur-cost-card.svelte` |
| `FormateurSearch` | `src/lib/components/formations/formateur-search.svelte` |
| `InvoiceDialog` | `src/lib/components/formations/invoice-dialog.svelte` |
| `InvoiceList` | `src/lib/components/formations/invoice-list.svelte` |
| `HistorySheet` | `src/lib/components/formations/history-sheet.svelte` |
| `HistoryEntry` | `src/lib/components/formations/history-entry.svelte` |

### Modified Components/Pages (12)

| File | Changes |
|------|---------|
| `src/routes/(app)/formations/[id]/seances/+page.svelte` | Replace stub with dual view |
| `src/routes/(app)/formations/[id]/seances/+page.server.ts` | New — session CRUD + emargement actions |
| `src/routes/(app)/formations/[id]/apprenants/+page.svelte` | Replace stub with full CRUD |
| `src/routes/(app)/formations/[id]/apprenants/+page.server.ts` | New — learner management actions |
| `src/routes/(app)/formations/[id]/programme/+page.svelte` | Replace read-only with editable |
| `src/routes/(app)/formations/[id]/programme/+page.server.ts` | Replace empty load with module CRUD actions |
| `src/routes/(app)/formations/[id]/formateurs/+page.svelte` | Add cost cards, doc badges, session assignment |
| `src/routes/(app)/formations/[id]/formateurs/+page.server.ts` | Add cost + session assignment actions |
| `src/routes/(app)/formations/[id]/finances/+page.svelte` | Replace stub with 3-section layout |
| `src/routes/(app)/formations/[id]/finances/+page.server.ts` | New — cost items + invoice CRUD |
| `src/routes/(app)/formations/[id]/actions/+page.svelte` | Add document uploads + comments in workspace |
| `src/routes/(app)/formations/[id]/actions/+page.server.ts` | Add document + comment server actions |
| `src/routes/(app)/formations/[id]/+page.svelte` | Add mini-actions + updated summaries |
| `src/routes/(app)/formations/[id]/+layout.svelte` | Add new notification dot props |
| `src/routes/(app)/formations/[id]/+layout.server.ts` | Load audit log, new notification dot computations, cost data |
| `src/lib/components/site-header.svelte` | Wire History button to Sheet |
| `src/lib/formation-quests.ts` | Add documentRequired + acceptedFileTypes to sub-actions |

### New Routes (1)

| Route | Purpose |
|-------|---------|
| `src/routes/emargement/[token]/` | Public standalone signature page |

---

## 12. Implementation Order

1. **Data model** — migration + Drizzle schema + relations + Supabase Storage buckets
2. **Document infrastructure** — upload service + FileUpload component + SignaturePad component
3. **Seances tab** — calendar + list views, session CRUD dialog, emargement management
4. **Signature pad page** — standalone public route for learner signatures
5. **Apprenants tab** — full CRUD, search/create contacts, mid-formation add dialog
6. **Programme tab** — module CRUD, drag-and-drop, sync/unsync banner
7. **Formateurs tab** — cost tracking, doc badges, session assignment, marketplace teaser
8. **Finances tab** — revenue/costs/invoices, invoice CRUD with PDF upload
9. **Quest documents & comments** — upload zones in workspace, quest template updates, comments section
10. **History panel** — audit log helper, Sheet UI, wire to all server actions
11. **Apercu updates** — mini-actions, updated summaries, new notification dots

---

## 13. Error Handling & Loading States

Same patterns as Phase 1:
- **Loading states**: disable buttons + show spinner while server actions are in-flight
- **Error handling**: `toast.error` with French messages on failure
- **Transactions**: wrap multi-step mutations in DB transactions
- **Optimistic updates**: for simple toggles (emargement checkbox), apply optimistically with rollback
- **Validation**: Zod schemas for all form inputs, inline error display

---

## 14. Accessibility

- Drag-and-drop module reorder has keyboard alternative (up/down buttons)
- Calendar is keyboard-navigable (arrow keys to move between days, Enter to select)
- Signature pad supports mouse and touch
- All dialogs trap focus, Escape to close
- File upload has keyboard-accessible file picker fallback
- Tab notification dots have `aria-label` descriptions
