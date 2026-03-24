---
name: ''
overview: ''
todos: []
isProject: false
---

# Plan technique — UX Improvements: Formations (end-to-end + Actions tab)

**Source**: `docs/ux/formations-ux-review.md`  
**Priority**: All findings (Critical + Major + Minor + Polish)  
**Agent instructions**: Implement the following changes exactly as described. Do NOT modify business logic, data models, or routing. Only touch UI/UX layer. Validate each change visually before moving to the next.

---

## Change 1 — Ajouter CTA principal « Créer une formation » sur la page Liste

**Finding ref**: Finding 1 (Major)  
**File(s)**: `src/routes/(app)/formations/+page.svelte`  
**Component(s)**: Formations list page

### What to change

1. **Ajouter un bouton principal** « Créer une formation » dans la zone de contenu, visible above-fold.
2. **Placement recommandé** : À droite du titre H1 « Formations », ou en tête de la toolbar (à droite de la barre de recherche).
3. **Style** : Bouton primary (variant="default"), taille appropriée (size="default" ou "lg"), avec icône Plus si disponible.
4. **Lien** : Pointe vers `/formations/creer`.
5. **Responsive** : Sur mobile, peut être placé sous le titre ou dans la toolbar selon l’espace disponible.

### Why (for context)

Le CTA principal est actuellement dans la sidebar, ce qui le rend peu visible. Pour un utilisateur qui veut créer une formation rapidement, le parcours n’est pas évident (Hick’s Law). Un CTA visible above-fold améliore la hiérarchie visuelle et réduit la friction.

### Acceptance criteria

- Le bouton « Créer une formation » est visible sans scroll sur la page Liste (above-fold).
- Le bouton utilise le style primary (variant="default").
- Le bouton est cliquable et navigue vers `/formations/creer`.
- Le bouton reste visible sur mobile (responsive).
- Le lien dans la sidebar est conservé (secondaire).

---

## Change 2 — Renforcer la visibilité des alertes (dots) sur les onglets

**Finding ref**: Finding 2 (Major)  
**File(s)**: `src/routes/(app)/formations/[id]/+layout.svelte`, `src/lib/components/nav-tabs.svelte`  
**Component(s)**: NavTabs component, formation detail layout

### What to change

1. **Augmenter la taille du dot** : Passer de `size-1.5` à `size-2` ou `size-2.5` pour une meilleure visibilité.
2. **Renforcer le contraste** : S’assurer que la couleur du dot (destructive/amber/blue selon le type) est suffisamment contrastée avec le fond.
3. **Optionnel — Ajouter un label court** : Si l’espace le permet, afficher un label court « À faire » ou « Attention » à côté du dot (ou en tooltip au survol).
4. **Position** : Le dot doit rester visible même sur viewport étroit (éviter qu’il soit coupé par le scroll horizontal).

### Why (for context)

Avec 8 onglets au même niveau, le dot d’alerte est en concurrence visuelle avec 7 autres labels. En situation de stress (audit Qualiopi), l’utilisateur peut ignorer le dot. Renforcer sa visibilité améliore la détection rapide des actions requises.

### Acceptance criteria

- Le dot est plus visible (taille augmentée, contraste renforcé).
- Le dot reste visible sur tous les viewports (pas de coupure).
- Le comportement existant (affichage conditionnel selon `overdueQuests`, `missingSignatures`, etc.) est conservé.
- Optionnel : Label court ou tooltip explicite au survol.

---

## Change 3 — Réduire la liste d’actions affichées par défaut dans l’onglet Actions

**Finding ref**: Finding 3 (Major)  
**File(s)**: `src/routes/(app)/formations/[id]/actions/+page.svelte`  
**Component(s)**: Actions tab, left panel (quest list)

### What to change

1. **Filtrage par défaut** : Par défaut, n’afficher que les actions non terminées (`status !== 'Terminé'`) et non bloquées (selon `getBlockingInfo`).
2. **Phases repliables** : Conserver le système de collapse/expand des phases (Conception, Déploiement, Évaluation).
3. **Bouton « Afficher toutes les actions »** : Ajouter un bouton/toggle en bas de la liste pour afficher toutes les actions (y compris terminées et bloquées).
4. **État initial** : Les phases contenant uniquement des actions terminées/bloquées sont repliées par défaut.
5. **État « toutes affichées »** : Quand le toggle est activé, toutes les actions sont visibles (comportement actuel).

### Why (for context)

Afficher 28+ actions d’un coup crée du bruit visuel et une impression de « trop à faire ». Le Progressive Disclosure réduit la charge cognitive en montrant uniquement ce qui est pertinent pour la décision immédiate.

### Acceptance criteria

- Par défaut, seules les actions non terminées et non bloquées sont visibles.
- Les phases vides (toutes terminées/bloquées) sont repliées par défaut.
- Un bouton/toggle « Afficher toutes les actions » permet d’afficher le reste.
- Le comportement de sélection d’action (première action faisable) est conservé.
- Les phases restent repliables/expandables.

---

## Change 4 — Éviter l’affichage fugace de « Sélectionnez une action »

**Finding ref**: Finding 4 (Minor)  
**File(s)**: `src/routes/(app)/formations/[id]/actions/+page.svelte`  
**Component(s)**: Actions tab, right panel (quest workspace)

### What to change

1. **État initial** : Ne pas afficher l’empty state « Sélectionnez une action pour voir ses détails » si une action est déjà déterminée comme sélectionnable (via `$effect` ou `?quest=`).
2. **Skeleton ou loader** : Pendant le premier rendu, si une action est en cours de sélection, afficher un skeleton/loader au lieu de l’empty state.
3. **Condition d’affichage** : L’empty state ne s’affiche que si `selectedQuestId` est `null` après stabilisation (par ex. après un micro-délai ou après le premier `$effect`).

### Why (for context)

Un flash d’empty state alors qu’une action est déjà présélectionnée crée une micro-confusion. Éviter ce flash améliore la perception de réactivité et réduit la confusion temporelle.

### Acceptance criteria

- L’empty state ne s’affiche pas si une action est déjà sélectionnée (via `?quest=` ou première action faisable).
- Un skeleton/loader s’affiche pendant le chargement initial si une action est en cours de sélection.
- L’empty state s’affiche uniquement si aucune action n’est sélectionnée après stabilisation.

---

## Change 5 — Renforcer le libellé des sous-tâches « document requis »

**Finding ref**: Finding 5 (Minor)  
**File(s)**: `src/routes/(app)/formations/[id]/actions/+page.svelte`  
**Component(s)**: Actions tab, sub-actions checklist

### What to change

1. **Libellé explicite** : Remplacer ou compléter « Déposez le document pour valider cette sous-tâche » par un libellé plus explicite : « Document requis — déposez un fichier ci-dessous pour pouvoir valider cette sous-tâche ».
2. **Liaison visuelle** : S’assurer que la zone d’upload est visuellement liée à la sous-tâche (proximité, encadré, ou indentation claire).
3. **État désactivé** : Conserver le comportement actuel (checkbox désactivée jusqu’à upload).

### Why (for context)

Le libellé actuel est correct mais peut être plus explicite. Renforcer l’affordance et la proximité visuelle réduit la charge cognitive et améliore la compréhension immédiate.

### Acceptance criteria

- Le libellé est plus explicite (« Document requis — déposez un fichier ci-dessous pour pouvoir valider cette sous-tâche »).
- La zone d’upload est visuellement liée à la sous-tâche (proximité, encadré).
- Le comportement de désactivation de la checkbox est conservé.

---

## Change 6 — Traiter les sous-tâches « lien externe »

**Finding ref**: Finding 6 (Minor)  
**File(s)**: `src/routes/(app)/formations/[id]/actions/+page.svelte`  
**Component(s)**: Actions tab, sub-actions checklist (ctaType === 'external')

### What to change

**Option A (préférée si possible)** : Implémenter l’ouverture d’URL externe

1. **URL configurable** : Utiliser `sub.ctaTarget` comme URL externe (si présent et valide).
2. **Ouverture** : Au clic, ouvrir l’URL dans un nouvel onglet (`window.open(sub.ctaTarget, '_blank')`).
3. **Validation** : Vérifier que `ctaTarget` est une URL valide avant d’ouvrir.

**Option B (si URL non disponible)** : Remplacer le bouton par un libellé

1. **Supprimer le bouton** : Remplacer le bouton « Lien externe » par un libellé du type « Lien externe — à venir » ou « Lien externe — non disponible ».
2. **Style** : Libellé en texte secondaire (muted-foreground), pas de CTA trompeur.

### Why (for context)

Un bouton qui affiche « bientôt disponible » crée une boucle ouverte (Zeigarnik) : la tâche est présentée comme faisable mais non réalisable. Soit on l’implémente, soit on la marque clairement comme non disponible.

### Acceptance criteria

- Option A : Le bouton ouvre l’URL externe dans un nouvel onglet si `ctaTarget` est valide.
- Option B : Le bouton est remplacé par un libellé explicite « à venir » / « non disponible ».
- Aucun toast « bientôt disponible » n’apparaît.

---

## Change 7 — Supprimer le snippet de debug « Actions depuis +page.svelte »

**Finding ref**: Finding 9 (Polish)  
**File(s)**: `src/routes/(app)/formations/+page.svelte`  
**Component(s)**: Formations list page

### What to change

1. **Supprimer le snippet** : Supprimer le snippet `{#snippet actions()}` et son contenu « Actions depuis +page.svelte » (lignes ~262-264).
2. **Vérifier l’utilisation** : S’assurer que ce snippet n’est pas utilisé ailleurs (grep pour `actions()` ou `headerSnippet`).

### Why (for context)

Ce snippet est du code de debug/placeholder qui ne devrait pas être visible dans l’UI finale. Le supprimer nettoie le code.

### Acceptance criteria

- Le snippet `actions()` est supprimé.
- Aucune référence à ce snippet n’existe ailleurs.
- La page Liste fonctionne normalement après suppression.

---

## Change 8 — Ajouter tooltip explicite sur la section « Notes »

**Finding ref**: Finding 7 (Polish)  
**File(s)**: `src/routes/(app)/formations/[id]/actions/+page.svelte`  
**Component(s)**: Actions tab, comments section

### What to change

1. **Tooltip optionnel** : Ajouter un tooltip au survol de l’icône MessageSquare ou du label « Notes » : « Notes internes pour cette action ».
2. **Style** : Utiliser le composant Tooltip existant.

### Why (for context)

Le libellé « Notes » est cohérent, mais un tooltip explicite améliore la compréhension pour les nouveaux utilisateurs.

### Acceptance criteria

- Un tooltip s’affiche au survol de l’icône/label « Notes ».
- Le tooltip contient le texte « Notes internes pour cette action » (ou équivalent).

---

## Change 9 — Améliorer l’indication de progression par phase (optionnel)

**Finding ref**: Finding 8 (Polish)  
**File(s)**: `src/routes/(app)/formations/[id]/actions/+page.svelte`  
**Component(s)**: Actions tab, phase headers

### What to change

1. **Barre de progression fine** : Ajouter une barre de progression fine (composant Progress) sous chaque en-tête de phase (ex. « Conception 11/12 »).
2. **Style** : Barre discrète, couleur cohérente avec la phase (violet pour Conception, bleu pour Déploiement, vert pour Évaluation).
3. **Conserver le check** : Conserver l’icône Check quand `allDone` est vrai.

### Why (for context)

Les indicateurs X/Y sont clairs, mais une barre de progression visuelle améliore la perception de l’avancement global.

### Acceptance criteria

- Une barre de progression fine s’affiche sous chaque en-tête de phase.
- La barre reflète le ratio `completed / total`.
- Le style est cohérent avec les couleurs de phase.
- L’icône Check reste visible quand `allDone` est vrai.

---

## Change 10 — Tester et ajuster le responsive mobile

**Finding ref**: Finding 5 (Hypothesis H5, non testé), Recommendation 7  
**File(s)**: `src/routes/(app)/formations/[id]/+page.svelte`, `src/routes/(app)/formations/[id]/actions/+page.svelte`, `src/lib/components/nav-tabs.svelte`  
**Component(s)**: Formation detail (Aperçu), Actions tab, NavTabs

### What to change

1. **Tester sur viewport mobile** : Vérifier que les boutons « Faire », les onglets et la liste d’actions sont accessibles sur mobile (viewport < 768px).
2. **Touch targets** : S’assurer que tous les boutons/liens ont une taille minimale de 44px × 44px (zone pouce).
3. **Scroll horizontal** : Vérifier que le scroll horizontal des onglets est fluide et que les dots d’alerte restent visibles.
4. **Ajustements si nécessaire** : Ajuster les tailles, espacements ou layout si des problèmes sont détectés.

### Why (for context)

Le test mobile n’a pas été effectué dans la session de review. Il est important de valider que les améliorations fonctionnent aussi sur mobile (Fitts’s Law, zone pouce).

### Acceptance criteria

- Tous les boutons/liens ont une taille minimale de 44px × 44px sur mobile.
- Les onglets sont scrollables horizontalement sans coupure de dots.
- Le bouton « Faire » est accessible sans scroll excessif.
- La liste d’actions est utilisable sur mobile (scroll vertical fluide).

---

## Notes d’implémentation

- **Ordre recommandé** : Implémenter les changements dans l’ordre (1 → 10) pour valider chaque étape visuellement.
- **Tests visuels** : Après chaque changement, tester dans le navigateur pour valider l’apparence et le comportement.
- **Pas de changement de logique métier** : Ne pas modifier les fonctions de calcul, les requêtes DB, ou la logique de routing. Seulement l’UI/UX.
- **Conserver les comportements existants** : S’assurer que les fonctionnalités existantes (sélection d’action, collapse/expand, etc.) continuent de fonctionner.

---

## Validation finale

Avant de marquer le plan comme terminé :

- Tous les changements sont implémentés.
- Chaque changement a été testé visuellement dans le navigateur.
- Les comportements existants sont conservés.
- Aucune régression visuelle n’a été introduite.
- Le responsive mobile a été testé (viewport < 768px).
