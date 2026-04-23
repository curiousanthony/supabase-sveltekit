---
name: crud-services
description: Guides agents on the shared CRUD service layer in Mentore Manager. Use when implementing a DB operation that might already exist, when the same insert/update/delete logic appears in more than one route, when adding a new creation or mutation action to a +page.server.ts, or when asked about centralizing database logic.
disable-model-invocation: true
---

# Shared CRUD Services

## The Pattern

Complex DB operations live as plain TypeScript modules in `src/lib/services/`. Server actions in `+page.server.ts` are thin orchestrators: they parse form data, call a service, then return `fail(...)` or a success response. **Services never call SvelteKit helpers** (`fail`, `redirect`, etc.) — they throw `Error` on failure.

```
src/lib/services/
├── audit-log.ts          — logAuditEvent / logFieldUpdate
├── document-service.ts   — document generation/storage
├── email-service.ts      — email sending
└── formateur-create.ts   — create user + formateur + thématiques
```

## When to Extract a Service

Extract when the same DB logic would appear in **two or more** `+page.server.ts` actions. Keep it inline for one-off mutations.

## Existing Services

### `audit-log.ts`
```ts
import { logAuditEvent, logFieldUpdate } from '$lib/services/audit-log';

// Log any mutation on a formation
await logAuditEvent({ formationId, userId, actionType: 'apprenant_added', entityType: 'contact', entityId });

// Shorthand for a field change
await logFieldUpdate(formationId, userId, 'statut', oldValue, newValue);
```

### `formateur-create.ts`
Creates a `users` row (reusing if email exists) + a `formateurs` row, then optionally inserts `formateurs_thematiques` and `formateurs_sousthematiques` links.

```ts
import { createFormateurForWorkspace } from '$lib/services/formateur-create';

const { formateurId } = await createFormateurForWorkspace({
  workspaceId,
  firstName, lastName, email,   // email generates placeholder if blank
  ville, departement,
  thematiqueIds: ['uuid-...'],   // optional
  sousthematiqueIds: ['uuid-...'] // optional
});
```

Used by:
- `contacts/formateurs/+page.server.ts` → `createFormateur` (redirects to profile)
- `formations/[id]/formateurs/+page.server.ts` → `createFormateurAndAssign` (also inserts into `formationFormateurs`)

## Creating a New Service

1. Create `src/lib/services/your-service.ts`
2. Export typed input/result interfaces
3. Export an `async function` — use Drizzle, throw `Error` on failure (never `fail` or `redirect`)
4. Import and call it from the relevant `+page.server.ts` actions

**Template:**
```ts
import { db } from '$lib/db';
import { someTable } from '$lib/db/schema';

export interface CreateXInput {
  workspaceId: string;
  // ...
}

export interface CreateXResult {
  id: string;
}

export async function createX(input: CreateXInput): Promise<CreateXResult> {
  const [row] = await db.insert(someTable).values({ ... }).returning({ id: someTable.id });
  if (!row) throw new Error('Impossible de créer X. Veuillez réessayer.');
  return { id: row.id };
}
```

**In `+page.server.ts`:**
```ts
import { createX } from '$lib/services/your-service';

// ...
try {
  const { id } = await createX({ workspaceId, ... });
  return { success: true };
} catch (e) {
  console.error('[action]', e instanceof Error ? e.message : e);
  return fail(500, { message: 'Impossible de créer X. Veuillez réessayer.' });
}
```

## Key Rules

- Services import from `$lib/db` and `$lib/db/schema` — never from SvelteKit
- Services **throw**, never `fail` or `redirect`
- Use `.onConflictDoNothing()` on junction-table inserts for idempotency
- When inserting a `users` row, always handle the email conflict case (see `formateur-create.ts` for the pattern)
- Pass `workspaceId` through every service that creates workspace-scoped data
