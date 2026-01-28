# Mentore Manager

[🇫🇷 Version Française](./README.fr.md)


**The simplest SaaS for French training centers to digitize their administrative workflows.**

Mentore Manager helps training organizations ("Organismes de Formation") streamline their daily operations, ensure **Qualiopi** compliance, and access a vast network of qualified independent trainers.

Built on top of [Mentore.fr](https://mentore.fr), the leading matchmaking platform for professional trainers.

## 🚀 Key Features

-   **Administrative Simplification**: Automate the generation of "Conventions", "Feuilles d'émargement", and other mandatory French training documents.
-   **Qualiopi Compliance**: Built-in quality assurance workflows to ensure you meet all regulatory criteria effortlessly.
-   **Trainer Matchmaking** (Coming Soon): Directly find and book qualified independent trainers from the Mentore network within the app.
-   **Multi-Tenant Workspaces**: Manage multiple training centers or departments from a single account.

## 🛠 Tech Stack

-   **Framework**: [SvelteKit](https://kit.svelte.dev/)
-   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **Styling**: TailwindCSS (inferred)

## 📖 Documentation

-   [Database Workflow](./docs/database.md) - **Read this first** before making schema changes.
-   [Git & GitHub Workflow](./docs/git-workflow.md) - Branching, commits, and release standards. Production deploys from `main`; integration happens on `develop`; feature branches are short-lived.

## 💻 Developing

### Prerequisites

-   Node.js
-   Supabase CLI (`brew install supabase/tap/supabase`)

### Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the development server**:
    ```bash
    npm run dev
    ```

3.  **Open the app**:
    Navigate to [http://localhost:5173](http://localhost:5173).

### Database Management

We use a **DB-First** workflow. Please refer to the [Database Workflow](./docs/database.md) guide for detailed instructions on how to make schema changes using the Supabase Dashboard and Drizzle.

## 🏗 Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.
