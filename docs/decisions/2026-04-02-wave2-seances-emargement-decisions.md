# Wave 2: Séances + Émargement -- Design Decisions

**Date**: 2026-04-02
**Context**: Wave 2 brainstorming session -- designing the Séances tab redesign and émargement system for Qualiopi compliance
**Wave/Feature**: Wave 2 (backlog items 6 + 7)
**Plan**: `.cursor/plans/wave_2_séances_émargement_90da2f4c.plan.md`

---

## Decisions

### 1. Smart Demi-Journée Splitting

**Choice**: Auto-split émargement rows at the data level, not the session level. Marie creates one session for a full day; the system generates 2 émargement rows (AM/PM) per participant when duration > 4 hours.

**Rationale**: Qualiopi Q11 requires twice-daily attendance signatures. Forcing Marie to manually create half-day sessions would add friction and risk human error. The 4-hour threshold follows French demi-journée conventions (art. R.6313-3). Aligns with UX foundation principle: **proactive intelligence** -- if the app CAN do it automatically, it SHOULD.

**Alternatives considered**:
- Manual half-day splitting (rejected: too many clicks, error-prone)
- Auto-splitting sessions into 2 (rejected: Marie can't control exact AM/PM times; system might guess wrong lunch break timing)

**Qualiopi impact**: Directly satisfies Q11 (émargement quotidien -- signatures par demi-journée). Zero compliance gaps if implemented correctly.

**Implementation**:
- Sessions <= 4h: 1 émargement row per participant, period derived from start time (before 13h = morning, from 13h = afternoon)
- Sessions > 4h: 2 émargement rows per participant (morning + afternoon)
- New enum `emargement_period` ('morning', 'afternoon') + `period` column on `emargements`
- Unique constraint updated to include period

### 2. Module-Formateur Linking

**Choice**: 1 Module = 1 Formateur (optional). Formateur is assigned at the module level in the Programme tab, auto-fills on séance creation (read-only), and is denormalized to `seances.formateurId` for compliance records.

**Rationale**: Séances are per-module. Each module is typically taught by one formateur. Making Marie pick the formateur every time she creates a séance is redundant. Aligns with: **smart defaults** (formateur from module), **control without configuration** (meaningful decision at module level, not repeated at séance level).

**Alternatives considered**:
- Formateur picker on séance dialog (rejected: redundant, violates 1 Module = 1 Formateur principle)
- Formateur at formation level only (rejected: doesn't scale when different modules have different formateurs)
- Multiple formateurs per module (rejected: adds complexity without clear benefit for MVP)

**Qualiopi impact**: Q09c (affectation du formateur), Q17 (moyens humains), Q21 (compétences des intervenants). The denormalized `seances.formateurId` preserves who ACTUALLY taught, which is critical for audit evidence.

**Key rules**:
- `modules.formateurId` is formation-specific (not on `biblio_modules`)
- Séance creation: formateur auto-fills from module, read-only in dialog
- Module formateur change: warns about future séances, offers bulk update
- Formateurs tab gains a read-only "Affectations aux modules" summary
- Formateur picker on modules: formation pool first + "Ajouter un formateur" for workspace search

### 3. Formateur Émargement

**Choice**: Include formateur in émargement system. Auto-create formateur émargement rows alongside learner rows, with the same AM/PM splitting logic. Formateur signs via the same public signing page.

**Rationale**: Qualiopi requires both learner AND formateur signatures on attendance sheets. Omitting the formateur would create a compliance gap. The public page detects signer type and displays appropriate labels.

**Qualiopi impact**: Q11 -- formateur signature is mandatory per demi-journée.

### 4. Postmark Email Integration for Émargement Links

**Choice**: Full email integration using Postmark's `rappel_emargement` template. Individual send per participant + bulk "Envoyer à tous" action per séance.

**Rationale**: Marie currently must copy and send ~15 individual links manually -- a 45-click nightmare for a single session. Aligns with: **productive dependency** (app is faster than manual process), **peace of mind** (one click for compliance).

**Implementation**:
- `sendEmargementEmail`: sends to one contact for one séance (first unsigned token as link)
- `sendAllEmargementEmails`: bulk send to all unsigned participants for a séance (1 email per unique contact, even if they have 2 unsigned period rows)

### 5. Batch Session Creation

**Choice**: 3-step wizard dialog for creating multiple sessions: template (module, time, location) -> date selection (multi-select calendar or date range) -> participants. No formateur picker -- derived from module.

**Rationale**: Marie often needs to schedule 5-10 sessions of the same module across different dates. Creating them one by one is tedious. The wizard reduces this to one interaction. Aligns with: **smart defaults** (all learners pre-selected), **zero config** (formateur from module).

### 6. Calendar UX Fixes

**Choice**: Decouple click-to-create from calendar clicks. Clicking a date with sessions scrolls to them. Creation is always via explicit "Ajouter une séance" button.

**Rationale**: The current click-to-create on empty dates is confusing and accident-prone. Marie expects clicking a date to show its sessions, not create one. Aligns with: **irreversible actions should require explicit intent**.

**Additional changes**: Wider calendar column (60/40 split), bigger cells, mobile order swap (list first), dot colors for émargement status (green/amber/red).

### 7. Séance Formateur is Locked

**Choice**: On the séance creation/edit dialog, the formateur is read-only (displayed, not editable). To change the formateur, Marie must change the module's formateur in the Programme tab.

**Rationale**: Prevents inconsistency between module assignment and séance records. For substitutions (formateur sick), Marie changes the module formateur + selectively bulk-updates affected séances. A proper substitution mechanism is deferred to a future wave.

### 8. Module Formateur Change Warning

**Choice**: When Marie changes a module's formateur, the app warns about existing future séances with the old formateur and offers to bulk-update them: "Le formateur de ce module a changé. Mettre à jour N séances à venir ?"

**Rationale**: Prevents silent data staleness. Marie stays in control (can accept or decline). Aligns with: **peace of mind** (no surprises), **proactive intelligence** (app detects the impact).

### 9. Formateur Picker Scope on Modules

**Choice**: Show formation formateurs first in the combobox, with a separator + "Ajouter un formateur" option that searches the full workspace. If a workspace formateur is selected who isn't in the formation pool, auto-add them.

**Rationale**: Most common case: Marie picks from the small pool of formateurs already associated with this formation. For new assignments, she can still search the full workspace without leaving context. Auto-adding to the formation pool prevents dangling references.

---

## Open Questions

- **Substitution frequency**: If formateur substitutions happen often, the module-level-change-then-bulk-update flow might be too heavy. Monitor usage and consider a dedicated substitution mechanism in a future wave.
- **Postmark sender domain**: Verify the sending domain is configured for production email delivery.
- **Migration safety**: The unique constraint change on émargements requires careful migration -- existing rows default to 'morning'.
