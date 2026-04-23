#!/usr/bin/env bash
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
dir="$root/docs/project/tickets"
out="$root/docs/project/board.md"
learnings="$root/docs/project/learnings.md"

field() {
  grep "^${1}:" "$2" | head -1 | sed "s/^${1}: *//"
}

emit() {
  local status="$1"
  for f in "$dir"/T-*.md; do
    [ -f "$f" ] || continue
    local s
    s=$(field status "$f")
    [ "$s" = "$status" ] || continue
    local id p t
    id=$(field id "$f")
    p=$(field priority "$f")
    t=$(field title "$f")
    printf '%s %s %s\n' "$id" "$p" "$t"
  done | sort -t' ' -k2,2
}

{ echo "# Board"
  echo ""
  echo "## sprint"
  emit sprint
  echo ""
  echo "## backlog"
  emit backlog
} > "$out"

echo "Board regenerated: $(grep -c '^T-' "$out") tickets."

orphans=""
for f in "$dir"/T-*.md; do
  [ -f "$f" ] || continue
  s=$(field status "$f")
  if [ "$s" = "in_progress" ]; then
    orphans="$orphans $(field id "$f")"
  fi
done
if [ -n "$orphans" ]; then
  echo "WARNING: Orphaned in_progress tickets:$orphans — resume or reset these."
fi

if [ -f "$learnings" ]; then
  last_review_date=$(grep '^## Reviewed' "$learnings" | tail -1 | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)
  if [ -n "$last_review_date" ]; then
    pending=$(awk -v d="$last_review_date" '/^- [0-9]{4}-[0-9]{2}-[0-9]{2}/ { if ($2 > d) count++ } END { print count+0 }' "$learnings")
  else
    pending=$(grep -c '^- ' "$learnings" 2>/dev/null || echo 0)
  fi
  if [ "$pending" -ge 10 ]; then
    echo "ACTION: $pending unreviewed learnings. Run /team-architect review."
  fi
fi
