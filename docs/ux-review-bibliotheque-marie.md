# UX Review: Bibliothèque & related flows — Marie (Learning Center)

**Persona:** Marie works in a Learning Center. She handles deals, creates formations, and uses the library (modules, programmes) to standardize offerings and save time. She may be admin, secretary, or sales. She is not a product expert; she expects the app to guide her and to avoid dead ends.

**Method:** Goals and intentions were defined as Marie; the app was used to achieve them. Frustrations, impact level, and “magic wand” improvements are noted. The report ends with a prioritized change plan.

---

## 1. Goals tested (Marie’s intentions)

| # | Goal | Entry point | Expected flow |
|---|------|-------------|----------------|
| A | Set the “programme ciblé” on a deal so that when we close, the formation is created with the right programme | Deal page | See “Programme ciblé”, choose programme, save → later “Clôturer et créer formation” uses it |
| B | Create a new formation from a library programme (template) | Unclear | Either Bibliothèque → Programmes → “Créer une formation”, or Formations → Créer? |
| C | Add a module from the library to a formation I’m creating | Formation create wizard | Step 2: add module from library without leaving the wizard |
| D | Add a module from the library to an existing formation | Formation detail | Programme/Modules section → “Ajouter depuis la bibliothèque” |
| E | I’m in the library, I found a module, I want to add it to a formation | Bibliothèque → Modules | “Ajouter à une formation” → choose formation → confirm |

---

## 2. Journey walkthroughs and frustrations

### Goal A — Set programme on deal, then close and create formation

**Hypothesis (Marie):** “I’m on the deal, I want to link the programme we’re going to deliver, then when we win I’ll close and get a formation already filled with that programme.”

**What happens:**
- Deal page → “Actions” card: “Étape” + “Programme ciblé (intérêt du lead)” + “Clôturer (gagné) et créer une formation”.
- Programme selector only appears if `libraryProgrammes.length > 0`. No hint that “if you set a programme, the created formation will be prefilled”.
- When she clicks “Clôturer (gagné) et créer une formation”, the dialog says: *“Une formation sera créée avec le nom, le client et les informations du deal. Vous pourrez la compléter (modules, Qualiopi, etc.) sur la page formation.”*
- **Problem:** The dialog is the same whether a programme is set or not. Marie does not see that the formation will be created **from the programme** (modules, objectifs, durée, etc.). She may think setting the programme is optional or only “for interest” and not that it prefills the formation.

**Frustrations:**
1. **No feedback that programme = prefill** (High). Dialog copy ignores `deal.libraryProgrammeId`. Marie would want: “La formation sera créée à partir du programme **« [titre] »** (modules, objectifs, durée déjà renseignés). Il restera à vérifier le client et les infos Qualiopi.”
2. **Order of actions unclear** (Medium). Should she set the programme first, then close? The UI doesn’t say “Étape 1: Choisir le programme ciblé → Étape 2: Clôturer”.

---

### Goal B — Create a formation from a library programme

**Hypothesis (Marie):** “I want to create a formation from a programme we already have. Where do I start?”

**Possible paths:**
- **Path 1:** Formations → “Créer une formation”. She gets the wizard from scratch. She never sees “partir d’un programme” unless she already knows the URL or came from the library.
- **Path 2:** Bibliothèque → Programmes de formation → on a card: “Créer une formation”. She clicks → `/formations/creer?programmeId=xxx`. The wizard opens with Step 1 (Bases) **prefilled** (name, durée, modalité, thématique, public cible, prérequis, modules in Step 2). But on the formation create page there is **no mention** of “Cette formation est basée sur le programme [X]”. So Marie may not realize the prefill happened or which programme it was.

**Frustrations:**
1. **No indication “création à partir du programme X”** (High). When `?programmeId=` is present, the page should show a clear banner or subtitle: “Création à partir du programme : [Nom du programme]”. Without it, Marie might re-enter data or not trust the prefill.
2. **Two entry points, no guidance** (Medium). Formations list has “Créer une formation” (blank). Bibliothèque has “Créer une formation” per programme. The home and formations list do not suggest “Créer à partir d’un programme de la bibliothèque”. Marie would want one obvious path when her intention is “from programme”: e.g. Formations → Créer → “Partir d’un programme” (dropdown or link to library) or a clear link “Créer à partir de la bibliothèque” next to “Créer une formation”.
3. **Dead end feeling** (Low). If she starts from Formations → Créer, she never sees the library. So “create from programme” is only discoverable from Bibliothèque → Programmes.

---

### Goal C — Add a module from the library while creating a formation

**Hypothesis (Marie):** “I’m in the creation wizard, Step 2. I want to add a module that we already have in the library.”

**What happens:**
- Step 2 shows “Ajouter un module” and “Ajouter depuis la bibliothèque”. She clicks “Ajouter depuis la bibliothèque” → dialog with library modules (radio list). She selects one, clicks “Ajouter” → module is appended to the form. Dialog closes. **This flow works.**

**Frustrations:**
1. **Radio selection UX** (Low). The “Ajouter” button is disabled until a module is selected. Selecting by clicking the label works; clicking the (sr-only) radio can be awkward. Optional: make the whole row a single “Add” target or show “Ajouter” per row.
2. **No empty state guidance** (Low). If there are no library modules, the dialog says “Aucun module dans la bibliothèque. Créez-en dans Bibliothèque → Modules.” That’s correct but could add a direct link “Aller à la bibliothèque” so she doesn’t have to remember the path.

---

### Goal D — Add a module from the library to an existing formation

**Hypothesis (Marie):** “I’m on the formation detail, I want to add another module from the library.”

**What happens:**
- Formation detail → “Programme / Modules” card → “Ajouter depuis la bibliothèque” → dialog → choose module → “Ajouter” (form POST). Module is added, list refreshes. **Flow works.**

**Frustrations:**
1. **Placement in the page** (Low). Programme/Modules can be below the fold. If the formation has a lot of content (séances, apprenants, etc.), Marie has to scroll to find “Ajouter depuis la bibliothèque”. Optional: sticky action or a more prominent CTA when there are few modules.

---

### Goal E — From the library, add a module to a formation

**Hypothesis (Marie):** “I’m in Bibliothèque → Modules. I see a module I want to use. I want to add it to a formation.”

**What happens:**
- On each module card: “Modifier” and “Ajouter à une formation”. She clicks “Ajouter à une formation” → `/bibliotheque/modules/[id]/utiliser`. New page: “Ajouter ce module à une formation” with a **single dropdown** “Formation *” (list of formations En attente / En cours). She chooses a formation, clicks “Ajouter à la formation”. Submit → module is copied into that formation. Then she sees success but stays on the “utiliser” page. “Annuler” goes back to `/bibliotheque/modules`.

**Frustrations:**
1. **Full-page step for one choice** (Medium). Marie leaves the module list, lands on a page with only one dropdown and two buttons. She would prefer a small modal or inline “Add to formation” from the list (choose formation → confirm) so she doesn’t lose context and doesn’t have to click “Annuler” to go back.
2. **No “go to formation” after add** (Medium). After adding, she remains on “utiliser”. She might want to “Voir la formation” or “Ajouter un autre module” to the same formation. Today she must use the sidebar or back navigation. Magic wand: after success, show “Module ajouté. [Voir la formation] [Ajouter à une autre formation]”.
3. **Empty formations list** (High when it happens). If there are no formations “En attente” or “En cours”, the dropdown is empty and the button disabled. Message: “Aucune formation en attente ou en cours. Créez une formation ou choisissez-en une modifiable.” So she **cannot** add the module to a formation from here. She has to create a formation elsewhere, then come back. Dead end for “I want to use this module in a new formation” (create formation first, then add module from library from the formation page).

---

## 3. Cross-cutting issues

| Issue | Impact | Magic wand |
|-------|--------|------------|
| **No clear “creation from programme” story** | High | One obvious path: Formations → Créer → “Partir de zéro” vs “Partir d’un programme” (link to library or inline programme picker). When coming from `?programmeId=`, show a clear “Basé sur le programme : [X]” on the wizard. |
| **Deal close dialog ignores programme** | High | When `deal.libraryProgrammeId` is set, change dialog title/description to say the formation will be created **from that programme** (modules, objectifs, etc. already filled). |
| **Programme ciblé purpose unclear** | Medium | On the deal, add a short line: “En clôturant, la formation sera créée à partir de ce programme si vous en avez choisi un.” |
| **“Utiliser” = full page** | Medium | From Bibliothèque Modules, “Ajouter à une formation” could open a modal (formation picker) and after success offer “Voir la formation” / “Retour aux modules”. |
| **No post-success “Voir la formation”** (utiliser) | Medium | After adding module to formation, show a link “Voir la formation” (and optionally “Ajouter à une autre formation”). |
| **Formation create: no “from programme” hint** | Medium | When `programmeId` in URL, show a non-intrusive banner: “Cette formation est préremplie à partir du programme [Nom].” |
| **Order of actions on deal** | Low | Optional: number or order “1. Programme ciblé (optionnel) 2. Clôturer et créer la formation”. |

---

## 4. Prioritized change plan

### P0 — Must-have (clarify value and avoid confusion)

1. **Deal close dialog: reflect programme**
   - **File:** `src/routes/(app)/deals/[id]/+page.svelte`
   - When `deal.libraryProgrammeId` is set, show in the dialog: title or description that the formation will be created **from the programme [titre]** (modules, objectifs, durée, etc. préremplis). Keep existing text when no programme is set.

2. **Formation create: “basé sur le programme” when prefill**
   - **File:** `src/routes/(app)/formations/creer/+page.svelte` (and optionally `+page.server.ts` to pass programme name)
   - When load returns a prefill from a programme (e.g. `programmeId` in URL and prefill applied), display a clear line or banner in Step 1: “Cette formation est préremplie à partir du programme : [Nom du programme].” (Pass programme name from server if not already in client data.)

### P1 — Should-have (better flow and discovery)

3. **Deal: clarify “Programme ciblé”**
   - **File:** `src/routes/(app)/deals/[id]/+page.svelte`
   - Add a short help text under the programme selector: “En clôturant le deal, la formation sera créée à partir de ce programme (modules et objectifs préremplis).”

4. **Formations list or “Créer” entry: “Partir d’un programme”**
   - **Files:** `src/routes/(app)/formations/+page.svelte` and/or formation create entry (e.g. header actions)
   - Next to “Créer une formation”, add a secondary action or link: “Créer à partir d’un programme” linking to `/bibliotheque/programmes` or a modal that lists programmes and redirects to `/formations/creer?programmeId=xxx`. So Marie can start from Formations and still “create from programme”.

5. **Bibliothèque “utiliser”: success state**
   - **File:** `src/routes/(app)/bibliotheque/modules/[id]/utiliser/+page.svelte` (and server action response)
   - After successful add, show a success message and a link “Voir la formation” (and optionally “Ajouter à une autre formation” or “Retour aux modules”) so she doesn’t have to navigate manually.

### P2 — Nice-to-have (fewer steps, less context loss)

6. **“Ajouter à une formation” from library modules: modal instead of full page**
   - **Files:** `src/routes/(app)/bibliotheque/modules/+page.svelte`, new small modal or reuse dialog
   - On “Ajouter à une formation”, open a modal with formation dropdown + “Ajouter” and “Annuler”. On success, close modal and show toast with “Voir la formation” link. Keeps her on the module list.

7. **Formation create “Add from library” empty state**
   - **File:** `src/routes/(app)/formations/creer/+page.svelte`
   - In the “Ajouter depuis la bibliothèque” dialog, when there are no modules, add a button or link “Créer un module dans la bibliothèque” (e.g. `/bibliotheque/modules/creer`) so the path is one click.

8. **Deal: optional visual order**
   - In the Actions card, optionally label or order: “1. Programme ciblé” then “2. Clôturer et créer la formation” so the recommended order is obvious.

---

## 5. Summary table (Marie’s view)

| Goal | Works? | Main frustration | Fix (priority) |
|------|--------|------------------|-----------------|
| A — Set programme on deal, close | Yes | Dialog doesn’t say formation is from programme | P0: Dialog text when programme set |
| B — Create formation from programme | Yes (from Bibliothèque) | No “from programme” hint on wizard; no discovery from Formations | P0: Banner on create; P1: “Créer à partir d’un programme” from Formations |
| C — Add module from library (wizard) | Yes | Minor: radio UX, empty state | P2: Link to create module in empty state |
| D — Add module on formation detail | Yes | Section can be below fold | Optional: sticky or CTA |
| E — From library, add module to formation | Yes | Full-page “utiliser”, no “Voir la formation” after | P1: Success + link; P2: Modal from list |

Implementing **P0** and **P1** would remove the main dead ends and make the “programme → formation” and “library → deal/formation” value clear to Marie, with minimal extra steps.
