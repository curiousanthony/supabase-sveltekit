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
