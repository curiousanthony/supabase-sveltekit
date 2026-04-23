# Project Process Learnings

Project-specific patterns for ticket management and project workflow. Read this file before creating, updating, or closing tickets.

- **`blocked_by` reflects causality of work**: `blocked_by` must mean "what code/data must exist before I can write this?" — NOT "what feels like the logical next step?". A ticket that removes UI references to a column is a prerequisite *for* the ticket that drops the column, not blocked by it. Reversed dependencies silently stall ready tickets.
- **Batch ticket creation hygiene**: After creating a batch of tickets from a planning doc, always cross-check `ls docs/project/tickets/T-*.md` against the plan's `ticket_to_task_map`. Parallel creation can grab IDs out of sequence, producing `blocked_by` pointers that reference the wrong tickets and silently stall the chain.
- **Ticket YAML integrity**: Keep `id: T-{N}` and all other ticket metadata **only** inside YAML frontmatter between `---` delimiters — never as a markdown heading like `## id:` (that corrupts frontmatter and breaks `scripts/board.sh` under `set -e` + `pipefail`).
