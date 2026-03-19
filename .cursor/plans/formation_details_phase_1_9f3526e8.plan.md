---
name: Formation Details Phase 1
overview: Transform the Formation detail page into a gamified, Qualiopi-compliant quest tracker with 8 tabs (Apercu, Fiche, Actions, Programme, Seances, Formateurs, Apprenants, Finances), master-detail quest system, 3-tier sounds, animations, inline editing, and enhanced creation wizard.
todos:
  - id: data-model
    content: "Migration + Drizzle schema: quest_phase enum, extend formation_actions (phase, quest_key, assignee_id, guidance_dismissed), new quest_sub_actions table, new formation_audit_log table (schema only)"
    status: pending
  - id: quest-templates
    content: "Create src/lib/formation-quests.ts with 22 quest templates (Conception: 9, Deploiement: 4, Evaluation: 9), sub-action definitions, dependency graph, helper functions (getQuestsForFormation, createFormationQuests, getNextQuest, shouldAutoAdvanceStatus, calculateDueDates)"
    status: pending
  - id: nav-tabs
    content: "Extend nav-tabs.svelte: add dot property to TabItem, ensure 8-tab horizontal scrolling on mobile, auto-scroll active tab into view"
    status: pending
  - id: header
    content: "Redesign formationButtonGroup in site-header.svelte: editable name, FOR- prefix, ProgressRing component, Link/History buttons, functional dropdown (copy info, delete dialog)"
    status: pending
  - id: fiche-tab
    content: "New route formations/[id]/fiche/: 3 sections (Informations generales, Logistique, Financement) with InlineEditableField components, updateField server action, deal link if applicable"
    status: pending
  - id: actions-tab
    content: "Redesign formations/[id]/suivi/: master-detail layout, QuestList + QuestPhaseGroup + QuestCard (left), QuestWorkspace + QuestSubAction + QuestGuidance (right), phase collapse/reveal animations, server actions (updateQuestStatus, toggleSubAction, updateAssignee, updateDueDate, dismissGuidance)"
    status: pending
  - id: sounds-animations
    content: "Create src/lib/sounds.ts (Web Audio API, 3-tier: micro tick, medium chime, macro level-up), LevelUpToast component, wire Svelte transitions (slide, fly, scale) for phase collapse/reveal, sub-action checkmarks, progress ring animation"
    status: pending
  - id: apercu-tab
    content: "Redesign formations/[id]/+page.svelte as dashboard: NextActionCard hero, Key Info summary, Participants summary, Upcoming Sessions, Financial Summary (cost/margin/TJM), Recent Activity feed"
    status: pending
  - id: creation-wizard
    content: "Enhance formations/creer/: add Step 3 (People: formateur + apprenants) and Step 4 (Financement), update schema.ts with new Zod fields, wire createFormationQuests() on creation with auto-assignment"
    status: pending
  - id: list-page
    content: "Update formationCard.svelte and formations/+page.svelte: FOR- prefix, notification dots, mini progress bar, include quest completion stats in server query"
    status: pending
  - id: phase2-stubs
    content: Create stub routes for formations/[id]/apprenants/ (move learner list from old overview + add/remove) and formations/[id]/finances/ (simple financial card), update layout.svelte with all 8 tabs + icons
    status: pending
isProject: false
---

# Formation Details Page — Phase 1

Full specification: `[.cursor/plans/formation-details-phase1.md](.cursor/plans/formation-details-phase1.md)`

## Architecture Overview

```mermaid
flowchart TD
    subgraph header [Header]
        EditableName["Editable Name + FOR-id"]
        StatusBadge["Status Badge"]
        ProgressRing["Progress Ring"]
        ActionButtons["Link | History | Dropdown"]
    end

    subgraph tabs [8 Tabs with Icons + Notification Dots]
        Apercu["Apercu - Dashboard"]
        Fiche["Fiche - Inline Edit"]
        Actions["Actions - Quest Tracker"]
        Programme["Programme - Phase 2"]
        Seances["Seances - Phase 2"]
        Formateurs["Formateurs - Phase 2"]
        Apprenants["Apprenants - Stub"]
        Finances["Finances - Stub"]
    end

    subgraph questSystem [Quest Tracker - Master Detail]
        QuestList["Left: Quest List by Phase"]
        QuestWorkspace["Right: Sub-actions + Guidance"]
        Sounds["3-tier Sound Effects"]
        Animations["Svelte Transitions + CSS"]
    end

    header --> tabs
    Actions --> questSystem
```

## Data Model

Extend `formation_actions` table with `phase` (new `quest_phase` enum), `quest_key`, `assignee_id`, `guidance_dismissed`. Create new `quest_sub_actions` child table. Create `formation_audit_log` table (schema only, populated in Phase 2). See spec sections 1a-1e.

Key files:

- `[src/lib/db/schema/enums.ts](src/lib/db/schema/enums.ts)` -- add `questPhase` enum
- `[src/lib/db/schema/formations.ts](src/lib/db/schema/formations.ts)` -- extend `formationActions`, add `questSubActions`, `formationAuditLog`
- New migration in `supabase/migrations/`

## Quest Template System

New file `src/lib/formation-quests.ts` replaces `[src/lib/formation-workflow.ts](src/lib/formation-workflow.ts)`. Defines 22 Qualiopi-compliant quests across 3 phases (Conception: 9, Deploiement: 4, Evaluation: 9). Each quest has sub-actions, dependencies, due date offsets, and conditional applicability by formation type/funding. Helpers: `getQuestsForFormation()`, `createFormationQuests()`, `getNextQuest()`, `shouldAutoAdvanceStatus()`. Full quest list in spec section 2b.

## Phase 1 Tabs

- **Apercu** -- Dashboard: Next Action hero card, Key Info summary, Participants summary, Upcoming Sessions, Financial Summary (cost/margin/TJM), Recent Activity feed. All read-only with "Voir tout" links.
- **Fiche** (new route) -- 3 inline-editable sections: Informations generales, Logistique, Financement. Uses `InlineEditableField` pattern from contacts. Shows deal link if created from deal.
- **Actions** -- Master-detail layout (~300px quest list left, workspace right). Quests grouped by 3 vertical phases. Phase collapse + reveal animations on completion. Level-up toast. 3-tier sounds (micro/medium/macro). Mobile: stacked with back button.
- **Apprenants** (new stub) -- Move learner list from current overview, add/remove functionality.
- **Finances** (new stub) -- Simple card with TJM, montant accorde, margin.
- **Programme, Seances, Formateurs** -- Keep current behavior.

## Header Redesign

- Editable formation name (click-to-edit in `[site-header.svelte](src/lib/components/site-header.svelte)`)
- `FOR-{idInWorkspace}` prefix (UI-only, numeric stays in DB)
- Small `ProgressRing` showing quest completion %
- Link button (copies URL), History button (placeholder toast)
- Dropdown: "Copier les informations" (plain text to clipboard), "Supprimer" (archive or hard delete dialog)
- Remove: "Modifier la formation", "En discuter avec..."

## NavTabs Enhancement

- Add `dot` property to `[nav-tabs.svelte](src/lib/components/nav-tabs.svelte)` `TabItem` type
- 8 tabs with icons + labels always visible
- Horizontally scrollable on mobile
- Notification dots: overdue quests (Actions tab), missing signatures (Seances tab)
- Dismissal via localStorage "last viewed at" timestamps

## Sound System

New `src/lib/sounds.ts` using Web Audio API (no audio files). Three tiers: micro (sub-action tick), medium (quest chime), macro (phase level-up). Short, non-annoying, toggleable via localStorage preference.

## Enhanced Creation Wizard

Modify `[formations/creer/](<src/routes/(app)`/formations/creer/>) to 4 steps: Basics, Programme, People (formateur + apprenants), Financement. On creation, call `createFormationQuests()` to generate quests + sub-actions, auto-assign to admin/secretary.

## List Page Updates

- `[formationCard.svelte](src/lib/components/custom/formationCard.svelte)`: FOR- prefix, notification dot, mini progress bar
- `[formations/+page.server.ts](<src/routes/(app)`/formations/+page.server.ts>): include quest completion stats in query

## New Files (19)

`src/lib/formation-quests.ts`, `src/lib/sounds.ts`, 12 new components in `src/lib/components/formations/` and `src/lib/components/custom/`, 2 new routes (`fiche/`, `apprenants/`, `finances/`), 1 migration

## Modified Files (16)

Schema files (3), components (3), layout files (2), page files (4), creation wizard (3), list page (2)
