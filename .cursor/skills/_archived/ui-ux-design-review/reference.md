# UI/UX Design Review — Reference

## Example finding (for the report)

```markdown
### F1. Too many steps to create a module

- **Where:** `/bibliotheque/modules` → "Nouveau module" → form
- **Current:** User must: (1) click list CTA, (2) land on creer, (3) fill 5 fields, (4) scroll to find Submit, (5) click Submit. No draft. Total 5+ clicks and scroll.
- **Expected:** Same outcome in ≤3 decisive actions (e.g. CTA → form with sticky submit → done), with optional "Save as draft".
- **Evidence:** Hypothesis "create in 3 clicks" refuted. Counted 5 clicks + 1 scroll to submit.
- **Severity:** Medium – Annoyance (repeated daily by admins).
```

## Example plan frontmatter (for .cursor/plans)

Plans in this project use YAML frontmatter and a markdown body. Example:

```yaml
---
name: "[Feature] UX improvements from review YYYY-MM-DD"
overview: "Apply UI/UX review recommendations for [feature/route]: reduce steps, add empty states, fix error feedback."
todos:
  - id: reduce-create-steps
    content: "Reduce 'create module' flow to ≤3 clicks; add sticky submit and optional draft"
    status: pending
  - id: empty-state-modules
    content: "Add empty state on /bibliotheque/modules with CTA to creer"
    status: pending
  - id: validation-messages
    content: "Show inline validation messages on module form (required fields, format)"
    status: pending
isProject: false
---
```

Then the body describes implementation details, file paths, and acceptance criteria per todo.

## Where reviews live

- **Reviews:** `docs/ux-reviews/<feature-or-route-slug>.md`
- **Plans:** `.cursor/plans/<feature_slug>_ux_<short_hash>.plan.md`

Create `docs/ux-reviews/` if it does not exist when saving the first review.
