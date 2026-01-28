---
name: git-workflow
description: Executes Git workflows for main/develop/feature branching. Use when the user says "start feature", "commit", "integrate", "merge to develop", "release", "ship to prod", or when the agent is about to run git operations.
---

# Git Workflow

Follow these workflows for branching, committing, integrating, and releasing. Base branch for all new work is `develop`, not `main`. Never run `git push` or `git merge` unless the user has explicitly said "Integrate", "Merge to develop", "Release", or "Ship to prod".

---

## 1. Start feature (or fix/chore/docs)

**When**: User says "Start feature X", "Work on Issue #42", "Fix login error", "Update deps", etc.

**Branch from**: `develop` (always).

**Steps**:

1. Checkout and update `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Determine branch name:
   - **New standalone task**: Use `type/short-description` (kebab-case). Types: `feat/`, `fix/`, `chore/`, `docs/`. Ask the user for a short description if not provided.
   - **From Issue #N**: e.g. `feat/42-issue-slug` derived from the issue title.
3. Create and switch to the branch:
   ```bash
   git checkout -b feat/my-feature
   ```
   Use `fix/...`, `chore/...`, or `docs/...` for standalone fixes, chores, or docs work.

---

## 2. Commit

**When**: User says "Commit" or "Commit as fix: …", or after completing a logical unit of work.

**Fix/chore/docs as part of current work**: Stay on the current branch. Do **not** create a new branch. Use `fix:`, `chore:`, or `docs:` in the message as appropriate.

**Steps**:

1. Stage changes:
   ```bash
   git add .
   ```
2. Write a Conventional Commit message: `type: description` (lowercase, no period at end).
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
3. Commit:
   ```bash
   git commit -m "feat: add login form validation"
   ```

---

## 3. Integrate (merge to develop)

**When**: User explicitly says "Integrate" or "Merge to develop". Do **not** push or merge otherwise.

**Steps**:

1. Push the feature branch:
   ```bash
   git push -u origin HEAD
   ```
2. Merge into `develop`:
   - **Direct merge** (default): `git checkout develop && git pull origin develop`, then `git merge <feature-branch>`, then `git push origin develop`.
   - **Via PR**: Open a PR into `develop` on GitHub; merge there, then pull `develop` locally.
3. Delete the feature branch (local and remote) if desired:
   ```bash
   git branch -d feat/my-feature
   git push origin --delete feat/my-feature
   ```

PRs to `main` are only for releases (see Release). Day-to-day integration is into `develop`.

---

## 4. Release (ship to prod)

**When**: User explicitly says "Release" or "Ship to prod". Do **not** merge to `main` or push otherwise.

**Steps**:

1. Ensure `develop` is up to date and validated on staging.
2. Merge `develop` into `main` using a **merge** (not squash), so Semantic Release sees `feat`/`fix` commits:
   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```
3. Semantic Release runs on `main` (GitHub Action); it updates `package.json`, `CHANGELOG.md`, and creates a GitHub Release.
4. Optionally update `develop` from `main`:
   ```bash
   git checkout develop
   git merge main
   git push origin develop
   ```

---

## Fix/chore/docs: branch vs commit

- **New standalone task** (e.g. "fix login error", "update deps", "update readme") → Create a **new branch** from `develop` (`fix/...`, `chore/...`, `docs/...`). Same workflow as features: work, then integrate to `develop`.
- **Part of current work** (e.g. small fix or chore while on `feat/forms`) → **Commit on the current branch.** Use `fix:`, `chore:`, or `docs:` in the message.

Ask: "Is this a new task or part of current work?" → New task → new branch; same work → commit on current branch.

---

## Work on GitHub Issue

If the user says "Work on #42" (or similar):

1. Fetch the issue title/description.
2. Create a branch from `develop` with a name derived from the issue (e.g. `feat/42-issue-slug`).
3. Implement; link the branch to the issue in commit messages if desired (e.g. "fix: resolve login redirect (fixes #42)").

---

For branch naming, commit types, and full workflow details, see [reference.md](reference.md) or [docs/git-workflow.md](../../../docs/git-workflow.md).
