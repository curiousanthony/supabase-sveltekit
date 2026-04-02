---
name: team-driven-development
description: >
  Orchestrates a team of specialized subagents for feature development in Mentore Manager.
  Dynamically assembles specialists (UX reviewer, Qualiopi analyst, schema explorer, etc.)
  based on task analysis, then coordinates through Brainstorm, Plan, Document, Implement,
  and Verify stages. Use when starting a feature, implementing a plan, building new
  functionality, adding a significant UI change, or when the user says "let's build",
  "implement", "start working on", "next feature", "execute the plan". This is the
  primary development workflow for this project -- use it by default for any non-trivial work.
---

# Team-Driven Development

Primary development workflow for Mentore Manager. Analyze the task, assemble a team of specialist subagents, and deliver intentional, UX-grounded, Qualiopi-aware implementations.

## Activation Rules

**Use the full team process when:**
- Adding or changing a feature that touches UI, UX, or user flows
- Implementing from a `.plan.md` file
- Building anything that affects Qualiopi compliance
- The task touches 2+ files or crosses schema/server/UI boundaries
- Starting a new wave or major backlog item

**Skip the team (work directly) when:**
- Fixing a typo, renaming a variable, or a single-line change
- Responding to a specific code question or running a command

When in doubt, use the team.

---

## Stage Sequence

Every significant task flows through these stages. Read the relevant stage skill at the start of each.

```
1. BRAINSTORM  →  .cursor/skills/design-brainstorm/SKILL.md
2. PLAN        →  Write or update .plan.md (use writing-plans skill if available)
3. DOCUMENT    →  .cursor/skills/project-tracker/SKILL.md (update docs BEFORE coding)
4. IMPLEMENT   →  .cursor/skills/implement-with-team/SKILL.md
5. VERIFY      →  UX alignment check + project-tracker update
```

Not every task needs all 5 stages:
- **Small feature with clear plan**: Skip Brainstorm, start at Document + Implement
- **Design exploration only**: Brainstorm + Plan, stop before Implement
- **Bug fix with UX implications**: Brainstorm (quick) + Implement + Verify

---

## Dynamic Team Assembly

Before starting work, analyze the task and launch relevant specialists as **parallel subagents** (multiple Task tool calls in one message).

### Core Specialists (include when relevant)

| Specialist | Include When | Reads |
|------------|-------------|-------|
| UX Senior Designer | UI, user flows, design decisions | `.cursor/skills/ux-reviewer/SKILL.md` + `references/` |
| Product Foundation | UX alignment matters | `docs/foundations/mentore-manager-formations-ux-foundation.md` |
| Qualiopi Analyst | Sessions, attendance, documents, formateurs, compliance-adjacent features | `docs/qualiopi-formation-workflow.md` |

### On-Demand Specialists (add based on task)

| Specialist | Include When | Explores |
|------------|-------------|----------|
| Schema/DB Analyst | New tables, columns, migrations | `src/lib/db/schema/`, `src/lib/db/relations.ts` |
| Component Inventory | New UI components | `src/lib/components/`, existing routes |
| Existing Patterns Finder | Logic that might already exist | Full codebase search |
| Accessibility Reviewer | New interactive elements, forms, status displays | RGAA compliance checks |

### How to Launch

Use Task tool with `subagent_type="explore"` or `subagent_type="generalPurpose"`. Launch independent specialists in parallel.

**Subagent prompt template:**

```
You are a [ROLE] for Mentore Manager, a SaaS for French training organizations.
The primary user is Marie, an administrative manager who needs to feel guided and confident.

Task: [WHAT TO ANALYZE]
Context: [BRIEF CONTEXT]

Read these files first: [PATHS]

Return:
1. Key findings relevant to the task
2. Specific recommendations or concerns
3. Any questions that need user input before proceeding
```

The Qualiopi Analyst subagent should always cross-reference with other specialists to ensure compliance is never sacrificed for UX convenience, and UX is never sacrificed for compliance rigidity.

---

## Interaction Rules

1. **Autonomous by default** -- proceed when direction is clear from plan and design decisions
2. **Ask when uncertain** -- design tensions, edge cases, compliance concerns = pause and ask user
3. **Never guess on UX** -- if an interaction pattern could go multiple ways, ask
4. **Checkpoints** -- between major phases (schema -> server -> UI), summarize and offer to validate
5. **Qualiopi never optional** -- if a specialist flags a compliance risk, always surface it

---

## Post-Task Obligations

After completing any significant task:

1. Read `.cursor/skills/project-tracker/SKILL.md` and update docs
2. Quick UX check: "Does this pass the magic wand test? Would Marie feel guided?"
3. Update `.plan.md` todo status if working from a plan
4. If the Qualiopi Analyst flagged concerns, verify they were addressed

---

## Project Resources

| Resource | Path |
|----------|------|
| UX Foundation | `docs/foundations/mentore-manager-formations-ux-foundation.md` |
| Qualiopi Workflow | `docs/qualiopi-formation-workflow.md` |
| UX Reviewer Skill | `.cursor/skills/ux-reviewer/SKILL.md` |
| Design Decisions | `docs/decisions/` |
| Backlog | `docs/backlog-*.md` |
| Wave Plans | `.cursor/plans/` |
