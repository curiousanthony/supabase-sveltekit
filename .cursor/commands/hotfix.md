# /hotfix

**Trigger**: User runs `/hotfix` or says "hotfix [description]"

**Purpose**: Immediately patch a production bug without disrupting active feature work.

## Steps

1. Ask the user: "What is broken in production? Give a short description for the branch name."
2. Stash or commit any WIP on the current branch
3. Follow the full **Hotfix Workflow** in `.agent/workflows/git-workflow.md`
4. After merging into both `main` and `develop`, confirm to the user:
   - ✅ Hotfix merged into `main` and pushed
   - ✅ `develop` synced with hotfix
   - ✅ Returned to previous branch with WIP restored
