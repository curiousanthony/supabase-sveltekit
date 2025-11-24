# Workflow Git & GitHub

Ce guide définit les standards de gestion de version, de collaboration et de gestion des releases pour Mentore Manager.

[🇺🇸 English Version](./git-workflow.md)

## 1. Stratégie de Branches
Nous utilisons un **Workflow de Branches de Fonctionnalités** (Trunk-Based Development).

*   **`main`** : La source unique de vérité. Toujours déployable. Représente la Production.
*   **Branches de Fonctionnalités** : Créées depuis `main` pour chaque nouvelle tâche.

### Comment Créer une Branche
Partez toujours de la dernière version de `main`.

```bash
# 1. Basculer sur main et récupérer les derniers changements
git checkout main
git pull origin main

# 2. Créer et basculer sur une nouvelle branche
git checkout -b feat/ma-nouvelle-fonctionnalite
```

**Convention de Nommage** :
*   `feat/` : Nouvelles fonctionnalités (ex: `feat/trainer-matchmaking`)
*   `fix/` : Corrections de bugs (ex: `fix/login-error`)
*   `chore/` : Maintenance (ex: `chore/update-deps`)
*   `docs/` : Documentation (ex: `docs/update-readme`)

## 2. Commits
Nous suivons la spécification **[Conventional Commits](https://www.conventionalcommits.org/)**.

### Comment Commiter
```bash
# 1. Ajouter vos changements (Stage)
git add .

# 2. Commiter avec un message conventionnel
git commit -m "feat: ajout de la mise en page login"
```

### Types
*   `feat` : Une nouvelle fonctionnalité
*   `fix` : Une correction de bug
*   `docs` : Documentation uniquement
*   `style` : Formatage (espaces, etc.)
*   `refactor` : Changement de code sans fix ni feature
*   `perf` : Amélioration des performances
*   `test` : Ajout/correction de tests
*   `chore` : Build ou outils

## 3. Pull Requests (PRs)
Tous les changements vers `main` doivent passer par une Pull Request.

### Comment Pousser & Créer une PR
1.  **Pousser votre branche** :
    ```bash
    git push -u origin feat/ma-nouvelle-fonctionnalite
    ```
2.  **Ouvrir la PR** : Allez sur l'URL du dépôt GitHub. GitHub affiche généralement une bannière "Compare & pull request". Cliquez dessus.
3.  **Remplir les détails** : Donnez un titre clair (ex: "feat: Ajout Page Login") et décrivez les changements.

### Comment Fusionner (Merge)
1.  **Revue** : Attendez l'approbation (ou relisez-vous).
2.  **Fusionner** : Cliquez sur **"Squash and merge"** sur GitHub.
    *   *Pourquoi Squash ?* Cela combine tous vos petits commits en un seul commit propre sur `main`.
3.  **Supprimer la branche** : GitHub proposera de supprimer la branche après la fusion. Faites-le pour garder le dépôt propre.

## 4. Versioning & Releases
Nous suivons le **[Semantic Versioning](https://semver.org/)** (`vX.Y.Z`).

*   **Majeur (`X.0.0`)** : Changements cassants.
*   **Mineur (`0.X.0`)** : Nouvelles fonctionnalités.
*   **Patch (`0.0.X`)** : Corrections de bugs.

### Processus de Release Automatisé
Nous utilisons **Semantic Release** pour automatiser le versioning.

1.  **Fusionner vers Main** : Lorsqu'une PR est fusionnée dans `main`, une Action GitHub se lance automatiquement.
2.  **Analyser les Commits** : Elle analyse vos messages de commit pour déterminer la prochaine version :
    *   `fix: ...` -> Release Patch (v1.0.0 -> v1.0.1)
    *   `feat: ...` -> Release Mineure (v1.0.0 -> v1.1.0)
    *   `BREAKING CHANGE: ...` dans le corps -> Release Majeure (v1.0.0 -> v2.0.0)
3.  **Publier** : Le bot effectue automatiquement :
    *   Mise à jour de la version dans `package.json`.
    *   Mise à jour de `CHANGELOG.md`.
    *   Création d'un Tag Git.
    *   Création d'une Release GitHub avec les notes de version.

**Note** : Vous n'avez PAS besoin de lancer `npm version` manuellement. Fusionnez simplement vers `main`.

## 5. Aide-Mémoire : Quand faire quoi ?

| Action | ✅ FAITES ceci quand... | ❌ NE FAITES PAS ceci quand... |
| :--- | :--- | :--- |
| **Créer une Branche** | Vous commencez **N'IMPORTE QUELLE** tâche (feature, bug, doc). | Vous voulez juste corriger une coquille directement sur `main` (ça brise l'historique). |
| **Commit** | Vous avez fini une "unité logique" (ex: "stylisé le bouton", "ajouté la route API"). | Votre code ne compile pas (sauf pour une sauvegarde privée). |
| **Push** | Vous voulez sauvegarder votre travail dans le cloud ou le partager. | Vous avez des secrets/clés API dans votre code. |
| **Créer une PR** | Votre feature est prête ou vous voulez un avis sur un travail en cours (utilisez "Draft"). | Votre branche est vide ou vous n'avez pas testé localement. |
| **Fusionner (Merge)** | La PR est approuvée et tous les tests passent. | Vous "pensez" que ça marche mais n'avez pas vérifié. |

