---
name: session-recap
description: Create a concise Markdown backlog/recap file summarizing remaining work items from a conversation. Use when the user says "recap", "what's left to do", "dump the backlog", "save what we discussed", "tomorrow's work", "end of day summary", "note everything we talked about", or asks to save outstanding tasks to a file for a future session.
---

# Session Recap

Generate a date-stamped Markdown file capturing all outstanding work items from the current conversation so they can be picked up in a future session.

## Output

File: `docs/backlog-YYYY-MM-DD.md` (use today's date).

## Process

1. **Collect** every work item, feature request, bug, improvement, or TODO mentioned in the conversation.
2. **Group** items by feature area, route, or tab — whichever grouping is most natural for the project.
3. **Write each item** with:
   - A numbered heading with a short, descriptive title.
   - **Route/location** — where in the app this applies.
   - A detailed description preserving the user's original intent and context — enough that an agent reading it tomorrow can produce an implementation plan without asking clarifying questions.
   - **"What needs to happen"** — concrete bullet list of requirements.
   - **"Why it matters"** — only if the reason isn't obvious from context.
4. Keep the file **scannable**: use horizontal rules between items, bold key terms, keep paragraphs short.
5. Do not editorialize or add items the user didn't mention.

## Template

```markdown
# Backlog — DD mois YYYY

Remaining work items for [Project Name], captured end of session.

---

## 1. [Short title]

**Route**: [where in the app]

[Detailed context — what exists today, what's broken or missing.]

**What needs to happen:**

- Requirement 1
- Requirement 2
- ...

---

## 2. [Short title]

...
```

## Guidelines

- Preserve the user's vocabulary and terminology.
- Include technical hints (affected routes, components, DB tables) when the user mentions them.
- If the user references dependencies between items, note them.
- Target: under 200 lines for up to ~15 items. Go longer only if the user provided very detailed specifications.
