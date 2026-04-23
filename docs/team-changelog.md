# Team Changelog

Changes to subagent definitions and the orchestrator rule, maintained by the `team-architect` agent.

---

## 2026-04-06 — Initial subagent ecosystem

**Agent(s) modified**: All (new)
**Change type**: New system
**Rationale**: Replaced 17-skill system (1,700+ lines of overlapping orchestration) with lean subagent ecosystem: 1 orchestrator rule + 10 custom subagents. See `.cursor/plans/subagent_ecosystem_08277224.plan.md` for full design rationale.
**Changes made**:
- Created 10 subagent definitions in `.cursor/agents/`
- Created orchestrator rule `.cursor/rules/team-orchestrator.mdc`
- Archived 9 retired skills to `.cursor/skills/_archived/`
- Added `disable-model-invocation: true` to 6 knowledge skills
- Established artifact-based inter-team communication in `docs/team-artifacts/`
- Created file-based project management in `docs/project/`
- Added meeting digest workflow with `/digest-meeting` command

---

## 2026-04-13 — Learnings review (2026-04-09 — 2026-04-10)

**Agent(s) modified**: implementer, reviewer, security-analyst, architect, ux-designer
**Change type**: Enhancement
**Rationale**: `docs/project/learnings.md` had a backlog of entries after `## Reviewed 2026-04-08` (tickets T-1, T-2, T-3, T-4, T-5, T-6, T-7, T-8, T-9, T-10, T-28, T-32, T-33, T-34, T-35, T-36, T-37, T-39). Recurring themes: SvelteKit router timing, Kanban consistency, filter edge cases, PDF/i18n, exhaustive switches, transactional + optimistic concurrency, Storage/RLS path patterns, Postmark templates-only, shared layout loads, quest `orderIndex`, and transactional audit logging.
**Changes made**:
- Added a compact **Pitfalls (from project learnings)** section to `implementer.md` covering the above patterns as implementation guardrails.
- Added **Learnings to enforce in review** bullets to `reviewer.md` for transactions, switches, status helpers, and navigation timing.
- Extended `security-analyst.md` with indirect workspace RLS via `EXISTS` chains and Storage policy/path + safe replace/remove notes.
- Added **Pitfalls** to `architect.md` for migration truth, transactions, RLS shape, layout loads, and quest wiring.
- Extended **Quick Audit Checklist** in `ux-designer.md` for Kanban consistency and filter integrity when categories disappear.
- Reset learnings review marker to `## Reviewed 2026-04-13` in `docs/project/learnings.md`.

---

## 2026-04-20 — Learnings review (T-9 → T-13, 14 entries)

**Agent(s) modified**: implementer, architect, test-engineer
**Change type**: Enhancement
**Rationale**: 14 unreviewed learnings (T-9, T-S1, T-S2, T-34, T-6, T-7, T-28, T-37, T-35, T-36, T-12, T-11, T-17, T-13). Most were already absorbed in the 2026-04-13 round. Three new patterns surfaced: (a) generation flows that fail validation downstream of `generateDocument` leave orphaned Storage/DB rows (T-12); (b) server-side preflight checks were skipped on the Suivi quest entry point even though Documents was covered, creating a compliance gap (T-13); (c) Vercel Cron Jobs are the standard for SvelteKit-on-Vercel scheduled work with `CRON_SECRET` + service-role client (T-17).
**Changes made**:
- `implementer.md`: added two pitfalls — pre-validate lifecycle transitions BEFORE `generateDocument` writes Storage/DB rows; preflight parity across every generation entry point.
- `architect.md`: added two pitfalls — Vercel Cron Jobs setup with `CRON_SECRET` + service-role client; design preflight/compliance guards as a single shared helper invoked by every entry point.
- `test-engineer.md`: added an edge-case enumeration item — exercise EVERY route/action/cron that triggers a server-side invariant, not just the most visible path.
- Appended `## Reviewed 2026-04-20` with summary paragraph to `docs/project/learnings.md`.

---

## 2026-04-22 — Learnings review (2026-04-21 — 2026-04-22, 12 entries)

**Agent(s) modified**: implementer, architect, security-analyst, project-manager, test-engineer
**Change type**: Enhancement
**Rationale**: 12 unreviewed learnings across T-46, T-48, T-52, T-53 (×2), T-54, T-55, T-56, T-63 (×3), T-20. Six thematic clusters emerged: (1) Svelte 5 reactivity correctness (`$derived.by` type anchoring, writable override toggles); (2) data boundary discipline (fallback resolution at loader/service, brand types, raw DB row shapes); (3) schema/migration quality (dual-layer bounded integer validation, idempotent DO-blocks for enums/FKs/triggers, Drizzle circular imports); (4) cross-tenant security hardening (polymorphic-FK AND rule, explicit WITH CHECK on UPDATE); (5) project tracking hygiene (dependency direction causality, batch ticket ID cross-check); (6) pure service testability (Drizzle schema mocking with vi.mock).
**Changes made**:
- `implementer.md`: added 13 new pitfall bullets — fallback resolution boundary (T-56), route path drift (T-56), writable override for feature toggles (T-54), long-form text Modifier/Enregistrer pattern (T-54), `$derived.by` type anchoring (T-53), field migration completeness (T-53), smart form defaults are additive only (T-53), shared descriptor utility modules (T-53), raw DB row shapes in pure services (T-52), dual-layer bounded integer validation (T-55), seed parity across creation paths (T-48), TypeScript brand types for trusted data (T-46).
- `architect.md`: added 4 new pitfall bullets — Drizzle circular schema imports are safe (T-63), idempotent Supabase migration DO-blocks for enums/FKs/triggers with `public.set_updated_at()` (T-63), dual-layer bounded integer constraints (T-55), seed helpers for multi-path entity creation (T-48).
- `security-analyst.md`: added 2 new RLS bullets — polymorphic-FK AND rule (never OR between two EXISTS) citing cross-tenant pivot risk (T-20), explicit WITH CHECK on every UPDATE policy (T-20). **[Moderate]**
- `project-manager.md`: added 2 new ticket lifecycle sections — dependency direction (causality of work, not logical follow-up) (T-54), batch ticket creation ID cross-check hygiene (T-63). **[Moderate]**
- `test-engineer.md`: added 1 new test-writing convention bullet — Drizzle schema mocking with vi.mock + Symbol to avoid pulling postgres-js/pglite into Vitest (T-52).
