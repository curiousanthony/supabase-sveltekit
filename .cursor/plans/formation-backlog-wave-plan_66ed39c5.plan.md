---
name: formation-backlog-wave-plan
overview: Implement the 24 Mar backlog through dependency-safe, small waves that minimize rework and defer quest CTA/highlight/nav-dot integration until all actionable destinations exist.
todos:
  - id: wave1-programme-modules
    content: Implement Wave 1 (programme linking + module alignment + two-way explicit sync + supports/questionnaires visibility)
    status: completed
  - id: wave2-seances-emargement
    content: "Implement Wave 2 (calendar UX/CRUD hardening + public emargement link visibility/copy/send + smart AM/PM splitting + Module-Formateur linking + batch creation + Postmark email integration)"
    status: completed
  - id: wave3-documents
    content: Implement Wave 3 (documents generation reliability + uploads + preview integrity)
    status: pending
  - id: wave4-formateurs-docs
    content: Implement Wave 4 (formateur CRM linking + required docs completeness integration)
    status: pending
  - id: wave5-finances
    content: Implement Wave 5 (invoice preview + finances UX polish)
    status: pending
  - id: wave6-fiche
    content: Implement Wave 6 (fiche redesign + quest-required field coverage check)
    status: pending
  - id: wave7-quests-final
    content: Implement Wave 7 (final quest CTA destinations + field highlight/autofocus + nav dot clearing semantics)
    status: pending
isProject: false
---

# Formation Backlog Wave Execution Plan

## Goal

Deliver all items from [`/Users/anthony/Coding/supabase-sveltekit/docs/backlog-2026-03-24.md`](/Users/anthony/Coding/supabase-sveltekit/docs/backlog-2026-03-24.md) in a no-backtracking order so Marie can complete every required action end-to-end.

## Locked Product Decisions

- Programme linking model: copy into Formation, then edit independently in Formation.
- Programme sync policy: explicit two-way choice each time divergence exists (Pull from Bibliotheque or Push to Bibliotheque).
- Wave size: small, tightly coupled batches.
- Quest CTA/highlight/nav-dot integration is final wave after all action surfaces exist.
- For every wave, brainstorm and validate edge cases + UI/UX decisions with the user **before** creating that wave plan and before implementation.
- Before each wave brainstorming phase, read [`/Users/anthony/Coding/supabase-sveltekit/docs/foundations/mentore-manager-formations-ux-foundation.md`](/Users/anthony/Coding/supabase-sveltekit/docs/foundations/mentore-manager-formations-ux-foundation.md) and run the `ux-reviewer` skill.
- Use subagents when relevant for focused exploration/review so the main conversation context stays clean.

## Wave Order (Approved)

1. **Wave 1 — Programme linking + Modules alignment (`1+2`)**
2. **Wave 2 — Seances + emargement links (`6+7`)**
3. **Wave 3 — Documents generation/upload (`8`)**
4. **Wave 4 — Formateurs + Formateur docs (`11+12`)**
5. **Wave 5 — Finances invoice preview/UI (`10`)**
6. **Wave 6 — Fiche UI overhaul (`9`)**
7. **Wave 7 — Quest CTA rerouting + field highlight + nav dots (`3+4+5`)**

## Key Code Areas by Wave

- Wave 1:
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/programme/+page.svelte`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/programme/+page.svelte>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/programme/+page.server.ts`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/programme/+page.server.ts>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/lib/db/schema/formations.ts`](/Users/anthony/Coding/supabase-sveltekit/src/lib/db/schema/formations.ts)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/lib/db/schema/biblio-modules.ts`](/Users/anthony/Coding/supabase-sveltekit/src/lib/db/schema/biblio-modules.ts)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/+layout.server.ts`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/+layout.server.ts>)
- Wave 2:
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/seances/+page.svelte`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/seances/+page.svelte>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/seances/+page.server.ts`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/seances/+page.server.ts>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/emargement/[token]/+page.server.ts`](/Users/anthony/Coding/supabase-sveltekit/src/routes/emargement/[token]/+page.server.ts)
- Wave 3:
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/documents/+page.svelte`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/documents/+page.svelte>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/documents/+page.server.ts`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/documents/+page.server.ts>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/lib/services/document-generator.ts`](/Users/anthony/Coding/supabase-sveltekit/src/lib/services/document-generator.ts)
- Wave 4:
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/formateurs/+page.svelte`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/formateurs/+page.svelte>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/formateurs/+page.server.ts`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/formateurs/+page.server.ts>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/suivi/+page.server.ts`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/suivi/+page.server.ts>)
- Wave 5:
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/finances/+page.svelte`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/finances/+page.svelte>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/finances/+page.server.ts`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/finances/+page.server.ts>)
- Wave 6:
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/fiche/+page.svelte`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/fiche/+page.svelte>)
- Wave 7:
  - [`/Users/anthony/Coding/supabase-sveltekit/src/lib/components/formations/hud-banner.svelte`](/Users/anthony/Coding/supabase-sveltekit/src/lib/components/formations/hud-banner.svelte)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/lib/components/formations/suivi/quest-row.svelte`](/Users/anthony/Coding/supabase-sveltekit/src/lib/components/formations/suivi/quest-row.svelte)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/lib/components/formations/quest-guide-banner.svelte`](/Users/anthony/Coding/supabase-sveltekit/src/lib/components/formations/quest-guide-banner.svelte)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/+layout.svelte`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/+layout.svelte>)
  - [`/Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/+layout.server.ts`](</Users/anthony/Coding/supabase-sveltekit/src/routes/(app)/formations/[id]/+layout.server.ts>)

## Dependency Gates (No Rework Policy)

- Do not start Wave 7 until Waves 1-6 expose all destination actions users can actually complete.
- Do not finalize Fiche quest mappings until missing quest-required fields are identified and implemented.
- For each wave, merge only after:
  - happy-path UX manually verified,
  - quest-impacting side effects reviewed,
  - no new blocking lints/type regressions in edited files.

## Execution Pattern Per Wave

- Step 0: Confirm the previous wave is both planned and implemented before starting the next wave.
- Step 1: Read the UX foundation doc and run `ux-reviewer` for the target wave scope.
- Step 2: Brainstorm edge cases and UI/UX decisions with the user; validate decisions explicitly.
- Step 3: Create a dedicated implementation plan for that single wave only.
- Step 4: Implement data/model changes first (if any), then server actions, then UI.
- Step 5: Verify with realistic Marie flows and edge cases.
- Step 6: Record discovered dependencies and decision notes to feed the next wave.

## Wave-by-Wave Governance

- Each wave follows this strict sequence: **Brainstorm + user validation -> Wave plan -> Implementation -> Verification -> Next wave**.
- No parallel implementation across waves; order is enforced to avoid rework.
- If new edge cases appear mid-wave, pause implementation and re-validate decisions with the user before continuing.

## Wave 1 Detailed Scope

- Add existing-formation attach flow from Formation Programme tab to Bibliotheque programmes.
- Ensure module fields expected by Formation are aligned with Bibliotheque model and persisted end-to-end.
- Add divergence detection and explicit sync choice UI:
  - Pull from Bibliotheque into Formation copy.
  - Push Formation changes back to Bibliotheque source.
- Show linked module supports/questionnaires in Formation Programme context.
- Define conflict/edge behavior for deleted source programme/module/relation.

## Risks to Track

- Duplicate CTA target mapping logic currently exists in multiple files; postpone centralization until Wave 7.
- Seances emargement currently learner-centric in parts of the flow; formateur handling may require schema-aware UI branches.
- Documents UI exposes generation options that may be partially implemented in generator services.
- Nav dots are currently data-driven booleans; acknowledgment-based clearing rules must be explicit in Wave 7.
