# Roadmap

High-level product direction for Mentore Manager.

## Current Focus — Chunk 1: Core PDF Templates

**Branch**: `feat/formations-v2`
**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md`

Implement the 3 remaining document types that have all required data in the schema today: **feuille d'émargement** (proof mode), **devis**, **ordre de mission**. Fix the convention participant count bug and wire real pricing. Add workspace financial defaults and `prixConvenu` to formations.

No auto-generation, no lifecycle states, no Documents tab UX changes — just the PDF templates and the `document-generator.ts` switch cases, following the existing patterns (convention, convocation, certificat).

## Next — Chunk 2: Document Lifecycle + Documents Tab UX

Rich status per document type with automatic transitions (email sent → envoyé, quest completed → signé, etc.). Contextual generation prompts on the Documents tab (quest-aware banners). Phase grouping. Regeneration prompt when data changes.

**Requires further brainstorming** before implementation: exact UX layout, batch generation, deep-link protocol, "régénérer" prompt design.

## Upcoming — Chunks 3–4

- **Chunk 3: Auto-generation triggers** — Feuille d'émargement blank (Mode 1) auto-generated J-1 for présentiel. Proof PDF auto-generated after signatures. Cron infrastructure decision needed.
- **Chunk 4: Deal devis + inheritance** — Generate devis from Deal page. Bridge to Formation on conversion (auto-complete quest). "Hérité du deal" badge.

Both chunks require brainstorming before implementation.

## Future — Chunk 5+

- **Evaluation tracking + Attestation** — Per-learner structured evaluation results. Attestation PDF with individual competency data. Requires extensive brainstorming (data model, questionnaire evolution, UX).
- **Postmark phase 2** — Webhooks, delivery tracking, reminder template fixes, ctaUrl in quest emails.
- **E-mail produit unifié** — Workspace invitations, other CRM flows on Postmark.
- **Signature overlay** — pdf-lib apposition on signed convention/ordre de mission returns.

## Completed Milestones

- **Vague 2 — Séances + émargement (2026 Q2)** — AM/PM splitting, formateur émargement, Postmark email links, batch session creation, calendar UX. Decisions: `docs/decisions/2026-04-02-wave2-seances-emargement-decisions.md`.
- **E-mails formation via Postmark** — Templates for séances (signing links) + suivi (quests). `formation_emails` logging.
- **Documents formation (partiel)** — Convention, convocation, certificat PDF generation + storage. Documents tab with server actions for all declared types.

---

*Dernière mise à jour : 2026-04-07 — restructuré en chunks alignés sur le document de décisions.*
