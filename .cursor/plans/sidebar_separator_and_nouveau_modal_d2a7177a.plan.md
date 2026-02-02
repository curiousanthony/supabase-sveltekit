---
name: Sidebar separator and Nouveau modal
overview: Add a horizontal Sidebar.Separator between shortcuts and main nav, and implement the "+ Nouveau" button to open a responsive modal (Dialog on desktop, Drawer on mobile) with permission-aware quick-create actions (Deal, Formation, Formateur/Client).
todos: []
isProject: false
---

# Sidebar separator and "+ Nouveau" quick-create modal

## 1. Horizontal separator between shortcuts and nav

**Where:** [src/lib/components/app-sidebar.svelte](src/lib/components/app-sidebar.svelte)

**Current structure:** Two `<Sidebar.Content>` blocks: first holds shortcuts (Chercher, Accueil, Boîte de réception) with `border-b border-sidebar-border`; second holds `<NavMain items={navItems} />`. The visual separation is only the border; the main nav items appear lower because they are in a separate Content block.

**Change:** Insert `<Sidebar.Separator />` between the first and second `Sidebar.Content` blocks. The project already has [Sidebar.Separator](src/lib/components/ui/sidebar/sidebar-separator.svelte) (exports `Separator` / `SidebarSeparator` in [sidebar index](src/lib/components/ui/sidebar/index.ts)); it renders a horizontal line with `bg-sidebar-border`. No new components; just add the separator in the markup.

```svelte
</Sidebar.Content>
<Sidebar.Separator />
<Sidebar.Content>
  <NavMain items={navItems} />
```

Optional: remove the `border-b border-sidebar-border pb-2` from the first `Sidebar.Content` if the separator alone is enough visually.

---

## 2. "+ Nouveau" opens a responsive modal (Dialog / Drawer)

**Pattern (from [shadcn-svelte Drawer docs](https://shadcn-svelte.com/docs/components/drawer)):** Use `MediaQuery` from `svelte/reactivity` with `(min-width: 768px)`; when true render `Dialog.Root`, when false render `Drawer.Root`. Both share the same `open` state via `bind:open`. Same inner content (title + list of actions) in both.

**Where to implement:** The "+ Nouveau" button lives in [src/lib/components/nav-main.svelte](src/lib/components/nav-main.svelte) (first `Sidebar.MenuItem`). The modal and its open state should live in the same component so the button can toggle it.

**Flow:**

- Add `let open = $state(false)` in `nav-main.svelte`.
- Give the existing "Nouveau" `Sidebar.MenuButton` an `onclick` that sets `open = true` (and use `child` snippet to render a `<button>` so it’s not a link).
- Add a responsive wrapper: `{#if isDesktop.current}` → `Dialog.Root bind:open` with `Dialog.Content`, else `Drawer.Root bind:open` with `Drawer.Content`. Reuse the same inner content snippet for both (title "Créer" or "Nouveau", list of action links).
- Each action: link to the create page (e.g. `/deals/creer`, `/formations/creer`) and on click close the modal (e.g. `open = false` or use `goto` then close). Use `Drawer.Close` / `Dialog.Close` or programmatic close after navigation; for SPA navigation, close in `onclick` before `goto` so the sheet/dialog closes immediately.

**Permission-aware actions:** Only show actions the user is allowed to use. [app-sidebar.svelte](src/lib/components/app-sidebar.svelte) already has `allowedNavUrls` (and optionally `role`). Pass `allowedNavUrls` (or a small list of permitted quick-create keys) into `NavMain`. In the modal, show:

- **Créer un deal** → `/deals/creer` (show if `allowedNavUrls` includes `/deals`)
- **Créer une formation** → `/formations/creer` (show if includes `/formations`)
- **Ajouter un formateur / Contacts** → `/contacts/formateurs` or the existing "inviter" flow (show if includes `/contacts`)

There is no dedicated "create client" route yet ([contacts/+page.svelte](<src/routes/(app)/contacts/+page.svelte>) has "Clients" disabled); for now the quick-create list can be Deal, Formation, and "Contacts" (link to `/contacts` or `/contacts/formateurs`) so staff can add formateurs. If you add a client create route later, add a fourth action.

**Optional:** Use [hasPermission](src/lib/server/permissions.ts) with the layout’s `role` if you prefer to derive visibility from role instead of `allowedNavUrls`; then pass `role` into `NavMain` and call `hasPermission(role, 'deals')` etc. Either approach is fine; the plan uses `allowedNavUrls` to stay consistent with the sidebar nav.

**Files to touch:**

- [src/lib/components/nav-main.svelte](src/lib/components/nav-main.svelte): add `open` state, wire "Nouveau" to open modal, add responsive Dialog/Drawer and shared content (title + list of action links). Add optional prop `allowedNavUrls?: string[]` and derive visible actions from it.
- [src/lib/components/app-sidebar.svelte](src/lib/components/app-sidebar.svelte): pass `allowedNavUrls={allowedNavUrls}` (or the same list used for nav) into `<NavMain>`.

**Imports in nav-main.svelte:** `MediaQuery` from `svelte/reactivity`, `* as Dialog` and `* as Drawer` from `$lib/components/ui/...`, icons for each action (e.g. HeartHandshake, Book_2, Users from Tabler).

---

## 3. Summary

| Task                | Location           | Detail                                                                                                      |
| ------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Separator           | app-sidebar.svelte | Insert `<Sidebar.Separator />` between shortcuts Content and nav Content.                                   |
| Nouveau opens modal | nav-main.svelte    | `open` state; Nouveau button opens it; responsive Dialog (desktop) / Drawer (mobile) with same content.     |
| Modal content       | nav-main.svelte    | Title + list of links: Créer un deal, Créer une formation, Contacts/Formateurs; filter by `allowedNavUrls`. |
| Pass permissions    | app-sidebar.svelte | Pass `allowedNavUrls` to `NavMain` for permission-based actions.                                            |

No backend or new routes; purely UI and wiring. Client create can be added later when you have a dedicated route.
