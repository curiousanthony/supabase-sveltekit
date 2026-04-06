---
name: project-tracker
description: >
  Ensures project documentation stays current: design decisions, backlog, wave plans, and
  session recaps. Updates docs/decisions/, docs/backlog-*.md, and .cursor/plans/ at every
  stage of development. Use after completing features, making design decisions, finishing a
  plan, at session boundaries, or when the user says "update docs", "track progress",
  "what's left", "update the backlog", "document this decision", "mark as done",
  "update the plan". Complements the Notion-based suivi-de-projet skill with repo-local
  documentation that persists across sessions.
disable-model-invocation: true
---

# Project Tracker

Keep repo-local project documentation current. This skill complements the Notion-based `suivi-de-projet` skill -- Notion is for sprint/ticket management, this is for design decisions, backlogs, and implementation plans that live in the repo.

## When to Trigger

- **After any validated design decision** -> create or update decision doc
- **After completing a plan task** -> update `.plan.md` todo status
- **After completing or scoping work items** -> update backlog
- **At session boundaries** -> ensure all work is documented
- **Before implementation** -> update docs with decisions from brainstorm phase
- **After implementation** -> mark completed items, add discovered items

---

## File Locations and Formats

### Design Decisions: `docs/decisions/`

**Naming**: `YYYY-MM-DD-slug.md` (e.g., `2026-04-02-wave2-seances-emargement-decisions.md`)

**Template**:

```markdown
# [Decision Title]

**Date**: YYYY-MM-DD
**Context**: [What prompted this decision]
**Wave/Feature**: [Which wave or feature this relates to]

## Decisions

### 1. [Decision Name]
**Choice**: [What was decided]
**Rationale**: [Why -- include UX foundation principle if applicable]
**Alternatives considered**: [What else was evaluated]
**Qualiopi impact**: [Which indicators are affected, if any]

### 2. [Next Decision]
...

## Open Questions
- [Anything deferred or needing future validation]
```

### Backlog: `docs/backlog-*.md`

The most recent backlog file is the active one. Find it with:

```
ls -t docs/backlog-*.md | head -1
```

**Update rules**:
- Mark completed items with a status note: `**[Completed -- Wave 2]**`
- Mark in-progress items: `**[In Progress -- Wave 2]**`
- Add new items discovered during implementation at the bottom
- Never delete items -- mark them with status changes

### Wave Plans: `.cursor/plans/`

**Update the frontmatter todos** when task status changes:

```yaml
todos:
  - id: task-id
    status: completed  # was: pending
```

Valid statuses: `pending`, `in_progress`, `completed`, `cancelled`

### Session Recaps

If the user requests a recap, use the `session-recap` skill. The project-tracker skill focuses on structured documentation, not session summaries.

---

## What to Update and When

| Event | Update |
|-------|--------|
| Design decision validated | Create/update `docs/decisions/YYYY-MM-DD-*.md` |
| Plan task completed | Update `.plan.md` todo status to `completed` |
| Plan task started | Update `.plan.md` todo status to `in_progress` |
| New work item discovered | Add to backlog + plan if applicable |
| Backlog item completed | Mark in backlog file |
| Wave started | Mark in umbrella wave plan |
| Feature fully shipped | Update backlog, plan, and wave plan |

---

## Checklist Before Ending a Session

Before the conversation ends or switches to a different feature:

- [ ] All completed tasks marked in the `.plan.md`
- [ ] Any new design decisions recorded in `docs/decisions/`
- [ ] Backlog reflects current state
- [ ] Any discovered work items added to plan or backlog
- [ ] If work was done that wasn't in the plan, it's been added retroactively

---

## Creating New Documentation

If the project doesn't have a backlog or decisions folder:

1. **Backlog**: Create `docs/backlog-YYYY-MM-DD.md` with numbered items
2. **Decisions**: Create `docs/decisions/` directory and first decision doc
3. **Plans**: Plans are managed by `.cursor/plans/` convention -- don't create outside this

Always prefer updating existing files over creating new ones.
