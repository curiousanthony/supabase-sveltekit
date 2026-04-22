---
name: T-8 workspace logo upload processing
overview: Process workspace logos at upload with Sharp (resize, PNG output), restrict bucket to image/png, remove previous object on replace, update UI copy. Legacy objects remain until re-upload.
todos:
  - { id: deps, content: Add sharp dependency; add $lib/server/workspace-logo.ts processor }
  - { id: upload, content: POST upload-logo — buffer → process → remove old object → upload PNG }
  - { id: bucket, content: Migration + ensureWorkspaceLogosBucket allowedMimeTypes image/png; size limit 2MiB }
  - { id: ui, content: Paramètres workspace — helper text (formats, max upload, processed output) }
  - { id: verify, content: bun run check + targeted tests if any }
isProject: false
---

# T-8 — Workspace logo: upload-time optimize and normalize

## Goals

- **Storage:** Avoid storing multi‑MB originals; cap displayed/logo use dimensions.
- **PDFKit / email:** Stored asset is always **PNG** (PDFKit-safe; broad email client support for `workspaceLogoUrl` hotlinks).
- **Legacy:** Existing `workspace-logos` objects (JPEG/WebP/SVG) stay valid URLs until the workspace **replaces** the logo; no batch migration required.

## Library

- **Sharp** (`sharp`): Node-native image pipeline; resize, EXIF `rotate()`, SVG rasterization, JPEG/PNG/WebP input → PNG output. Fits SvelteKit server routes and Vercel Node.

## Constants (proposed)

| Constant | Value | Rationale |
|----------|-------|-----------|
| Max upload (client + server) | 5 MiB | Current behavior; enough for camera photos before processing |
| Max edge after resize | 512 px | `fit: 'inside'`, `withoutEnlargement: true`; plenty for PDF header (~80pt) and email footer (140px wide) |
| Stored MIME | `image/png` | Single bucket type; transparency preserved |
| Bucket `file_size_limit` | 2 MiB | Post-processed logos should be far below; guards abuse |
| PNG options | `compressionLevel: 9`, `effort: 10` | Balance CPU vs size |

## Server flow (`upload-logo/+server.ts`)

1. Permission checks (unchanged).
2. Validate `file.type` in `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`.
3. Validate `file.size` ≤ 5 MiB.
4. `const input = Buffer.from(await file.arrayBuffer())`.
5. `processWorkspaceLogoUpload(input)` → `Buffer` PNG; on Sharp failure → 400 with French message (invalid/corrupt/unsupported).
6. Load current `workspaces.logoUrl`; if set, parse path after `/{bucketId}/` and `remove([path])` (same pattern as DELETE).
7. Upload `{uuid}.png` with `contentType: 'image/png'` (Blob or ArrayBuffer).
8. Update `logoUrl` to new public URL.

## Supabase Storage

- **New migration:** `UPDATE storage.buckets SET allowed_mime_types = ARRAY['image/png'], file_size_limit = 2097152 WHERE id = 'workspace-logos';`
- **`ensureWorkspaceLogosBucket`:** On create, `allowedMimeTypes: ['image/png']`, `fileSizeLimit: 2097152`.

## UI (`parametres/workspace/+page.svelte`)

- Keep `accept` for JPEG, PNG, WebP, SVG (server still normalizes).
- Helper text: recommend **PNG or JPEG** for logos; **max 5 Mo** upload; image is **redimensionnée** (max ~512 px) and **enregistrée en PNG** for documents and emails.

## Failure modes

- **Truncated/corrupt input:** Sharp throws → 400.
- **SVG complexity / decompression bomb:** Mitigated by 5 MiB input cap; optional future timeout.
- **Bucket MIME mismatch:** Migration + ensure create path aligned before deploy order: deploy migration then app.

## Out of scope (this ticket)

- Re-encoding existing DB URLs without user action.
- CID embedding for Postmark (still URL-based footer).
