# Chunk 2: Document Lifecycle + Documents Tab UX — Design Decisions

**Date**: 2026-04-09
**Status**: Accepted
**Context**: Brainstorming session for Chunk 2. Three specialists contributed: UX designer, product/Qualiopi analyst, database architect. Builds on `2026-04-07-document-generation-system.md`.
**Tickets**: T-9, T-10, T-11, T-12, T-13, T-14

---

## 1. Lifecycle States — Final Design

### Status values per document type (ASCII keys, French display labels)

**Devis**:
`genere` → `envoye` → `accepte` | `refuse` | `expire`

**Convention / Ordre de mission** (contractual):
`genere` → `envoye` → `signe` → `archive`

**Feuille d'émargement**:
`genere` → `signatures_en_cours` → `signe` → `archive`

**Convocation / Certificat** (informational):
`genere` → `envoye` → `archive`

### Terminal status: `remplace`

When a document is regenerated after being sent, the old row gets `status = 'remplace'`. This preserves audit trail while keeping the "current" document clear.

### No `brouillon` state

Documents start as `genere`. The current `'draft'` default is migrated to `'genere'`. Marie doesn't manage draft states — she generates, then sends (or doesn't).

### Cancelled formations

Add an `annule` terminal status. When a formation is cancelled, all in-flight documents (not yet `signe` or `archive`) transition to `annule`.

---

## 2. Display States — Action-Oriented

The UI does NOT show raw lifecycle states. Instead, documents show **action-oriented display labels**:

| System status | Display label | Color |
|---------------|--------------|-------|
| `genere` | **À envoyer** | amber |
| `envoye` | **En attente** | blue |
| `signatures_en_cours` | **En attente** | blue |
| `accepte` / `signe` / `archive` | **Terminé** | green |
| `refuse` / `expire` / `annule` | **Action requise** | red |
| `remplace` | *(hidden by default)* | muted |

The detailed lifecycle timeline is visible on document expand/detail.

---

## 3. Automatic vs Manual Transitions

### Automatic (system-inferred)
- `genere → envoye`: when `formation_emails` record created for this document
- `envoye → expire`: computed at read time (`expires_at < now()` for devis)
- `genere → signatures_en_cours`: when first émargement signature collected for the séance
- `signatures_en_cours → signe`: when all expected émargements have `signedAt`
- `signe → archive` / `envoye → archive`: when parent quest marked "Terminé"

### Manual (Marie's action)
- `envoye → accepte`: Marie clicks "Devis accepté" (business decision from client)
- `envoye → refuse`: Marie clicks "Devis refusé"
- Any → `archive`: Marie can manually archive
- "Marquer comme envoyé": for postal sends outside the app

### Blocked transitions
- Signed documents (convention, ordre de mission) **cannot** be regenerated. Marie is guided to create an avenant (future feature) instead.
- `archive` and `remplace` are terminal — no transitions out.

---

## 4. Documents Tab Layout — Urgency-First, Not Phase-First

### Decision: No phase grouping as default

Marie thinks in urgency, not audit phases. Phase grouping contradicts her mental model. Instead:

- **Default view**: flat list sorted by urgency (action needed first, then recent)
- **Phase chips**: small muted labels on each document row (Conception / Déploiement / Évaluation)
- **Optional toggle**: "Grouper par phase" for audit-prep scenarios
- **Per-learner collapsing**: e.g. "Convocations (5/12 envoyées)" with expand-on-click. Auto-expand if any document has an error.

### Rationale

The Suivi tab already provides phase-structured workflow. Documents tab = reference library with action prompts. Clear role separation: Suivi = guided workflow, Documents = document management.

---

## 5. Contextual Prompts (T-10)

### Per-document inline indicators (not global banners)

When quest context suggests a document should be generated, show an inline prompt in the Documents tab:

- "Le devis est prêt à être généré — [Générer →]"
- Driven by quest state via `?quest=devis` query param from Suivi deep-links

### Quest → Documents deep-link protocol

`/formations/[id]/documents?quest=devis` → highlights or scrolls to the relevant document type section with the contextual prompt.

---

## 6. Pre-Flight Validation (T-13)

### Before generation, show a checklist

- Green checks for ready data
- Red X with "[Compléter →]" links for missing data
- Links navigate to the correct tab with field focus

### Blocking vs warning

- **Block**: Missing data that makes the document legally non-compliant (e.g. no client for convention, no séance for émargement)
- **Warn**: Missing optional data (e.g. no logo, no NDA number)

---

## 7. Regeneration (T-12)

### Per-document stale indicators

When `formation.updatedAt > document.generatedAt`, the specific document gets an inline warning:

- "Les données ont changé — [Voir les changements] [Régénérer]"
- No global banner (ambiguous when 5 documents are stale)

### Versioning rules

- `genere` (never sent): replace in place (update row)
- `envoye` or later: create new row, old gets `status = 'remplace'`
- `signe`: block regeneration (contractual document — suggest avenant)

---

## 8. Batch Generation (T-14)

### "Générer pour tous" button per document type

- Available for per-learner types (convocation, certificat)
- Progress indicator during batch
- Partial failure handling: show which learners failed with fix paths (e.g. "Missing email for Jean Dupont — [Compléter →]")

---

## 9. Devis Accept/Refuse

### Accessible from both Suivi and Documents tab

- Documents tab: action buttons on the devis row (when `status = 'envoye'`)
- Suivi tab: quest sub-action "Devis accepté par le client"
- Both surfaces trigger the same status transition
- Accepting a devis unlocks the convention quest

---

## 10. Compliance Warnings

### Cross-reference lifecycle with formation dates

- "Convention non signée, formation dans 3 jours" — amber warning
- "Convention non signée, formation commencée" — red warning
- Shown on Documents tab and Suivi HUD

---

## 11. Schema Changes

### New columns on `formation_documents`

| Column | Type | Purpose |
|--------|------|---------|
| `accepted_at` | timestamptz | Devis acceptance timestamp |
| `refused_at` | timestamptz | Devis refusal timestamp |
| `expires_at` | timestamptz | Devis expiry (computed at generation) |
| `archived_at` | timestamptz | Archive timestamp |
| `status_changed_at` | timestamptz | Last transition timestamp |
| `status_changed_by` | uuid FK→users | Who triggered the change |
| `replaces_document_id` | uuid FK→self | Version chain |

### Default change

`status` default: `'draft'` → `'genere'`. Migrate existing rows.

### Existing columns to activate

- `signed_at` — use for `signe` transition
- `sent_at` / `sent_to` — use for `envoye` transition

### New indexes

- `(formation_id, type, status)` — composite for "current doc of type X"
- `expires_at` partial — devis expiry queries
- `replaces_document_id` partial — version chain lookups

### Transition logging

Use existing `formation_audit_log` table. No new history table needed.

### Status storage

Keep `status` as `text` (not enum). App-level validation per type via `document-lifecycle.ts` service. Consistent with existing project patterns.

---

## 12. Devis Expiry

### Query-time computation, not cron

No scheduled job infrastructure exists yet (T-17). Expiry is checked at read time:
- If `type = 'devis'` AND `status = 'envoye'` AND `expires_at < now()` → display as `expire`
- DB row stays `envoye`; optional future cron can materialize

### On regeneration of expired devis

Old devis → `remplace`. New devis gets fresh `expires_at`.

---

## 13. What This Decision Does NOT Cover

Deferred to future chunks/sessions:
- Auto-generation triggers (Chunk 3, requires T-17 scheduled jobs)
- Deal-level devis (Chunk 4)
- Attestation + evaluation tracking (Chunk 5)
- Signature overlay on PDFs (T-31)
- RLS hardening for documents (T-6, T-7 — separate track)
- Avenant workflow for signed documents

---

*This document supersedes §2, §8, §11 of `2026-04-07-document-generation-system.md` for Chunk 2 implementation decisions.*
