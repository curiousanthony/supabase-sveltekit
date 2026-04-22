# Brainstorm Session — Document Generation System

**Date**: 2026-04-07
**Duration**: Extended brainstorming session
**Participants**: User + orchestrated subagent team (Qualiopi expert, UX designer, product synthesizer, data model explorer, deals analyst)

## Session Summary

Deep-dive brainstorming on how document generation should work across the entire formation lifecycle. Specialist subagents were launched in parallel, then made to communicate to resolve tensions between Qualiopi compliance requirements and UX simplicity.

## Key Outcomes

1. **15-section design decision document** written at `docs/decisions/2026-04-07-document-generation-system.md`
2. **Backlog restructured** into 5 ordered chunks with clear dependencies and brainstorming gates
3. **Roadmap updated** to reflect the chunked approach
4. **Current sprint** set to Chunk 1 (core PDF templates + convention fix)

## Decisions Made

- 3 PDF types to build now (feuille_emargement, devis, ordre_mission); attestation deferred
- Rich document lifecycle states with automatic transitions (no manual status management for Marie)
- Dual-mode émargement PDF (blank pre-session for présentiel + proof post-session for all)
- Workspace-level financial defaults for devis (TVA, payment terms, validity)
- `prixConvenu` field on formations (negotiated price, may differ from `prixPublic`)
- Prompt-based regeneration (not silent auto-regen)
- Deal devis bridging deferred to Chunk 4
- Attestation blocked by missing evaluation tracking schema (Chunk 5)

## Tensions Resolved

- **Qualiopi vs UX on lifecycle**: Qualiopi wanted 5-6 manual states; UX wanted 3 flat states. Resolution: rich states BUT automatic transitions. Marie manages actions, system infers states.
- **Émargement PDF purpose**: Qualiopi wanted pre-session printable; UX wanted post-session proof. Resolution: both modes, digital system is primary, physical is backup.

## Topics Deferred for Future Brainstorming

These MUST be brainstormed before their respective chunks are implemented:

1. **Chunk 2 prerequisites**: Documents tab UX layout, batch generation, deep-link protocol, "régénérer" prompt design
2. **Chunk 3 prerequisites**: Cron infrastructure (SvelteKit vs pg_cron vs edge functions), notification UX for auto-generated docs
3. **Chunk 4 prerequisites**: Deal documents UI, deal→formation document bridging mechanism
4. **Chunk 5 prerequisites**: Evaluation tracking data model, questionnaire system evolution, per-learner results granularity
5. **Cross-cutting**: Devis accepté/refusé exact UX, document versioning policy, signature overlay timing

## Process Improvement Noted

User requested that when parallel subagents produce contradictory recommendations, the orchestrator should force a follow-up round where each specialist receives the other's findings before a final decision is made. This was applied in this session (synthesis subagent received both Qualiopi and UX reports).
