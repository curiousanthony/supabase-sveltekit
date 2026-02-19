# Git & GitHub Workflow

This guide outlines the standards for version control, collaboration, and release management for Mentore Manager.

[🇫🇷 Version Française](./git-workflow.fr.md)

## 1. Branching Strategy

We use a **main / develop / feature** workflow.

- **`main`**: Production only. Always deployable. No direct development. Updated only when releasing.
- **`develop`**: Integration branch. All feature work merges here first. Preview/staging.
- **Feature branches** (`feat/*`, `fix/*`, `chore/*`, `docs/*`): Short-lived. Always created from `develop`.

### How to Create a Branch

Always start from the latest `develop`.

```bash
# 1. Switch to develop and pull latest changes
git checkout develop
git pull origin develop

# 2. Create and switch to a new branch
git checkout -b feat/my-new-feature
```

**Naming convention**:

- `feat/`: New features (e.g. `feat/trainer-matchmaking`)
- `fix/`: Bug fixes (e.g. `fix/login-error`)
- `chore/`: Maintenance (e.g. `chore/update-deps`)
- `docs/`: Documentation (e.g. `docs/update-readme`)

**Fix / chore / docs**:

- **New standalone task** (e.g. "fix login error", "update deps") → Create a new branch from `develop` (`fix/...`, `chore/...`, `docs/...`).
- **Part of current work** (e.g. small fix while on `feat/forms`) → Commit on the current branch; use `fix:`, `chore:`, or `docs:` in the message.

## 2. Commits

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**.

### How to Commit

```bash
git add .
git commit -m "feat: add login page layout"
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

## 3. Integrate (merge to develop)

Feature branches are merged into `develop` (direct merge or PR into `develop`). PRs to `main` are only for releases (see below).

1. Push your branch: `git push -u origin feat/my-feature`
2. Merge into `develop` (locally or via a PR into `develop`), then push `develop`.
3. Optionally delete the feature branch.

**PRs (solo dev)**: Optional. Direct merge to `develop` is fine; use a PR when you want a paper trail.

## 4. Release (merge develop → main)

Production deploys from `main` only. To release:

1. Merge `develop` into `main` using a **merge** (not squash), so Semantic Release sees `feat`/`fix` commits.
2. Push `main`. Semantic Release runs via GitHub Actions: updates `package.json`, `CHANGELOG.md`, creates a tag and GitHub Release.
3. Optionally update `develop` from `main`.

**Release frequency**: Release when a logical batch is validated on staging (`develop` Preview). Avoid letting `develop` accumulate many weeks of work.

**Note**: You do NOT need to run `bun version` manually. Just merge `develop` into `main`.

## 5. Vercel

- **Production**: Branch `main`. Deploys to Production on push.
- **Preview**: All non-`main` branches (Option A, recommended)—`develop` and every `feat/*` get a Preview. Optionally assign a staging domain to `develop`.
- **Option B**: Only `develop` → Preview. Use [Vercel Ignored Build Step](https://vercel.com/guides/how-do-i-use-the-ignored-build-step-field-on-vercel) so only `main` and `develop` build.

**Skip Preview for docs/workflow-only commits**: To avoid a Preview deployment when you only changed docs, Cursor/agent config, or `.env.dev.example`, set **Ignored Build Step** in Vercel (Project Settings → Git) to:

```bash
bash scripts/vercel-ignore-build-if-docs-only.sh
```

If the script exits 0, the build is skipped; if 1, the build runs. The script skips when all changed files are under `.cursor/`, `.agent/`, `.agents/`, `docs/`, or the file `.env.dev.example`.

## 6. Cheat Sheet

| Action            | ✅ Do when…                                         | ❌ Don’t when…                                                                       |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Create branch** | You start any new task (feature, fix, chore, docs). | You make a small fix that belongs to the current feature (commit on current branch). |
| **Commit**        | You finish a logical unit of work.                  | Code doesn’t compile (unless a private backup).                                      |
| **Push**          | You want to save or share work.                     | You have secrets in code.                                                            |
| **Integrate**     | Feature is done; merge into `develop`.              | Branch is empty or untested.                                                         |
| **Release**       | Staging is validated; merge `develop` → `main`.     | You haven’t verified on staging.                                                     |
