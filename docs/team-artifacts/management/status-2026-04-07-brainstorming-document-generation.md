# Session Summary — Document Generation Brainstorming

**Date**: 2026-04-07  
**Type**: Brainstorming + design decisions + project tracking update

## What Happened

Full brainstorming session on the document generation system for formations. Specialist subagents contributed:

- **Qualiopi expert**: Legal requirements per document type, content mandates, timing rules
- **UX designer**: Optimal generation flow, lifecycle UX, Documents tab improvements
- **Product synthesizer**: Resolved tensions between Qualiopi and UX recommendations
- **Deal/devis analyst**: Analyzed the Deal → Formation → Devis relationship
- **Data model explorer**: Mapped evaluation/questionnaire schema gaps

## Key Decisions Made

See `docs/decisions/2026-04-07-document-generation-system.md` for the full record (15 sections).

Summary:
1. **Scope**: Build feuille_emargement + devis + ordre_mission; defer attestation
2. **Lifecycle**: Rich per-type statuses, almost all automatic transitions
3. **Émargement**: Dual-mode PDF (blank pre-session for présentiel, proof post-session for all)
4. **Devis pricing**: Workspace defaults + `prixConvenu` on formation
5. **Deal bridge**: Deferred to Chunk 4
6. **Auto-generation**: Deferred to Chunk 3; manual first
7. **Regeneration**: Prompt-based ("données ont changé")

## Project Tracking Updated

- `docs/project/backlog.md` — Restructured into 5 chunks + email fixes + other
- `docs/project/roadmap.md` — Rewritten with chunk sequence and prerequisites
- `docs/project/current-sprint.md` — Focused on Chunk 1 items with definition of done

## Topics Requiring Future Brainstorming

These are explicitly documented in the decisions doc §15 and in each chunk's notes in the backlog. They must be brainstormed at the start of the relevant chunk's implementation, not skipped:

1. **Before Chunk 2**: Documents tab UX (layout, batch generation, deep-links, regeneration prompt design)
2. **Before Chunk 3**: Auto-generation infrastructure (cron approach), notification UX
3. **Before Chunk 4**: Deal documents UI, other deal-level documents
4. **Before Chunk 5**: Evaluation tracking data model, questionnaire evolution, attestation content

## Next Action

Start implementing **Chunk 1** — an agent in the next session can read `docs/project/current-sprint.md` and `docs/decisions/2026-04-07-document-generation-system.md` to understand exactly what to build. The sprint items are self-contained and don't require further brainstorming.
