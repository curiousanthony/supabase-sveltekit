# Current Sprint

Active sprint items and progress.

**Sprint**: Post-Chunk 1 — Bug Fixes + Chunk 2 Prep  
**Branch**: `feat/formations-v2`  
**Design decisions**: `docs/decisions/2026-04-07-document-generation-system.md`

## Context

Chunk 1 (Core PDF Templates + Convention Fix + Email Fixes) shipped 2026-04-08. See `docs/project/shipped.md` for details. The sprint now focuses on fixing bugs surfaced during Chunk 1 review and preparing Chunk 2 (Document Lifecycle States + Documents Tab UX).

## Items

| Status | Item | Priority | Notes |
| --- | --- | --- | --- |
| `[SPRINT]` | **BUG: Price formatting broken on documents** — amounts show "2/ 600€" instead of "2 600,00 €" | P1 | Likely in `devis.ts` and/or convention pricing section |
| `[SPRINT]` | Add `timeZone: 'Europe/Paris'` to all `toLocaleTimeString`/`toLocaleDateString` calls in document-generator + templates | P1 | Cloud hosts run UTC — session times will be wrong |
| `[SPRINT]` | Exhaustive switch for `DocumentType` in `document-generator.ts` (add `default` branch) | P2 | New types won't trigger compile errors |
| `[SPRINT]` | Type the pdfmake import (`esmRequire('pdfmake/js/index.js')` returns `any`) | P2 | Add local interface for type safety |
| `[SPRINT]` | Optimize certificat emargements query — filter by `formationId` at DB level | P2 | Currently fetches ALL emargements then filters in JS |
| `[BACKLOG]` | Logo WebP/SVG → PNG conversion for professional PDFs | P3 | Currently skipped; PDFKit only supports PNG/JPEG |
| `[BACKLOG]` | RLS: scope `formation_documents` policies to workspace | P2 | Pre-existing — currently `USING (true)` |
| `[BACKLOG]` | RLS: scope `formation-documents` storage bucket to workspace | P2 | Pre-existing — currently permissive |

## What Comes Next

**Chunk 2**: Document lifecycle states + Documents tab UX improvements. **Requires further brainstorming** on: exact UX layout, batch generation, quest→Documents deep-link protocol, regeneration prompt design. See `docs/decisions/2026-04-07-document-generation-system.md` §11 and §15.

## Definition of Done

- Price formatting displays correctly on all generated PDFs (e.g. "2 600,00 €")
- Timezone-safe date/time formatting in all document templates
- Exhaustive switch covers all `DocumentType` variants
- pdfmake import is typed
- Certificat emargement query filters at DB level

## Retrospective — Chunk 1

- pdfmake 0.3.7 CJS integration via `createRequire` works well server-side
- Convention bug (participant count) was a long-standing issue — fixed by querying correct table
- Logo support limited to PNG/JPEG due to PDFKit — acceptable for now, tracked for later
- Price formatting bug discovered post-implementation — needs immediate fix

---

*Dernière mise à jour : 2026-04-08.*
