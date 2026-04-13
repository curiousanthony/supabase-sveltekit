# Learnings

One-line insights discovered during development. Reviewed by team-architect every 10 entries.

- 2026-04-10 T-8: Replace workspace storage objects only after a successful new upload + DB update; validate object keys against `workspaceId/` before `remove()`; use Sharp `limitInputPixels` against decompression DoS
- 2026-04-10 T-39: Match an existing route’s Kanban (`flex` + `overflow-x-auto`, `min-w`/`max-w` columns) instead of inventing a new grid breakpoint pattern
- 2026-04-09 T-1: French PDF amounts need Intl currency + replace U+202F/U+00A0 so Helvetica does not garble thousands separators
- 2026-04-09 T-2: Centralize PDF_TIMEZONE in shared for every template date/time helper
- 2026-04-09 T-3: `default` + `assertNever` on DocumentType switch catches missing cases at compile time
- 2026-04-09 T-4: Typed wrapper for pdfmake CJS singleton avoids `any` on createRequire
- 2026-04-09 T-5: Certificat attendance — innerJoin seances on formationId avoids loading all contact émargements
- 2026-04-09 T-32: Hand-written SQL migrations can get out of sync with Supabase tracking — always verify schema_migrations table before `migration up`
- 2026-04-09 T-33: When hiding a filter category (e.g. remplace), reset active filter to 'all' if it matches the hidden category to avoid empty-list confusion
- 2026-04-09 T-10: replaceState from $app/navigation cannot be called before router initialization — guard with onMount + requestAnimationFrame on pages that read URL params in $effect
- 2026-04-09 T-9: Multi-step DB mutations (replace old + link new doc) must be wrapped in db.transaction() and use optimistic concurrency (WHERE status = expected) to prevent races
- 2026-04-08 T-S1: Locale-aware number formatting needed for French currency (not just toFixed)
- 2026-04-08 T-S2: pdfmake CJS via createRequire works but needs setFonts() before createPdf()

- 2026-04-10 T-34: logAuditEvent must accept a tx client and propagate errors when called transactionally — fire-and-forget is only safe for non-critical callers
- 2026-04-10 T-6: RLS via EXISTS subquery joining child→parent→workspaces_users is the standard pattern for tables without direct workspace_id
- 2026-04-10 T-7: Storage policies use (storage.foldername(name))[1]::uuid to extract entity ID from path convention {entityId}/filename.ext
- 2026-04-10 T-28: When raw-HTML email path exists alongside template-based path, remove raw HTML — all Postmark sends should use templates for consistency and deliverability
- 2026-04-10 T-37: transitionStatus already sets timestamp fields via STATUS_TIMESTAMP_FIELD map — no need to manually set sentAt when transitioning to envoye
- 2026-04-10 T-35: When linking quest sub-actions to document lifecycle, use sub-action orderIndex (not title matching) to identify specific actions within a quest
- 2026-04-10 T-36: Compliance warnings belong in the layout load (not per-page) so both Documents and Suivi share the same computed warnings from a single lightweight query

- 2026-04-13 T-11: Svelte 5 {#snippet} avoids template duplication when the same card layout is rendered in flat, grouped, and nested contexts — define once, @render everywhere
- 2026-04-13 T-17: Vercel Cron Jobs are the natural fit for SvelteKit-on-Vercel scheduled tasks — configure in vercel.json crons array, auth via CRON_SECRET bearer token, and use service-role Supabase client (not user session) since cron runs without auth context

## Reviewed 2026-04-13
