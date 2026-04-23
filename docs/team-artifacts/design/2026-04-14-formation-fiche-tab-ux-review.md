# Formation — Fiche tab UX review

**Date**: 2026-04-14  
**Reviewer**: UX review (behavioral psychology lens, aligned with archived UX reviewer + UX designer practice)  
**Route**: `src/routes/(app)/formations/[id]/fiche/` (`+page.svelte`, `+page.server.ts`)  
**Parent shell**: `src/routes/(app)/formations/[id]/+layout.svelte` (tabs + `HudBanner`)  
**Reference**: `.cursor/skills/_archived/ux-reviewer/references/behavioral-psychology.md`  
**Persona**: Marie — admin / responsable pédagogique, multi-contexte, charge cognitive élevée, besoin de clarté Qualiopi / audit

---

## TL;DR

1. **La fiche est une longue colonne de cartes homogènes** — peu de différenciation visuelle entre “identité de la formation”, “référentiel”, “logistique” et “finance” ; l’œil ne sait pas où atterrir en premier (**charge cognitive**, **Progressive disclosure** absente au niveau page).
2. **La grille 2 colonnes est largement annulée** — nombreux champs en `sm:col-span-2` (modalité, durée, RNCP, description, lieu, client) : sur desktop, l’effet “2 colonnes” est faible ; la sensation reste **liste verticale** (**Cognitive load** — tout se lit comme une seule masse).
3. **Hiérarchie informationnelle faible** — l’intitulé (signal le plus fort pour “quelle formation ?”) est traité comme un champ parmi d’autres, même poids typographique que “Type” ou “Montant accordé” (**Peak-End / première impression** dégradée).
4. **Generic “form builder”** — répétition du motif label uppercase + contrôle shadcn identique sur ~20 champs : effet **admin template** sans personnalité métier (**Emotional contagion** — interface “dense bureau” plutôt que “outil de pilotage”).
5. **Cumul vertical avec le shell formation** — onglets + `HudBanner` + bannière deal + `QuestGuideBanner` + 3 `Card` : beaucoup d’éléments **avant** le contenu “métier” stable (**Cognitive load**, risque de **banner fatigue** avec le HUD parent).

**Priorité recommandée**: Repenser le **above-the-fold** (résumé + prochaine action), puis **layout large écran** (panneau latéral “faits clés” + zone principale), puis **regroupement sémantique** (identité / pédagogie / calendrier & lieu / finance).

---

## Personas & hypothèses

**Marie** ouvre l’onglet Fiche pour compléter ou corriger des données avant un audit, un financeur, ou après un deal.


| ID  | Hypothèse                                                              | Mécanisme psychologique                                                          |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| H1  | Elle ne sait pas en < 3 s si la fiche est “complète” ou “à risque”     | Zeigarnik — trop de boucles ouvertes sans priorisation                           |
| H2  | Elle scroll longtemps pour relier dates, lieu et client                | Charge cognitive intrinsèque (relations logiques dispersées)                     |
| H3  | Elle confond champs “consultation rapide” et “édition profonde”        | Affordances — boutons `cursor-text` vs vrais champs peu différenciés hors survol |
| H4  | Sur grand écran, elle ressent du “gaspillage” d’espace à gauche/droite | Manque de structure en colonnes hiérarchisées                                    |


---

## Click-path & scan (tâches fréquentes)

### Tâche A — “Je veux voir de quoi il s’agit”


| Étape                   | Constat                                                                                      | Friction                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1. Arrivée onglet Fiche | Tabs + HUD (layout) puis bannières optionnelles puis titre de carte “Informations générales” | **Temporelle** — le nom de la formation n’est pas en en-tête de page |
| 2. Repérer l’intitulé   | Premier champ dans la première carte                                                         | **Cognitive** — pas de hiérarchie “titre > sous-titre”               |


### Tâche B — “Je complète dates + lieu + client”


| Étape     | Constat                                | Friction                                                                            |
| --------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| 1. Dates  | Carte “Logistique”, grille 2 cols — OK | Faible                                                                              |
| 2. Lieu   | `sm:col-span-2` sous les dates         | **Motrice** — scroll si beaucoup de contenu au-dessus (carte 1 longue)              |
| 3. Client | Même carte, pleine largeur             | **Logique** — lien mental “qui / où / quand” correct mais **vertical depth** élevée |


### Tâche C — “Je vérifie financement + montants”


| Étape                          | Constat                  | Friction                                                    |
| ------------------------------ | ------------------------ | ----------------------------------------------------------- |
| 1. Carte séparée “Financement” | Séparation claire        | Positive                                                    |
| 2. Lisibilité                  | Même densité que carte 1 | **Hick** — plusieurs montants / switch / type sans “résumé” |


---

## Findings

### Critical — Absence de couche 1 (résumé + statut + action)

**Observation** : La page saute directement dans les champs éditables. Aucun bloc “Vue d’ensemble” (type, modalité, dates, client, financement synthétisés) ni indicateur de complétude / risque lié à la fiche elle-même (le HUD parent couvre les quêtes, pas la qualité de remplissage de la fiche).

**Psychologie** : *Progressive disclosure* recommande couche 1 = statut + action principale ; ici tout est couche 3 (détail champs). *Cognitive load* — Marie doit reconstruire mentalement l’état à partir de fragments.

**Recommandation** : Ajouter un **header de fiche** (hors Card ou Card unique “Synthèse”) : intitulé en `text-2xl` / `font-semibold`, sous-ligne avec type · modalité · dates (si présentes) · client ; puces d’état “manque X” uniquement si pertinent ; CTA secondaire “Compléter les champs obligatoires” si modèle métier défini.

---

### Major — Layout desktop sous-utilisé ; effet “1 colonne”

**Observation** : `grid-cols-1 sm:grid-cols-2` mais `sm:col-span-2` sur une majorité de blocs à forte surface (description, modalité, durée, RNCP, lieu, client). Résultat : **deux colonnes rarement visibles simultanément** pour les blocs qui comptent visuellement.

**Psychologie** : *Cognitive load* — la verticalité maximise la sérialisation de l’attention ; *Fitts* indirectement (plus de scroll = plus de distance vers cibles bas de page).

**Recommandation** : À partir de `lg:` :

- **Colonne A (fixe ~320–380px)** : Identité + statut + liens (deal, entreprise) + champs courts.
- **Colonne B (flex)** : Description, RNCP, blocs pédagogiques.
- **Colonne C ou bas de B** : Logistique + finance en panneaux repliables ou onglets internes **si** la largeur reste confortable.

Alternative plus légère : **2 colonnes inégales** `lg:grid-cols-[1fr_1.2fr]` avec regroupement strict pour éviter `col-span-2` systématique.

---

### Major — Homogénéité visuelle = hiérarchie plate

**Observation** : Tous les labels en `text-xs uppercase tracking-wide text-muted-foreground` + contrôles `h-9` / bordures identiques. L’intitulé, la description, un montant euros et un switch ont le **même poids perceptif**.

**Psychologie** : *Emotional contagion* — interface “grille administrative” ; *Peak-End* — la première chose visible n’est pas le nom de la formation mais “Informations générales”.

**Recommandation** :

- **Élever** l’intitulé (taille, poids, éventuellement hors carte ou en tête de première carte sans label uppercase).
- **Diminuer** visuellement les champs secondaires (RNCP, aide inline) : `text-sm`, espacement, ou disclosure “Référentiel & tags”.
- Utiliser **Card.Description** ou sous-titres contextuels par section (1 phrase métier), pas seulement `Card.Title`.

---

### Major — Densité + micro-textes d’aide partout

**Observation** : Textes d’aide sous Code RNCP, lieu, TJM (`text-xs text-muted-foreground`) — utiles mais **additifs** en hauteur. Carte 1 très longue (thématiques + description).

**Psychologie** : *Cognitive load* — charge extrinsèque (texte non actionnable) concurrente des champs ; *Progressive disclosure* — l’aide devrait être “sur demande” (icône info, tooltip) pour champs non critiques.

**Recommandation** : Garder l’aide inline uniquement pour champs **à fort risque d’erreur** ou conformité ; sinon tooltips / lien “En savoir plus”.

---

### Moderate — Bannières & contexte parent

**Observation** : `QuestGuideBanner` en haut de la fiche + bannière “Créée depuis le deal” + dans le layout `NavTabs` + `HudBanner`. La fiche ajoute encore une couche visuelle avant le contenu stable.

**Psychologie** : *Emotional contagion* + saturation — si le HUD est déjà “chargé”, la fiche ressentie comme **encore une pile**.

**Recommandation** : Harmoniser avec le shell : par ex. intégrer le lien deal dans le **header synthèse** ; quest guide contextuel pourrait être **sticky latéral** ou réduit à une seule ligne avec lien vers Suivi.

---

### Moderate — Édition inline : affordance correcte mais fatigue

**Observation** : Pattern cohérent clic → input. Bon pour power users ; pour longues sessions, la prévisibilité est bonne, mais **peu de feedback** de granularité (toast global “Enregistré” seulement).

**Psychologie** : *Affordance* — `hover:bg-muted/50` aide ; sans hover (mobile / trackpad timide), les champs “bouton” peuvent sembler statiques.

**Recommandation** : Icône crayon discrète ou état “brouillon / sauvegardé” par champ pour champs à risque ; au minimum **saving** indicator local sur le champ actif.

---

### Minor — Presets durée (ghost buttons)

**Observation** : `ButtonGroup` en `variant="ghost"` pour 7h / 14h / … — cibles correctes mais visuellement **faibles** par rapport au Stepper.

**Psychologie** : *Fitts* OK en desktop ; *Affordance* — risque que les presets soient ignorés.

**Recommandation** : Style `outline` ou `secondary` pour au moins un preset “le plus courant” du workspace (si analytics possible) ou regrouper sous “Durées fréquentes”.

---

### Minor — Accessibilité / focus

**Observation** : `autofocus` sur plusieurs patterns d’édition — un seul à la fois en pratique, mais attention aux doubles montages si navigation rapide.

**Recommandation** : Préférer focus programmatique ciblé ; conserver `preflight` scroll (bonne idée) et documenter dans la synthèse UX.

---

## Recommandations priorisées (backlog produit)


| Priorité | Item                                                                       | Impact                                 |
| -------- | -------------------------------------------------------------------------- | -------------------------------------- |
| P0       | Header synthèse (intitulé + méta + complétude)                             | Réduit charge cognitive, améliore scan |
| P1       | Layout `lg+` 2–3 colonnes avec moins de `col-span-2`                       | Adresse “2 colonnes à peine”           |
| P1       | Regroupement sémantique (Identité & pédagogie / Planning & lieu / Finance) | Alignement mental Marie                |
| P2       | Aide inline → tooltips sauf champs critiques                               | Réduit hauteur & bruit                 |
| P2       | Section “Référentiel” (RNCP + thématiques) repliable                       | Progressive disclosure                 |
| P3       | Affordance presets durée + états sauvegarde par champ                      | Polish                                 |


---

## Tests d’acceptation (UX) suggérés

1. **Test des 5 secondes** : une admin voit-elle le nom de la formation et le type sans scroller ?
2. **Tâche chronométrée** : “Renseigner dates début/fin + lieu + client” — nombre de scrolls avant soumission.
3. **Test 1440px** : au moins **deux colonnes denses** visibles sans vide excessif sur les blocs principaux.
4. **Mobile** : la carte 1 ne dépasse pas ~2 hauteurs d’écran avant action critique (option : sections accordéon).

---

## Références code (ancrage)

- Structure page : `+page.svelte` — conteneur `flex flex-col gap-6`, enchaînement `QuestGuideBanner`, bannière deal, trois `Card.Root`.
- Grilles : `grid grid-cols-1 gap-4 sm:grid-cols-2` avec multiples `sm:col-span-2` (modalité, durée, RNCP, description, lieu, client).
- Shell formation : `+layout.svelte` — `NavTabs` + `HudBanner` au-dessus du `children` avec `pt-4`.

---

## Synthèse “design north star”

La fiche doit passer de **“formulaire long”** à **“fiche métier lisible, éditable progressivement”** : une synthèse calme en tête (*emotional contagion* positive), puis détails selon besoin (*progressive disclosure*), avec un layout large écran qui respecte la **charge cognitive** (4±1 chunks visibles, pas 15 champs au même niveau).