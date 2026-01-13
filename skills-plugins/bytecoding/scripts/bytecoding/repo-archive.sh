#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

bc_require_git

CHANGE_ID="${CHANGE_ID:-}"
FORCE_ARCHIVE=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --change-id)
      CHANGE_ID="$2"
      shift 2
      ;;
    --force)
      FORCE_ARCHIVE=1
      shift
      ;;
    -h|--help)
      echo "usage: repo-archive.sh --change-id <id>"
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
ARCHIVE_ROOT="$(bc_archive_root)"
ARCHIVE_DIR="$ARCHIVE_ROOT/$CHANGE_ID"
BRANCH_NAME="feature-$CHANGE_ID"

[ -d "$CHANGE_DIR" ] || bc_die "change dir not found: $CHANGE_DIR"
[ -f "$PLANSPEC" ] || bc_die "planspec not found: $PLANSPEC"

STATUS="$(grep '^status:' "$PLANSPEC" | head -1 | awk '{print $2}')"
if [ -z "$STATUS" ]; then
  STATUS="unknown"
fi
if [ "$STATUS" != "completed" ] && [ "$FORCE_ARCHIVE" -ne 1 ]; then
  bc_die "status is '$STATUS', use --force to archive anyway"
fi

mkdir -p "$ARCHIVE_ROOT"

if [ -e "$ARCHIVE_DIR" ]; then
  bc_die "archive already exists: $ARCHIVE_DIR"
fi

mv "$CHANGE_DIR" "$ARCHIVE_DIR"

bc_update_planspec_status "$ARCHIVE_DIR/planspec.yaml" "archived"
bc_append_planspec_field "$ARCHIVE_DIR/planspec.yaml" "archived_at" "$(bc_now_utc)"

WORKTREE_PATH="$(bc_find_worktree_by_branch "$BRANCH_NAME")"
if [ -n "$WORKTREE_PATH" ]; then
  git worktree remove "$WORKTREE_PATH"
fi

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  git branch -d "$BRANCH_NAME" || true
fi

cat <<EOF2
change-id: $CHANGE_ID
archive-dir: $ARCHIVE_DIR
branch: $BRANCH_NAME
EOF2
