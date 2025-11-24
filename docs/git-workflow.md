# Git & GitHub Workflow

This guide outlines the standards for version control, collaboration, and release management for Mentore Manager.

[🇫🇷 Version Française](./git-workflow.fr.md)

## 1. Branching Strategy
We use a **Feature Branch Workflow** (Trunk-Based Development).

*   **`main`**: The single source of truth. Always deployable. Represents Production.
*   **Feature Branches**: Created from `main` for every new task.

### How to Create a Branch
Always start from the latest `main`.

```bash
# 1. Switch to main and pull latest changes
git checkout main
git pull origin main

# 2. Create and switch to a new feature branch
git checkout -b feat/my-new-feature
```

**Naming Convention**:
*   `feat/`: New features (e.g., `feat/trainer-matchmaking`)
*   `fix/`: Bug fixes (e.g., `fix/login-error`)
*   `chore/`: Maintenance (e.g., `chore/update-deps`)
*   `docs/`: Documentation (e.g., `docs/update-readme`)

## 2. Commits
We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.

### How to Commit
```bash
# 1. Stage your changes
git add .

# 2. Commit with a conventional message
git commit -m "feat: add login page layout"
```

### Types
*   `feat`: A new feature
*   `fix`: A bug fix
*   `docs`: Documentation only
*   `style`: Formatting (white-space, etc)
*   `refactor`: Code change that neither fixes a bug nor adds a feature
*   `perf`: Performance improvement
*   `test`: Adding/fixing tests
*   `chore`: Build process or tools

## 3. Pull Requests (PRs)
All changes to `main` must go through a Pull Request.

### How to Push & Create PR
1.  **Push your branch**:
    ```bash
    git push -u origin feat/my-new-feature
    ```
2.  **Open PR**: Go to the GitHub repository URL. GitHub usually shows a banner to "Compare & pull request". Click it.
3.  **Fill Details**: Title your PR clearly (e.g., "feat: Add Login Page") and describe the changes.

### How to Merge
1.  **Review**: Wait for approval (or self-review).
2.  **Merge**: Click **"Squash and merge"** on GitHub.
    *   *Why Squash?* It combines all your small commits into one clean commit on `main`.
3.  **Delete Branch**: GitHub will offer to delete the branch after merging. Do it to keep the repo clean.

## 4. Versioning & Releases
We follow **[Semantic Versioning](https://semver.org/)** (`vX.Y.Z`).

*   **Major (`X.0.0`)**: Breaking changes.
*   **Minor (`0.X.0`)**: New features.
*   **Patch (`0.0.X`)**: Bug fixes.

### Automated Release Process
We use **Semantic Release** to automate versioning.

1.  **Merge to Main**: When a PR is merged into `main`, a GitHub Action automatically runs.
2.  **Analyze Commits**: It analyzes your commit messages to determine the next version:
    *   `fix: ...` -> Patch release (v1.0.0 -> v1.0.1)
    *   `feat: ...` -> Minor release (v1.0.0 -> v1.1.0)
    *   `BREAKING CHANGE: ...` in body -> Major release (v1.0.0 -> v2.0.0)
3.  **Publish**: The bot automatically:
    *   Updates `package.json` version.
    *   Updates `CHANGELOG.md`.
    *   Creates a Git Tag.
    *   Creates a GitHub Release with release notes.

**Note**: You do NOT need to run `npm version` manually. Just merge to `main`.

## 5. Cheat Sheet: When to do what?

| Action | ✅ DO this when... | ❌ DO NOT do this when... |
| :--- | :--- | :--- |
| **Create Branch** | You start **ANY** new task (feature, bug, doc update). | You just want to fix a typo directly on `main` (it breaks the audit trail). |
| **Commit** | You have completed a "logical unit" of work (e.g., "styled the button", "added the API route"). | You have broken code that doesn't compile (unless it's a private backup). |
| **Push** | You want to save your work to the cloud or share it. | You have secrets/API keys in your code. |
| **Create PR** | Your feature is ready for review OR you want feedback on a work-in-progress (use "Draft"). | Your branch is empty or you haven't tested your code locally. |
| **Merge** | The PR is approved and all checks pass. | You "think" it works but haven't verified it. |

