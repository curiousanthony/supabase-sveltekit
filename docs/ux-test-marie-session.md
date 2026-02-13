# Marie – Session de test (Browser)

**Date:** Session de navigation en tant que Marie (Centre de formation).  
**Objectif:** Vérifier que les changements UX répondent aux intentions de Marie.

---

## Intention 1 — « Je veux créer une formation à partir d’un programme de la bibliothèque »

**Parcours :**
1. **Formations** (sidebar) → page Formations.
2. En-tête : deux boutons visibles — **« Créer une formation »** (primaire) et **« Créer à partir d’un programme »** (outline).
3. Clic sur **« Créer à partir d’un programme »** → navigation vers **Bibliothèque → Programmes de formation** (`/bibliotheque/programmes`).

**Résultat :**  
L’entrée « Créer à partir d’un programme » depuis la page Formations est claire et évite à Marie d’avoir à deviner qu’il faut passer par la Bibliothèque. Elle peut démarrer depuis Formations et atterrir directement sur la liste des programmes pour en choisir un et cliquer sur « Créer une formation » sur une carte.

**Verdict :** ✅ Conforme aux attentes. Pas de dead-end.

---

## Intention 2 — « Je suis sur un deal, je veux définir le programme ciblé et comprendre ce qui se passera à la clôture »

**Parcours :**
1. **Deals** → liste (pipeline) → clic sur **« Deal exemple – Anglais business »** → page détail du deal.
2. Carte **Actions** :
   - **« 1. Programme ciblé (intérêt du lead) »** avec menu de sélection.
   - Texte d’aide : *« En clôturant le deal, la formation sera créée à partir de ce programme (modules et objectifs préremplis). »*
   - **« 2. Clôturer et créer la formation »** avec le bouton **« Clôturer (gagné) et créer une formation »**.
3. Clic sur **« Clôturer (gagné) et créer une formation »** → ouverture de la boîte de dialogue.
4. **Sans programme sélectionné** : titre de la dialog = *« Créer une formation à partir du deal ? »* (message générique).

**Résultat :**  
- La numérotation (1. Programme ciblé, 2. Clôturer) guide l’ordre des actions.  
- Le texte sous le sélecteur de programme explique bien la conséquence (formation créée à partir du programme).  
- La dialog de clôture affiche le message générique quand aucun programme n’est choisi ; avec un programme sélectionné, le titre et la description devraient passer au message basé sur le programme (implémentation vérifiée en code).

**Verdict :** ✅ Conforme. La valeur de « Programme ciblé » et l’ordre des étapes sont clairs pour Marie.

---

## Intention 3 — « Je suis dans la bibliothèque Modules et je veux ajouter un module à une formation sans quitter la liste »

**Parcours :**
1. **Bibliothèque → Modules** (`/bibliotheque/modules`).
2. Sur une carte module (**Introduction à ChatGPT**), clic sur **« Ajouter à une formation »** (bouton, pas un lien).
3. Ouverture d’une **modale** sur la même page :
   - Titre : **« Ajouter à une formation »**.
   - Liste déroulante **« Formation * »** : options « Formation sans titre #2 (En attente) », « Test 1 #1 (En attente) ».
   - Boutons **« Annuler »** et **« Ajouter »**.
4. Sélection de **« Test 1 #1 (En attente) »** → clic sur **« Ajouter »**.
5. Soumission du formulaire → **modale se ferme**, on reste sur la liste des modules (`/bibliotheque/modules`).

**Résultat :**  
- Plus de navigation vers la page dédiée « utiliser » : tout se fait dans une modale.  
- Marie reste dans le contexte de la liste des modules.  
- Après succès, la modale se ferme ; le code prévoit un toast « Module ajouté » avec action « Voir la formation » (non vérifié visuellement dans le snapshot mais implémenté).

**Verdict :** ✅ Conforme. Flux plus direct et sans changement de page.

---

## Synthèse

| Intention | Statut | Commentaire |
|-----------|--------|-------------|
| Créer une formation à partir d’un programme (depuis Formations) | ✅ | Bouton « Créer à partir d’un programme » visible et mène à la liste des programmes. |
| Comprendre programme ciblé et ordre des actions sur un deal | ✅ | Numérotation 1/2 et texte d’aide présents ; dialog de clôture adaptée (générique sans programme). |
| Ajouter un module à une formation depuis la liste des modules | ✅ | Modale avec choix de formation ; pas de full-page ; retour sur la liste après ajout. |

**Conclusion :** Les parcours testés correspondent aux attentes de Marie : pas de dead-end, ordre des actions explicite, et « Ajouter à une formation » se fait désormais sans quitter la liste des modules.
