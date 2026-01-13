#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

bc_require_git

CHANGE_ID="${CHANGE_ID:-}" 
DESCRIPTION="${DESCRIPTION:-}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --change-id)
      CHANGE_ID="$2"
      shift 2
      ;;
    --desc)
      DESCRIPTION="$2"
      shift 2
      ;;
    -h|--help)
      echo "usage: repo-plan.sh [--change-id <id>] [--desc <description>]"
      exit 0
      ;;
    *)
      # Treat first free arg as description if not set
      if [ -z "$DESCRIPTION" ]; then
        DESCRIPTION="$1"
      fi
      shift
      ;;
  esac
 done

if [ -z "$CHANGE_ID" ]; then
  CHANGE_ID="change-$(date +%Y%m%d-%H%M)"
fi

PROJECT_ROOT="$(bc_project_root)"
CHANGE_DIR="$(bc_change_dir "$CHANGE_ID")"
PLANSPEC="$CHANGE_DIR/planspec.yaml"

mkdir -p "$CHANGE_DIR"

if [ -f "$PLANSPEC" ]; then
  bc_die "planspec already exists: $PLANSPEC"
fi

bc_init_planspec "$CHANGE_ID" "$DESCRIPTION" "$PLANSPEC"

cat <<EOF2
change-id: $CHANGE_ID
change-dir: $CHANGE_DIR
planspec: $PLANSPEC
status: pending
EOF2
