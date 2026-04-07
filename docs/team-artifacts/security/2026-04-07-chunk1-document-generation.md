# Security Audit — Chunk 1: Core PDF Templates + Convention Fix

**Date:** 2026-04-07
**Scope:** Schema migration, document generator, 3 PDF templates, documents tab UI, email fixes
**Overall Risk:** MEDIUM

---

## Summary

The Chunk 1 implementation introduces server-side PDF generation with proper authentication and workspace-scoped authorization at the server action layer. The code correctly uses admin-only Supabase clients for storage operations and validates document types against an allowlist. However, two **Medium** findings require attention: related entity IDs (`contactId`, `seanceId`) passed to `generateDocument()` are not validated against the formation, allowing cross-formation data mixing within the same workspace. Additionally, pre-existing permissive RLS policies on `formation_documents`, `formation_emails`, and the `formation-documents` storage bucket remain overly broad.

---

## Findings

### MEDIUM-1: `contactId` not validated against formation enrollment

- **Severity:** Medium
- **Location:** `src/lib/services/document-generator.ts` lines 264–269 (convocation), lines 301–306 (certificat)
- **Issue:** For `convocation` and `certificat` document types, the `contactId` is looked up directly via `contacts.id` without verifying the contact is enrolled in the formation through `formationApprenants`. A user could generate a convocation or certificate for any contact accessible in their workspace, even if that contact is not a participant of the specific formation.
- **Risk:** Data integrity violation — a convocation/certificate could be produced for the wrong person, associating them with a formation they're not enrolled in. Limited confidentiality impact since this stays within the same workspace.
- **Fix:** Before using the `contactId`, verify it exists in `formationApprenants` for the given `formationId`:
  ```typescript
  const enrollment = await db.query.formationApprenants.findFirst({
    where: and(
      eq(formationApprenants.formationId, formationId),
      eq(formationApprenants.contactId, options.contactId)
    )
  });
  if (!enrollment) throw new Error('Ce contact n\'est pas inscrit à cette formation');
  ```

### MEDIUM-2: `seanceId` not validated against formation

- **Severity:** Medium
- **Location:** `src/lib/services/document-generator.ts` lines 352–357 (feuille_emargement)
- **Issue:** The séance is fetched solely by `seances.id` without verifying `seance.formationId === formationId`. A user could pass a `seanceId` from a different formation (within the same workspace), producing an attendance sheet that mixes séance data from one formation with the identity and title of another.
- **Risk:** Incorrect attendance records — an émargement sheet could show the wrong dates/times for a formation, violating Qualiopi traceability requirements.
- **Fix:** Add `formationId` to the séance lookup:
  ```typescript
  const seance = await db.query.seances.findFirst({
    where: and(eq(seances.id, options.seanceId), eq(seances.formationId, formationId)),
    columns: { id: true, startAt: true, endAt: true, location: true, formateurId: true }
  });
  if (!seance) throw new Error('Séance introuvable ou n\'appartient pas à cette formation');
  ```

### MEDIUM-3: Permissive RLS on `formation_documents` and `formation_emails` (pre-existing)

- **Severity:** Medium
- **Location:** `supabase/migrations/20260323113000_phase0_documents_workspace_emargements.sql` lines 118–131
- **Issue:** Both tables have RLS enabled but with `USING (true) WITH CHECK (true)` policies, granting any authenticated user full CRUD access regardless of workspace membership. While the app uses Drizzle ORM (direct Postgres connection, bypassing RLS) and enforces authorization in server actions, any direct Supabase client access from the browser would expose all documents and emails across all workspaces.
- **Risk:** If any current or future client-side code uses the Supabase JS client to query these tables directly, it would bypass workspace isolation entirely. Cross-workspace document and email data could be read, modified, or deleted.
- **Fix:** Replace the permissive policies with workspace-scoped ones:
  ```sql
  CREATE POLICY "formation_documents_workspace_isolation" ON formation_documents
    FOR ALL USING (
      formation_id IN (
        SELECT f.id FROM formations f
        JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
        WHERE wu.user_id = auth.uid()
      )
    );
  ```

### MEDIUM-4: Permissive Storage RLS on `formation-documents` bucket (pre-existing)

- **Severity:** Medium
- **Location:** `supabase/migrations/20260323113000_phase0_documents_workspace_emargements.sql` lines 133–169
- **Issue:** The storage policies allow any authenticated user to upload, read, and delete any object in the `formation-documents` bucket. The upload/download code uses the admin client (bypassing RLS), but direct Supabase client access from the browser would allow any authenticated user to access any formation's documents.
- **Risk:** Any authenticated user with the Supabase anon key could download PDFs containing financial data (devis, ordre de mission) from other workspaces by constructing the storage path (`{formationId}/{type}_{timestamp}.pdf`).
- **Fix:** Scope storage policies to workspace members:
  ```sql
  CREATE POLICY "formation_docs_workspace_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'formation-documents'
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT f.id FROM formations f
        JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
        WHERE wu.user_id = auth.uid()
      )
    );
  ```

### LOW-1: No UUID format validation on entity ID parameters

- **Severity:** Low
- **Location:** `src/routes/(app)/formations/[id]/documents/+page.server.ts` lines 78–80
- **Issue:** `contactId`, `formateurId`, and `seanceId` from form data are passed to Drizzle queries without UUID format validation. Invalid strings (non-UUID) will cause Postgres type-cast errors that surface as unhandled 500 errors.
- **Risk:** Poor error handling; no security impact since Drizzle parameterizes queries.
- **Fix:** Add UUID regex validation before passing to `generateDocument()`:
  ```typescript
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (contactId && !UUID_RE.test(contactId)) return fail(400, { message: 'Contact ID invalide' });
  if (formateurId && !UUID_RE.test(formateurId)) return fail(400, { message: 'Formateur ID invalide' });
  if (seanceId && !UUID_RE.test(seanceId)) return fail(400, { message: 'Séance ID invalide' });
  ```

### LOW-2: `formations` and `workspaces` tables have no RLS (pre-existing)

- **Severity:** Low (informational)
- **Location:** No migration enables RLS on these tables
- **Issue:** Neither `formations` nor `workspaces` has RLS enabled. Access control relies entirely on application-level checks (server-side `getUserWorkspace()` + workspace-scoped queries). Adding `prixConvenu` and financial default columns in Chunk 1 does not change this posture since RLS is row-based.
- **Risk:** Pre-existing architectural decision. No change from Chunk 1.
- **Fix:** No immediate action for Chunk 1. Consider enabling RLS as a defense-in-depth measure in a future migration.

---

## RLS Policy Review

### New/modified tables

| Table | RLS Enabled | Policies | Assessment |
|-------|-------------|----------|------------|
| `formations` (modified — new `prix_convenu` column) | **No** | N/A | Pre-existing. Column-level changes don't affect row-level access. |
| `workspaces` (modified — 4 new columns) | **No** | N/A | Pre-existing. Column-level changes don't affect row-level access. |
| `formation_documents` (used by new feature) | Yes | `FOR ALL USING (true)` | **Overly permissive** — should scope to workspace. |
| `formation_emails` (used by email feature) | Yes | `FOR ALL USING (true)` | **Overly permissive** — should scope to workspace. |

### Storage buckets

| Bucket | Public | Policies | Assessment |
|--------|--------|----------|------------|
| `formation-documents` | false | Auth users: full access | **Should scope to workspace** via folder name = formationId. |

---

## Positive Findings

1. **Auth checks on all server actions** — Every action in `documents/+page.server.ts` and `suivi/+page.server.ts` calls `getUserWorkspace()` and `verifyFormationOwnership()` before proceeding.
2. **Document type allowlist** — `VALID_DOCUMENT_TYPES` array validates the `type` parameter before passing to `generateDocument()`.
3. **`ordre_mission` validates formateur-formation association** — Uses a join on `formationFormateurs` with both `formationId` AND `formateurId`, preventing cross-formation access.
4. **Signed URLs with 1-hour expiry** — `getDocumentSignedUrl()` defaults to 3600 seconds, limiting exposure window.
5. **`getSignedUrl` action scopes to formation** — The document lookup uses both `documentId` AND `formationId`, preventing IDOR across formations.
6. **`deleteDocument` action also scopes to formation** — Same compound WHERE clause prevents cross-formation deletion.
7. **No path traversal in storage** — Upload paths use `{formationId}/{type}_{timestamp}.pdf` with server-generated values only.
8. **`ctaUrl` is server-controlled** — Built from `env.PUBLIC_SITE_URL` (server-side env var), not user input. Cannot be manipulated for phishing.
9. **No secrets in client-side code** — `POSTMARK_SERVER_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` accessed exclusively via `$env/dynamic/private`.
10. **Email `toName` sanitized** — Quotes and backslashes stripped to prevent header injection.
11. **Storage operations use admin client** — `getSupabaseAdmin()` is properly gate-checked (`if (!admin) throw`) before storage operations.

---

## Required Fixes

**Must resolve before shipping (MEDIUM severity):**

1. **MEDIUM-1**: Add enrollment check for `contactId` in `convocation` and `certificat` generation.
2. **MEDIUM-2**: Add `formationId` check for `seanceId` in `feuille_emargement` generation.

**Should resolve soon (pre-existing, MEDIUM severity):**

3. **MEDIUM-3**: Replace permissive RLS policies on `formation_documents` and `formation_emails`.
4. **MEDIUM-4**: Replace permissive Storage RLS on `formation-documents` bucket.

**Nice to have (LOW severity):**

5. **LOW-1**: Add UUID format validation for entity ID parameters in server actions.
