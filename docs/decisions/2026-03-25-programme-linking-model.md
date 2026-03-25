# Decision: Programme ↔ Formation Linking Model

**Date:** 2026-03-25  
**Status:** Accepted  
**Context:** Wave 1 of Formation backlog (items 1+2)  
**Stakeholders:** Anthony (developer), Marie (end user persona)

---

## Summary

When a Bibliothèque Programme is linked to a Formation, the Formation receives a **snapshot copy** of the programme's modules and data. Edits are local to each Formation. Two-way sync is available but always **explicit and user-initiated**.

---

## Core Model: Copy-on-Link with Explicit Sync

### Rule 1 — Snapshot at link time

When Marie links Programme X to Formation A, the system copies Programme X's current modules (with all fields, supports, questionnaires) into Formation A as Formation-owned data. Formation A records `programmeSourceId = X` for traceability.

**Rationale:** Each Formation is an independent operational unit. Its pedagogical content must be self-contained for Qualiopi audit purposes.

### Rule 2 — Local edits by default

When Marie edits modules from Formation A's Programme tab, changes are local to Formation A only. A subtle indicator shows "modified from source." Marie can choose to "Push changes back to Bibliothèque" when ready.

**Rationale:** Keeps Marie in control. Her Formation is her workspace; she shouldn't worry about side effects on other formations.

### Rule 3 — Source update notifications (active formations only)

When Marie edits Programme X directly in the Bibliothèque, active/upcoming formations that reference Programme X receive a soft notification on the Programme tab at next visit: "The source programme was updated on [date]. Review changes / Pull updates / Ignore."

Completed/past formations are **never** notified and **never** affected. Their data is frozen for audit purposes.

**Rationale:** Past formations are historical records. Active formations deserve awareness, not forced changes.

### Rule 4 — Independent copies per formation

When Marie links the same Programme X to Formation B, Formation B gets a fresh copy of Programme X's **current** state — not Formation A's modified version. Each formation's copy is independent.

**Rationale:** Formations are independent operational units. Marie may customize pedagogical content per client or audience.

### Rule 5 — Library deletion doesn't break formations

If Marie deletes a module from Programme X in the Bibliothèque, existing formations are not affected. Their copies are independent. Active formations that haven't pulled yet see the update notification (Rule 3).

If Marie deletes Programme X entirely from the Bibliothèque, formations keep their copied modules intact. `programmeSourceId` becomes null (FK `onDelete: set null`). The Formation's Programme tab shows "Source programme has been deleted" with neutral tone, and modules remain fully editable.

**Rationale:** The Formation's pedagogical content must survive independently. This is a Qualiopi compliance requirement.

### Rule 6 — Programme change on a Formation

When Marie changes Formation A from Programme X to Programme Y, the system asks what to do with existing modules:
- **Replace** existing modules with Programme Y's modules (with confirmation showing what will be lost)
- **Add alongside** existing modules (append Programme Y's modules after current ones)
- **Cancel** the change

The `programmeSourceId` updates to Y upon confirmation.

### Rule 7 — Frozen state definition

A Formation is considered frozen/past when its status reaches a terminal state (e.g., "Terminée", "Archivée"). Until then, it is active and eligible for programme update notifications.

Frozen formations never receive sync prompts, update notifications, or automatic data changes from the Bibliothèque.

---

## Sync Mechanics

### Push (Formation → Bibliothèque)

Marie edits modules in a Formation and wants to update the source programme. The system:
1. Shows a diff of what changed vs. the source programme.
2. Asks for confirmation.
3. Updates the Bibliothèque programme with the Formation's current module data.

### Pull (Bibliothèque → Formation)

The source programme was updated in the Bibliothèque. Marie visits the Formation's Programme tab and sees a notification. She can:
1. **Review changes** — see what's different.
2. **Pull updates** — replace Formation modules with the current Bibliothèque state (with confirmation if local edits exist).
3. **Ignore** — dismiss the notification; it won't reappear unless the source changes again.

---

## Programme Picker UI

- **Trigger:** "Choisir" (no programme linked) or "Changer" (switch programme) button on the Programme tab.
- **Pattern:** Full-screen modal dialog with programme cards, search by name, and filter by thématique/sous-thématique.
- **Selection:** Single-select. Clicking "Sélectionner" triggers the link flow (with collision handling per Rule 6 if modules already exist).
- **Components:** Built with shadcn-svelte.

---

## Thématique/Sous-thématique on Programmes

Programmes in the Bibliothèque (and by extension in the Formation Programme tab) should support linking to thématique and sous-thématique. This enables filtering in the picker modal and organization in the Bibliothèque listing.

*(Field details to be finalized in the module/programme field alignment discussion.)*

---

## References

- [UX Foundation](/docs/foundations/mentore-manager-formations-ux-foundation.md) — principles that guided these decisions
- [Backlog 2026-03-24](/docs/backlog-2026-03-24.md) — items 1 and 2
- [Wave Plan](/.cursor/plans/formation-backlog-wave-plan_66ed39c5.plan.md) — execution context
