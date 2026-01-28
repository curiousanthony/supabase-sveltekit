# Workflow Git & GitHub

Ce guide définit les standards de gestion de version, de collaboration et de gestion des releases pour Mentore Manager.

[🇺🇸 Version anglaise](./git-workflow.md)

## 1. Stratégie de branches

Nous utilisons un workflow **main / develop / feature**.

- **`main`** : Production uniquement. Toujours déployable. Pas de développement direct. Mis à jour seulement lors des releases.
- **`develop`** : Branche d’intégration. Tout le travail de feature fusionne ici d’abord. Preview / staging.
- **Branches de fonctionnalité** (`feat/*`, `fix/*`, `chore/*`, `docs/*`) : Courtes durées. Toujours créées depuis `develop`.

### Créer une branche

Toujours partir de la dernière version de `develop`.

```bash
# 1. Basculer sur develop et récupérer les derniers changements
git checkout develop
git pull origin develop

# 2. Créer et basculer sur une nouvelle branche
git checkout -b feat/ma-nouvelle-fonctionnalite
```

**Convention de nommage** :
- `feat/` : Nouvelles fonctionnalités (ex. `feat/trainer-matchmaking`)
- `fix/` : Corrections de bugs (ex. `fix/login-error`)
- `chore/` : Maintenance (ex. `chore/update-deps`)
- `docs/` : Documentation (ex. `docs/update-readme`)

**Fix / chore / docs** :
- **Nouvelle tâche distincte** (ex. « corriger le login », « mettre à jour les deps ») → Créer une nouvelle branche depuis `develop` (`fix/...`, `chore/...`, `docs/...`).
- **Partie du travail en cours** (ex. petit fix sur `feat/forms`) → Commiter sur la branche actuelle ; utiliser `fix:`, `chore:` ou `docs:` dans le message.

## 2. Commits

Nous suivons **[Conventional Commits](https://www.conventionalcommits.org/)**.

### Commiter

```bash
git add .
git commit -m "feat: ajout de la mise en page login"
```

**Types** : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

## 3. Intégrer (fusionner dans develop)

Les branches de feature sont fusionnées dans `develop` (merge direct ou PR vers `develop`). Les PR vers `main` sont réservées aux releases (voir ci‑dessous).

1. Pousser la branche : `git push -u origin feat/ma-feature`
2. Fusionner dans `develop` (local ou via PR vers `develop`), puis pousser `develop`.
3. Optionnel : supprimer la branche de feature.

**PR (solo)** : Optionnel. Merge direct vers `develop` suffit ; utiliser une PR quand vous voulez une trace.

## 4. Release (fusionner develop → main)

La production déploie uniquement depuis `main`. Pour release :

1. Fusionner `develop` dans `main` avec un **merge** (pas de squash), pour que Semantic Release voie les commits `feat`/`fix`.
2. Pousser `main`. Semantic Release s’exécute via GitHub Actions : met à jour `package.json`, `CHANGELOG.md`, crée un tag et une Release GitHub.
3. Optionnel : mettre à jour `develop` depuis `main`.

**Fréquence des releases** : Release quand un lot logique est validé en staging (Preview `develop`). Éviter d’accumuler des semaines de travail sur `develop`.

**Note** : Vous n’avez pas besoin de lancer `npm version` (ou équivalent `bun`) manuellement. Il suffit de fusionner `develop` dans `main`.

## 5. Vercel

- **Production** : Branche `main`. Déploiement en Production à chaque push.
- **Preview** : Toutes les branches sauf `main` (option A, recommandée) — `develop` et chaque `feat/*` ont une Preview. Optionnel : attacher un domaine de staging à `develop`.
- **Option B** : Seulement `develop` → Preview. Utiliser [Vercel Ignored Build Step](https://vercel.com/guides/how-do-i-use-the-ignored-build-step-field-on-vercel) pour ne builder que `main` et `develop`.

## 6. Aide‑mémoire

| Action | ✅ Faire quand… | ❌ Ne pas faire quand… |
|--------|------------------|-------------------------|
| **Créer une branche** | Vous commencez une nouvelle tâche (feature, fix, chore, docs). | C’est un petit fix qui appartient à la feature en cours (commiter sur la branche actuelle). |
| **Commit** | Vous avez fini une unité logique de travail. | Le code ne compile pas (sauf sauvegarde privée). |
| **Push** | Vous voulez sauvegarder ou partager. | Vous avez des secrets dans le code. |
| **Intégrer** | La feature est prête ; fusionner dans `develop`. | La branche est vide ou non testée. |
| **Release** | Le staging est validé ; fusionner `develop` → `main`. | Vous n’avez pas vérifié sur le staging. |
