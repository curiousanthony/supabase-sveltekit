# Product & Qualiopi Analysis: T-14 — Batch Generation for Per-Learner Documents

**Reviewer's takeaway:** The ticket's three acceptance criteria describe a feature skeleton; building it correctly requires resolving seven untreated edge cases, explicit per-learner audit log rows (not an aggregate), a concurrency cap, a formation-level prerequisite gate for certificat before per-learner preflight, and strict reuse of the T-13 preflight/resume-banner infrastructure to avoid creating a parallel code path that bypasses preflight.

---

**Date:** 2026-04-20  
**Analyst:** product-analyst  
**Ticket:** T-14 — Batch generation for per-learner documents  
**Decision source:** `2026-04-09-chunk2-document-lifecycle-ux.md` §8  
**Status:** in_progress  

---

## 1. Marie's Job-to-be-Done for "Générer pour tous"

Marie has a formation starting in 4 days with 12 learners. She needs:

1. Every learner to receive their convocation before the start date (Qualiopi indicator C3-I11).
2. All 12 PDFs generated in one action — not 12 separate "Générer" clicks.
3. An immediate, scannable summary: who got a document, who was blocked, and a direct link to fix each blocker.
4. The ability to re-run for the blocked learners after fixing data — without re-generating the 10 who already succeeded.

**Concrete success state:** Marie clicks "Générer pour tous" on the Convocations group card. A progress modal shows "10 / 12 générées". Two rows appear in red: "Jean Dupont — e-mail manquant [Compléter →]" and "Aïcha Benali — e-mail manquant [Compléter →]". She fixes both contacts, returns, clicks "Générer pour tous" again, and this time the 2 remaining generate successfully (the 10 already generated are skipped). She can now email all 12 from the Documents tab.

---

## 2. Scenarios That Must Be Supported

### 2a. Happy path — all 12 learners ready

- Server runs `evaluatePreflight` for each learner (with their `contactId`).
- All 12 pass. Batch generates sequentially (or capped parallel — see §4).
- Progress indicator shows `12 / 12`.
- Success toast: "12 convocations générées."
- Group card counter updates: "Convocations (12/12 générées)".

### 2b. Mixed — some block, some warn, some ready

- Learners with blocks: skipped, listed in failure summary with `[Compléter →]` links using the T-13 `?preflightFocus=email&returnTo=...` pattern.
- Learners with warnings only: batch CAN proceed for them IF the user has pre-acknowledged the warning category (e.g. "NDA manquant") once for the batch — not once per learner. Requiring per-learner warning acknowledgement for a warning that applies to the formation as a whole (e.g. missing NDA) would be severe UX friction.
- Summary format: "8 générées, 2 ignorées (avertissement), 2 bloquées."

### 2c. All blocked — no documents created

- Server returns 0 successes.
- Clear, non-alarming summary: "Aucune convocation générée — tous les apprenants ont au moins un blocage."
- Each learner listed with their specific blocker and `[Compléter →]` fix link.
- No partial state in the DB: if all fail at preflight, no document rows are written.

### 2d. Pre-existing documents — idempotency decision (UNRESOLVED — see §7)

The ticket is silent on what happens when a learner already has a convocation in status `genere` or `envoye`.

**Options:**
- **Skip** (safest default): if a current (non-`remplace`) convocation exists for a learner, skip them. Report as "déjà générée".
- **Regenerate via T-12 path**: apply `replaceDocument()` logic — old row gets `status = 'remplace'`, new row is created. Preserves audit trail.
- **Ask per learner**: too much friction for a batch operation.

**Recommendation:** Default to Skip for `envoye`/`signe`/`archive` status (document has left the system). For `genere` status (never sent), apply the T-12 in-place replace. This matches `regenerateAll` behavior in `+page.server.ts` lines 396-480 and is consistent.

---

## 3. Qualiopi Compliance Notes

### 3a. Audit trail — per-learner rows (REQUIRED)

**Recommendation: one `formation_audit_log` row per learner document generated.**

Rationale: Qualiopi auditors verify that each participant received their convocation (C3-I11) and certificat (C3-I17). An aggregate "12 convocations générées" log row cannot prove individual delivery. The audit log must record:

```
actionType: 'document_batch_generated'
entityType: 'formation_document'
entityId: <new document id>
newValue: { documentType: 'convocation', contactId: '...', batchId: '<uuid>' }
userId: <from server locals — never from client input, per T-46>
```

`batchId` links all per-learner rows to the triggering batch action, enabling both per-learner and aggregate queries. Do NOT write only an aggregate row — this is a Qualiopi audit gap.

### 3b. Equal treatment — partial success is legally acceptable

If 8/10 succeed and 2 fail, the 8 generated documents are valid. Marie can fix the 2 and re-run. The messaging must not imply that the formation is non-compliant — only that 2 learners are not yet covered. Suggested wording: "8 convocations générées. 2 apprenants nécessitent une action avant génération."

The preflight system enforces the same blocking rules in batch as in single-doc generation. No bypass is possible — `assertPreflightOrThrow` is called per-learner on the server, just as in the `generateDocument` action.

### 3c. Preflight cannot be bypassed in batch

This is non-negotiable. `evaluatePreflight` MUST be called once per learner per document type on the server before calling `generateDocument`. The client-side progress UI is cosmetic; it does not gate generation. The server action is the enforcement point. The `regenerateAll` action (lines 430-448 in `+page.server.ts`) already demonstrates this pattern correctly — batch generation must mirror it exactly.

### 3d. Qualiopi indicators touched

| Indicator | Description | Relevance |
|-----------|-------------|-----------|
| C3-I11 | Convocation des participants avec délai suffisant | Batch convocation generation directly serves this |
| C3-I17 | Remise d'une attestation/certificat | Batch certificat generation |
| C3-I06 | Traçabilité des actions de formation | Per-learner audit log rows |
| C1-I02 | Publicité des informations sur les prestations | Not directly affected |

**Compliance alignment: ADEQUATE** — the feature satisfies the generation need. Gaps exist in audit granularity (per-learner rows) and idempotency handling (duplicate prevention).

---

## 4. Edge Cases the Ticket Omits

### 4a. Cancellation mid-batch

If the user closes the progress modal or navigates away while the server action is running, the action continues server-side (SvelteKit form actions are fire-and-forget once submitted). Partial writes WILL occur — some learners get documents, some don't. The UI must handle re-entry gracefully: on next load, the group card shows "(8/12 générées)" and "Générer pour tous" only targets the remaining 4. This works IF idempotency (§2d) is implemented correctly. Without it, re-clicking generates duplicates.

### 4b. Concurrent batch invocations (two browser tabs)

Two simultaneous `generateBatch` calls for the same formation + document type will race. Each will call `evaluatePreflight` independently and both may pass, resulting in duplicate documents per learner. **Recommendation:** Add a per-(formationId, documentType) advisory lock or a server-side idempotency check (query for existing `genere` docs before generating) within the server action. This is the same risk that exists for `regenerateAll` today and should be addressed in both.

### 4c. Server timeout / partial-write recovery

PDF generation is CPU-heavy and slow. A batch of 12 may exceed SvelteKit's default request timeout (30s). **Recommendation:** Either (a) use streaming responses / SSE to report per-learner progress without a single long-lived request, or (b) cap the batch at a safe limit and document it. Option (a) is the superior UX but significantly increases implementation scope. Minimum viable: sequential generation with a generous server timeout, clearly documented cap (e.g. max 20 learners per batch call).

### 4d. Zero eligible learners

If the formation has 0 enrolled learners (or all are blocked for a reason other than data), "Générer pour tous" should be disabled (not just hidden). Tooltip: "Aucun apprenant éligible pour ce type de document." This prevents a confusing empty progress modal.

### 4e. B2B companyId + per-learner contact has no email

This is the T-13 C1 bug transposed to batch. The formation-level preflight check (`client_manquant`) now correctly uses `clientId || companyId`. However, for convocation batch, the per-learner check is `hasLearnerWithEmail` — which in the current `evaluatePreflight` checks whether ANY learner has an email, not whether the SPECIFIC learner being generated for has one. In batch mode, this check must be scoped to the specific `contactId` being processed, not the formation aggregate. **This is a semantic change required for batch that does not exist in the current preflight engine.** A new preflight context field `contactEmail: string | null` must be added and checked per-learner.

### 4f. Certificat: formation-level prerequisite before per-learner loop

`evaluatePreflight` for `certificat` checks `hasSignedEmargements` — this is a formation-level flag (are all past séances fully signed?). This check applies the same result to all 12 learners. It is a gate that should be evaluated ONCE before the per-learner loop, not repeated 12 times with the same result. If the gate fails, the entire batch is blocked (not a per-learner failure) and the user should be directed to complete émargements before retrying.

**Recommended architecture:**
1. Run formation-level prerequisite checks (convention signed? emargements complete?) once.
2. If any formation-level prerequisite fails → abort entire batch with a single clear message.
3. Run per-learner data checks (`contactEmail`, etc.) for each learner in the loop.

This distinction is not modeled in the current `evaluatePreflight` API. The `kind: 'prerequisite'` field exists but is not split by scope.

### 4g. Concurrency cap — sequential vs limited parallel

PDF generation is CPU-bound (likely ~1–2s per document). For 12 learners:
- Sequential: ~15–25s total. Safe, simple, easy to track progress.
- Parallel (all 12): risks server OOM / timeout.
- Limited parallel (3 at a time with `Promise.allSettled` batches): ~6–9s, manageable memory.

**Recommendation:** Sequential (one at a time) for the MVP. Add a `BATCH_CONCURRENCY = 3` constant for future tuning. The `regenerateAll` action uses a sequential `for...of` loop — follow that pattern.

### 4h. Idempotency — double-click protection

If Marie clicks "Générer pour tous" twice in quick succession, two server actions fire. Without a lock or idempotency key, she gets duplicate rows. **Recommendation:** Disable the button immediately on first click (client-side) AND add the server-side idempotency check described in §4b.

---

## 5. Cross-Ticket Coordination

### T-43 (preflight progress counter "X sur Y éléments prêts")

T-43 introduces "X sur Y éléments prêts" wording in the preflight dialog. The batch progress UI needs consistent terminology. **Align on:** "X / Y apprenants prêts" as the batch progress label (not "générées" until generation completes). The T-43 counter pattern should be used as a building block for the batch pre-flight summary.

### T-46 (audit log auth.uid binding)

T-14's `generateBatch` server action will write audit log rows. **Every row must use `user.id` from `event.locals` (already established pattern in `generateDocument`).** The batch action must NOT accept `userId` from form data or construct it from client input. T-46's acceptance criteria explicitly cover "any other call sites" — the implementer of T-14 must ensure the batch action is listed in T-46's audit scope so the security-analyst can verify it.

**Fields T-14 batch will write to `formation_audit_log`:**
- `userId`: from `locals.user.id`
- `formationId`: from route params
- `actionType`: `'document_batch_generated'`
- `entityType`: `'formation_document'`
- `entityId`: the new document's UUID (per-learner row)
- `newValue`: `{ documentType, contactId, batchId }`

### T-47 (Drizzle queries bypass RLS)

T-14's batch server action will introduce new Drizzle queries:
1. Load all `formationApprenants` with their `contact.email` for the formation.
2. Query existing documents per learner to implement idempotency skip.
3. Insert new `formation_documents` rows per learner.

All three queries must include the workspace scope guard (`eq(formations.workspaceId, workspaceId)` via `verifyFormationOwnership`). Flag these queries explicitly in the T-47 workspace-clause audit inventory.

### T-13 reuse — PreflightResumeBanner + FOCUS_REGISTRY + `?preflightFocus=`

The per-learner `[Compléter →]` links in the batch failure summary MUST use the existing T-13 pattern:
- URL: `?preflightFocus=email&returnTo=<encoded documents URL>`
- On the destination tab (Apprenants): `PreflightResumeBanner` shows "Reprendre la génération des convocations →"
- FOCUS_REGISTRY scrolls to the learner's email field

Do NOT invent a new "batch fix" navigation pattern. The T-13 infrastructure handles interrupted generation flows exactly. Each failed learner gets their own `[Compléter →]` link with their specific `contactId` embedded in `returnTo`, so the banner on return is scoped to that learner.

---

## 6. CTA Placement Recommendations (input for ux-designer)

### Primary placement: Documents tab type-group card

The existing `kind: 'group'` collapsible card (e.g. "Convocations (3/12 envoyées)") is the canonical entry point. The "Générer pour tous" button belongs in the card header, right-aligned, alongside the existing per-type "Générer un document" dropdown. It should be visible without expanding the card.

**Visual hierarchy:**
```
[Convocations card header]
  ← "Convocations (3/12 envoyées)"     [Générer un document ▾]  [Générer pour tous]
```

- "Générer pour tous" is a secondary action (outlined button, not filled) unless 0 documents exist for this type (then it becomes the primary action, filled).
- If all learners already have a current document: button label becomes "Régénérer pour tous" (amber outlined).

### Secondary placement: "Générer un document" dropdown

Add "Générer pour tous les apprenants" as the first item in the per-type dropdown (above the per-learner list). This supports users who discover batch via the familiar single-doc dropdown.

### Tertiary: émargement / convocation / certificat row

Per the ticket scope, a compact "Tous" badge or count chip on the group row summary is sufficient. Full CTA there would create clutter.

### Progress modal

A modal (not a toast) is required for batch operations because:
1. The operation may take 10–25s — a toast would disappear before completion.
2. The partial failure list needs scrollable space.
3. The modal can house the per-learner `[Compléter →]` links directly.

Modal dismiss should be possible mid-generation (server continues), but warn: "Génération en cours — les documents déjà créés seront disponibles dans l'onglet Documents."

---

## 7. Open Product Questions

1. **Idempotency policy for existing `genere` documents:** Skip silently, replace in-place (T-12 path), or surface as a "Régénérer" option? This affects the button label and the server action branching. Must be decided before implementation starts.

2. **Warning acknowledgement for batch:** When a formation-level warning (e.g. NDA manquant) affects all learners, should Marie acknowledge it once for the batch or per-learner? The single-doc flow requires explicit per-warning acknowledgement. Batch needs a "I acknowledge this warning applies to all" checkbox to avoid 12 identical confirmations.

3. **Batch size cap:** Is there a hard upper limit on learners per batch call (e.g. 25)? What is the UX if a formation has 50 learners? Pagination? Multiple calls? The answer affects both the server action timeout design and the progress UI.

4. **`contactEmail` per-learner preflight:** The existing `hasLearnerWithEmail` flag in `evaluatePreflight` checks formation-wide, not per-learner. Does the implementer extend the `PreflightContext` interface (adding `contactEmail?: string | null`) and update the convocation rule, or does batch implement its own per-learner email check outside `evaluatePreflight`? The former is cleaner and preserves the server-side guard; the latter risks a preflight bypass.

5. **Certificat gate sequencing:** Should the "all émargements signed" check block the entire batch (formation-level gate) or show per-learner as a block? It is semantically a formation-level prerequisite — blocking all 12 with the same message is wasteful UX. Recommend a single formation-level gate check before the loop, but this requires a small architecture decision.

---

## Foundation Alignment

| Principle | Verdict | Rationale |
|-----------|---------|-----------|
| Status-first (not data-first) | ALIGNED | The group card "(3/12 générées)" is a status-first display; batch action updates it directly |
| Proactive intelligence | NEEDS WORK | The button exists but doesn't proactively tell Marie how many are blocked before she clicks |
| Context-appropriate urgency | ALIGNED | Batch is naturally invoked when formation start is near — no added anxiety needed |
| Reward completion (don't punish incompletion) | NEEDS WORK | Partial failure summary risks feeling punishing; framing as "8 réussies, 2 à compléter" (not "2 erreurs") is critical |
| Progressive disclosure | ALIGNED | Failure detail per learner is inside the modal, not dumped on the main tab |
| Smart defaults, zero configuration | ALIGNED | "Skip already generated" as default is the right smart default — Marie shouldn't have to configure this |
| Educational through use | ALIGNED | Each failure with a `[Compléter →]` link teaches Marie what data is required |
| Peace of mind as primary goal | NEEDS WORK | Without a concurrency cap and idempotency guarantee, double-clicking or slow network can create confusion |

---

## Tensions

**Tension 1: Warning acknowledgement friction vs. compliance audit trail**
- Compliance: each warning acknowledged should be logged per-document (T-46 scope).
- UX: asking Marie to acknowledge the same warning 12 times is unacceptable.
- Resolution: implement a single batch warning acknowledgement (`warningsAcknowledged: string[]` already used in `generateDocument`), but write one audit log row per generated document that includes the acknowledged warning IDs. The acknowledgement is collected once; the audit trail records it N times.

**Tension 2: Per-learner preflight depth vs. `evaluatePreflight` API**
- Compliance: preflight must be run server-side per-learner, and must be as strict as single-doc.
- Architecture: `evaluatePreflight` currently uses `hasLearnerWithEmail` (aggregate), which is wrong for per-learner batch.
- Resolution: extend `PreflightContext` with `contactEmail?: string | null` for per-learner use. The formation-aggregate flag remains for the single-doc UI path. This is a small, non-breaking addition.

---
