---
name: Workspace settings and team
overview: Extend workspace settings (name, logo via Supabase Storage, SIRET, legal info) with DB persistence, improve the workspace switcher when no logo is set, add team invites (pending list, cancel, set role), and implement owner-only "See as" member/role with a persistent visible state and exit control.
todos: []
isProject: false
---

# Workspace settings, team invites, and "See as"

## Current state

- **Workspaces table** ([src/lib/db/schema.ts](src/lib/db/schema.ts)): only `id`, `createdAt`, `name`. No logo, SIRET, or legal fields.
- **Workspace settings page** ([src/routes/(app)/parametres/workspace/](<src/routes/(app)/parametres/workspace/>)): single "Équipe" card with members table; placeholder "Fonctionnalité d'invitation à venir."; no workspace editing.
- **Workspace switcher** ([src/lib/components/workspace-switcher.svelte](src/lib/components/workspace-switcher.svelte)): always shows `GalleryVerticalEndIcon` in `bg-sidebar-primary text-sidebar-primary-foreground` (red/coral, eye-catching). No logo support; layout passes only `workspace: { id, name }`.
- **Layout** ([src/routes/(app)/+layout.server.ts](<src/routes/(app)/+layout.server.ts>)): loads workspace and role from `getActiveWorkspace` / `getUserRoleInWorkspace`; no "See as" or invite data.
- **Guards** ([src/lib/server/guards.ts](src/lib/server/guards.ts), [src/lib/server/workspace.ts](src/lib/server/workspace.ts)): `requireWorkspace` and role checks use real user only; no impersonation.
- **Supabase**: Auth and server client in use; no Storage bucket or storage usage yet.

---

## 1. Database: workspace settings and invites

**1.1 Extend `workspaces**`

Add columns (migration + [schema.ts](src/lib/db/schema.ts)):

- `logo_url` (text, nullable) – public or signed URL from Supabase Storage.
- `legal_name` (text, nullable) – official name (Learning Center).
- `siret` (varchar, nullable) – SIRET as text.
- Optional later: `address`, `phone`, etc.

**1.2 Workspace invites table**

New table `workspace_invites`:

- `id` (uuid, PK), `workspace_id` (FK workspaces), `email` (text), `role` (workspace_role), `invited_by` (uuid FK users), `token` (text, unique, for accept link), `expires_at` (timestamptz), `created_at` (timestamptz).

Relations in [relations.ts](src/lib/db/relations.ts). No email sending required for first version: in-app list + copy-invite-link or accept-by-token page is enough; email can be added later.

**1.3 Supabase Storage for logos**

- Create bucket `workspace-logos` (public read, or private with signed URLs).
- RLS on `storage.objects`: INSERT/UPDATE only for authenticated users who are workspace members with `workspace_settings` permission for that workspace (path can be `{workspace_id}/{filename}`); SELECT for public read if bucket is public, or signed URL from server.
- Migration: create bucket via Supabase Storage API or dashboard; add RLS policies (e.g. using `storage.foldername()` to get `workspace_id` and checking `workspaces_users` + role).

---

## 2. Workspace settings page: data and API

**2.1 Load**

- In [parametres/workspace/+page.server.ts](<src/routes/(app)/parametres/workspace/+page.server.ts>): already has `workspace`, `members`, `canManage`. Extend workspace query to include `logo_url`, `legal_name`, `siret`. Load `workspace_invites` for current workspace (id, email, role, expires_at, created_at) when `canManage`.
- Return `pendingInvites` and full workspace fields.

**2.2 Save workspace settings (form action)**

- New form action (or dedicated API): validate permission (`hasPermission(role, 'workspace_settings')`), then update `workspaces` (name, legal_name, siret). Logo is handled separately (upload endpoint).
- Logo upload: POST endpoint (e.g. `parametres/workspace/upload-logo/+server.ts`) that: checks permission, validates file (type/size), uploads to `workspace-logos/{workspaceId}/{uuid}.ext` via `locals.supabase.storage`, then updates `workspaces.logo_url` with the public URL (or stores path and serves signed URL from layout).

---

## 3. Workspace switcher: logo + subtle default icon

- **Layout**: In [(app)/+layout.server.ts](<src/routes/(app)/+layout.server.ts>), include `logo_url` (and optionally other display fields) in the `workspace` object passed to the layout (query `workspaces` with `logo_url` for the active workspace).
- **Workspace switcher** ([workspace-switcher.svelte](src/lib/components/workspace-switcher.svelte)):
  - Accept `defaultWorkspace` with `logoUrl` (e.g. `{ id, name, logoUrl }`).
  - If `defaultWorkspace.logoUrl`: show `<img>` for the logo in the trigger button (same 8x8 container).
  - If no logo: keep `GalleryVerticalEndIcon` but **change class** from `bg-sidebar-primary text-sidebar-primary-foreground` to a more subtle style, e.g. `bg-sidebar-accent text-sidebar-accent-foreground` or `bg-muted text-muted-foreground`, so the icon is visible but not as prominent (not red).
- **Dropdown items**: For each workspace in the list, you may optionally show logo thumbnail if you later pass per-workspace logo URLs; minimal change is only the current workspace logo in the trigger.

---

## 4. Parametres/workspace UI: structure and team

**4.1 Page structure**

- Use **tabs** (or clear sections): "Général" | "Équipe".
- **Général**: Form – Learning Center name (maps to `workspaces.name`), legal name, SIRET; logo upload (preview, replace, remove). Submit saves to DB; logo submit calls upload endpoint then updates `logo_url`.
- **Équipe**: Existing members table; add for `canManage`: "Inviter un membre" (email + role selector), list of **pending invites** (email, role, sent date, actions: cancel). Members: show role; for owner/admin, allow role change (dropdown or dialog) and remove member (with confirmation). Prepare UI for "Inviter" even if backend is phased (e.g. invite form + empty pending list first).

**4.2 Invite flow (backend)**

- **Create invite**: Form action or API – check `canManage`, create row in `workspace_invites` (generate token, e.g. `crypto.randomUUID()` or nanoid), set `expires_at` (e.g. 7 days). Optionally send email later; for now, "Invitation créée" and show in pending list (and optionally "Copy invite link" using token).
- **Cancel invite**: Form action – delete row in `workspace_invites` by id, ensure workspace and permission.
- **Accept invite**: Route e.g. `/invite/[token]/+page.server.ts` – resolve invite by token, ensure not expired, add user to `workspaces_users` with invite role, delete invite, redirect to app with that workspace active.
- **Change member role**: Form action – update `workspaces_users.role` for given userId in current workspace; only owner/admin; prevent demoting last owner.
- **Remove member**: Form action – delete from `workspaces_users`; only owner/admin; prevent removing last owner.

---

## 5. "See as" (owner only)

**5.1 Semantics**

- Only **owner** can enter "See as" mode: choose a **member** (or equivalently a role by picking one member with that role). The view then behaves as if the current user had that member’s identity and role in the workspace (same workspace, different effective user/role for data and UI).
- Stored in **cookie** (e.g. `see_as`) so it’s available on every request: payload could be `{ workspaceId, userId, role }` or `{ workspaceId, workspaceMembershipId }`. Prefer signed or server-validated: e.g. store minimal payload and verify server-side that the current user is owner and the target is in the same workspace.

**5.2 Guards and layout**

- **Resolve effective context**: In `requireWorkspace` (or a small helper used by layout and guards), after resolving real user and active workspace, check cookie `see_as`. If set and valid (current user is owner of that workspace; target userId is in `workspaces_users` for that workspace), then for that request use **effectiveUserId** = target user, **effectiveRole** = target role; otherwise use real user and role.
- **Layout** ([(app)/+layout.server.ts](<src/routes/(app)/+layout.server.ts>)): When computing `role`, `roleLabel`, `allowedNavUrls`, use effective role if "See as" is active. Pass a flag and target info to the layout (e.g. `seeAs: { userId, role, roleLabel, memberName } | null`) so the UI can show the banner.
- **Data loading**: All loaders that use `userId` or `role` for filtering (formations, deals, etc.) must use the **effective** user/role when "See as" is on (so the owner sees data as that member would). That implies passing effective context from layout or from a shared helper that reads the cookie and returns effective userId/role.

**5.3 UI**

- **Banner / pill**: When `seeAs` is set, show a persistent, clearly visible bar (e.g. at top of main content or below header): "Vous consultez l'espace en tant que [Member name] ([Role])" with button "Revenir à mon rôle" which clears the cookie and invalidates/reloads.
- **Setting "See as"**: On the workspace settings **Équipe** tab (or a dedicated control), for owner only: dropdown or list "Voir en tant que…" with members (excluding self). On select, set cookie and redirect or invalidate so layout and all data reflect the effective user/role.
- **Visibility**: Banner must appear on every page of the app while "See as" is active (layout-level component or slot). Clear cookie on logout and when switching workspace (so "See as" is workspace-scoped).

---

## 6. Implementation order (high level)

1. **DB**: Migration for `workspaces` new columns + `workspace_invites` table; update Drizzle schema and relations.
2. **Storage**: Create bucket `workspace-logos` and RLS policies; implement upload endpoint and `workspaces.logo_url` update.
3. **Layout**: Load workspace with `logo_url`; pass to sidebar; optionally add `see_as` cookie read and effective context (can be after step 5).
4. **Workspace switcher**: Use `logoUrl` when present; when absent, use subtle icon styling (no red).
5. **Parametres/workspace**: Tabs Général / Équipe; Général form (name, legal_name, siret, logo upload) with save and upload; Équipe: members + pending invites list, invite form (create invite), cancel invite, change role, remove member; accept-invite route.
6. **See as**: Cookie write/read, guard/layout effective context, owner-only "Voir en tant que" control, persistent banner and "Revenir à mon rôle".

---

## 7. Files to touch (concise)

| Area          | Files                                                                                                                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB            | New migration; [src/lib/db/schema.ts](src/lib/db/schema.ts), [src/lib/db/relations.ts](src/lib/db/relations.ts)                                                                                                                                                       |
| Storage       | Migration or script for bucket + RLS; upload endpoint e.g. `parametres/workspace/upload-logo/+server.ts`                                                                                                                                                              |
| Layout        | [(app)/+layout.server.ts](<src/routes/(app)/+layout.server.ts>) (workspace with logo_url; later see_as)                                                                                                                                                               |
| Switcher      | [workspace-switcher.svelte](src/lib/components/workspace-switcher.svelte)                                                                                                                                                                                             |
| Settings page | [parametres/workspace/+page.server.ts](<src/routes/(app)/parametres/workspace/+page.server.ts>), [parametres/workspace/+page.svelte](<src/routes/(app)/parametres/workspace/+page.svelte>); form actions for save, invite, cancel, change role, remove                |
| Invite accept | New route e.g. `invite/[token]/+page.server.ts` (and optional +page.svelte)                                                                                                                                                                                           |
| See as        | [guards.ts](src/lib/server/guards.ts) or [workspace.ts](src/lib/server/workspace.ts) (effective context); layout (seeAs data); banner component or inline in [layout.svelte](<src/routes/(app)/+layout.svelte>); workspace settings Équipe "Voir en tant que" control |

---

## 8. Optional / later

- **Email for invites**: Use Supabase Auth invite or custom email with accept link; first version can be in-app only (pending list + copy link or token in URL).
- **Validation**: SIRET format (e.g. 14 digits); file type/size for logo (e.g. image only, max 2MB).
- **Remove last owner**: Guard so at least one owner remains; prevent role change to non-owner if they are the only owner.
