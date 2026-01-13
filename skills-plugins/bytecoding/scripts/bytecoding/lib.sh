#!/usr/bin/env bash
set -euo pipefail

bc_die() {
  echo "error: $*" >&2
  exit 1
}

bc_require_git() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || bc_die "not inside a git repository"
}

bc_project_root() {
  git rev-parse --show-toplevel
}

bc_changes_root() {
  echo "$(bc_project_root)/.bytecoding/changes"
}

bc_change_dir() {
  local change_id="$1"
  echo "$(bc_changes_root)/$change_id"
}

bc_archive_root() {
  echo "$(bc_changes_root)/archive"
}

bc_now_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

bc_update_planspec_status() {
  local planspec="$1"
  local new_status="$2"
  local tmp

  if [ ! -f "$planspec" ]; then
    bc_die "planspec not found: $planspec"
  fi

  tmp="$(mktemp)"
  if grep -q '^status:' "$planspec"; then
    sed "s/^status:.*/status: $new_status/" "$planspec" > "$tmp"
  else
    cat "$planspec" > "$tmp"
    echo "status: $new_status" >> "$tmp"
  fi
  mv "$tmp" "$planspec"
}

bc_append_planspec_field() {
  local planspec="$1"
  local field="$2"
  local value="$3"

  if [ ! -f "$planspec" ]; then
    bc_die "planspec not found: $planspec"
  fi

  echo "${field}: ${value}" >> "$planspec"
}

bc_init_planspec() {
  local change_id="$1"
  local description="$2"
  local out="$3"

  cat > "$out" <<EOF2
# PlanSpec for $change_id

change_id: $change_id
description: $description
created_at: $(bc_now_utc)
status: pending

# outputs
proposal: proposal.md
design: design.md
tasks: tasks.md

spec_deltas: []
EOF2
}

bc_find_worktree_by_branch() {
  local branch="$1"
  local target="refs/heads/$branch"
  local path=""
  local current_path=""

  while IFS= read -r line; do
    case "$line" in
      worktree\ *)
        current_path="${line#worktree }"
        ;;
      branch\ *)
        if [ "${line#branch }" = "$target" ]; then
          path="$current_path"
          break
        fi
        ;;
    esac
  done < <(git worktree list --porcelain)

  echo "$path"
}
