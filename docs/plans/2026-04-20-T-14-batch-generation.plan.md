---
title: "T-14 — Batch generation for per-learner documents"
date: 2026-04-20
ticket: T-14
ref: docs/team-artifacts/design/2026-04-20-T-14-batch-generation-ux-review.md
target: src/routes/(app)/formations/[id]/documents/
tasks:
  - id: extend-preflight-context
    title: "Add contactEmail to PreflightContext for per-learner semantics"
    status: done
  - id: batch-server-action
    title: "Add generateForAll server action with formation-prereq + per-learner loop"
    status: done
  - id: audit-log-batch-id
    title: "Per-document audit rows with shared batchId, userId from locals"
    status: done
  - id: batch-progress-dialog
    title: "Batch progress + result dialog component (per-learner rows)"
    status: done
  - id: cta-placement
    title: "Add 'Générer pour tous' CTA to group card + dropdown"
    status: done
  - id: per-learner-fix-links
    title: "Per-learner [Compléter →] links + apprenants tab focusContactId handler"
    status: done
  - id: idempotency
    title: "Skip envoye/archive learners; replace-in-place genere"
    status: done
  - id: cancellation
    title: "Client-driven cancellation token (no rollback of completed)"
    status: done
  - id: concurrency-cap
    title: "Server: bounded parallel inline pool (3 slots)"
    status: done
  - id: testing-checklist
    title: "Unit + Playwright happy path + partial-failure recovery"
    status: done
---

# T-14 — Batch Generation for Per-Learner Documents

All work targets `src/routes/(app)/formations/[id]/documents/` unless noted.

Per-learner doc types in scope: `convocation`, `certificat`. Other per-learner types
(`attestation` — future chunk) are not in scope here.

---

## Task 1: Extend PreflightContext with `contactEmail` `[extend-preflight-context]`

**Problem.** `evaluatePreflight` currently checks `hasLearnerWithEmail` (aggregate over the
whole formation). For batch, this is wrong: we need to verify the **specific** learner being
generated for has an email. Without this fix, batch generates convocations for learners with
no email recipient — a Qualiopi audit gap (C1, ux-review).

**Files**
- `src/lib/preflight/document-preflight.ts` — modify
- `src/routes/(app)/formations/[id]/documents/+page.server.ts` — modify call sites
- `src/lib/preflight/document-preflight.test.ts` — add tests (or sibling `__tests__` location matching existing convention)

**Implementation steps**

1. In `document-preflight.ts`, extend `PreflightContext`:
   ```ts
   export interface PreflightContext {
     documentType: string;
     contactId?: string;
     contactEmail?: string | null;       // NEW — per-learner email for batch & single
     formateurId?: string;
     seanceId?: string;
     hasAcceptedDevis?: boolean;
     hasLearnerWithEmail?: boolean;      // KEEP — formation-aggregate, used by single-doc UI
     hasSignedConvention?: boolean;
     hasSignedEmargements?: boolean;
   }
   ```

2. In the `convocation` branch, prefer `contactEmail` when provided (per-learner mode),
   fall back to `hasLearnerWithEmail` (formation mode for single-doc UI):
   ```ts
   if (documentType === 'convocation') {
     const perLearnerMode = context.contactId !== undefined;
     const learnerEmailOk = perLearnerMode
       ? !!context.contactEmail
       : !!context.hasLearnerWithEmail;

     if (!learnerEmailOk) {
       items.push({
         id: 'email_apprenant_manquant',
         severity: 'block',
         kind: 'data',
         messageFr: perLearnerMode
           ? "L'apprenant n'a pas d'adresse e-mail"
           : "Aucun apprenant avec adresse e-mail",
         fixLabelFr: perLearnerMode
           ? "Compléter l'e-mail de l'apprenant"
           : "Compléter l'e-mail d'un apprenant",
         tab: 'apprenants',
         hrefPath: `${base(formationId)}/apprenants`,
         focusKey: 'email'
       });
     }
     // ... existing prerequisite check unchanged
   }
   ```

3. In `+page.server.ts`, update `evaluatePreflightForServer` to thread `contactEmail`:
   ```ts
   ids: { contactId?: string; contactEmail?: string | null; formateurId?: string; seanceId?: string }
   // ...
   {
     documentType,
     contactId: ids.contactId,
     contactEmail: ids.contactEmail,
     // ...rest unchanged
   }
   ```

**Key constraints**
- Keep `hasLearnerWithEmail` working — single-doc UI (line 152, current dialog) still uses
  the formation-aggregate semantics.
- `perLearnerMode` is detected by *presence of `contactId`* — do NOT add a separate flag.
- Tests: cover (a) `convocation` + no `contactId` + 1 learner with email → passes (existing),
  (b) `convocation` + `contactId` + `contactEmail: null` → blocks (NEW),
  (c) `convocation` + `contactId` + `contactEmail: 'x@y.fr'` → passes (NEW).

---

## Task 2: `generateForAll` server action `[batch-server-action]`

**Problem.** The page has no batch action. We need one that mirrors `regenerateAll`'s
proven pattern: load preflight rows once, evaluate per-learner, loop with concurrency cap,
return per-learner results.

**File:** `src/routes/(app)/formations/[id]/documents/+page.server.ts`

**Implementation skeleton** (mirror `regenerateAll` lines 375–489 exactly for shape):

```ts
generateForAll: async ({ request, params, locals }) => {
  const workspaceId = await getUserWorkspace(locals);
  if (!workspaceId) return fail(401, { message: 'Non autorisé' });
  const { session, user } = await locals.safeGetSession();
  if (!session || !user) return fail(401, { message: 'Non autorisé' });

  const isOwner = await verifyFormationOwnership(params.id, workspaceId);
  if (!isOwner) return fail(403, { message: 'Accès refusé' });

  const formData = await request.formData();
  const type = formData.get('type')?.toString();
  const warningsAcknowledgedRaw = formData.get('warningsAcknowledged')?.toString();
  const warningsAcknowledged: string[] = warningsAcknowledgedRaw
    ? warningsAcknowledgedRaw.split(',').filter(Boolean)
    : [];

  if (type !== 'convocation' && type !== 'certificat') {
    return fail(400, { message: 'Type invalide pour génération en masse' });
  }

  // ── Load preflight rows ONCE (mirrors regenerateAll) ────────────────────
  const { formationRow, workspaceRow, apprenantRows, docRows } = await loadPreflightRows(
    params.id,
    workspaceId
  );
  if (!formationRow || !workspaceRow) return fail(404, { message: 'Formation introuvable' });

  // ── Formation-level prerequisite gate (one-shot) ────────────────────────
  // For certificat: hasSignedEmargements applies to all 12 — check once.
  // For convocation: hasSignedConvention applies to all 12 — check once.
  // We evaluate once with NO contactId — any block/prerequisite at formation level fails fast.
  const formationGate = evaluatePreflightForServer(
    formationRow, workspaceRow, apprenantRows, docRows,
    type,
    { /* no contactId */ }
  );
  // Filter to PREREQUISITE-class items only (formation-wide). Per-learner data
  // checks (e.g. email) are deferred to the loop because they require contactId.
  const formationPrereqBlocks = formationGate.items.filter(
    (i) => i.severity === 'prerequisite' || (i.severity === 'block' && i.id !== 'email_apprenant_manquant')
  );
  if (formationPrereqBlocks.length > 0) {
    return fail(400, {
      message: 'Prérequis formation non remplis',
      formationBlocks: formationPrereqBlocks
    });
  }

  // ── Warning ack gate (single batch ack) ─────────────────────────────────
  const warnIds = formationGate.items.filter((i) => i.severity === 'warn').map((i) => i.id);
  const warnIdSet = new Set(warnIds);
  const sanitizedWarnings = [...new Set(warningsAcknowledged)].filter((id) => warnIdSet.has(id));
  if (warnIds.length > 0 && !warnIds.every((id) => sanitizedWarnings.includes(id))) {
    return fail(400, { message: 'Veuillez prendre connaissance de tous les avertissements.' });
  }

  // ── Existing-document idempotency map ───────────────────────────────────
  const existingByContact = new Map<string, { status: string; id: string }>();
  const existingForType = await db.query.formationDocuments.findMany({
    where: and(
      eq(formationDocuments.formationId, params.id),
      eq(formationDocuments.type, type)
    ),
    columns: { id: true, status: true, relatedContactId: true }
  });
  for (const d of existingForType) {
    if (d.relatedContactId && d.status !== 'remplace') {
      existingByContact.set(d.relatedContactId, { status: d.status, id: d.id });
    }
  }

  const SKIP_IF_STATUS = new Set(['envoye', 'signe', 'archive', 'accepte']);
  const REPLACE_IF_STATUS = new Set(['genere']);

  // ── Per-learner result accumulator ──────────────────────────────────────
  type LearnerResult =
    | { contactId: string; learnerName: string; status: 'done'; documentId: string }
    | { contactId: string; learnerName: string; status: 'skipped'; reason: 'already_sent' }
    | { contactId: string; learnerName: string; status: 'failed'; reason: string; blockingIds: string[] };

  const batchId = crypto.randomUUID();
  const results: LearnerResult[] = [];

  // ── Inline 3-slot promise pool (no p-limit dep — see comment) ───────────
  // We avoid p-limit because (a) we want zero new deps, (b) the loop is short
  // (max ~25 learners), (c) PDF generation is the bottleneck not scheduling
  // overhead, and (d) AbortSignal integration is simpler with our own pool.
  const CONCURRENCY = 3;
  const eligibleLearners = apprenantRows.filter((a) => a.contactId);
  const queue = [...eligibleLearners];
  const inFlight: Promise<void>[] = [];

  async function processLearner(learner: typeof eligibleLearners[number]) {
    const contactId = learner.contactId!;
    const learnerName = [learner.contact?.firstName, learner.contact?.lastName]
      .filter(Boolean).join(' ') || 'Apprenant';

    if (request.signal.aborted) return;

    // Idempotency: skip if already sent/signed
    const existing = existingByContact.get(contactId);
    if (existing && SKIP_IF_STATUS.has(existing.status)) {
      results.push({ contactId, learnerName, status: 'skipped', reason: 'already_sent' });
      return;
    }

    // Per-learner preflight (with contactEmail from Task 1)
    const perLearnerPreflight = evaluatePreflightForServer(
      formationRow, workspaceRow, apprenantRows, docRows,
      type,
      { contactId, contactEmail: learner.contact?.email ?? null }
    );

    try {
      assertPreflightOrThrow(perLearnerPreflight);
    } catch {
      const blockingIds = perLearnerPreflight.items
        .filter((i) => i.severity === 'block' || i.severity === 'prerequisite')
        .map((i) => i.id);
      results.push({
        contactId,
        learnerName,
        status: 'failed',
        reason: blockingIds.includes('email_apprenant_manquant') ? 'email_manquant' : blockingIds[0] ?? 'unknown',
        blockingIds
      });
      return;
    }

    try {
      const newResult = await generateDocument(
        type as DocumentType,
        params.id,
        user.id,
        { contactId }
      );

      // Replace-in-place if a 'genere' doc existed (T-12 path)
      if (existing && REPLACE_IF_STATUS.has(existing.status)) {
        await db.delete(formationDocuments).where(
          and(
            eq(formationDocuments.id, existing.id),
            eq(formationDocuments.status, 'genere')
          )
        );
      }

      await logAuditEvent({
        formationId: params.id,
        userId: user.id,                               // T-46: from locals, never client
        actionType: 'document_batch_generated',
        entityType: 'formation_document',
        entityId: newResult.documentId,
        newValue: {
          documentType: type,
          contactId,
          batchId,                                     // shared across all rows
          warningsAcknowledged: sanitizedWarnings
        }
      });

      results.push({ contactId, learnerName, status: 'done', documentId: newResult.documentId });
    } catch (err) {
      console.error(`[generateForAll] failed for contact ${contactId}:`, err);
      results.push({
        contactId,
        learnerName,
        status: 'failed',
        reason: err instanceof Error ? err.message : 'erreur génération',
        blockingIds: []
      });
    }
  }

  // Pump the pool
  while (queue.length > 0 || inFlight.length > 0) {
    if (request.signal.aborted) break;
    while (inFlight.length < CONCURRENCY && queue.length > 0) {
      const learner = queue.shift()!;
      const p = processLearner(learner).finally(() => {
        inFlight.splice(inFlight.indexOf(p), 1);
      });
      inFlight.push(p);
    }
    if (inFlight.length > 0) {
      await Promise.race(inFlight);
    }
  }

  return {
    success: true,
    batchId,
    documentType: type,
    results,
    totals: {
      done: results.filter((r) => r.status === 'done').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed: results.filter((r) => r.status === 'failed').length
    }
  };
};
```

**Key constraints**
- Mirror `regenerateAll`'s `loadPreflightRows` + `evaluatePreflightForServer` pattern — do
  NOT introduce a parallel preflight code path.
- `userId` MUST come from `locals.safeGetSession()`, never from form data (T-46).
- `request.signal.aborted` checked between learners — completed learners stay (no rollback).
- Workspace scope guard via `verifyFormationOwnership` (T-47).
- Note: this action does NOT stream progress. Per-learner live progress in the dialog is
  cosmetic (Task 4) — the server is single-shot, returns full results at end. If real
  streaming is desired in a future iteration, switch to a `+server.ts` SSE endpoint;
  for MVP, the dialog runs an animated "spinner sweep" through pending learners and
  reveals real states when the action returns.

---

## Task 3: Per-document audit rows with `batchId` `[audit-log-batch-id]`

**Problem.** Qualiopi auditors need per-learner proof, not aggregate "12 generated".

**Implementation.** Already covered inline in Task 2 — each successful per-learner generation
triggers `logAuditEvent` with `actionType: 'document_batch_generated'` and `newValue.batchId`
shared across rows. No additional file changes; this task is the *contract*: do not refactor
the audit calls into a single aggregate row.

**Files to verify**
- `src/lib/services/audit-log.ts` — confirm `logAuditEvent` signature accepts the fields
  used in Task 2; if not, extend.

**Constraints**
- One audit row per `done` result. Skipped + failed do NOT write audit rows (no document
  to attest).
- `batchId` is a `crypto.randomUUID()` — server-generated, never from client.
- Add `'document_batch_generated'` to T-46's audit scope inventory so the security analyst
  can verify it during their next pass.

---

## Task 4: Batch progress + result dialog `[batch-progress-dialog]`

**Problem.** No UI exists to confirm a batch, show progress, and recover from per-learner
failures.

**Files to create**
- `src/lib/components/documents/BatchGenerateDialog.svelte` — new component
- `src/lib/components/documents/BatchGenerateDialog.test.ts` — Vitest unit (optional MVP)

**Files to modify**
- `src/routes/(app)/formations/[id]/documents/+page.svelte` — mount + wire

**Component skeleton**

```svelte
<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Progress } from '$lib/components/ui/progress';
  import Check from '@lucide/svelte/icons/check';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import Clock from '@lucide/svelte/icons/clock';
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import MinusCircle from '@lucide/svelte/icons/minus-circle';
  import { deserialize } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';

  type LearnerRow = {
    contactId: string;
    learnerName: string;
    state: 'pending' | 'generating' | 'done' | 'skipped' | 'failed';
    failure?: { reasonFr: string; fixHref?: string };
  };

  type Props = {
    open: boolean;
    formationId: string;
    documentType: 'convocation' | 'certificat';
    learners: { contactId: string; firstName: string; lastName: string; email: string | null }[];
    warnings: { id: string; messageFr: string }[];
    onClose: () => void;
  };
  let { open = $bindable(), formationId, documentType, learners, warnings, onClose }: Props = $props();

  let phase = $state<'confirm' | 'generating' | 'result'>('confirm');
  let acknowledged = $state(false);
  let abortController: AbortController | null = $state(null);
  let rows = $state<LearnerRow[]>([]);
  let totals = $state({ done: 0, skipped: 0, failed: 0 });

  const docTypeLabel = $derived(documentType === 'convocation' ? 'convocations' : 'certificats');
  const canSubmit = $derived(warnings.length === 0 || acknowledged);
  const progressPct = $derived(
    rows.length === 0 ? 0 :
    Math.round((rows.filter((r) => r.state !== 'pending' && r.state !== 'generating').length / rows.length) * 100)
  );

  function initRows() {
    rows = learners.map((l) => ({
      contactId: l.contactId,
      learnerName: [l.firstName, l.lastName].filter(Boolean).join(' ') || 'Apprenant',
      state: 'pending'
    }));
  }

  async function submit() {
    initRows();
    phase = 'generating';
    abortController = new AbortController();

    // Cosmetic "sweep": tick rows from pending → generating in order while server runs.
    // Real states are applied when the action returns.
    let sweepIdx = 0;
    const sweep = setInterval(() => {
      if (sweepIdx >= rows.length) return clearInterval(sweep);
      rows[sweepIdx].state = 'generating';
      sweepIdx++;
    }, 600);

    try {
      const body = new FormData();
      body.set('type', documentType);
      body.set('warningsAcknowledged', warnings.map((w) => w.id).join(','));

      const response = await fetch(`/formations/${formationId}/documents?/generateForAll`, {
        method: 'POST',
        body,
        signal: abortController.signal
      });
      clearInterval(sweep);

      const result = deserialize(await response.text());
      if (result.type === 'success') {
        const data = result.data as {
          results: Array<{ contactId: string; learnerName: string; status: 'done'|'skipped'|'failed'; reason?: string; documentId?: string }>;
          totals: { done: number; skipped: number; failed: number };
        };
        totals = data.totals;
        rows = data.results.map((r) => ({
          contactId: r.contactId,
          learnerName: r.learnerName,
          state: r.status === 'done' ? 'done' : r.status === 'skipped' ? 'skipped' : 'failed',
          failure: r.status === 'failed' ? {
            reasonFr: reasonToFr(r.reason),
            fixHref: r.reason === 'email_manquant'
              ? `/formations/${formationId}/apprenants?preflightFocus=email&focusContactId=${r.contactId}&returnTo=${encodeURIComponent(`/formations/${formationId}/documents?resumeBatch=${documentType}`)}`
              : undefined
          } : undefined
        }));
        phase = 'result';
        await invalidateAll();
      } else if (result.type === 'failure') {
        toast.error((result.data as { message?: string })?.message ?? 'Erreur');
        phase = 'confirm';
      }
    } catch (err: unknown) {
      clearInterval(sweep);
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast.info('Génération annulée — les documents déjà créés ont été conservés');
      } else {
        toast.error(err instanceof Error ? err.message : 'Erreur de génération');
      }
      phase = 'result';
      await invalidateAll();
    } finally {
      abortController = null;
    }
  }

  function reasonToFr(reason?: string): string {
    switch (reason) {
      case 'email_manquant': return 'e-mail manquant';
      case 'client_manquant': return 'client non renseigné';
      default: return reason ?? 'donnée manquante';
    }
  }

  function cancel() {
    if (phase === 'generating' && abortController) {
      if (confirm('Annuler la génération ? Les documents déjà créés seront conservés.')) {
        abortController.abort();
      }
    } else {
      open = false;
      onClose();
    }
  }
</script>

<Dialog bind:open onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent class="sm:max-w-lg">
    {#if phase === 'confirm'}
      <DialogHeader>
        <DialogTitle>Générer {learners.length} {docTypeLabel} ?</DialogTitle>
      </DialogHeader>
      <p class="text-sm text-muted-foreground">Cela peut prendre jusqu'à 30 secondes.</p>
      {#if warnings.length > 0}
        <div class="rounded-md border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/30">
          <p class="mb-2 text-sm font-medium">Avant de continuer</p>
          <ul class="mb-2 ml-4 list-disc space-y-1 text-sm">
            {#each warnings as w (w.id)}<li>{w.messageFr}</li>{/each}
          </ul>
          <label class="flex items-center gap-2 text-sm">
            <Checkbox bind:checked={acknowledged} />
            Je comprends et je souhaite continuer
          </label>
        </div>
      {/if}
      <DialogFooter>
        <Button variant="outline" onclick={cancel}>Annuler</Button>
        <Button disabled={!canSubmit} onclick={submit}>Lancer la génération</Button>
      </DialogFooter>

    {:else if phase === 'generating'}
      <DialogHeader><DialogTitle>Génération en cours…</DialogTitle></DialogHeader>
      <Progress value={progressPct} />
      <p class="text-sm text-muted-foreground" aria-live="polite">
        {rows.filter((r) => r.state === 'done' || r.state === 'skipped').length} / {rows.length} apprenants prêts
      </p>
      <ul class="max-h-64 space-y-1 overflow-y-auto">
        {#each rows as row (row.contactId)}
          <li class="flex items-center gap-2 text-sm">
            {#if row.state === 'done'}<Check class="size-4 text-green-600" />
            {:else if row.state === 'generating'}<Loader2 class="size-4 animate-spin text-blue-600" />
            {:else if row.state === 'skipped'}<MinusCircle class="size-4 text-muted-foreground" />
            {:else if row.state === 'failed'}<AlertTriangle class="size-4 text-red-600" />
            {:else}<Clock class="size-4 text-muted-foreground" />
            {/if}
            <span class="flex-1">{row.learnerName}</span>
            <span class="text-xs text-muted-foreground">
              {#if row.state === 'done'}généré
              {:else if row.state === 'generating'}génération…
              {:else if row.state === 'skipped'}déjà envoyée
              {:else if row.state === 'failed'}échec
              {:else}en attente{/if}
            </span>
          </li>
        {/each}
      </ul>
      <DialogFooter><Button variant="outline" onclick={cancel}>Annuler</Button></DialogFooter>

    {:else}
      <DialogHeader><DialogTitle>Résultat</DialogTitle></DialogHeader>
      <div class="space-y-1 text-sm">
        {#if totals.done > 0}<p>✓ {totals.done} {docTypeLabel} générées</p>{/if}
        {#if totals.skipped > 0}<p class="text-muted-foreground">⊘ {totals.skipped} déjà envoyée(s) — ignorée(s)</p>{/if}
        {#if totals.failed > 0}<p class="text-red-600">⚠ {totals.failed} à compléter</p>{/if}
      </div>
      {#if rows.some((r) => r.state === 'failed')}
        <ul class="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
          {#each rows.filter((r) => r.state === 'failed') as row (row.contactId)}
            <li class="flex items-center gap-2 text-sm">
              <AlertTriangle class="size-4 shrink-0 text-red-600" />
              <span class="flex-1">{row.learnerName} — {row.failure?.reasonFr}</span>
              {#if row.failure?.fixHref}
                <Button href={row.failure.fixHref} variant="link" size="sm" class="h-auto p-0">
                  Compléter →
                </Button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
      <DialogFooter>
        <Button variant="outline" onclick={() => { open = false; onClose(); }}>Fermer</Button>
        {#if totals.failed > 0}
          <Button onclick={submit}>Réessayer pour les {totals.failed} restants</Button>
        {/if}
      </DialogFooter>
    {/if}
  </DialogContent>
</Dialog>
```

**Key constraints**
- `aria-live="polite"` on progress text for screen readers.
- `prefers-reduced-motion`: replace `animate-spin` and "sweep" with static "…" via CSS guard.
- Mobile: `sm:max-w-lg` keeps it usable on narrow viewports; rows scroll vertically.
- The dialog's "sweep" is cosmetic — the server is fire-and-forget single-shot. If we
  later add SSE streaming, replace the sweep with real per-learner state pushes.
- "Réessayer pour les {n} restants" simply re-invokes `submit()` — server idempotency
  (Task 7) ensures completed learners are skipped on the retry.

---

## Task 5: CTA placement on group card + dropdown `[cta-placement]`

**Problem.** No entry point for batch action exists.

**File:** `src/routes/(app)/formations/[id]/documents/+page.svelte`

**Implementation**

1. Inside the group card render (look for `kind === 'group'` block, near line ~1000), add to
   the header right side:
   ```svelte
   {#if item.type === 'convocation' || item.type === 'certificat'}
     {@const remaining = data.formationLearners.length - item.children.length}
     {@const allExist = remaining === 0 && item.children.length > 0}
     <Button
       variant={item.children.length === 0 ? 'default' : 'outline'}
       size="sm"
       onclick={() => openBatchDialog(item.type)}
       disabled={data.formationLearners.length === 0}
     >
       {#if item.children.length === 0}
         Générer pour tous
       {:else if allExist}
         Régénérer pour tous
       {:else}
         Générer pour les {remaining} restants
       {/if}
     </Button>
   {/if}
   ```

2. In the "Générer un document" dropdown (around line 627), prepend a per-learner-type
   submenu item for `convocation` and `certificat`:
   ```svelte
   <DropdownMenu.Item class="cursor-pointer gap-2" onclick={() => openBatchDialog(type)}>
     <Users class="size-4" />
     Pour tous les apprenants ({data.formationLearners.length})
   </DropdownMenu.Item>
   ```
   (Show only when `type === 'convocation' || type === 'certificat'`.)

3. Add the dialog state + handler to the page script:
   ```ts
   let batchOpen = $state(false);
   let batchType = $state<'convocation' | 'certificat'>('convocation');

   function openBatchDialog(type: string) {
     if (data.formationLearners.length === 0) {
       toast.info('Aucun apprenant inscrit — ajoutez des apprenants pour générer.');
       return;
     }
     batchType = type as 'convocation' | 'certificat';
     batchOpen = true;
   }
   ```

4. Mount the dialog at the bottom of the page:
   ```svelte
   <BatchGenerateDialog
     bind:open={batchOpen}
     formationId={data.formation.id}
     documentType={batchType}
     learners={data.formationLearners}
     warnings={data.batchWarnings[batchType] ?? []}
     onClose={() => (batchOpen = false)}
   />
   ```

5. Update `+page.server.ts` `load` to include `formationLearners` and `batchWarnings`:
   ```ts
   const formationLearners = apprenantRows.map((a) => ({
     contactId: a.contactId!,
     firstName: a.contact?.firstName ?? '',
     lastName: a.contact?.lastName ?? '',
     email: a.contact?.email ?? null
   })).filter((l) => l.contactId);

   // For each batch-eligible type, compute formation-level warnings (no contactId)
   const batchWarnings: Record<string, { id: string; messageFr: string }[]> = {};
   for (const t of ['convocation', 'certificat'] as const) {
     const r = evaluatePreflightForServer(formationRow, workspaceRow, apprenantRows, docRows, t, {});
     batchWarnings[t] = r.items
       .filter((i) => i.severity === 'warn')
       .map((i) => ({ id: i.id, messageFr: i.messageFr }));
   }
   ```

**Key constraints**
- Empty state (0 learners): button disabled with tooltip via `title` attribute, plus a
  `toast.info` on click for clarity.
- "Régénérer pour tous" copy applies T-12 in-place replacement semantics for `genere` rows —
  do not surface a destructive confirm beyond the standard dialog.

---

## Task 6: Per-learner `[Compléter →]` links + apprenants tab handler `[per-learner-fix-links]`

**Problem.** The result panel's `[Compléter →]` links must navigate to the right learner's
field on the apprenants tab. The apprenants page does not currently honor `?preflightFocus=`.

**Files**
- `src/routes/(app)/formations/[id]/apprenants/+page.svelte` — add focus handler

**Implementation**

1. In the apprenants page script, add an `onMount` mirror of the fiche page pattern
   (`fiche/+page.svelte:235-241`):
   ```svelte
   <script lang="ts">
     import { onMount } from 'svelte';
     import { page } from '$app/state';
     // ...

     onMount(() => {
       requestAnimationFrame(() => {
         const focusKey = page.url.searchParams.get('preflightFocus');
         const focusContactId = page.url.searchParams.get('focusContactId');
         if (!focusKey) return;

         const root = focusContactId
           ? document.querySelector(`[data-contact-row="${CSS.escape(focusContactId)}"]`)
           : document;
         if (!root) return;

         const el = (root as HTMLElement | Document).querySelector?.(`[data-preflight-target="${CSS.escape(focusKey)}"]`)
           ?? (root as HTMLElement);
         if (!el) return;

         (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
         (el as HTMLElement).focus?.();
         // Brief highlight pulse
         (el as HTMLElement).classList.add('ring-2', 'ring-primary');
         setTimeout(() => (el as HTMLElement).classList.remove('ring-2', 'ring-primary'), 1500);
       });
     });
   </script>
   ```

2. On the learner row template, add `data-contact-row={contact.id}` and on the email field
   add `data-preflight-target="email"`:
   ```svelte
   <div data-contact-row={contact.id}>
     <!-- ... -->
     <Input data-preflight-target="email" bind:value={contact.email} />
   </div>
   ```

3. Mount `<PreflightResumeBanner />` in the apprenants page if it is not already mounted in
   a shared layout (check `src/routes/(app)/formations/[id]/+layout.svelte` first; if mounted
   there, no change).

**Key constraints**
- `returnTo` MUST start with `/` (T-13 open-redirect protection enforces same-origin paths
  in `PreflightResumeBanner.svelte` lines 19–30).
- `focusContactId` is optional — if absent, fall back to scrolling to the first preflight
  target on the page.
- Use `CSS.escape()` to defend against malformed contactId attribute values.

---

## Task 7: Idempotency `[idempotency]`

**Problem.** Re-clicking "Générer pour tous" or running a retry should not duplicate
documents for learners who already succeeded.

**Implementation.** Already encoded in Task 2 via `existingByContact` map and the
`SKIP_IF_STATUS` / `REPLACE_IF_STATUS` sets. Verification checklist:

- Learner has `envoye`/`signe`/`archive`/`accepte` doc → result is `skipped`, no new row.
- Learner has `genere` doc → new row generated, old `genere` row deleted (in-place replace,
  matches T-12 path for never-sent docs).
- Learner has `remplace` doc → ignored (it's already a historical row), new generation proceeds.
- Two-tab race: same as `regenerateAll` today. Document this risk in the testing checklist;
  full advisory-lock fix is deferred (orthogonal to T-14, applies to single-doc too).

**Client-side double-click guard.** In Task 4 dialog, the "Lancer la génération" button is
already gated by `phase === 'confirm'`; re-clicks during `generating` are ignored.

---

## Task 8: Cancellation `[cancellation]`

**Problem.** User closes the dialog mid-batch. Server should stop processing remaining
learners; completed work is preserved.

**Implementation.** Already encoded in Task 2 (server: `request.signal.aborted` check
between learners) and Task 4 (client: `AbortController` passed to `fetch`).

**Constraints**
- `request.signal.aborted` is checked at three points: top of `processLearner`, in the
  outer `while` loop, and (implicitly) by `Promise.race` returning from completed work.
- No rollback of completed documents — deliberate. Marie's work stays.
- Confirm dialog before cancel: *"Annuler la génération ? Les documents déjà créés seront conservés."*

---

## Task 9: Concurrency cap (inline pool, no new dep) `[concurrency-cap]`

**Problem.** Sequential generation of 12 docs may exceed SvelteKit's 30s default timeout.
All-parallel risks server OOM.

**Implementation.** Inline 3-slot Promise pool in Task 2 (~15 lines). Justification comment
already inlined:

```ts
// We avoid p-limit because (a) we want zero new deps, (b) the loop is short
// (max ~25 learners), (c) PDF generation is the bottleneck not scheduling
// overhead, and (d) AbortSignal integration is simpler with our own pool.
const CONCURRENCY = 3;
```

**Tunability.** Extract `CONCURRENCY` as a module-level constant near the action; future
tuning is one edit. Do not externalize to env unless evidence warrants it.

**Ceiling.** For very large formations (>25 learners), the dialog should warn and recommend
splitting (out of MVP scope — track as future ticket if encountered).

---

## Task 10: Testing checklist `[testing-checklist]`

### Unit (Vitest)

- [ ] `evaluatePreflight` for `convocation` with `contactId` set + `contactEmail: null` → blocks
- [ ] `evaluatePreflight` for `convocation` with `contactId` set + `contactEmail: 'x@y.fr'` → passes
- [ ] `evaluatePreflight` for `convocation` with NO `contactId` (single-doc UI mode) + `hasLearnerWithEmail: true` → passes (existing behavior preserved)
- [ ] Inline 3-slot pool processes 7 items with concurrency ≤ 3 (assert via mock timestamps)
- [ ] `generateForAll` returns `formationBlocks` and does NOT enter loop when convention not signed
- [ ] `generateForAll` writes one audit log row per `done` result with shared `batchId`
- [ ] `generateForAll` skips learners with existing `envoye` doc (results `status: 'skipped'`)
- [ ] `generateForAll` replace-in-place when learner has `genere` doc

### Integration / Playwright

- [ ] **Happy path**: formation with 3 learners (all with email + convention signed) → click "Générer pour tous" on Convocations card → confirm dialog → progress dialog → result shows "3 générées" → group card updates to "(3/3 générées)"
- [ ] **Partial failure**: formation with 3 learners (2 with email, 1 without) → batch → result shows "2 générées, 1 à compléter" → click `[Compléter →]` → land on apprenants tab with banner + scroll to learner's email field → fill email → click "Reprendre la génération des convocations →" → return to documents tab with `?resumeBatch=convocation` → dialog re-opens with the 1 remaining → succeeds
- [ ] **Idempotency**: run "Générer pour tous" twice — second run shows all as `skipped` (no duplicates in DB)
- [ ] **Cancellation**: start batch with 5 learners → close dialog after 2 succeed → confirm "Annuler" → 2 docs remain in DB, group card shows "(2/5)"
- [ ] **Empty state — 0 learners**: button disabled with tooltip
- [ ] **Empty state — formation prereq fails**: certificat batch with unsigned emargements → confirm dialog shows single prereq card (not 12 rows)
- [ ] **Warning ack**: batch with NDA missing (OPCO certificat) → ack checkbox required, single ack covers all 12 audit rows
- [ ] **Dark mode**: dialog + result panel render correctly
- [ ] **Mobile (375px)**: dialog full-width, result rows scroll, `[Compléter →]` tap target ≥ 44px
- [ ] **Keyboard**: Tab cycles through dialog; Escape during `confirm` closes; Escape during `generating` triggers cancel confirm
- [ ] **Screen reader**: progress text announced as it changes (`aria-live="polite"`)

### Manual / QA persona

- [ ] Marie can complete a 12-learner batch in <30s end-to-end (happy path)
- [ ] After a partial failure, Marie can fix and complete all remaining learners in <3 minutes
- [ ] No copy uses "erreur" or "échec" — all failure copy is action-oriented

---

## Dependencies & Cross-Ticket Notes

- **T-13**: reuses `?preflightFocus=` + `PreflightResumeBanner` + open-redirect protection. No changes needed to T-13 components.
- **T-43**: align "X / Y apprenants prêts" wording. Coordinate if T-43 is not yet shipped.
- **T-46**: add `'document_batch_generated'` to audit-scope inventory. `userId` from `locals` only.
- **T-47**: all new Drizzle queries inside `generateForAll` go through `verifyFormationOwnership`. Flag `formationDocuments` insert + `formationApprenants` read in the workspace-clause audit.
- **T-12**: replace-in-place pattern for `genere` docs is reused (do not re-implement).
