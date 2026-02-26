# /hotfix

**Trigger**: User runs `/hotfix` or says "hotfix [description]"

**Purpose**: Immediately patch a production bug without disrupting active feature work.

## Production & Vercel (for agent)

- **Production URL**: `https://supabase-sveltekit-seven.vercel.app`
- **Vercel**: When `develop` is pushed, Vercel first deploys a **Preview** (~2 min), then deploys **Production** (~2 min). When only `main` is pushed, Production deploys (~2 min). Poll deployments via Vercel MCP (`list_deployments` for project/team) until the Production deployment is READY.
- **Test autonomously**: After the Production deployment is READY, open the Production URL in the browser (e.g. cursor-ide-browser MCP), navigate to the affected route, and verify the fix. Prefer testing yourself rather than asking the user to confirm.

## Steps

1. If the user did not already describe the issue: ask for a short description for the branch name. Otherwise proceed.
2. Stash or commit any WIP on the current branch.
3. Follow the **Hotfix Workflow** in `.cursor/skills/git-workflow/SKILL.md` (branch from `main`, fix, merge into `main` and `develop`, push both).
4. Wait for Vercel Production deployment: poll `list_deployments` (projectId/teamId from Vercel MCP or project config) until the latest deployment with `target: "production"` has `state: "READY"` (~2–4 min).
5. Test on Production: open `https://supabase-sveltekit-seven.vercel.app` in the browser, go to the relevant path, and confirm the fix (e.g. no 500, correct content).
6. Confirm to the user: hotfix merged and pushed, Production deploy READY, and verification result (or that they should re-test after logging in if auth was required).
