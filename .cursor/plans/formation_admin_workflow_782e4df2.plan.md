---
name: Formation Admin Workflow
overview: 'Redesign the formation detail page (/formations/[id]) as the single admin view: Recap + 10 Qualiopi action steps + Formateurs/Séances/Modifier. No tabs. Implement in 3 phases: Phase 1 = UI mockup with dummy data only (iterate until user approves); Phase 2 = schema + data layer; Phase 3 = logic + form actions. Do not do Phase 2 or 3 until Phase 1 is signed off.'
todos: []
isProject: false
---

# Formation Admin Workflow – Implementation Plan

---

## FOR THE CODING AGENT – START HERE

**Rule:** Work in **phases**. Do **Phase 1 only** until the user explicitly says they approve the UI.

- **Phase 1:** Build the formation [id] page UI with **dummy data only**. No schema changes, no migrations, no real DB queries, no form actions. Iterate with the user until they approve. Then stop and wait for user to say "Phase 1 approved" or similar before doing Phase 2.
- **Phase 2:** Only after Phase 1 sign-off: schema, migrations, load real data.
- **Phase 3:** Only after Phase 2: form actions, validation, persist step completion.

**Do not** create migrations, change [src/lib/db/schema.ts](src/lib/db/schema.ts), or add form actions in Phase 1. Use only dummy/mock data and the existing route + components.

**Where to implement:** [src/routes/(app)/formations/[id]/+page.svelte](<src/routes/(app)/formations/[id]/+page.svelte>) and optional [src/routes/(app)/formations/[id]/+page.server.ts](<src/routes/(app)/formations/[id]/+page.server.ts>) (dummy load only in Phase 1). New components under e.g. `src/lib/components/formations/` or next to the route.

---

## 1. What this page is (context)

- **Mentore Manager** is the app for managing the **administrative** side of Formations. The formation detail page **is** the admin view – there is **no** separate "Admin" tab.
- **Current state:** `/formations/[id]` has draft tabs (Aperçu, Informations, Documents, Formateurs, Séances, Paramètres). **Remove all tabs.** The page becomes one single view.
- **Three goals for this page:** (1) **Recap** – see formation info at a glance; (2) **Action steps** – see and do the 10 Qualiopi steps with minimal clicks; (3) **Formateurs** – assign/find formateurs per Module (aggregated view). Tone: **fun, playful, clear** – not boring SaaS; Qualiopi conformity but rewarding.

---

## 2. Page structure (single source of truth)

**No tabs.** Everything is either **always visible** on the page or **one click** away (expand / drawer / modal).

### 2.1 Always visible (no scroll or minimal scroll)

| Zone                                  | Content                                                                                                                                                                                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recap block** (top)                 | Compact: formation title, client, dates, type de financement, statut, duration. Entry point: **"Modifier"** (or gear icon) – one click opens modal/drawer to edit formation.                                                                                                                  |
| **Progress**                          | Text + bar: e.g. **"3 / 10 étapes validées"** and a progress bar.                                                                                                                                                                                                                             |
| **List of 10 steps**                  | Compact list (or stepper). **Each row/card:** step number, **French label** (see table below), status (done / in progress / to do), **primary button** (e.g. "Vérifier les infos", "Générer la convention", "Valider l'étape"). Use the **exact** French labels from the 10-step table in §3. |
| **Entry points** (optional placement) | **"Formateurs (3)"** and **"Séances (5)"** – one click each opens a panel or drawer.                                                                                                                                                                                                          |

### 2.2 One click to open (not visible until user clicks)

| Trigger                                | Result                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Click a step row or its primary button | That step's **content** appears: inline expand below the row, **or** drawer from the right, **or** main content area shows only that step (step list stays visible). Choose one pattern and use it consistently. **Recommendation:** main content area that shows the selected step's content; step list on the left or above. |
| Click "Formateurs (3)"                 | Panel or drawer with: per-module formateurs + aggregated list (placeholder in Phase 1).                                                                                                                                                                                                                                        |
| Click "Séances (5)"                    | Panel or drawer with: list of séances (placeholder in Phase 1).                                                                                                                                                                                                                                                                |
| Click "Modifier" in Recap              | Modal or drawer with: formation edit form (placeholder in Phase 1).                                                                                                                                                                                                                                                            |

**Optional:** On first load, the **first incomplete step's content** is shown in the main area so the user can act with zero extra clicks. If you implement this, clicking another step switches the main area to that step.

**Do not add any tabs.** Remove existing tabs from the formation [id] page.

---

## 3. The 10 Qualiopi steps (reference – use these labels in the UI)

Use these **exact** French names and step keys in the UI.

| #   | Step key (schema)           | Name (FR) – use in UI          |
| --- | --------------------------- | ------------------------------ |
| 1   | info_verification           | Vérifications des informations |
| 2   | convention_program          | Convention et programme        |
| 3   | needs_analysis              | Analyse des besoins            |
| 4   | convocation                 | Convocation                    |
| 5   | mission_order               | Ordre de mission               |
| 6   | end_certificate             | Attestation de fin de mission  |
| 7   | satisfaction_questionnaires | Questionnaires de satisfaction |
| 8   | instructor_documents        | Documents formateur            |
| 9   | billing                     | Facturation                    |
| 10  | complete_file               | Dossier complet                |

Existing schema: [src/lib/db/schema.ts](src/lib/db/schema.ts) – `workflowStepKeys` and `formationWorkflowSteps` table already exist. Do **not** change schema in Phase 1.

---

## 4. Phase 1 – UI mockup (dummy data only)

**Goal:** Build the full layout and all UI elements so the user can review and approve. No real DB, no schema changes, no form actions.

### 4.1 Phase 1 checklist (implement in this order)

1. **Remove** all tabs (Aperçu, Informations, Documents, Formateurs, Séances, Paramètres) from [src/routes/(app)/formations/[id]/+page.svelte](<src/routes/(app)/formations/[id]/+page.svelte>).
2. **Recap block** (top of page)

- Show: formation name, client name, dates, type de financement, statut, duration (all from dummy data).
- Add a **"Modifier"** button or gear icon. On click: open a modal or drawer with a placeholder formation edit form (fields optional; can be "Formulaire d'édition – placeholder").

1. **Progress**

- Show text: e.g. "3 / 10 étapes validées" and a progress bar (e.g. 3/10 = 30%). Use dummy value (e.g. 3 completed).

1. **List of 10 steps**

- For each of the 10 steps, show one row (or card) with: step number (1–10), **French label** from the table in §3, status badge (done / in progress / to do), primary button (e.g. "Vérifier les infos" for step 1, "Générer la convention" for step 2, "Valider l'étape" for steps that are "in progress" or "to do").
- Use dummy statuses: e.g. steps 1–3 done, step 4 in progress, steps 5–10 to do.

1. **Step content area**

- When the user clicks a step (or its button), show that step's **content** in a main area (or inline expand or drawer – pick one and stay consistent).
- For **Phase 1**, each step's content is **placeholder** so the user can judge layout. Suggested placeholders:
  - **Step 1:** Short formation summary + list of 3–5 dummy learners + buttons "Ajouter apprenant", "Importer CSV", "Valider l'étape".
  - **Step 2:** Buttons "Générer", "Modifier", "Télécharger" (convention) + "Renseigner le programme", "Télécharger" (program).
  - **Step 3:** "À programmer" button + dummy participants table (name, email, statut).
  - **Step 4:** "Générer pour tous les apprenants", "Programmer un envoi groupé" + dummy learner count and list.
  - **Step 5:** "Générer" / "Modifier" / "Télécharger" (ordre de mission) + upload zone for "Test de positionnement".
  - **Step 6:** Same pattern as Step 4 (attestations).
  - **Step 7:** "Ajouter manuellement", "Importer depuis l'émargement", "Importer depuis le listing admin" + dummy learners table (hot/cold questionnaire).
  - **Step 8:** List of document types (Fiche d'entretien, CV, Diplôme, URSAFF, NDA, Contrat) with upload placeholder or "Choose file" per row.
  - **Step 9:** Financing mode, payment method, toggles for "Facture entreprise envoyée/payée", "Virement formateur réalisé".
  - **Step 10:** Short recap: "Données émargement" (0 session / 0 signature) + "Documents déposés par le formateur" (placeholder list or empty message).

1. **Entry points: Formateurs, Séances**

- Add **"Formateurs (3)"** and **"Séances (5)"** (or similar) – e.g. in Recap or next to the step list. On click: open a **drawer or panel** with placeholder content (Formateurs: per-module list + aggregated; Séances: list of 5 dummy séances).

### 4.2 Dummy data for Phase 1

Use a **single dummy payload** so the page renders without DB. Shape (TypeScript-ish):

```ts
// Example shape – adapt to your components
{
  formation: {
    id: '...', name: 'Formation pilot', client: { legalName: 'Acme SA' },
    dates: '...', typeFinancement: 'OPCO', statut: 'En cours', duree: 24,
    lieu: '...', format: '...', ...
  },
  progress: { completed: 3, total: 10 },  // 3/10 étapes validées
  steps: [
    { key: 'info_verification', label: 'Vérifications des informations', status: 'done', primaryButton: '...' },
    // ... one per workflowStepKeys, status: 'done' | 'in_progress' | 'to_do'
  ],
  learners: [ { id: '...', firstName: '...', lastName: '...', email: '...' }, ... ],  // 3–5 items
  modules: [ { id: '...', name: 'Module 1' }, ... ],
  formateurs: [ { id: '...', name: '...' }, ... ],  // 2–3 for "Formateurs (3)"
  seances: [ { id: '...', date: '...', ... }, ... ],  // 5 for "Séances (5)"
}
```

You can define this in `+page.server.ts` as a `load` that returns the object above (no DB call), or hardcode it in the page. **No** `db.query` or schema changes in Phase 1.

### 4.3 Phase 1 – files to touch

- [src/routes/(app)/formations/[id]/+page.svelte](<src/routes/(app)/formations/[id]/+page.svelte>) – main page: remove tabs, add Recap, progress, step list, step content area, Formateurs/Séances/Modifier entry points. Use dummy data from `data` (load) or local variable.
- [src/routes/(app)/formations/[id]/+page.server.ts](<src/routes/(app)/formations/[id]/+page.server.ts>) – optional: `load` returns the dummy payload above. No `db` calls.
- New components (e.g. under `src/lib/components/formations/`): e.g. `FormationRecap.svelte`, `FormationProgress.svelte`, `FormationStepList.svelte`, `FormationStepContent.svelte` (or one per step), `FormateursDrawer.svelte`, `SeancesDrawer.svelte`, `FormationModifierModal.svelte`. All receive dummy data via props or `data`.

### 4.4 Phase 1 – done when (success criteria)

- Tabs are removed; page is one single view.
- Recap block is visible at top with formation info and "Modifier" (opens modal/drawer with placeholder form).
- Progress shows "X / 10 étapes validées" and a bar.
- All 10 steps are visible in a compact list with French labels, status, and primary button each.
- Clicking a step (or its button) opens that step's content (main area / drawer / inline) with placeholder content as in §4.1.
- "Formateurs" and "Séances" entry points open a panel/drawer with placeholder content.
- No schema changes, no migrations, no real DB queries, no form actions. All data is dummy.
- User has reviewed and **explicitly approved** the UI before proceeding to Phase 2.

**Do not start Phase 2 until the user says they approve the Phase 1 UI.**

---

## 5. Phase 2 – Schema and data layer (only after Phase 1 sign-off)

**Start only when the user has approved the Phase 1 UI.**

- Add schema: e.g. `formations_apprenants` join table, minimal `formation_documents` (or equivalent), billing/audit fields on formation or related table. Run migration. See existing [src/lib/db/schema.ts](src/lib/db/schema.ts) and [docs/bubble/bubble-admin-workflow-analysis.md](docs/bubble/bubble-admin-workflow-analysis.md) for recommendations.
- [src/lib/db/relations.ts](src/lib/db/relations.ts) – add relations for formation → workflow steps, formation learners, documents.
- [src/routes/(app)/formations/[id]/+page.server.ts](<src/routes/(app)/formations/[id]/+page.server.ts>) – `load` fetches **real** formation (with client), formation_workflow_steps, formation learners, documents, modules, formateurs, séances from DB. Remove dummy data; pass real data to the page.
- **Phase 2 done when:** Page shows real formation data and real step completion status; no dummy payload. No form actions yet (Phase 3).

---

## 6. Phase 3 – Logic and form actions (only after Phase 2)

**Start only when Phase 2 is done.**

- Form actions in `+page.server.ts`: validate step (insert/update `formation_workflow_steps`), add learner, upload file, edit formation, etc.
- Wire "Valider l'étape" and other buttons to form actions; refresh data after success (invalidate or re-run load).
- Step content: real forms and minimal validation (e.g. Step 1: at least one learner before validate); "Valider l'étape" persists completion and updates progress.
- Polish: optional "block until previous step completed" (or soft warning), RBAC if specified, micro-celebrations on step completion.

**Phase 3 done when:** User can complete steps, add learners, and see progress persist; formation workflow is functional end-to-end with real data.

---

## 7. Reference – schema and validation (for Phase 2 and 3 only)

- **Existing:** `formation_workflow_steps` (formationId, stepKey, completedAt, completedBy), `workflowStepKeys` in [src/lib/db/schema.ts](src/lib/db/schema.ts). Use as-is for step completion.
- **To add (Phase 2):** Formation–learners link (e.g. `formations_apprenants`), minimal document metadata table, billing/audit fields. See [docs/bubble/bubble-admin-workflow-analysis.md](docs/bubble/bubble-admin-workflow-analysis.md) for details.
- **Validation (Phase 3):** Keep rules light for MVP (e.g. Step 1: at least one learner; Step 8: at least one document type uploaded). "Valider l'étape" writes to `formation_workflow_steps` and re-loads.

---

## 8. Out of scope for this plan

- Real document generation (PDF/Word); placeholders or single file URL per type is enough for MVP.
- Full scheduling/email ("programmer un envoi groupé"); stub buttons that set "scheduled" in DB are enough.
- Formateur Marketplace and matching algorithm (later).
- Inbox integration (see [docs/issues/inbox-feature.md](docs/issues/inbox-feature.md)).

---

## 9. Summary for the Agent

1. **Read "FOR THE CODING AGENT – START HERE"** and follow the phase rule.
2. **Phase 1:** Remove tabs; build Recap, progress, 10-step list, step content area (with placeholders), Formateurs/Séances/Modifier entry points. Use **only** dummy data. Iterate until user approves.
3. **Phase 2:** Only after Phase 1 approval. Schema + migrations + real load; remove dummy data.
4. **Phase 3:** Only after Phase 2. Form actions + validation + persist step completion.

Use the **exact** French step labels from §3 in the UI. Do **not** add tabs. File paths: [src/routes/(app)/formations/[id]/+page.svelte](<src/routes/(app)/formations/[id]/+page.svelte>), [src/routes/(app)/formations/[id]/+page.server.ts](<src/routes/(app)/formations/[id]/+page.server.ts>), [src/lib/db/schema.ts](src/lib/db/schema.ts), [src/lib/db/relations.ts](src/lib/db/relations.ts).
