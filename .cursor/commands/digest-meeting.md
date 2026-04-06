Process the latest unprocessed meeting transcript from the `meetings/` folder. Extract decisions, action items, priority changes, and contradictions. Update project files and design decisions accordingly.

Use the `project-manager` subagent (`.cursor/agents/project-manager.md`) to execute the full meeting digest workflow:

1. Read the newest transcript in `meetings/`
2. Extract decisions, action items, priority changes, contradictions
3. Update `docs/decisions/` with new design decisions
4. Update `docs/project/backlog.md` and `current-sprint.md` with changes
5. Review active `.plan.md` files — flag any that are contradicted
6. Write digest to `docs/team-artifacts/management/meeting-digest-YYYY-MM-DD.md`
7. Flag contradictions with ongoing plans and ask me to resolve
