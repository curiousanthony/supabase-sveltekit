# Sidebar: hide/unhide nav items

Change which sidebar nav items are visible by editing the **`sidebarHidden`** array in `src/lib/settings/config.ts`.

- **To hide** an item: add its key to `sidebarHidden`.
- **To show** it again: remove its key from `sidebarHidden`.

**Keys:**

| Item | Key to add/remove |
|------|-------------------|
| Messagerie (shortcut) | `'/messagerie'` |
| Gestion qualité (main nav) | `'/qualiopi'` |
| Outils (main nav) | `'/outils'` |
| Credits balance (secondary nav) | `'credits'` |

You can also hide any other sitemap entry by adding its URL path (e.g. `'/bibliotheque'`, `'/calendrier'`). The sidebar and the Command Palette (⌘K) both read `sidebarHidden`, so hidden routes disappear from both.

**Examples:**

- User says "hide Messagerie and credits" → ensure `sidebarHidden` includes `'/messagerie'` and `'credits'`.
- User says "show Gestion qualité" → remove `'/qualiopi'` from `sidebarHidden`.
- User says "show everything" → set `sidebarHidden` to `[]`.
