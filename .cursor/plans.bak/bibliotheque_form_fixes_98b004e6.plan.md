---
name: Bibliotheque Form Fixes
overview: Fix broken Select components, replace with CardCheckboxGroup and Stepper patterns from /formations/creer, update textarea placeholders with Qualiopi examples, add missing fields, deduplicate header/page content, and create alert-dialog component.
todos:
  - id: fix-module-selectors
    content: Replace broken Select with CardCheckboxGroup (modaliteEvaluation) and Stepper+ButtonGroup (dureeHeures) in modules creer + [id] pages; update textarea placeholders
    status: completed
  - id: fix-programme-selectors
    content: Replace broken Select with CardCheckboxGroup (modalite + statut) and add Stepper+ButtonGroup for dureeHeures in programmes creer + [id] pages
    status: completed
  - id: fix-programme-schema
    content: Add dureeHeures to programme Zod schema and update creer/[id] server actions to read/write it
    status: completed
  - id: fix-supports-detail
    content: Add Programme association picker to supports/[id] page and server (load programmes, update biblio_programme_supports)
    status: completed
  - id: header-dedup-list-pages
    content: Remove duplicate h2/count from list pages; fix empty state CTA to say Nouveau X
    status: completed
  - id: header-dedup-detail-pages
    content: Move back button + title to header via server loaders; relocate delete to danger zone; remove inline back/title
    status: completed
  - id: fix-questionnaire-selectors
    content: Replace broken Select for type with CardCheckboxGroup in questionnaires creer + [id]
    status: completed
  - id: create-alert-dialog
    content: Create alert-dialog UI component (bits-ui AlertDialog wrapper)
    status: completed
isProject: false
---

# Bibliothèque Form Fixes

## Root cause: broken Select.Root usage

All `Select.Root` components in the bibliotheque forms use `{#snippet child({ open })}` on the trigger — this passes `open` (a boolean) instead of spreading `{ props }` onto a real button element, so the trigger never receives click handlers and the dropdown never opens.

The fix is not to patch the Select, but to replace the card-style pickers with the same `CardCheckboxGroup` + `CardCheckbox` pattern used in `[src/routes/(app)/formations/creer/+page.svelte](<src/routes/(app)`/formations/creer/+page.svelte>), and the duration `Input[type=number]` with `Stepper` + `ButtonGroup`.

---

## Changes per file

### 1. Module create — `[src/routes/(app)/bibliotheque/modules/creer/+page.svelte](<src/routes/(app)`/bibliotheque/modules/creer/+page.svelte>)

- **Modalité d'évaluation**: Replace `Select.Root` → `CardCheckboxGroup` (single, `disallowEmpty={false}`) with 4 `CardCheckbox` cards: QCM (ClipboardList icon), QCU (CircleDot icon), Pratique (Wrench icon), Projet (FolderKanban icon). Bind to a local `modaliteArray` state, write hidden input `name="modaliteEvaluation"`.
- **Durée (heures)**: Replace `Input[type=number]` → `Stepper` (min=0.5, step=0.5) + `ButtonGroup` with quick picks: 3.5h, 7h, 14h, 21h, 35h.
- **Contenu placeholder**: `"Ex: Introduction aux fondamentaux du sujet, présentation des concepts clés, démonstration des outils. Ce contenu est transmis via des exposés interactifs, des études de cas et des exercices pratiques guidés."`
- **Objectifs pédagogiques placeholder**: `"À l'issue de ce module, le stagiaire sera capable de :\n• [Verbe d'action] + [compétence mesurable]\n• Utiliser [outil/méthode] pour [objectif concret]\n• Évaluer [résultat attendu] dans un contexte professionnel"` (Qualiopi Indicateur 6)

### 2. Module edit — `[src/routes/(app)/bibliotheque/modules/[id]/+page.svelte](<src/routes/(app)`/bibliotheque/modules/[id]/+page.svelte>)

Same changes as above, initializing `modaliteArray` from `mod.modaliteEvaluation` and Stepper `bind:value` from `mod.dureeHeures`.

### 3. Programme create — `[src/routes/(app)/bibliotheque/programmes/creer/+page.svelte](<src/routes/(app)`/bibliotheque/programmes/creer/+page.svelte>)

- **Modalité**: Replace `Select.Root` → `CardCheckboxGroup` (single) with 4 `CardCheckbox` cards: Présentiel (School), Distanciel (Monitor), Hybride (Shuffle), E-Learning (GraduationCap) — exact same icons as `/formations/creer`.
- **Statut**: Replace broken `Select.Root` → small `CardCheckboxGroup` (single, `disallowEmpty={true}`) with 4 compact cards: Brouillon, En cours, Publié, Archivé.
- **Durée (heures)** _(currently missing from Programme forms)_: Add new field with `Stepper` + `ButtonGroup` (7h, 14h, 21h, 35h, 70h). Server action already reads `dureeHeures` but current form never submits it — the stored `dureeHeures` on `biblio_programmes` stays null. Fix the server action to also save `dureeHeures` from the form.

### 4. Programme edit — `[src/routes/(app)/bibliotheque/programmes/[id]/+page.svelte](<src/routes/(app)`/bibliotheque/programmes/[id]/+page.svelte>)

Same changes as above, initializing from `programme.modalite`, `programme.statut`, `programme.dureeHeures`.

Server action `update` in `[src/routes/(app)/bibliotheque/programmes/[id]/+page.server.ts](<src/routes/(app)`/bibliotheque/programmes/[id]/+page.server.ts>): add `dureeHeures` to the parsed data and the `db.update` call.

---

## Notion prototype comparison — missing/mismatched fields

| Entity         | Notion field                         | Our schema                 | Our form/detail                         | Gap                                     |
| -------------- | ------------------------------------ | -------------------------- | --------------------------------------- | --------------------------------------- |
| Modules        | Modalité d'évaluation: QCM, Pratique | QCM, QCU, Pratique, Projet | Present (broken)                        | Fix selector only                       |
| Programmes     | Durée (heures)                       | `dureeHeures` col exists   | **Not in any form**                     | Add Stepper field                       |
| Programmes     | Pré-requis (multi_select)            | stored as JSON text        | Present as checkboxes                   | No gap                                  |
| Questionnaires | All fields                           | All present                | All present                             | No gap                                  |
| Supports       | Only Name + Programmes relation      | Much richer (file/url)     | Programme link missing from detail page | Add Programme picker to Supports detail |

**Supports detail page** `[src/routes/(app)/bibliotheque/supports/[id]/+page.svelte](<src/routes/(app)`/bibliotheque/supports/[id]/+page.svelte>) and its server: add Programme association picker (load available programmes, render as badge-select, update `biblio_programme_supports` on save).

---

## Summary of files to change

- `src/routes/(app)/bibliotheque/modules/creer/+page.svelte`
- `src/routes/(app)/bibliotheque/modules/[id]/+page.svelte`
- `src/routes/(app)/bibliotheque/programmes/creer/+page.svelte`
- `src/routes/(app)/bibliotheque/programmes/creer/+page.server.ts` (add dureeHeures to insert)
- `src/routes/(app)/bibliotheque/programmes/[id]/+page.svelte`
- `src/routes/(app)/bibliotheque/programmes/[id]/+page.server.ts` (add dureeHeures to update)
- `src/routes/(app)/bibliotheque/supports/[id]/+page.svelte`
- `src/routes/(app)/bibliotheque/supports/[id]/+page.server.ts` (load programmes, add update action for links)
- `src/lib/bibliotheque/programme-schema.ts` (add `dureeHeures` to Zod schema)
