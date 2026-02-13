---
name: Bibliothèque Library feature
overview: Implement the Bibliothèque (Library) as a workspace content bank with Library Modules and Library Programmes, real reference data for Public cible and Pré-requis, separate routes for Modules and Programmes, deal–programme link with formation prefill on close. Evaluation is per-module (each Formation module has its own modalité d'évaluation). Sales can view Library and select programme on deals; only owner/admin/secretary manage Library. Full plan in one delivery.
todos: []
isProject: false
---

# Bibliothèque (Library) feature – Implementation plan

## 1. Data model

### 1.1 Reference data (new tables, workspace-scoped)

- `**target_publics**`: `id`, `workspace_id`, `name`, `created_at`. Used in Formation create and Library Programmes.
- `**prerequisites**`: `id`, `workspace_id`, `name`, `created_at`. Same use.
- `**modalites_evaluation**` (enum): `'QCM de fin de formation' | 'Mise en situation pratique' | 'Étude de cas complexe' | 'Entretien avec le formateur'`. Used for Library Module and for storing evaluation on formation modules.

Seed or migrate initial data: e.g. seed a few `target_publics` and `prerequisites` per workspace (or globally and link by workspace if you prefer a shared catalog). Formation create currently uses mock lists in [formations/creer/+page.server.ts](<src/routes/(app)/formations/creer/+page.server.ts>); these will be replaced by DB-backed lists.

### 1.2 Library tables

- `**library_modules**`: `id`, `workspace_id`, `created_by`, `created_at`, `titre` (text), `duree_hours` (numeric), `objectifs_pedagogiques` (text), `modalite_evaluation` (enum above). Scoped by workspace.
- `**library_programmes**`: `id`, `workspace_id`, `created_by`, `created_at`, `titre`, `duree` (integer, hours), `topic_id` (FK `thematiques`), `modalite` (existing `modalites` enum: Distanciel, Présentiel, Hybride, E-Learning), `objectifs` (text). No array columns for target public/prerequisites in DB if we use junction tables (see below).
- `**library_programme_target_publics**`: `library_programme_id`, `target_public_id` (unique on (programme_id, target_public_id)).
- `**library_programme_prerequisites**`: `library_programme_id`, `prerequisite_id` (unique on (programme_id, prerequisite_id)).
- `**library_programme_modules**`: `library_programme_id`, `library_module_id`, `order_index`. Defines the ordered set of Library Modules in a Programme.

### 1.3 Extend existing tables

- `**modules**` (formations): add `objectifs_pedagogiques` (text), `modalite_evaluation` (enum `modalites_evaluation`). **Evaluation is per-module only** (no formation-level “mode d’évaluation”); each module has its own modalité d’évaluation. Formation-level “suivi assiduité” remains. Persist these on every module insert/update so that formation create, “create from programme”, and “add module from library” store full module data.
- `**formations**`: add junction tables `**formation_target_publics**` and `**formation_prerequisites**` (formation_id, target_public_id / prerequisite_id) so Formation create can persist Public cible and Pré-requis (and so “create formation from programme” can copy them). Alternatively, add `formations.target_public_ids` and `formations.prerequisite_ids` as UUID arrays if you prefer to avoid extra tables (Postgres does not enforce FK on array elements; junction tables are cleaner for integrity).
- `**deals**`: add `library_programme_id` (uuid, nullable, FK to `library_programmes`). When closing the deal and creating a formation, if `library_programme_id` is set, prefill the new formation (and its modules) from that programme.

### 1.4 Drizzle schema and relations

- Add new tables and enums to [src/lib/db/schema.ts](src/lib/db/schema.ts).
- Add relations in [src/lib/db/relations.ts](src/lib/db/relations.ts) (library_programmes ↔ library_modules, ↔ target_publics, ↔ prerequisites; library_modules; deals ↔ library_programmes; formations ↔ target_publics, prerequisites).

---

## 2. Permissions and nav

- **Two-tier access**: Sales can **view** the Library (list, search, select programme on a deal) but cannot create, edit or delete. Only **owner, admin, secretary** can manage Library items.
- Add permission `**bibliotheque**` for **view** in [src/lib/server/permissions.ts](src/lib/server/permissions.ts): `['owner', 'admin', 'secretary', 'sales']`. Add `**bibliotheque_manage**` (or derive from existing): `['owner', 'admin', 'secretary']` for create/edit/delete.
- In [src/lib/settings/config.ts](src/lib/settings/config.ts), add `'/bibliotheque': 'bibliotheque'` so all four roles see the Bibliothèque nav item. Gate create/edit/delete routes and UI (e.g. hide "Créer", "Modifier", "Supprimer" for sales) using the manage permission.

---

## 3. Routes and layout

- **Layout** at `(app)/bibliotheque/+layout.svelte` and `+layout.server.ts`: load workspace and user role; render a clear navigation between “Modules” and “Programmes de formation” (e.g. sidebar or top nav with links to `/bibliotheque/modules` and `/bibliotheque/programmes`). Use Qualiopi-oriented labels (e.g. “Modules”, “Programmes de formation”).
- `**/bibliotheque**`: redirect to `/bibliotheque/modules` (or to a small dashboard with two cards linking to Modules and Programmes).
- `**/bibliotheque/modules**`: list Library Modules for the workspace; search (titre, objectifs); filter by modalité d’évaluation; sort (titre, durée, date). Actions: create, edit, delete, “Utiliser” (e.g. “Ajouter à une formation” → pick formation → add a copy of the module to that formation).
- `**/bibliotheque/programmes**`: list Library Programmes; search (titre, objectifs); filter by thématique, modalité; sort. Actions: create, edit, delete (manage only), “Créer une formation” — **from Library page**: open prefill wizard (redirect to `/formations/creer` with prefilled data so user can set client and review before creating). **From deal close**: see §7 (direct creation).

Shared layout should expose a single place for “type” (Modules vs Programmes) so the user always knows where they are.

---

## 4. Library Modules UI

- **List page** ([src/routes/(app)/bibliotheque/modules/+page.svelte](<src/routes/(app)/bibliotheque/modules/+page.svelte>)): table or cards showing titre, durée, modalité d’évaluation, excerpt of objectifs; search input; filter dropdown (modalité d’évaluation); sort options.
- **Create/Edit** (e.g. `/bibliotheque/modules/creer`, `/bibliotheque/modules/[id]/modifier`): form with Titre, Durée (heures), Objectifs pédagogiques, Modalité d’évaluation (single select from the 4 enum values). Save to `library_modules`.
- **“Utiliser”**: from list or detail, action “Ajouter à une formation” that opens a modal or navigates to a picker to choose an existing formation, then creates a new row in `modules` (with `course_id` = that formation, copying titre → name, duree_hours → duration_hours, objectifs_pedagogiques, modalite_evaluation). Formation’s module list and duration logic (e.g. remaining hours) should be updated as needed.

---

## 5. Library Programmes UI

- **List page** ([src/routes/(app)/bibliotheque/programmes/+page.svelte](<src/routes/(app)/bibliotheque/programmes/+page.svelte>)): table or cards with titre, durée, thématique, modalité, number of modules, objectifs excerpt; search; filters (thématique, modalité); sort.
- **Create/Edit** (e.g. `/bibliotheque/programmes/creer`, `/bibliotheque/programmes/[id]/modifier`): form with Intitulé/Titre, Durée (heures), Thématique (same combobox as [formations/creer](<src/routes/(app)/formations/creer/+page.svelte>) – thematiques), Modalité (same card-checkbox single choice: Distanciel, Présentiel, Hybride, E-Learning), Public cible (multi-select from `target_publics` for workspace), Pré-requis (multi-select from `prerequisites`), Objectifs (text), and an ordered multi-select of Library Modules (from the same workspace). Reuse patterns from formation create for Thématique and Modalité.
- **“Créer une formation”** (from Library page only): redirect to `/formations/creer` with query params or form state prefill. Prefill: name, duree, topic_id, modalite, objectifs, target_public_ids, prerequisite_ids, and modules array (from library_programme_modules: titre, duree_hours, objectifs_pedagogiques, modalite_evaluation). Client is left for the user to set in the wizard before submitting. No direct creation from Library — user reviews and submits from the wizard.

---

## 6. Formation create updates

- **Evaluation model**: Per-module evaluation only. In Step 2 each module has its own **Modalité d’évaluation** (select from the 4 options). Step 3 keeps only **Suivi de l’assiduité** at formation level; remove the formation-level “Comment évaluez-vous les acquis?” card group (or repurpose as a default applied to new modules only). Schema: each `modules[]` item has `modalite_evaluation`; no `evaluationMode` at root.
- **Load**: In [formations/creer/+page.server.ts](<src/routes/(app)/formations/creer/+page.server.ts>), replace mock `targetPublics` and `prerequisites` with DB queries filtered by workspace (`target_publics`, `prerequisites`). Keep loading `thematiques` (topics) from DB as today (or adjust if they become workspace-scoped).
- **Submit**: Persist `target_public_ids` and `prerequisite_ids` (via junction tables `formation_target_publics`, `formation_prerequisites`) and persist `objectifs_pedagogiques` and `modalite_evaluation` **per module** on each inserted `modules` row (from form `modules[].objectifs` and `modules[].modalite_evaluation`). Remove formation-level `evaluationMode` from the form/schema; keep only `suiviAssiduite` at formation level. Update [formations/creer/schema.ts](<src/routes/(app)/formations/creer/schema.ts>) so each module has `modalite_evaluation`; remove or repurpose the single `evaluationMode` field.

---

## 7. Deal ↔ Library Programme and formation prefill

- **Deal form** (create/edit): add an optional field “Programme (intérêt du lead)” or “Programme ciblé” that allows selecting a Library Programme from the workspace (dropdown or searchable select). Save to `deals.library_programme_id`.
- **Close deal and create formation**: **Direct creation** (one action, no wizard). In the action that creates a formation when closing a won deal, if `deal.library_programme_id` is set:
  - Load the library programme and its library_programme_modules (with library_module details).
  - Create the formation with name, duree, topic_id, modalite, objectifs, client (from deal), and copy target_publics and prerequisites from the programme into formation junction tables.
  - Create one `modules` row per programme module (order_index, name from library_module titre, duration_hours, objectifs_pedagogiques, modalite_evaluation).
  - Set `deals.formation_id` to the new formation; redirect to the new formation page. Keep `library_programme_id` for traceability.

---

## 8. “Add module from Library” (two places)

- **Formation create, Step 2 (Programme)**: Add a button “Ajouter un module depuis la bibliothèque” next to “Ajouter un module”. Opens a modal or picker listing Library Modules; user selects one; add a new entry to the form’s `modules` array with data copied from the chosen Library Module (titre → title, duree_hours → durationHours, objectifs_pedagogiques → objectifs, modalite_evaluation). User can adjust before submit.
- **Formation detail/edit page** (programme/modules section): Same action “Ajouter un module depuis la bibliothèque”. Opens picker; user selects one; server creates a new `modules` row for that formation with data copied from the chosen Library Module (name, duration_hours, objectifs_pedagogiques, modalite_evaluation, order_index = next). No link is kept to the library module (copy, not reference).

---

## 9. Qualiopi wording and UX

- Use consistent French labels: “Objectifs pédagogiques”, “Modalité d’évaluation”, “Public cible”, “Pré-requis”, “Modalité” (Distanciel/Présentiel/Hybride/e-Learning), “Programme de formation”, “Module”. Prefer “Intitulé” or “Titre” for the programme title in the Library context.
- Keep the Library layout simple: primary nav between Modules and Programmes; secondary actions (create, use) visible; list filters and sort clearly labeled.

---

## 10. Implementation order (suggested)

1. **Migrations**: reference tables (`target_publics`, `prerequisites`), enum `modalites_evaluation`, `library_modules`, `library_programmes`, junction tables for programme ↔ target_publics, prerequisites, modules; extend `modules` and `formations` (or add formation junction tables); add `deals.library_programme_id`. Apply migrations and run Drizzle generate/push as per [.agent/workflows/database-migration.md](.agent/workflows/database-migration.md).
2. **Drizzle schema + relations**: update [schema.ts](src/lib/db/schema.ts) and [relations.ts](src/lib/db/relations.ts).
3. **Permissions and config**: bibliotheque permission, sitemapPermissions for `/bibliotheque`.
4. **Bibliothèque layout**: layout with nav to Modules / Programmes; redirect `/bibliotheque` → `/bibliotheque/modules` (or dashboard).
5. **Library Modules**: list, create, edit, delete, “Ajouter à une formation”.
6. **Library Programmes**: list, create, edit, delete, “Créer une formation” (prefill).
7. **Formation create**: load target_publics and prerequisites from DB; persist them and module objectifs/evaluation.
8. **Deals**: add programme selector; in “close and create formation”, prefill from programme when `library_programme_id` is set.
9. **Formation edit**: “Ajouter un module depuis la bibliothèque” with copy into `modules`.

---

## 11. Files to add or touch (summary)

| Area             | Files                                                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB               | New migrations; [src/lib/db/schema.ts](src/lib/db/schema.ts), [src/lib/db/relations.ts](src/lib/db/relations.ts)                                                                             |
| Config           | [src/lib/settings/config.ts](src/lib/settings/config.ts), [src/lib/server/permissions.ts](src/lib/server/permissions.ts)                                                                     |
| Layout           | [src/routes/(app)/bibliotheque/+layout.svelte](<src/routes/(app)/bibliotheque/+layout.svelte>), +layout.server.ts; redirect or dashboard at +page                                            |
| Modules          | [src/routes/(app)/bibliotheque/modules/+page.svelte](<src/routes/(app)/bibliotheque/modules/+page.svelte>), +page.server.ts; creer, [id]/modifier (and optional [id] detail)                 |
| Programmes       | [src/routes/(app)/bibliotheque/programmes/+page.svelte](<src/routes/(app)/bibliotheque/programmes/+page.svelte>), +page.server.ts; creer, [id]/modifier                                      |
| Formation create | [src/routes/(app)/formations/creer/+page.server.ts](<src/routes/(app)/formations/creer/+page.server.ts>) (load ref data, persist target_public/prerequisite and module objectifs/evaluation) |
| Deals            | Deal create/edit page and server (programme selector); close-and-create-formation action (prefill from programme)                                                                            |
| Formation edit   | Formation detail or edit flow: “Add module from Library” action and server logic                                                                                                             |

This plan keeps the Library as the single source of templates, uses real reference data for Public cible and Pré-requis, and ties deals to a programme so that closing and creating a formation prefills from that programme.
