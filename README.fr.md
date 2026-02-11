# Mentore Manager

**Le SaaS le plus simple pour numériser les processus administratifs des organismes de formation.**

Mentore Manager aide les organismes de formation à simplifier leurs opérations quotidiennes, à assurer leur conformité **Qualiopi** et à accéder à un vaste réseau de formateurs indépendants qualifiés.

Construit sur [Mentore.fr](https://mentore.fr), la plateforme de mise en relation leader pour les formateurs professionnels.

## 🚀 Fonctionnalités Clés

-   **Simplification Administrative** : Automatisez la génération des Conventions, Feuilles d'émargement et autres documents obligatoires.
-   **Conformité Qualiopi** : Workflows d'assurance qualité intégrés pour répondre sans effort à tous les critères réglementaires.
-   **Mise en relation Formateurs** (Bientôt disponible) : Trouvez et réservez directement des formateurs indépendants qualifiés du réseau Mentore depuis l'application.
-   **Espaces de travail Multi-Comptes** : Gérez plusieurs centres de formation ou départements depuis un seul compte.

## 🛠 Stack Technique

-   **Framework** : [SvelteKit](https://kit.svelte.dev/)
-   **Base de données** : [Supabase](https://supabase.com/) (PostgreSQL)
-   **ORM** : [Drizzle ORM](https://orm.drizzle.team/)
-   **Styles** : TailwindCSS

## 📖 Documentation

-   [Environnement de développement](./docs/setup-dev.fr.md) - **Mise en place pour un nouveau développeur** (Docker, Supabase local, `.env`, `bun run dev`).
-   [Workflow Base de Données](./docs/database.fr.md) - À lire avant de modifier le schéma de la base de données.
-   [Workflow Git & GitHub](./docs/git-workflow.fr.md) - Standards pour les branches, commits et releases. La prod déploie depuis `main` ; l’intégration se fait sur `develop` ; les branches de feature sont de courte durée.

## 💻 Développement

### Prérequis

-   Node.js (ou Bun)
-   **Docker** (Docker Desktop sur Mac/Windows — requis pour Supabase en local)
-   Supabase CLI (`brew install supabase/tap/supabase`)

### Premier démarrage (nouveau sur le projet)

Pour avoir le même environnement local (Supabase dans Docker + app sur localhost), suivre le guide **[Environnement de développement](./docs/setup-dev.fr.md)** : installation, `supabase start`, fichier `.env` à partir de `.env.dev.example`, `supabase db reset`, puis `bun run dev`.

### Démarrage rapide (environnement déjà configuré)

1.  **Démarrer Docker** puis Supabase : `supabase start`
2.  **Installer les dépendances** (si besoin) : `bun install` ou `npm install`
3.  **Lancer l’app** : `bun run dev`
4.  **Ouvrir** : [http://localhost:5173](http://localhost:5173)

### Gestion de la Base de Données

Nous utilisons un workflow **DB-First** (Base de données d'abord). Veuillez vous référer au guide [Workflow Base de Données](./docs/database.md) pour des instructions détaillées sur la façon de modifier le schéma à l'aide du Dashboard Supabase et de Drizzle.

## 🏗 Build

Pour créer une version de production de votre application :

```bash
npm run build
```

Vous pouvez prévisualiser la version de production avec `npm run preview`.
