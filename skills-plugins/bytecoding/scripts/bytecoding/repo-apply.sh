#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

bc_require_git

CHANGE_ID="${CHANGE_ID:-}"
WORKTREE_DIR="${WORKTREE_DIR:-}"
MARK_COMPLETED=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --change-id)
      CHANGE_ID="$2"
      shift 2
      ;;
    --worktree-dir)
      WORKTREE_DIR="$2"
      shift 2
      ;;
    --mark-completed)
      MARK_COMPLETED=1
      shift
      ;;
    -h|--help)
      echo "usage: repo-apply.sh --change-id <id> [--worktree-dir <path>] [--mark-completed]"
      exit 0
      ;;
    *)
      if [ -z "$CHANGE_ID" ]; then
        CHANGE_ID="$1"
      fi
      shift
      ;;
  esac
 done

[ -n "$CHANGE_ID" ] || bc_die "missing change-id"

PROJECT_ROOT="$(bc_project_root)"
CHANGE_DIR="$(bc_change_dir "$CHANGE_ID")"
PLANSPEC="$CHANGE_DIR/planspec.yaml"

[ -d "$CHANGE_DIR" ] || bc_die "change dir not found: $CHANGE_DIR"
[ -f "$PLANSPEC" ] || bc_die "planspec not found: $PLANSPEC"

REQUIRED_FILES=("proposal.md" "design.md" "tasks.md" "planspec.yaml")
for file in "${REQUIRED_FILES[@]}"; do
  [ -f "$CHANGE_DIR/$file" ] || bc_die "missing required file: $file"
 done

if [ "$MARK_COMPLETED" -eq 1 ]; then
  bc_update_planspec_status "$PLANSPEC" "completed"
  bc_append_planspec_field "$PLANSPEC" "completed_at" "$(bc_now_utc)"
  cat <<EOF2
change-id: $CHANGE_ID
status: completed
EOF2
  exit 0
fi

BRANCH_NAME="feature-$CHANGE_ID"
if [ -z "$WORKTREE_DIR" ]; then
  WORKTREE_DIR="$(dirname "$PROJECT_ROOT")/feature-$CHANGE_ID"
fi

if [ -d "$WORKTREE_DIR" ]; then
  echo "worktree-exists: $WORKTREE_DIR"
else
  if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    git worktree add "$WORKTREE_DIR" "$BRANCH_NAME"
  else
    git worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME"
  fi
fi

printf "%s\n" "$WORKTREE_DIR" > "$CHANGE_DIR/worktree.path"
printf "%s\n" "$BRANCH_NAME" > "$CHANGE_DIR/worktree.branch"

cat <<EOF2
change-id: $CHANGE_ID
worktree: $WORKTREE_DIR
branch: $BRANCH_NAME
EOF2
