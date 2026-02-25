---
name: Bibliothèque MVP
overview: Build the Bibliothèque feature from scratch on a new `feat/bibliotheque-mvp` branch, creating 6 parent + 15 sub-tickets in Notion (PJT-1) and designing the full DB schema + routes based on the prototype analysis.
todos:
  - id: branch
    content: Create branch feat/bibliotheque-mvp from develop (git-workflow skill)
    status: completed
  - id: notion-tickets
    content: Create all 21 Notion tickets (6 parent + 15 sub) in PJT-1 with full content, properties, deps, sprint assignments
    status: completed
  - id: schema
    content: 'Implement Drizzle schema: biblio_modules, biblio_programmes, biblio_questionnaires, biblio_supports + all junction tables + migrations'
    status: pending
  - id: layout
    content: Page principale /bibliotheque with 4 tabs + sidebar integration
    status: pending
  - id: modules-crud
    content: 'Modules: vue liste + formulaire créer/éditer + page détail'
    status: pending
  - id: programmes-crud
    content: 'Programmes: vue liste + formulaire (with D&D modules) + page détail'
    status: pending
  - id: questionnaires-crud
    content: 'Questionnaires: vue liste + formulaire + page détail'
    status: pending
  - id: supports-crud
    content: 'Supports: vue liste + upload + page détail'
    status: pending
isProject: false
---

# Bibliothèque MVP — Plan complet

## Prototype analysis summary

From the Notion prototype (`(mm biblio)` databases), 4 entities are in scope for MVP. The **E-mails (mm biblio)** entity is excluded (not in baseline).

### Data model (Drizzle schema)

New prefix `biblio_` to avoid collision with existing `modules` table in `[formations.ts](src/lib/db/schema/formations.ts)`.

`**biblio_modules` — `src/lib/db/schema/biblio-modules.ts`

- `id`, `titre` (text, NOT NULL), `contenu` (text/rich text), `objectifs_pedagogiques` (text), `modalite_evaluation` (new enum: `QCM | QCU | Pratique | Projet`), `duree_heures` (numeric), `workspace_id` FK, `created_by` FK, `created_at`, `updated_at`

`**biblio_programmes` — `src/lib/db/schema/biblio-programmes.ts`

- `id`, `titre` (NOT NULL), `description` (rich text), `modalite` (reuse existing `modalites` enum), `prix_public` (numeric), `statut` (new enum: `Brouillon | En cours | Archivé | Publié`), `duree_heures` (numeric — auto-sum via query), `workspace_id` FK, `created_by` FK, `created_at`, `updated_at`
- Junction: `**biblio_programme_modules` (`programme_id`, `module_id`, `order_index`)

`**biblio_questionnaires` — `src/lib/db/schema/biblio-questionnaires.ts`

- `id`, `titre` (NOT NULL), `type` (new enum: `Test de niveau | Quiz / Exercice | Audit des besoins`), `url_test` (text/URL), `workspace_id` FK, `created_by` FK, `created_at`, `updated_at`
- Junctions: `biblio_programme_questionnaires`, `biblio_module_questionnaires`

`**biblio_supports` — `src/lib/db/schema/biblio-supports.ts`

- `id`, `titre` (NOT NULL), `url` (text — external URL or Supabase Storage path), `workspace_id` FK, `created_by` FK, `created_at`, `updated_at`
- Junctions: `biblio_programme_supports`, `biblio_module_supports`

### Routes structure

```
/bibliotheque                            ← main page, 4 tabs
/bibliotheque/modules                    ← list
/bibliotheque/modules/creer              ← create form
/bibliotheque/modules/[id]               ← detail + edit
/bibliotheque/programmes                 ← list
/bibliotheque/programmes/creer           ← create form (with D&D modules)
/bibliotheque/programmes/[id]            ← detail + edit
/bibliotheque/questionnaires             ← list
/bibliotheque/questionnaires/creer       ← create form
/bibliotheque/questionnaires/[id]        ← detail
/bibliotheque/supports                   ← list + upload
/bibliotheque/supports/[id]              ← detail
```

---

## Notion tickets to create (PJT-1, Pôle: Produit, Assigné: Anthony)

**6 parent tickets + 15 sub-tickets = 21 total**

### TCK-AA — Initialiser la section Bibliothèque _(parent, Fonctionnalité, Haute, M)_

- **AA1**: Page `/bibliotheque` — layout principal avec 4 onglets (Sprint 2)
- **AA2**: Vérifier l'intégration sidebar (lien `/bibliotheque` déjà présent) (Sprint 2)

### TCK-AB — Schéma DB Bibliothèque _(parent, Infrastructure, Haute, M)_

- **AB1**: Drizzle `biblio_modules` + migration → Sprint 2, bloque: AC1, AC2, AC3
- **AB2**: Drizzle `biblio_programmes` + junction `biblio_programme_modules` + migration → Sprint 2, bloqué par AB1, bloque: AD1, AD2, AD3
- **AB3**: Drizzle `biblio_questionnaires` + junctions + migration → Sprint 2, bloqué par AB1+AB2, bloque: AE1, AE2, AE3
- **AB4**: Drizzle `biblio_supports` + junctions + migration → Sprint 2, bloqué par AB1+AB2, bloque: AF1, AF2

### TCK-AC — Gestion des Modules _(parent, Fonctionnalité, Haute, L)_

- **AC1**: Vue liste `/bibliotheque/modules` — table avec colonnes Titre, Programmes, Durée, Modalité d'évaluation (bloqué par AB1)
- **AC2**: Formulaire Créer/Éditer Module — champs: titre, contenu (rich text), objectifs, modalité éval, durée (bloqué par AB1)
- **AC3**: Page détail Module `/bibliotheque/modules/[id]` (bloqué par AC1)

### TCK-AD — Gestion des Programmes _(parent, Fonctionnalité, Haute, L)_

- **AD1**: Vue liste `/bibliotheque/programmes` — table groupée par statut (bloqué par AB2)
- **AD2**: Formulaire Créer/Éditer Programme — titre, description (rich text), modalité, prix, statut + drag-and-drop modules (bloqué par AB2 + AC1)
- **AD3**: Page détail Programme `/bibliotheque/programmes/[id]` + export PDF (bloqué par AD1)

### TCK-AE — Gestion des Questionnaires _(parent, Fonctionnalité, Haute, M)_

- **AE1**: Vue liste `/bibliotheque/questionnaires` — table avec colonnes Titre, Type, URL test, Programmes (bloqué par AB3)
- **AE2**: Formulaire Créer/Éditer Questionnaire — titre, type, URL Google Forms, liaison programme/module (bloqué par AB3)
- **AE3**: Page détail Questionnaire `/bibliotheque/questionnaires/[id]` (bloqué par AE1)

### TCK-AF — Gestion des Supports _(parent, Fonctionnalité, Haute, M)_

- **AF1**: Vue liste `/bibliotheque/supports` + upload (fichier Supabase Storage ou URL) (bloqué par AB4)
- **AF2**: Page détail Support `/bibliotheque/supports/[id]` — prévisualisation, téléchargement, liaisons programme/module (bloqué par AF1)

---

## Sprint assignments

- **Sprint 2** (next sprint): AB1, AB2, AB3, AB4 (all schema), AA1, AA2
- **No sprint** (parent tickets + views/forms): AA, AB, AC, AD, AE, AF and all sub-tickets AC1–AF2

---

## Execution order (once confirmed)

1. Create branch `feat/bibliotheque-mvp` from `develop` (git-workflow skill)
2. Create all 21 Notion tickets in PJT-1 (suivi-de-projet Workflow 6)
3. (Implementation begins via individual tickets)
