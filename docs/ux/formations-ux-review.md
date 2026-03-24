# UX Review — Formations (end-to-end + Actions tab)

**Date**: 2025-03-20  
**Reviewer**: Senior UX Agent (Cursor)  
**Route / Component**: `/formations`, `/formations/creer`, `/formations/[id]` (Aperçu, Fiche, Actions, Programme, Séances, Formateurs, Apprenants, Finances)  
**Product context**: Mentore Manager — outil de gestion des formations et du suivi Qualiopi pour organismes de formation.

---

## TL;DR

- **Liste Formations** : La vue Kanban par statut et les filtres sont puissants mais le CTA principal « Créer une formation » n’est pas mis en avant au-dessus de la ligne de flottaison ; il est noyé dans la sidebar. Pour un responsable qui veut « créer une formation » rapidement, le parcours n’est pas évident (Hick’s Law).
- **Détail formation** : L’onglet Actions porte un point de notification (dot) en cas d’actions en retard, mais avec 8 onglets au même niveau la charge cognitive est élevée. L’Aperçu fait bien le job en mettant en avant la « prochaine action » et un bouton « Faire » direct.
- **Onglet Actions** : Liste d’actions par phase (Conception / Déploiement / Évaluation) claire, mais au premier chargement le panneau de droite affiche « Sélectionnez une action » alors que le code sélectionne déjà la première action faisable — incohérence possible (état initial vs rendu). Les actions bloquées sont désactivées avec tooltip « Bloqué par : … » ; c’est bien. En revanche, plus de 25 intitulés d’actions dans la colonne de gauche créent du bruit et du scroll (Cognitive Load, Hick’s Law).
- **Création de formation** : Parcours en 4 étapes (Bases, Programme, Personnes, Financement) avec stepper en footer et indicateurs Qualiopi. Points positifs : verb-first CTAs, champs obligatoires explicites. Risque : étape 3 (Personnes) et 4 (Financement) sont « optionnelles » sans indiquer clairement qu’on peut passer à « Créer la formation » ; le blocage sur « Il manque X h à affecter » en étape 4 est bien visible mais peut arriver tard (Peak-End).
- **Recommandation prioritaire** : Rendre le CTA « Créer une formation » visible et dominant sur la page Liste (au-dessus de la zone des cartes), et réduire la concurrence visuelle des onglets (regrouper ou prioriser Aperçu / Actions / Fiche) pour que « où je dois cliquer pour avancer ? » soit évident en moins de 5 secondes.

---

## User Personas & Hypotheses

### 1.1 Personas identifiés

| Persona | Objectif principal | Contexte | État émotionnel à l’arrivée |
|--------|---------------------|----------|-----------------------------|
| **Marie — Responsable administrative** | Savoir en < 10 s si la formation est « prête pour un audit » et quelle est la prochaine action à faire. | Pressée, multi-fenêtres, rappels Qualiopi en tête. | Anxieuse, orientée tâche. |
| **Thomas — Coordinateur pédagogique** | Créer une nouvelle formation (client, durée, programme) et lancer le suivi des actions. | Calme, au bureau, temps devant lui. | Neutre à confiant. |
| **Sophie — Formateur / intervenant** | Consulter les séances et les documents (convocations, règlement) pour sa prochaine intervention. | Sur mobile ou tablette, déplacement. | Pressée, besoin d’info rapide. |

### 1.2 Hypothèses

| ID | Hypothèse | Risque |
|----|-----------|--------|
| H1 | Marie ne repérera pas le point (dot) sur l’onglet « Actions » au premier coup d’œil, car 8 onglets + statut + en-tête rivalisent pour l’attention. | Élevé |
| H2 | Thomas ne trouvera pas « Créer une formation » en priorité sur la page Liste, car le CTA est dans la sidebar et non au-dessus du contenu. | Élevé |
| H3 | Sur l’onglet Actions, l’utilisateur ne comprendra pas immédiatement pourquoi certaines actions sont désactivées (blocage par une autre action) sans survol / tooltip. | Moyen |
| H4 | Au premier chargement de l’onglet Actions, le panneau de droite « Sélectionnez une action » peut apparaître brièvement alors qu’une action est déjà sélectionnée à gauche, créant une micro-confusion. | Moyen |
| H5 | Sophie sur mobile aura du mal à atteindre le bouton « Faire » ou les onglets sans scroll horizontal (Fitts’s Law, zone pouce). | Moyen |

---

## UX Metrics

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Clics pour « Créer une formation » depuis Liste | 1 (sidebar) mais peu visible | 1, CTA above-fold | Visibilité, pas le nombre |
| Clics pour atteindre la prochaine action (depuis Aperçu) | 1 (« Faire ») | 1 | 0 |
| Clics pour ouvrir une action depuis l’onglet Actions | 1 (sélection dans la liste) | 1 | 0 |
| Éléments concurrents above-fold (Liste) | Titre, search, 4 filtres, tri, 3 vues, sidebar, cartes | ≤ 4 principaux | Réduire concurrence |
| Onglets visibles (détail formation) | 8 | 4–5 ou regroupés | Beaucoup de choix |
| Empty state (Liste, aucun filtre) | Géré (message + contexte) | Oui | — |
| Empty state (Actions, aucune action) | « Aucune action n’a été créée » | Oui | — |
| Primary action (Liste) visible sans scroll | Non (Créer dans sidebar) | Oui | À corriger |

---

## Findings

### 🔴 Critical

*Aucun finding bloquant identifié : les parcours principaux (voir une formation, ouvrir une action, avancer une action) sont réalisables.*

---

### 🟠 Major

#### Finding 1 — CTA « Créer une formation » peu visible sur la page Liste

**Location**: `src/routes/(app)/formations/+page.svelte`  
**Persona affected**: Thomas (coordinateur), tout utilisateur voulant créer une formation  
**Hypothesis**: H2  
**Observed behavior**: Le lien « Créer une formation » existe dans la sidebar (et éventuellement dans un menu « Nouveau »). Sur la page Liste, la zone above-fold est occupée par le titre « Formations », la barre de recherche, les filtres (Statut, Thématique, Modalité), le tri et le toggle de vue (Kanban / Grille / Liste). Aucun bouton principal « Créer une formation » n’est placé en évidence dans le contenu principal.  
**Expected behavior**: Un CTA principal (bouton ou lien fort) « Créer une formation » devrait être visible dans la zone de contenu, idéalement en haut à droite du bloc titre/filtres ou juste au-dessus des cartes, pour que l’intention « je veux créer une formation » soit satisfaite en un coup d’œil.  
**Psychological mechanism**: Hick’s Law — trop d’options au même niveau (recherche, filtres, vues) sans hiérarchie claire pour l’action principale ; Fitts’s Law si le CTA est petit ou loin du focus.  
**Emotional impact**: Légère frustration (« où est le bouton pour créer ? »), perte de temps de scan.  
**Intensity**: 3/5  
**Recommendation**: Ajouter un bouton principal « Créer une formation » dans la zone de contenu de la page Liste (par ex. à droite du titre H1 ou en tête de la toolbar), avec un style visuel dominant (primary button). Garder le lien dans la sidebar en secondaire.

---

#### Finding 2 — Huit onglets au même niveau sur le détail formation

**Location**: `src/routes/(app)/formations/[id]/+layout.svelte` (NavTabs)  
**Persona affected**: Marie, Sophie  
**Hypothesis**: H1  
**Observed behavior**: Les onglets Aperçu, Fiche, Actions, Programme, Séances, Formateurs, Apprenants, Finances sont affichés au même niveau. Sur viewport étroit, défilement horizontal (scrollbar masquée). Le point (dot) d’alerte sur « Actions » (et autres) est petit et en compétition avec 7 autres labels.  
**Expected behavior**: Réduire le nombre de choix visibles simultanés (regroupement ou priorisation) ou rendre l’onglet « à attention » (ex. Actions avec retard) plus saillant, pour que « où aller en priorité ? » soit évident.  
**Psychological mechanism**: Hick’s Law, Cognitive Load — 8 options augmentent le temps de décision et la charge mentale.  
**Emotional impact**: Hésitation, risque d’ignorer le dot pour les utilisateurs pressés.  
**Intensity**: 3/5  
**Recommendation**: En priorité : garder les 8 onglets mais renforcer la visibilité du dot (taille, couleur, ou court label « À faire ») sur l’onglet Actions (et autres onglets avec alerte). À moyen terme : envisager un regroupement (ex. « Suivi » = Actions + Séances + Formateurs + Apprenants) ou un sous-menu pour alléger la barre.

---

#### Finding 3 — Liste d’actions très longue sur l’onglet Actions

**Location**: `src/routes/(app)/formations/[id]/actions/+page.svelte` (panneau gauche)  
**Persona affected**: Marie  
**Hypothesis**: Cognitive Load  
**Observed behavior**: La colonne de gauche affiche toutes les actions regroupées par phase (Conception, Déploiement, Évaluation), avec de nombreux intitulés (28+ dans les données observées). Beaucoup sont en « disabled » (verrouillées). L’utilisateur doit scroller pour voir l’ensemble et repérer la prochaine action faisable.  
**Expected behavior**: Réduire le bruit visuel : par défaut n’afficher que la phase « en cours » ou les N prochaines actions non terminées ; le reste en « Tout afficher » ou replié.  
**Psychological mechanism**: Cognitive Load, Progressive Disclosure — afficher uniquement ce qui est pertinent pour la décision immédiate.  
**Emotional impact**: Surcharge, impression de « trop à faire ».  
**Intensity**: 3/5  
**Recommendation**: Par défaut, n’afficher que les actions non terminées et non bloquées (ou la phase courante + la suivante). Bouton « Afficher toutes les actions » pour développer le reste. Conserver les phases repliables telles quelles.

---

### 🟡 Minor

#### Finding 4 — Message « Sélectionnez une action pour voir ses détails » alors qu’une action peut être présélectionnée

**Location**: `src/routes/(app)/formations/[id]/actions/+page.svelte` (panneau droit)  
**Persona affected**: Marie, Thomas  
**Hypothesis**: H4  
**Observed behavior**: Un `$effect` sélectionne la première action « actionable » (ou celle passée en `?quest=`). Il peut y avoir un court instant où le panneau droit affiche encore l’état vide « Sélectionnez une action pour voir ses détails » avant que le détail ne s’affiche.  
**Expected behavior**: Éviter d’afficher l’état vide si une sélection valide est déjà déterminée (ex. afficher un skeleton ou ne montrer l’empty state que lorsque `selectedQuestId` est null après stabilisation).  
**Psychological mechanism**: Réduction de la confusion temporelle (flash d’empty state).  
**Emotional impact**: Légère confusion.  
**Intensity**: 2/5  
**Recommendation**: Ne montrer le message « Sélectionnez une action » que lorsque aucune action n’est sélectionnée après le premier rendu (ou après un micro-délai). Sinon afficher un loader ou le détail directement.

---

#### Finding 5 — Sous-tâche « document requis » : libellé et état désactivé

**Location**: `src/routes/(app)/formations/[id]/actions/+page.svelte` (checklist sous-tâches)  
**Persona affected**: Marie  
**Observed behavior**: Pour une sous-tâche qui exige un document, le texte « Déposez le document pour valider cette sous-tâche » apparaît et la checkbox est désactivée jusqu’à upload. C’est cohérent, mais le libellé pourrait être encore plus explicite (ex. « Document requis : déposez un fichier pour débloquer la validation »).  
**Expected behavior**: Compréhension immédiate : « je dois déposer un fichier ici pour pouvoir cocher ».  
**Psychological mechanism**: Affordance, réduction de la charge cognitive.  
**Emotional impact**: Neutre à légèrement rassurant si le libellé est très clair.  
**Intensity**: 1/5  
**Recommendation**: Renforcer le libellé au besoin (ex. « Document requis — déposez un fichier ci-dessous pour pouvoir valider cette sous-tâche ») et s’assurer que la zone d’upload est visuellement liée à la sous-tâche (proximité, encadré).

---

#### Finding 6 — Bouton « Lien externe » des sous-tâches : « bientôt disponible »

**Location**: `src/routes/(app)/formations/[id]/actions/+page.svelte` (sous-tâche `ctaType === 'external'`)  
**Persona affected**: Marie  
**Observed behavior**: Le bouton pour un lien externe affiche un toast « Lien externe bientôt disponible » au clic. L’utilisateur ne peut pas accomplir la tâche si elle dépend de ce lien.  
**Expected behavior**: Soit le lien externe est implémenté (URL configurable), soit la sous-tâche est marquée « À venir » et n’est pas présentée comme une action cliquable complète.  
**Psychological mechanism**: Zeigarnik — une tâche présentée comme faisable mais non réalisable crée une boucle ouverte.  
**Emotional impact**: Frustration légère.  
**Intensity**: 2/5  
**Recommendation**: Implémenter l’ouverture d’URL externe si possible, ou remplacer le bouton par un libellé du type « Lien externe — à venir » sans CTA trompeur.

---

### 🔵 Polish

#### Finding 7 — Cohérence du libellé « Notes » vs « Commentaires »

**Location**: `src/routes/(app)/formations/[id]/actions/+page.svelte` (section comments)  
**Observed behavior**: La section est intitulée « Notes (N) » avec un placeholder « Ajouter une note… ». Terminologie cohérente en français.  
**Recommendation**: Aucun changement requis ; éventuellement prévoir une courte aide au survol (« Notes internes pour cette action ») si besoin.

---

#### Finding 8 — Indication de progression (X/Y) dans les phases

**Location**: `src/routes/(app)/formations/[id]/actions/+page.svelte` (boutons de phase)  
**Observed behavior**: Les en-têtes de phase affichent « Conception 11/12 », « Déploiement 1/6 », « Évaluation 0/10 ». C’est clair et utile.  
**Recommendation**: Conserver ; éventuellement ajouter une barre de progression fine par phase (déjà partiellement présent via le check vert quand allDone).

---

#### Finding 9 — Page Liste : snippet « Actions depuis +page.svelte »

**Location**: `src/routes/(app)/formations/+page.svelte` (snippet `actions()`)  
**Observed behavior**: Un snippet `actions()` contient le texte « Actions depuis +page.svelte » — probablement du debug ou un placeholder.  
**Expected behavior**: Ce contenu ne devrait pas être visible dans l’UI finale.  
**Recommendation**: Supprimer ou remplacer par le contenu réel des actions de page (ex. bouton Créer une formation si on l’y déplace).

---

## Hypothesis Validation

| ID | Verdict | Evidence |
|----|---------|----------|
| H1 | PARTIAL | Le dot existe sur l’onglet Actions mais est en concurrence avec 7 autres onglets ; risque de non-remarque en situation de stress. |
| H2 | CONFIRMED | « Créer une formation » n’apparaît pas comme CTA principal dans la zone de contenu de la liste ; il est dans la sidebar. |
| H3 | REFUTED | Les actions bloquées sont bien désactivées et le tooltip « Bloqué par : … » est présent au survol. |
| H4 | PARTIAL | Le code sélectionne bien la première action faisable ; un flash possible d’empty state côté droit n’a pas été observé de façon répétée mais reste plausible au premier paint. |
| H5 | NOT TESTED | Pas de test mobile (viewport réduit, zone pouce) dans cette session ; à valider en responsive. |

---

## Prioritized Recommendations

1. **Ajouter un CTA principal « Créer une formation »** sur la page Liste (à droite du titre ou en tête de la toolbar), visible above-fold, style primary. Réduit la friction pour Thomas et améliore la clarté de la hiérarchie (Fitts’s Law, Hick’s Law).
2. **Renforcer la visibilité des alertes sur les onglets** (Actions, Séances, Formateurs, Apprenants, Finances) : dot plus visible et/ou court label « À faire » / « Attention » pour que Marie repère rapidement où agir.
3. **Réduire la liste d’actions affichées par défaut** dans l’onglet Actions : n’afficher que les actions non terminées et non bloquées (ou phase courante + suivante), avec option « Afficher toutes les actions ».
4. **Éviter l’affichage fugace de « Sélectionnez une action »** quand une action est déjà présélectionnée : condition d’affichage de l’empty state basée sur l’état stabilisé ou skeleton pendant le premier rendu.
5. **Traiter les sous-tâches « lien externe »** : soit implémenter l’ouverture d’URL, soit afficher « À venir » sans CTA trompeur pour éviter la frustration (Zeigarnik).
6. **Supprimer ou remplacer le snippet de debug** « Actions depuis +page.svelte » sur la page Liste.
7. **Tester le parcours sur mobile** (viewport étroit, zone pouce) pour les boutons « Faire », onglets et liste d’actions, et ajuster touch targets / scroll si nécessaire.

---

## Questions for the Developer

1. Le lien « Créer une formation » est-il intentionnellement uniquement dans la sidebar (ou menu Nouveau), ou l’objectif produit est-il d’avoir aussi un CTA fort sur la page Liste ?
2. Y a-t-il des contraintes (design system, maquettes) qui imposent 8 onglets sans regroupement ? Si non, un regroupement (ex. « Suivi » pour Actions + Séances + Formateurs + Apprenants) est-il envisageable à moyen terme ?
3. Pour l’onglet Actions : la sélection initiale (première action faisable ou `?quest=`) est-elle toujours appliquée côté client après le premier rendu ? Souhaitez-vous qu’on évite complètement l’affichage de « Sélectionnez une action » dans ce cas ?
4. Les liens externes des sous-tâches (ctaType === 'external') sont-ils prévus pour être configurés (URL par type de quête) ou temporairement désactivés ?
5. La page « Créer une formation » : les étapes 3 (Personnes) et 4 (Financement) sont optionnelles ; faut-il un libellé explicite du type « Optionnel — vous pourrez compléter plus tard » pour rassurer l’utilisateur qu’il peut valider sans remplir ?
