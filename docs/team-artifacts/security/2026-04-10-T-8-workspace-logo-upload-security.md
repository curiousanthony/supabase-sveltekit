# Security review: T-8 workspace logo upload (Sharp, Storage, PNG-only bucket)

**Date:** 2026-04-10  
**Scope:** `src/lib/server/workspace-logo.ts`, `src/routes/(app)/parametres/workspace/upload-logo/+server.ts`, `src/lib/server/supabase-admin.ts`, migration `20260410120000_workspace_logos_png_only.sql`

## Summary

**Overall risk: MEDIUM**

Authorization for POST/DELETE remains correctly gated (`requireWorkspace` + `workspace_settings`). Service role use is appropriate given pre-checks. Main concerns are **resource exhaustion during Sharp decode** (decompression / dimension bombs) and **defense-in-depth on Storage object keys parsed from `logoUrl`**. SSRF is not applicable (no URL fetch). Legacy bucket objects are an operational/compatibility topic, not a direct confidentiality break.

## Findings (by severity)

### High — Image decode / decompression DoS (pixel bombs, SVG)

- **Location:** `src/lib/server/workspace-logo.ts` (`processWorkspaceLogoUpload`)
- **Issue:** Input is capped at 5MB on the wire, but raster formats can declare very large dimensions while staying under 5MB. Sharp is invoked without an explicit **`limitInputPixels`** (and no pre-decode dimension cap derived from `metadata` before the heavy pipeline). SVG amplifies CPU/memory vs typical rasters.
- **Risk:** Authenticated users with `workspace_settings` can submit crafted files and cause high CPU, memory pressure, or slow requests (DoS against the app worker).
- **Fix:** Set Sharp `limitInputPixels` to a tight bound consistent with `MAX_EDGE_PX` (e.g. allow modest headroom for rotation/intermediate decode, not tens of megapixels). Optionally reject SVG if product allows, or apply stricter limits / separate path for SVG. Consider a **wall-clock or concurrency limit** for logo processing if abuse is a concern.

### Medium — Storage `remove()` path derived from `logoUrl` without key validation

- **Location:** `src/routes/(app)/parametres/workspace/upload-logo/+server.ts` (POST and DELETE branches using `split(\`/${bucketId}/\`)` then `remove([urlParts[1]])`)
- **Issue:** The object key is taken from persisted `logoUrl`. Under normal operation the app writes this URL. If `logoUrl` were ever wrong (manual DB edit, future write path, SQL injection elsewhere), a crafted value could yield a key outside `${workspaceId}/…` (e.g. another workspace prefix or traversal-like segments, depending on Storage API normalization).
- **Risk:** Cross-tenant **deletion** of arbitrary objects in `workspace-logos` via poisoned `logoUrl`, combined with another weakness that mutates that column.
- **Fix:** After parsing, **validate** the object key: must equal `workspaceId + '/' + safeFilename`, UUID filename only, reject `..`, `%2e%2e`, slashes beyond one segment, and empty segments. If validation fails, skip `remove` and log; optionally clear `logoUrl` only after safe delete or admin repair.

### Low — Sharp / native dependency surface

- **Location:** `sharp` dependency
- **Issue:** Native stack (libvips, etc.) is a larger attack surface than pure JS; vulnerabilities are patched in releases.
- **Risk:** Remote code execution only in the context of historic CVEs; mostly operational patching.
- **Fix:** Keep `sharp` on current patched versions; monitor advisories.

### Low — Client `Content-Type` vs actual bytes

- **Location:** `upload-logo/+server.ts` (allowlist on `file.type`)
- **Issue:** Browser-supplied MIME can be spoofed; real validation is Sharp/metadata.
- **Risk:** Low; unsupported types still fail processing, but could add noise before Sharp.
- **Fix:** Optional: treat MIME as hint only; rely on Sharp format detection (already partially done).

### Informational — Bucket migration and legacy objects

- **Location:** `supabase/migrations/20260410120000_workspace_logos_png_only.sql`, `ensureWorkspaceLogosBucket`
- **Issue:** Bucket `allowed_mime_types` / `file_size_limit` tightened to PNG and 2 MiB. Existing non-PNG objects are not deleted by this migration.
- **Risk:** No direct security regression; legacy files may remain publicly readable as before. New uploads must be PNG ≤ 2 MiB (aligned with `MAX_STORED_PNG_BYTES` in route).
- **Fix:** Product/plan: backfill or delete legacy objects if consistency is required.

## RLS / Storage policy review

- **Service role:** Upload/delete use admin client after app-level workspace + permission checks — acceptable **if** all code paths that call admin storage enforce the same checks (true for this route).
- **Bucket:** Public read for logos is consistent with `getPublicUrl` usage. Writes are not client-direct when using service role from server.

## Required fixes before shipping (Critical + High)

- **High:** Add Sharp input pixel limits (and/or stricter SVG policy) to mitigate decode DoS.

Medium items are strongly recommended as defense-in-depth.
