#!/usr/bin/env bash
# Skip Vercel build when the only changes are in dev-only paths:
#   docs, .vscode, .cursor, .agent, .env.dev.example, this script.
# Used via vercel.json ignoreCommand (or Vercel → Project Settings → Git → Ignored Build Step).
# Exit 0 = skip build, exit 1 = run build.

CHANGED=$(git diff --name-only HEAD^ HEAD 2>/dev/null || true)
if [ -z "$CHANGED" ]; then
  # No diff (e.g. first deploy or shallow clone) → run build
  exit 1
fi

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if [[ "$f" == .cursor/* ]]; then continue; fi
  if [[ "$f" == .agent/* ]]; then continue; fi
  if [[ "$f" == .agents/* ]]; then continue; fi
  if [[ "$f" == .vscode/* ]]; then continue; fi
  if [[ "$f" == .env.dev.example ]]; then continue; fi
  if [[ "$f" == docs/* ]]; then continue; fi
  if [[ "$f" == scripts/vercel-ignore-build-if-docs-only.sh ]]; then continue; fi
  # At least one file outside "skip" paths → run build
  exit 1
done <<< "$CHANGED"

# All changes are in skip paths → skip build
exit 0
