# Formation Details Page — Phase 1

## Goal

Transform the Formation detail page (`/formations/[id]`) from a static, informational display into an action-oriented, gamified quest tracker that guides secretaries through every Qualiopi-compliant administrative step. The experience should feel rewarding, fun, and so intuitive a teenager could use it on first visit.

## Phase 1 Scope

- **Header** redesign (editable name, FOR- prefix, progress ring, functional actions)
- **Apercu** tab (dashboard with summary cards)
- **Fiche** tab (new — all formation info, inline-editable)
- **Actions** tab (quest tracker with master-detail layout, 3 phases, sounds, animations)
- **Enhanced creation wizard** (4-step: basics, programme, people, financement)
- **List page updates** (FOR- prefix, notification dots, mini progress bar)
- Tabs 4-8 (Programme, Seances, Formateurs, Apprenants, Finances) are Phase 2 — keep current behavior or show placeholder.

---

## 1. Data Model Changes

### 1a. New enum: `quest_phase`

```sql
CREATE TYPE quest_phase AS ENUM ('conception', 'deploiement', 'evaluation');
```

### 1b. Extend `formation_actions` table

Add columns to support the quest system without making the table obsolete:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `phase` | `quest_phase` | `NULL` | Which Qualiopi phase this quest belongs to |
| `quest_key` | `varchar(64)` | `NULL` | References the quest template definition in code |
| `assignee_id` | `uuid` FK → users | `NULL` | Who is responsible for this quest |
| `guidance_dismissed` | `boolean` | `false` | Whether the user dismissed the help text |
| `applicable_to` | `jsonb` | `NULL` | Which formation types/funding this quest applies to (null = all) |

**Indexes:** `assignee_id`, `quest_key`, composite `(formation_id, phase)`.
**Constraints:** `UNIQUE (formation_id, quest_key)` to prevent duplicate quests per formation. `CHECK` that `quest_key IS NOT NULL WHEN phase IS NOT NULL`.
**RLS:** Add appropriate Supabase RLS policies to protect user-sensitive fields (`assignee_id`, `guidance_dismissed`, `applicable_to`).

### 1c. New table: `quest_sub_actions`

```
quest_sub_actions
├── id: uuid PK
├── formation_action_id: uuid FK → formation_actions (CASCADE)
├── title: text NOT NULL
├── description: text
├── completed: boolean DEFAULT false
├── completed_at: timestamptz
├── completed_by: uuid FK → users
├── order_index: integer DEFAULT 0 NOT NULL
└── created_at: timestamptz DEFAULT now()
```

### 1d. New table: `formation_audit_log` (schema only — Phase 2 will populate it)

```
formation_audit_log
├── id: uuid PK
├── formation_id: uuid FK → formations (SET NULL on delete, nullable — preserves audit history)
├── user_id: uuid FK → users
├── action_type: text NOT NULL (field_update, quest_completed, phase_completed, status_changed...)
├── entity_type: text (formation, quest, sub_action, seance...)
├── entity_id: uuid
├── field_name: text
├── old_value: jsonb (structured to preserve types and enable queries)
├── new_value: jsonb (structured to preserve types and enable queries)
└── created_at: timestamptz DEFAULT now()
```

**Indexes:** `formation_id`, `created_at`, composite `(formation_id, created_at DESC)` for recent-activity queries.

**Retention:** Consider a scheduled cleanup job (e.g., archive/delete entries older than a configurable period) and potential partitioning by `created_at` (monthly/quarterly) at scale.

### 1e. Files to change

- [`src/lib/db/schema/enums.ts`](src/lib/db/schema/enums.ts) — add `questPhase` enum
- [`src/lib/db/schema/formations.ts`](src/lib/db/schema/formations.ts) — extend `formationActions`, add `questSubActions`, add `formationAuditLog`
- [`src/lib/db/schema/index.ts`](src/lib/db/schema/index.ts) — re-export new tables
- New migration file in `supabase/migrations/`

---

## 2. Quest Template System

### 2a. New file: `src/lib/formation-quests.ts`

Replace the current [`src/lib/formation-workflow.ts`](src/lib/formation-workflow.ts) with a comprehensive quest template system. The old file's exports (`WORKFLOW_STEPS`, `DEFAULT_FORMATION_ACTIONS`) will be replaced by the new system. Keep `isFormationQualiopiComplete` in a shared location.

**Quest template interface:**

```typescript
interface QuestTemplate {
  key: string;               // e.g. 'convention'
  phase: 'conception' | 'deploiement' | 'evaluation';
  title: string;             // French label
  description: string;       // What needs to happen
  guidance: string;          // Help text for new users (dismissible)
  subActions: { title: string; description?: string }[];
  dependencies: string[];    // quest_keys that must be completed first
  applicableTo: {            // null = all formations
    types?: ('Intra' | 'Inter' | 'CPF')[];
    funding?: ('OPCO' | 'CPF' | 'Inter' | 'Intra')[];
  } | null;
  dueDateOffset: {           // relative to formation.dateDebut
    days: number;            // negative = before J0, positive = after
    reference: 'dateDebut' | 'dateFin';
  } | null;
  criticalForQualiopi: boolean;  // major non-conformity if missed
}
```

### 2b. Quest list (22 quests, based on Qualiopi research)

**Phase: Conception (9 quests, before formation starts)**

| # | Key | Title | Sub-actions (3-5) | Dependencies | Conditional |
|---|-----|-------|-------------------|--------------|-------------|
| 1 | `verification_infos` | Vérification des informations | Check name/description complete, Confirm dates, Verify modality & duration, Confirm client info | — | All |
| 2 | `analyse_besoins` | Analyse des besoins | Choose/create needs questionnaire, Send to learners, Collect responses, Share with trainer | `verification_infos` | All |
| 3 | `programme_modules` | Programme et modules | Link/create programme, Verify modules, Confirm objectives, Validate evaluation method | `verification_infos` | All |
| 4 | `convention` | Convention de formation | Generate convention document, Review & customize, Send to client, Collect signature | `programme_modules` | All |
| 5 | `demande_financement` | Demande de financement | Prepare funding file, Submit to OPCO/CPF platform, Track approval status | `convention` | OPCO, CPF only |
| 6 | `convocations` | Convocations | Generate convocation documents, Attach welcome booklet, Schedule/send to all learners | `convention` | All |
| 7 | `test_positionnement` | Test de positionnement | Choose/create positioning test, Configure sending, Send to learners, Collect results | `analyse_besoins` | All |
| 8 | `ordre_mission` | Ordre de mission formateur | Generate mission order, Send to trainer, Collect signed copy | `convention` | All |
| 9 | `documents_formateur` | Documents formateur | Verify CV, Check diplomas, Confirm NDA/URSSAF/SIRET, Request missing docs | — | All |

**Phase: Deploiement (4 quests, during formation)**

| # | Key | Title | Sub-actions | Dependencies | Conditional |
|---|-----|-------|-------------|--------------|-------------|
| 10 | `accueil_lancement` | Accueil et lancement | Confirm logistics ready, Welcome learners, Distribute materials | All Conception quests | All |
| 11 | `emargement` | Suivi des emargements | Track daily attendance, Follow up on missing signatures, Send reminders | `accueil_lancement` | All |
| 12 | `evaluations_formatives` | Evaluations formatives | Conduct in-course assessments, Record results, Adapt if needed | `accueil_lancement` | All |
| 13 | `suivi_absences` | Suivi des absences | Record absences, Notify client, Document justifications | `accueil_lancement` | All |

**Phase: Evaluation (9 quests, after formation ends)**

| # | Key | Title | Sub-actions | Dependencies | Conditional |
|---|-----|-------|-------------|--------------|-------------|
| 14 | `satisfaction_chaud` | Satisfaction a chaud | Choose/create questionnaire, Send to learners, Send to client, Collect responses | `emargement` | All |
| 15 | `evaluation_finale` | Evaluation finale | Administer final test, Record results, Compare with positioning test | `evaluations_formatives` | All |
| 16 | `certificat_realisation` | Certificat de realisation | Generate certificates, Verify attendance data, Send to learners | `emargement` | All |
| 17 | `attestation` | Attestation de fin de formation | Generate attestations, Send to learners, Archive copies | `certificat_realisation` | All |
| 18 | `facturation` | Facturation | Generate invoice, Send to client/OPCO, Track payment | `certificat_realisation` | All |
| 19 | `justificatifs_opco` | Justificatifs OPCO | Compile justification package, Send to OPCO, Track validation | `facturation` | OPCO only |
| 20 | `satisfaction_froid` | Satisfaction a froid (J+60) | Schedule cold survey, Send to learners, Collect & analyze responses | `satisfaction_chaud` | All |
| 21 | `bilan_formateur` | Bilan formateur | Send debrief questionnaire, Collect feedback, Record improvement notes | `satisfaction_chaud` | All |
| 22 | `cloture_archivage` | Cloture et archivage | Verify all documents present, Archive formation file, Mark as complete | All Evaluation quests | All |

### 2c. Helper functions

- `getQuestsForFormation(type, funding)` — filter templates by applicability
- `calculateDueDates(dateDebut, dateFin)` — compute due dates from offsets
- `createFormationQuests(formationId, type, funding, assigneeId, dateDebut, dateFin)` — insert quests + sub-actions into DB
- `getQuestProgress(actions)` — compute per-phase and overall completion %
- `getNextQuest(actions)` — find the most urgent actionable quest
- `shouldAutoAdvanceStatus(actions, currentStatus)` — determine if formation status should change

### 2d. Status auto-advancement rules

| Quests completed | New status |
|------------------|-----------|
| `verification_infos` + `programme_modules` | Signature convention |
| `convention` signed | Financement (if applicable) or Planification |
| `demande_financement` (if applicable) | Planification |
| `convocations` + `ordre_mission` | En cours (when `dateDebut` arrives) |
| All Evaluation quests | Terminee |
| `cloture_archivage` | Archivee |

---

## 3. Component Architecture

### 3a. New components to create

| Component | Path | Purpose |
|-----------|------|---------|
| `ProgressRing` | `src/lib/components/custom/progress-ring.svelte` | Small circular progress indicator for header |
| `QuestList` | `src/lib/components/formations/quest-list.svelte` | Left panel of master-detail: phases + quest cards |
| `QuestPhaseGroup` | `src/lib/components/formations/quest-phase-group.svelte` | Collapsible phase section with quests |
| `QuestCard` | `src/lib/components/formations/quest-card.svelte` | Individual quest in the list (title, status, assignee, due date) |
| `QuestWorkspace` | `src/lib/components/formations/quest-workspace.svelte` | Right panel: sub-actions, guidance, upload zones |
| `QuestSubAction` | `src/lib/components/formations/quest-sub-action.svelte` | Checkable sub-action item with animation |
| `QuestGuidance` | `src/lib/components/formations/quest-guidance.svelte` | Dismissible help text panel |
| `LevelUpToast` | `src/lib/components/formations/level-up-toast.svelte` | Achievement-style toast for phase completion |
| `NotificationDot` | `src/lib/components/custom/notification-dot.svelte` | Small colored dot for tabs and cards |
| `NextActionCard` | `src/lib/components/formations/next-action-card.svelte` | Hero card on overview: next quest + "Do it" button |
| `DashboardCard` | `src/lib/components/formations/dashboard-card.svelte` | Reusable card wrapper for overview widgets |
| `InlineEditableField` | `src/lib/components/custom/inline-editable-field.svelte` | Click-to-edit field (reuse patterns from [`src/lib/components/crm/InlineField.svelte`](src/lib/components/crm/InlineField.svelte)) |
| `DeleteFormationDialog` | `src/lib/components/formations/delete-formation-dialog.svelte` | Archive or permanent delete dialog |
| `SoundManager` | `src/lib/sounds.ts` | Module for playing 3-tier sound effects |

### 3b. Components to modify

| Component | Changes |
|-----------|---------|
| [`src/lib/components/nav-tabs.svelte`](src/lib/components/nav-tabs.svelte) | Add `dot` property to `TabItem` type for notification indicators |
| [`src/lib/components/site-header.svelte`](src/lib/components/site-header.svelte) | Add `ProgressRing` to `formationButtonGroup`, change Share icon to Link icon, make formation name editable inline, wire up dropdown actions |
| [`src/lib/components/custom/formationCard.svelte`](src/lib/components/custom/formationCard.svelte) | Add FOR- prefix, notification dot, mini progress bar |

---

## 4. Route / Page Changes

### 4a. Layout: [`src/routes/(app)/formations/[id]/+layout.svelte`](src/routes/(app)/formations/[id]/+layout.svelte)

**Current:** 5 tabs (Apercu, Actions, Programme, Formateurs, Seances), no icons always shown.

**New:** 8 tabs with icons + labels always visible, notification dots:

```
Apercu (LayoutDashboard) | Fiche (FileText) | Actions (Target) | Programme (BookOpen) | Seances (Calendar) | Formateurs (GraduationCap) | Apprenants (Users) | Finances (Wallet)
```

Tab bar must be horizontally scrollable on mobile with the active tab centered.

Notification dots appear on tabs when:
- **Overdue:** a quest is past its due date, or a session has missing signatures
- **New activity:** a quest was unlocked, a learner was added, etc., since the user last viewed that tab

### 4b. Layout server: [`src/routes/(app)/formations/[id]/+layout.server.ts`](src/routes/(app)/formations/[id]/+layout.server.ts)

**Extend the query** to also load:
- `questSubActions` for each action (new relation)
- Assignee user data for each action (new `assigneeId` relation)
- Quest progress calculation (completedCount / totalCount per phase)
- `formationAuditLog` (last 5 entries for recent activity on overview)

**Update header:**
- Change `idPrefix` from `'#'` to `'FOR-'`
- Add `questProgress` (percentage) for the `ProgressRing`
- Change Share button icon to Link
- Wire `formationButtonGroup` actions:
  - Link → copy page URL to clipboard
  - History → placeholder (toast "Bientot disponible")
  - Dropdown: remove "Modifier", remove "En discuter", wire "Copier les informations" and "Supprimer"

### 4c. Apercu tab: [`src/routes/(app)/formations/[id]/+page.svelte`](src/routes/(app)/formations/[id]/+page.svelte)

**Complete redesign.** Dashboard layout with cards:

```
┌─────────────────────────────────┐
│  Next Action Hero Card          │  ← Most urgent quest, "Faire" button opens Actions tab
├────────────────┬────────────────┤
│  Key Info      │  Participants  │  ← Summary stats (not editable — Fiche handles that)
│  (type, dates, │  Summary       │
│  modalite,     │  (count, att.  │
│  client)       │  rate, alerts) │
├────────────────┼────────────────┤
│  Upcoming      │  Financial     │  ← Next 2-3 sessions; cost, margin, TJM
│  Sessions      │  Summary       │
├────────────────┴────────────────┤
│  Recent Activity Feed           │  ← Last 5 changes (from audit log)
└─────────────────────────────────┘
```

All cards are read-only summaries with "Voir tout" links to the relevant tab.

### 4d. Fiche tab (NEW): `src/routes/(app)/formations/[id]/fiche/`

**New route** with `+page.svelte` and `+page.server.ts`.

3 sections using `InlineEditableField` components:
1. **Informations generales**: name, type (Intra/Inter/CPF), modalite, duree, description, code RNCP, thematique
2. **Logistique**: date debut, date fin, location, client (EntityCombobox)
3. **Financement**: type financement, montant accorde, financement accorde (toggle)

If the formation was created from a deal, show a link: "Cree depuis le deal [Deal Name]" with a link to `/deals/[dealId]`.

**Server actions:**
- `updateField` — generic field update (same pattern as contacts page)

### 4e. Actions tab: [`src/routes/(app)/formations/[id]/suivi/`](src/routes/(app)/formations/[id]/suivi/+page.svelte)

**Complete redesign** into master-detail quest tracker.

**Layout:**
```
┌──────────────────┬──────────────────────────────────────┐
│  QUEST LIST      │  QUEST WORKSPACE                     │
│  (~300-350px)    │  (remaining width)                   │
│                  │                                      │
│  ┌─ CONCEPTION ──┤  ┌────────────────────────────────┐  │
│  │ ✓ Quest 1     │  │  Quest Title                   │  │
│  │ → Quest 2  ←  │  │  ──────────────────            │  │
│  │ ○ Quest 3     │  │  Guidance (dismissible)        │  │
│  │ 🔒 Quest 4    │  │                                │  │
│  └───────────────┤  │  Sub-actions:                  │  │
│  ┌─ DEPLOIEMENT ─┤  │  ☐ Sub-action 1               │  │
│  │ 🔒 Quest 5    │  │  ☐ Sub-action 2               │  │
│  │ 🔒 Quest 6    │  │  ☑ Sub-action 3               │  │
│  └───────────────┤  │                                │  │
│  ┌─ EVALUATION ──┤  │  [Upload zone placeholder]     │  │
│  │ 🔒 Quest 7    │  │                                │  │
│  │ 🔒 Quest 8    │  │  Assignee: [Avatar] Marie      │  │
│  └───────────────┤  │  Due: 15 mars 2026             │  │
│                  │  │                                │  │
│  Progress: 35%   │  │  [Marquer comme termine]       │  │
│  ████░░░░░░░░    │  └────────────────────────────────┘  │
└──────────────────┴──────────────────────────────────────┘
```

**On mobile:** list view fills the screen. Tapping a quest navigates to the workspace view with a back button.

**Quest states in the list:**
- `✓` Completed (green check, muted text)
- `→` Active/selected (highlighted border, primary color)
- `○` Available (empty circle, ready to start)
- `🔒` Blocked (lock icon, tooltip with blocking quest name, visible but not interactive)

**Phase groups:**
- Each phase has a header with phase name, progress (e.g., "3/9"), and expand/collapse
- Completed phase: auto-collapses with a subtle animation
- Active phase: expanded, highlighted
- Future phase: collapsed but visible (teaser)

**Phase completion:**
- When all quests in a phase are done:
  1. Checkmark animation on the last quest
  2. Phase header gets a "Phase terminee !" label
  3. Phase collapses with animation
  4. Next phase expands dramatically
  5. Level-up toast notification appears (achievement-style, top-right, auto-dismisses after 5s)
  6. Phase-completion sound plays

**Quest workspace (right panel):**
- Quest title + phase badge
- Guidance text (collapsible, dismissible per-quest via `guidance_dismissed`)
- Sub-actions checklist (3-5 items, each checkable with animation + sound)
- Upload zone (placeholder for Phase 2 — shows "Documents bientot disponibles" with file icon)
- Assignee selector (dropdown of workspace members)
- Due date (auto-calculated, editable via date picker)
- "Marquer comme termine" button (disabled until all sub-actions checked, OR manually overridable)

**Server actions for `+page.server.ts`:**
- `updateQuestStatus` — update quest status (Pas commence → En cours → Termine)
- `toggleSubAction` — mark/unmark a sub-action
- `updateAssignee` — change quest assignee
- `updateDueDate` — override auto-calculated due date
- `dismissGuidance` — mark guidance as dismissed for this quest

### 4f. Phase 2 tab placeholders

Tabs 4-8 (Programme, Seances, Formateurs, Apprenants, Finances):
- **Programme, Formateurs, Seances**: keep current behavior as-is
- **Apprenants**: new route `src/routes/(app)/formations/[id]/apprenants/+page.svelte` — for now, move the current apprenant list from the overview page here with add/remove functionality
- **Finances**: new route `src/routes/(app)/formations/[id]/finances/+page.svelte` — show current financial info (TJM, montant accorde, margin calculation) in a simple card layout

---

## 5. Sound System

### 5a. New file: `src/lib/sounds.ts`

Three tiers of sounds using the Web Audio API (no external files needed — generate tones programmatically):

| Tier | Event | Character |
|------|-------|-----------|
| Micro | Sub-action checked | Very subtle, soft click/tick — barely perceptible |
| Medium | Quest completed | Satisfying chime — clean, short, rewarding |
| Macro | Phase completed | Level-up fanfare — short (1-2s), fuller, triumphant but not cartoonish |

All sounds are:
- Generated via Web Audio API (oscillators + gain envelopes) — no audio file dependencies
- Short (< 1.5 seconds)
- Designed to not become annoying after 100+ plays
- Controlled by a user preference (stored in localStorage, default: on)

---

## 6. Animations

Use **Svelte built-in transitions** (`fly`, `slide`, `fade`, `scale`) + CSS keyframes:

| Animation | Technique |
|-----------|-----------|
| Sub-action checkmark | CSS `scale` + `opacity` transition on the check icon |
| Quest completion | Svelte `scale` transition on the status icon + CSS background pulse |
| Phase collapse | Svelte `slide` transition on the phase group |
| Phase reveal | Svelte `slide` + `fly` on the next phase group |
| Level-up toast | Svelte `fly` from right + CSS shimmer on border |
| Progress ring | CSS `stroke-dashoffset` transition (smooth arc animation) |
| Progress bar | CSS `width` transition with ease-out |

---

## 7. Enhanced Creation Wizard

### 7a. Modify: [`src/routes/(app)/formations/creer/+page.svelte`](src/routes/(app)/formations/creer/+page.svelte) and [`+page.server.ts`](src/routes/(app)/formations/creer/+page.server.ts)

Add 2 new steps to the existing wizard (currently handles basics + programme/modules):

**Step 1 — Basics** (existing, enhanced):
- Name, client, type (Intra/Inter/CPF), modalite, duree, dates, location

**Step 2 — Programme** (existing):
- Select from Bibliotheque or create custom modules

**Step 3 — People** (new):
- Assign formateur (search/select from existing formateurs)
- Add apprenants (search/select from existing contacts, or create new)

**Step 4 — Financement** (new):
- Type de financement (OPCO, CPF, Inter, Intra)
- Montant accorde (optional)
- Financement accorde (toggle)

### 7b. On creation:

The server action must wrap all steps inside `db.transaction(async (tx) => { ... })`:
1. Create the formation via `tx.insert(formations)` (existing)
2. Create modules via `tx.insert(modules)` (existing)
3. Create `formation_formateurs` entries via `tx.insert(formationFormateurs)` (new)
4. Create `formation_apprenants` entries via `tx.insert(formationApprenants)` (new)
5. Call `createFormationQuests(tx, formation.id, ...)` — creates quests + sub-actions based on formation type/funding, running inside the same transaction
6. Auto-assign all quests to the admin/secretary user, or formation creator as fallback
7. If any step throws, the transaction rolls back and propagates the error

### 7c. Update: [`src/routes/(app)/formations/creer/schema.ts`](src/routes/(app)/formations/creer/schema.ts)

Add Zod fields for `formateurIds`, `apprenantContactIds`, `typeFinancement`, `montantAccorde`, `financementAccorde`.

---

## 8. List Page Updates

### 8a. Modify: [`src/routes/(app)/formations/+page.svelte`](src/routes/(app)/formations/+page.svelte) and [`src/lib/components/custom/formationCard.svelte`](src/lib/components/custom/formationCard.svelte)

- Display `FOR-{idInWorkspace}` instead of `#{idInWorkspace}`
- Add notification dot (overdue quests, missing signatures)
- Add mini progress bar (quest completion %) at the bottom of each card

### 8b. Modify: [`src/routes/(app)/formations/+page.server.ts`](src/routes/(app)/formations/+page.server.ts)

- Include quest completion stats in the formation query (count of completed vs total actions)

---

## 9. Header Changes

### 9a. Modify: [`src/lib/components/site-header.svelte`](src/lib/components/site-header.svelte)

For the `formationButtonGroup` action type:

1. **Formation name** — replace static `<h1>` with an inline-editable field (click to edit, Enter to save, Escape to cancel). Uses the same `updateField` server action from the Fiche tab.

2. **ID display** — change prefix from `#` to `FOR-`

3. **Progress ring** — add a small `ProgressRing` component between the status badge and the button group. Shows overall quest completion %.

4. **Link button** (was Share) — change icon from `Share` to `Link`. On click: copy the current page URL to clipboard + show toast "Lien copie !"

5. **History button** — on click: show toast "Historique bientot disponible" (Phase 2)

6. **Dropdown menu:**
   - Remove "Modifier la formation" (editing is inline)
   - Remove "En discuter avec..." (V2 feature)
   - "Copier les informations" → copy plain-text summary to clipboard:
     ```
     Formation: [name]
     Ref: FOR-[id]
     Type: [type] | Modalite: [modalite]
     Duree: [duree]h
     Dates: [dateDebut] - [dateFin]
     Client: [client name]
     Formateur: [formateur name or "Non assigne"]
     Statut: [statut]
     ```
   - "Supprimer la formation" → opens `DeleteFormationDialog` with two options:
     - "Archiver" — sets status to "Archivee"
     - "Supprimer definitivement" — hard deletes with cascade

---

## 10. Notification Dot System

### 10a. Triggers

| Tab | Dot appears when |
|-----|-----------------|
| Actions | A quest is overdue (past due date + not completed) |
| Seances | A past session has missing signatures |
| Formateurs | A formateur is missing required documents (Phase 2) |
| Apprenants | — (no triggers in Phase 1) |
| Finances | — (no triggers in Phase 1) |

### 10b. Dismissal

Dots disappear when:
- The user navigates to the tab AND the condition is resolved (e.g., they complete the overdue quest)
- The underlying condition no longer exists (e.g., all signatures collected)

### 10c. Implementation

Store "last viewed at" timestamps per tab per user in `localStorage`. Compare against the latest relevant event timestamp to determine if a dot should show.

---

## 11. Mobile Responsiveness

All components must work on mobile (320px+) and tablet (768px+):

| Component | Mobile behavior |
|-----------|----------------|
| Tab bar | Horizontally scrollable, active tab auto-scrolled into view |
| Master-detail (Actions) | Stacked: quest list fills screen, tapping a quest replaces with workspace view + back button |
| Dashboard cards | Single column stack |
| Side panel | N/A (master-detail replaces it) |
| Inline editing | Same click-to-edit, but input fills available width |
| Fiche sections | Single column |

---

## 12. Implementation Order

Execute in this sequence, each step building on the previous:

1. **Data model** — migration + Drizzle schema changes + quest template system
2. **NavTabs** — add notification dot support + ensure 8-tab scrolling works
3. **Header** — editable name, FOR- prefix, progress ring, functional dropdown
4. **Fiche tab** — new route + inline editing + server actions
5. **Actions tab** — master-detail layout, quest list, quest workspace, sub-actions
6. **Sounds + animations** — wire up sound manager + Svelte transitions
7. **Apercu tab** — redesign as dashboard with summary cards
8. **Creation wizard** — add People + Financement steps, wire quest creation
9. **List page** — FOR- prefix, dots, mini progress bar
10. **Phase 2 placeholders** — Apprenants and Finances tab stubs

---

## 13. Error Handling & Loading States

Each server action should define concrete behavior:

- **UI loading states:** disable buttons + show spinner or skeleton per-action while request is in-flight.
- **Error handling:** show `toast.error` with localized messages (e.g., "Impossible de mettre a jour le statut") on failure.
- **Rollback strategies:** wrap multi-step mutations (e.g., `createFormationQuests`) in DB transactions; on partial failure, let the transaction roll back.
- **Optimistic updates:** for `toggleSubAction`, apply the toggle optimistically with automatic rollback on conflict.
- **Validation error display:** Zod errors shown inline beside form fields with a fallback toast for unexpected validation failures.

---

## 14. Data Migration Strategy

When adding the `questPhase` enum and quest-related tables, existing formation rows must be handled:

- Decide whether existing formations are migrated to the quest system or marked legacy.
- Define heuristics to map current `formation_actions`/status to quests and which phases should be pre-completed.
- Decide on dual-mode (old actions alongside quests) or full migration.
- Require a separate data migration script (distinct from schema migrations) that inspects formations, creates quests, marks pre-completed quests, writes `formationAuditLog` entries, includes a rollback plan, and a test plan (sample datasets, verification queries, dry-run mode).

---

## 15. Status Auto-Advancement Details

Implement via two paths:
1. **Event-driven:** invoke `advanceStatusForFormation(...)` from the quest completion handler.
2. **Time-based:** a daily cron job checks date-based rules (e.g., `dateDebut` reached).

Add a `status_override` boolean on `Formation`; when a user manually updates status, set it to `true` and have `advanceStatusForFormation` bail out (or only suggest changes).

Enforce transitions via a central state machine module (`allowedTransitions`, `canTransition(current, target)`) used in both auto and manual paths.

Prevent races by performing status changes inside a DB transaction with `SELECT ... FOR UPDATE` on the Formation row.

---

## 16. Dependency Graph Safety

Inside `createFormationQuests`:
- Expand ambiguous "All Evaluation quests" dependencies for `cloture_archivage` into the explicit key list.
- Detect and throw on circular dependencies (DFS cycle check via `validateDependencyGraph`).
- Handle conditional dependencies (e.g., `demande_financement`): mark dependent quests as optional/inapplicable when the condition doesn't apply, providing fallback logic so downstream quests are not blocked.

---

## 17. Accessibility

- **Sounds:** check `prefers-reduced-motion` before playing animations; provide visual alternatives (CSS classes like `visual-feedback-micro/medium/macro`) when sound is disabled.
- **Sound toggle:** keyboard-focusable and ARIA-labeled (WCAG audio control requirements).
- **Sound persistence:** wire the preference into the user preferences backend (save/read via user preferences table when authenticated) with localStorage as client fallback.

---

## 18. Inline Edit Authorization

For the inline-editable formation name and Fiche fields:
- The `updateField` server action must enforce a role x field permission matrix (which roles can edit which fields and when; e.g., prevent edits after certain formation statuses).
- Every change must be written to `formation_audit_log` with actor, timestamp, old/new values.
- Validate input against the creation wizard Zod schema (e.g., non-empty name, dateDebut < dateFin, business rules).
- Ensure returned/displayed values are properly escaped (SvelteKit automatic escaping) to prevent XSS.

---

## 19. URL Routing & Navigation (Mobile)

- Desktop: selection uses query param `/formations/[id]/suivi?quest=[questKey]`.
- Mobile: uses path param `/formations/[id]/suivi/[questKey]`.
- Mobile "back" UI pushes/pops browser history so the hardware back button works.
- Deep links/bookmarks must load the selected quest.
- Tab bar: ArrowLeft/ArrowRight to move, Home/End to jump, auto-scroll active into view.
- Touch gestures: swipe left/right to navigate quests.

---

## 20. Files Summary

### New files (16)
- `src/lib/formation-quests.ts`
- `src/lib/sounds.ts`
- `src/lib/components/custom/progress-ring.svelte`
- `src/lib/components/custom/notification-dot.svelte`
- `src/lib/components/custom/inline-editable-field.svelte`
- `src/lib/components/formations/quest-list.svelte`
- `src/lib/components/formations/quest-phase-group.svelte`
- `src/lib/components/formations/quest-card.svelte`
- `src/lib/components/formations/quest-workspace.svelte`
- `src/lib/components/formations/quest-sub-action.svelte`
- `src/lib/components/formations/quest-guidance.svelte`
- `src/lib/components/formations/level-up-toast.svelte`
- `src/lib/components/formations/next-action-card.svelte`
- `src/lib/components/formations/delete-formation-dialog.svelte`
- `src/routes/(app)/formations/[id]/fiche/+page.svelte`
- `src/routes/(app)/formations/[id]/fiche/+page.server.ts`
- `src/routes/(app)/formations/[id]/apprenants/+page.svelte`
- `src/routes/(app)/formations/[id]/finances/+page.svelte`
- `supabase/migrations/[timestamp]_quest_system.sql`

### Modified files (12)
- `src/lib/db/schema/enums.ts`
- `src/lib/db/schema/formations.ts`
- `src/lib/db/schema/index.ts`
- `src/lib/components/nav-tabs.svelte`
- `src/lib/components/site-header.svelte`
- `src/lib/components/custom/formationCard.svelte`
- `src/routes/(app)/formations/[id]/+layout.svelte`
- `src/routes/(app)/formations/[id]/+layout.server.ts`
- `src/routes/(app)/formations/[id]/+page.svelte`
- `src/routes/(app)/formations/[id]/suivi/+page.svelte`
- `src/routes/(app)/formations/[id]/suivi/+page.server.ts`
- `src/routes/(app)/formations/creer/+page.svelte`
- `src/routes/(app)/formations/creer/+page.server.ts`
- `src/routes/(app)/formations/creer/schema.ts`
- `src/routes/(app)/formations/+page.svelte`
- `src/routes/(app)/formations/+page.server.ts`
