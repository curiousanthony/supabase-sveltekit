# Environnement de développement — Nouveau développeur

Ce guide permet à un autre développeur d’avoir **le même environnement local** que toi : app sur localhost + Supabase en local dans Docker.

## Ce que tu dois lui fournir

- **Le dépôt Git** (clone ou accès au repo).
- **Ce document** et le fichier **`.env.dev.example`** (déjà dans le repo) : template des variables d’environnement.
- **Aucune clé secrète** pour le dev local : les clés Supabase **locales** sont générées sur sa machine quand il lance `supabase start` (affichées par `supabase status`).

Optionnel, s’il veut tester la connexion GitHub ou Google en local : lui donner les instructions pour créer ses propres OAuth dev (ou des identifiants de test partagés, selon ta politique).

---

## Ce que l’autre développeur doit faire

### 1. Prérequis

- **Node.js** (ou **Bun** si le projet utilise `bun run dev`).
- **Docker**
  - Sur macOS/Windows : **Docker Desktop** (au démarrage, il lance les conteneurs).
  - Sur Linux : Docker Engine + Docker Compose.
- **Supabase CLI** :
  ```bash
  brew install supabase/tap/supabase
  ```

### 2. Cloner et installer

```bash
git clone https://github.com/curiousanthony/supabase-sveltekit.git
cd supabase-sveltekit
bun install   # ou npm install
```

### 3. Démarrer Supabase en local (Docker)

Docker doit être lancé (Docker Desktop sur Mac/Windows).

À la racine du projet :

```bash
supabase start
```

Cela démarre les conteneurs Supabase (Postgres, Auth, API, etc.). La première fois peut prendre quelques minutes.

Récupérer les clés pour le fichier `.env` :

```bash
supabase status
```

Tu y verras notamment :

- **API URL** → `PUBLIC_SUPABASE_URL`
- **anon key** → `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Fichier `.env`

Copier le template et remplir avec les valeurs **locales** :

```bash
cp .env.dev.example .env
```

Éditer `.env` :

- **`DATABASE_URL`** : déjà correct dans le template pour le Postgres local  
  `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **`PUBLIC_SUPABASE_URL`** : `http://127.0.0.1:54321`
- **`PUBLIC_SUPABASE_PUBLISHABLE_KEY`** : la valeur **anon key** de `supabase status`
- **`SUPABASE_SERVICE_ROLE_KEY`** : la valeur **service_role key** de `supabase status`

Les autres variables (GitHub, Google, Slack, etc.) sont optionnelles pour faire tourner l’app en local.

### 5. Appliquer les migrations

Pour que la base locale soit à jour avec le code :

```bash
supabase db reset
```

Cela applique toutes les migrations du dossier `supabase/migrations/` (schéma + seeds éventuels).

### 6. Lancer l’app

```bash
bun run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

---

## Résumé des commandes (ordre typique)

1. Docker allumé (Docker Desktop ou Docker Engine).
2. `supabase start` → attendre que ce soit prêt.
3. `supabase status` → noter anon key et service_role key.
4. `cp .env.dev.example .env` → remplir avec les valeurs de `supabase status`.
5. `supabase db reset` → appliquer les migrations.
6. `bun run dev` → app sur localhost.

Ensuite, à chaque fois qu’il travaille : Docker + `supabase start` (si les conteneurs sont arrêtés), puis `bun run dev`. Si des **nouvelles migrations** arrivent (nouveau fichier dans `supabase/migrations/`), refaire un `supabase db reset` pour être à jour.

---

## Dépannage

- **« Cannot connect to Docker »** : lancer Docker Desktop (ou le daemon Docker sur Linux).
- **« Port already in use »** : un autre Supabase ou Postgres tourne déjà ; arrêter l’autre instance ou changer les ports dans `supabase/config.toml`.
- **App qui ne voit pas la base** : vérifier que `DATABASE_URL` et `PUBLIC_SUPABASE_*` dans `.env` correspondent bien à la sortie de `supabase status` (ports 54321 pour l’API, 54322 pour Postgres).
- **Schéma ou données incohérents** : après un pull avec de nouvelles migrations, refaire `supabase db reset`.

Pour plus de détails sur la base de données et les migrations : [Workflow Base de Données](./database.fr.md).
