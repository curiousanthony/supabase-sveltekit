# Security audit: T-10 Contextual generation prompts

**Date:** 2026-04-09  
**Ticket:** T-10  
**Scope:** `src/lib/document-prompts.ts`, `src/lib/document-prompts.test.ts`, `src/routes/(app)/formations/[id]/documents/+page.svelte`, `src/routes/(app)/formations/[id]/suivi/+page.svelte`, `src/lib/components/formations/hud-banner.svelte`

## Summary

**Overall risk from this change set: LOW.**

The new `?quest=` handling is used only for in-page scroll/highlight and URL cleanup; it does not drive navigation to external origins, is not written with `{@html}`, and does not pass the raw query string into `openGenerate()` or server actions. Document generation remains gated by `verifyFormationOwnership` and `VALID_DOCUMENT_TYPES` in `documents/+page.server.ts`.

**Caveat:** Prompt content is derived from the same `data.formation` (and documents load) as the rest of the formation UI. The formation `[id]/+layout.server.ts` loader still fetches by `formations.id` only (no `workspaceId` predicate). That is a **pre-existing** multi-tenant isolation concern for the whole formation subtree; T-10 does not worsen it but inherits the same trust boundary (see Medium finding below).

## Findings

### 1. Formation layout load — workspace scoping (pre-existing, relevant to “is layout enough?”)

- **Severity:** Medium  
- **Location:** `src/routes/(app)/formations/[id]/+layout.server.ts` (formation query `where: eq(formations.id, formationId)`)  
- **Issue:** Layout does not constrain the formation row by the active user workspace, unlike `documents/+page.server.ts` and other child `+page.server.ts` files that use `and(eq(formations.id, …), eq(formations.workspaceId, workspaceId))`.  
- **Risk:** If a caller can guess or obtain another workspace’s formation UUID, they may receive full layout payload (actions, contacts, etc.) while authenticated. Inline prompts only surface data already exposed by that load.  
- **Fix:** Align layout query with other routes: require `getUserWorkspace` / `verifyFormationOwnership`-style check and filter `formations` by `workspaceId`, or return 404 when the formation is not in the active workspace.

### 2. Query string encoding for app-built `?quest=` links

- **Severity:** Low  
- **Location:** `src/lib/components/formations/hud-banner.svelte` — `getQuestHref()` builds `?quest=${questKey}`  
- **Issue:** `questKey` is interpolated without `encodeURIComponent`. Today keys appear to be fixed template identifiers (e.g. `devis`, `certificat_realisation`); risk is low.  
- **Risk:** If keys ever contained `&`, `=`, or non-ASCII characters, the query could be misparsed or behave unexpectedly.  
- **Fix:** Use `encodeURIComponent(questKey)` when appending to the URL.

### 3. `$effect` + `replaceState` cleanup

- **Severity:** Low (informational)  
- **Location:** `src/routes/(app)/formations/[id]/documents/+page.svelte` (effect reading `questParam`, then `replaceState`)  
- **Issue:** None material for security: `new URL(page.url)` keeps the same origin and path; only `quest` is removed. No open redirect.  
- **Risk:** Theoretical UX or double-run quirks if store updates were delayed; not a confidentiality/integrity issue.  
- **Fix:** None required for security; monitor if client-side navigation tests show redundant history entries.

### 4. `?quest=` — XSS and open redirect

- **Severity:** Low (no issue in current code)  
- **Location:** `documents/+page.svelte` — `page.url.searchParams.get('quest')`  
- **Issue:** N/A as vulnerability: `questParam` is matched against `p.questKey` from server-loaded actions; `scrollIntoView` / element `id` use `highlightedDocType` from the matched prompt (i.e. template-derived `documentType`), not the raw query string. No `{@html}` on prompt copy (static French strings + safe fallback in `document-prompts.ts`).  
- **Risk:** None under current data flow; arbitrary `?quest=` values are effectively no-ops beyond stripping the param.  
- **Fix:** Optional hardening: allowlist `questParam` against known quest keys before scroll/highlight (defense in depth if server data were ever out of sync).

### 5. Quest → tab mapping and information leakage

- **Severity:** Low (informational)  
- **Location:** `src/lib/document-prompts.ts` — `TAB_MAP`, `getTargetTab()`  
- **Issue:** Mapping is static application metadata (which tab corresponds to which quest).  
- **Risk:** Does not expose per-tenant secrets; at most reveals product structure already present in client bundles.  
- **Fix:** None.

### 6. Prompt cards and access-controlled data

- **Severity:** Low (no issue)  
- **Location:** `getDocumentPrompts()`, documents page prompt UI  
- **Issue:** Messages are static labels keyed by document type; `canGenerate` is UI-only.  
- **Risk:** Actual create/generate permission remains enforced server-side (`generateDocument` action).  
- **Fix:** None for T-10; keep server validation as source of truth (already present).

## RLS policy review

No new tables or schema changes in this ticket. N/A.

## Required fixes before shipping (Critical + High)

**None introduced by T-10.**

Recommended follow-up (Medium, pre-existing): add workspace-scoped formation fetch in `formations/[id]/+layout.server.ts` so all child pages (including prompts) only receive data for formations in the active workspace.
