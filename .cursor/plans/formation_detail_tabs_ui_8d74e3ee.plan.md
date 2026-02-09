# Formation detail page – tabs and Aperçu UI (PoC, dummy data)

## Scope

- **In scope:** Route structure, layout, tab navigation, Aperçu as the **index view** at `[id]/`, and three sub-routes (suivi, formateurs, seances). All content with **dummy/mock data**. Formateur(s) in main info: one line with stacked avatar(s) when multiple, or "Aucun formateur assigné" + "Gérer".
- **Out of scope:** Real DB queries, schema changes, form actions, backend logic. Those will be planned once navigation and flow are validated.

---

## 1. Route structure

- **Aperçu is the formation index:** The URL `/formations/[id]` (no trailing segment) **is** the Aperçu view. No `/formations/[id]/apercu` sub-route. The 2x2 grid lives in `[id]/+page.svelte`; the layout wraps it and shows the tab strip.
- **Layout:** `src/routes/(app)/formations/[id]/+layout.server.ts` and `+layout.svelte`. Layout load returns formation (or dummy) + header config. Layout renders: header + tab strip + `<slot />` (child = index or sub-route).
- **Sub-routes (tabs):** Only three sub-routes, short names, no hyphens:
  - `[id]/suivi` – Suivi qualité (quality tracking)
  - `[id]/formateurs` – Formateurs
  - `[id]/seances` – Séances
- **Tab strip:** Four items. First tab is **Aperçu** and links to `/formations/[id]` (same as current page when already there). Other three link to `.../suivi`, `.../formateurs`, `.../seances`. Active tab: Aperçu when `pathname` is exactly `/formations/[id]` or `/formations/[id]/`; others when pathname ends with `/suivi`, `/formateurs`, `/seances`.

**Files to add/change:**

- Add `[id]/+layout.server.ts`: formation fetch for header (or dummy for PoC).
- Add `[id]/+layout.svelte`: header + tab strip (4 links: Aperçu → `[id]`, Suivi → `[id]/suivi`, Formateurs → `[id]/formateurs`, Séances → `[id]/seances`) + `<slot />`.
- Keep `[id]/+page.svelte` for the **Aperçu** 2x2 grid (index view). Move current tab content into this page; remove old tabs component from here.
- Keep or simplify `[id]/+page.server.ts` for Aperçu load (dummy data only for PoC).
- Create `[id]/suivi/+page.svelte`, `[id]/formateurs/+page.svelte`, `[id]/seances/+page.svelte` with placeholder content.

---

## 2. Layout and tab strip

- **Tab order (left to right):** Aperçu | Suivi | Formateurs | Séances.
- **Icons (Lucide):** LayoutGrid (or LayoutDashboard) for Aperçu; CheckSquare or ClipboardCheck for Suivi; UserRound or GraduationCap for Formateurs; Calendar for Séances.
- **Visual:** Tabs as links; active state via pathname. Use existing UI (e.g. tabs as presentational, or styled links with `aria-current="page"`).

---

## 3. Aperçu (index) – 2x2 grid and sections

Rendered at `[id]/+page.svelte`. **Responsive grid:** 1 column on small screens (e.g. default/mobile), 2 columns from `md` breakpoint up (e.g. `grid grid-cols-1 md:grid-cols-2 gap-4`). On small screens the four sections stack vertically so the layout remains usable. Each cell is a card-like block. All data **dummy**.

### Cell 1 – Quest tracker (actions to perform)

Treat this block as a **quest tracker**, not a flat checklist: one clear "current" step in the spotlight, the app leads the user to the next action.

- **One current quest:** Visually highlight a single "next" action (e.g. "Prochaine étape : Générer la convention" or "À faire : Assigner un formateur") with one primary CTA (e.g. "Commencer" or "Faire" / "Aller >") that navigates to the right sub-route and, when backend exists, to the right section or flow (e.g. Formateurs tab with assign flow in focus).
- **Full list below (optional):** Show the full ordered list of steps; completed steps have a checkmark, the current one is emphasized, later steps are **greyed out / locked** until prerequisites are done. No equal-weight list of 8 buttons — the user should not have to choose what to do next.
- **Progress:** Text like "X / Y actions complétées" or "Plus que Z étapes" plus a progress bar (dummy for PoC). When backend exists, consider a small reward on step completion (e.g. checkmark animation or short "Étape validée" feedback).
- **Copy:** Use task-oriented labels (e.g. "Générer la convention", "Assigner un formateur"). Optional short line under progress: "Vous avez validé les infos et la convention. Prochaine étape : assigner un formateur."
- **CTAs:** Primary CTA goes to the tab (and later, the exact section) where the action is done. Secondary list items use "Aller >" or similar to the same destinations.

### Cell 2 – Main information

- Title, #idInWorkspace, duration, dates, modality, location, financement (org, amount, status).
- **Formateur(s) – Option C:** One line: stacked avatars (when assigned) + "Gérer" → `/formations/[id]/formateurs`; or "Aucun formateur assigné." + "Gérer" (same link).

### Cell 3 – Sessions planifiées (Séances)

- Title + "Voir tout le calendrier" → `/formations/[id]/seances`. Dummy list of sessions (date, module, time, educator, émargement).

### Cell 4 – Learners (Apprenants)

- List: full name, company. Company hover → popover with rich company info (dummy). CTAs: message (→ Messagerie), optional phone.

---

## 4. Placeholder sub-routes

- **Suivi** (`[id]/suivi`): Placeholder text.
- **Formateurs** (`[id]/formateurs`): Placeholder; "Gérer" from Aperçu lands here.
- **Séances** (`[id]/seances`): Placeholder; "Voir tout le calendrier" lands here.

---

## 5. Dummy data and components

- Centralise dummy data (e.g. inline in Aperçu page or a small `dummy.ts`) for formation, actions, sessions, learners. Formateur avatars: 1–2 dummy image URLs for stacked display. Icons: Lucide where specified.

---

## 6. File checklist (no backend)

| Action | Path |
|--------|------|
| Add layout | `[id]/+layout.server.ts`, `[id]/+layout.svelte` |
| Aperçu = index | `[id]/+page.svelte` (2x2 grid), optional `[id]/+page.server.ts` |
| Placeholder sub-routes | `[id]/suivi/+page.svelte`, `[id]/formateurs/+page.svelte`, `[id]/seances/+page.svelte` |
| Remove | Old tab triggers/content from current `[id]/+page.svelte` (replace with grid only) |

---

## 7. Navigation to validate

- Aperçu at `/formations/[id]`; "Gérer" → formateurs; "Voir tout le calendrier" → seances; action "Aller >" → correct tab. URLs and back/forward work. Formateur(s) line: stacked avatars or "Aucun formateur assigné" + "Gérer". Learners: company popover, message CTA to Messagerie.

Backend and real data in a separate plan once this flow is approved.
