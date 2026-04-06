---
name: implement-with-team
description: >
  Guides implementation using parallel subagents, UX verification, and structured checkpoints.
  Ensures code aligns with the UX foundation, Qualiopi requirements, and design decisions.
  Use when implementing from a plan, building features, writing server logic, or creating
  UI components. Trigger phrases: "implement", "build", "code this", "execute the plan",
  "start task", "begin implementation". Complements team-driven-development and
  design-brainstorm skills.
---

# Implement with Team

Execute implementation tasks using parallel subagents where possible, with UX verification checkpoints and mandatory documentation updates.

## Before You Start

1. **Read the plan**: If a `.plan.md` exists for this work, read it fully
2. **Check design decisions**: Read relevant files in `docs/decisions/`
3. **Identify the task scope**: What files will be touched? What's the dependency order?

---

## Parallel Subagent Strategy

### When to Parallelize

Launch parallel subagents when implementation tasks are independent:

- **Schema + exploration** can run in parallel (schema analyst + component inventory)
- **Server logic + UI exploration** can run in parallel if schema is already done
- **Multiple independent components** can be built in parallel
- **Tests + documentation** can run alongside final UI polish

### When NOT to Parallelize

- Tasks with data dependencies (server action needs schema first)
- UI components that depend on server load data shape
- Migrations that must be applied before server code can reference new columns

---

## Implementation Loop

For each task in the plan:

### 1. Pre-Implementation Check

Launch quick parallel subagents:

**UX Alignment Check** (for UI tasks):
```
Read docs/foundations/mentore-manager-formations-ux-foundation.md.
I'm about to implement: [TASK DESCRIPTION].
The design decision says: [RELEVANT DECISION].
Flag anything that might violate the foundation principles.
Return only actionable concerns, not general advice.
```

**Qualiopi Check** (for compliance-adjacent tasks):
```
Read docs/qualiopi-formation-workflow.md.
I'm implementing: [TASK DESCRIPTION].
Which Qualiopi quests (Q01-Q25) and indicators does this touch?
Are there compliance requirements I must not miss?
Return specific requirements only.
```

### 2. Build

- Follow the plan's specifications exactly
- Use existing patterns from the codebase (check `src/lib/components/` and similar routes)
- Apply the project's stack conventions (`.cursor/skills/svelte5-stack/SKILL.md`)
- For Svelte files, use the svelte-file-editor subagent type when available

### 3. Post-Implementation Verification

After completing each task:

- [ ] Does the implementation match the plan's specifications?
- [ ] Does it align with the UX foundation? (Quick mental walkthrough as Marie)
- [ ] Does it handle edge cases? (empty states, error states, mobile)
- [ ] Are French labels correct and consistent with existing UI copy?
- [ ] If compliance-related: does it satisfy the identified Qualiopi indicators?

---

## Checkpoint Pattern

**Pause and check with the user when:**

- Completing a major phase boundary (all schema done, all server logic done, starting UI)
- Discovering a design tension not covered by the plan
- A subagent flags a concern that requires a product decision
- The implementation reveals that the plan needs adjustment
- Completing the last task in a wave or feature

**Checkpoint format:**

```
## Checkpoint: [Phase Name]

**Completed:**
- [What was built, with key details]

**Key decisions made during implementation:**
- [Any micro-decisions not in the original plan]

**Discovered concerns:**
- [Edge cases, tensions, or issues found]

**Next up:**
- [What's planned next]

**Action needed?** [Continue / Validate / Adjust]
```

**Continue without checking when:**
- The plan is clear and the implementation is straightforward
- No new edge cases or tensions were discovered
- The task is a direct server-side implementation with no UX ambiguity

---

## Documentation Obligations

After completing each significant task:

1. **Update plan status**: Mark the task's todo as `completed` in the `.plan.md` frontmatter
2. **Update backlog**: If the task closes a backlog item, mark it (see `project-tracker` skill)
3. **Record new decisions**: If implementation forced a micro-decision, note it in the relevant decision doc
4. **Never leave undocumented work**: If you built something not in the plan, add it to the plan retroactively

---

## Quality Gates

Before declaring a task complete:

1. **Linter check**: Run ReadLints on edited files
2. **Type safety**: Ensure no `any` types were introduced
3. **UX foundation alignment**: Would Marie feel guided? Does this pass the magic wand test?
4. **Qualiopi compliance**: Does this help, or at minimum not hinder, Marie's audit readiness?
