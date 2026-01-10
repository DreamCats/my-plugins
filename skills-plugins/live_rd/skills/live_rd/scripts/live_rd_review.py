#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from typing import Iterable, List, Optional, Tuple


def run_cmd(cmd: List[str], cwd: str, allow_fail: bool = False) -> Tuple[int, str]:
    result = subprocess.run(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    output = result.stdout or ""
    if output:
        print(output.rstrip())
    if result.returncode != 0 and not allow_fail:
        return result.returncode, output
    return 0, output


def git_root() -> str:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode != 0:
        print("Not a git repository.", file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()


def git_branch(root: str) -> str:
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    branch = result.stdout.strip()
    if branch:
        return branch
    # Fallback for older git versions.
    result = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        cwd=root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    branch = result.stdout.strip()
    return branch if branch and branch != "HEAD" else "detached"


def git_diff(scope: str, root: str) -> str:
    if scope == "staged":
        cmd = ["git", "diff", "--cached"]
    elif scope == "working":
        cmd = ["git", "diff"]
    elif scope == "all":
        cmd = ["git", "diff", "HEAD"]
    else:
        raise ValueError("unknown scope")
    result = subprocess.run(cmd, cwd=root, stdout=subprocess.PIPE, text=True)
    return result.stdout


def list_go_files(scope: str, root: str) -> List[str]:
    if scope == "staged":
        cmd = ["git", "diff", "--name-only", "--cached", "--diff-filter=ACM"]
    elif scope == "working":
        cmd = ["git", "diff", "--name-only", "--diff-filter=ACM"]
    elif scope == "all":
        cmd = ["git", "ls-files"]
    else:
        raise ValueError("unknown scope")
    result = subprocess.run(cmd, cwd=root, stdout=subprocess.PIPE, text=True)
    files = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    return [f for f in files if f.endswith(".go")]


def find_module_root(path: str, root: str) -> Optional[str]:
    abs_root = os.path.abspath(root)
    current = os.path.abspath(os.path.join(root, path))
    if os.path.isfile(current):
        current = os.path.dirname(current)
    while True:
        if os.path.exists(os.path.join(current, "go.mod")):
            return current
        if current == abs_root:
            return None
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent


def module_roots(go_files: List[str], root: str, mode: str) -> List[str]:
    if mode == "repo":
        return [root]
    roots = set()
    for path in go_files:
        mod_root = find_module_root(path, root)
        if mod_root:
            roots.add(mod_root)
    return sorted(roots)


def has_git_head(root: str) -> bool:
    result = subprocess.run(
        ["git", "rev-parse", "--verify", "HEAD"],
        cwd=root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.returncode == 0


def chunked(items: Iterable[str], size: int) -> Iterable[List[str]]:
    batch: List[str] = []
    for item in items:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def write_stamp(root: str, scope: str, diff_text: str) -> str:
    stamp_dir = os.path.join(root, ".claude")
    os.makedirs(stamp_dir, exist_ok=True)
    payload = {
        "scope": scope,
        "timestamp": int(time.time()),
        "diff_sha256": hashlib.sha256(diff_text.encode("utf-8")).hexdigest(),
    }
    path = os.path.join(stamp_dir, "live_rd_review.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=True, indent=2)
    print(f"Review stamp written to {path}")
    return path


def safe_name(value: str) -> str:
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "-", value)
    return sanitized.strip("-") or "unknown"


def write_report(
    root: str,
    scope: str,
    module_mode: str,
    lint_mode: str,
    branch: str,
    go_files: List[str],
    modules: List[str],
    checks: dict,
    stamp_path: str,
    diff_text: str,
) -> Tuple[str, str]:
    report_dir = os.path.join(root, ".claude", "live_rd", "reports")
    os.makedirs(report_dir, exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S", time.localtime())
    base = f"review_{safe_name(branch)}_{timestamp}"
    json_path = os.path.join(report_dir, f"{base}.json")
    md_path = os.path.join(report_dir, f"{base}.md")

    report = {
        "meta": {
            "timestamp": timestamp,
            "branch": branch,
            "scope": scope,
            "module_mode": module_mode,
            "lint_mode": lint_mode,
            "root": root,
            "go_files_count": len(go_files),
            "modules_count": len(modules),
            "diff_sha256": hashlib.sha256(diff_text.encode("utf-8")).hexdigest(),
            "stamp_path": stamp_path,
        },
        "go_files": go_files,
        "modules": [os.path.relpath(path, root) for path in modules],
        "checks": checks,
        "ai_review": {
            "summary": "",
            "defects": [],
            "risks": [],
            "suggestions": [],
            "concurrency": [],
            "transaction": [],
            "error_handling": [],
            "updated_at": "",
        },
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=True, indent=2)

    md_lines = [
        "# live_rd Review Report",
        "",
        "## Basic Info",
        f"- Timestamp: {timestamp}",
        f"- Branch: {branch}",
        f"- Scope: {scope}",
        f"- Module Mode: {module_mode}",
        f"- Lint Mode: {lint_mode}",
        f"- Go Files: {len(go_files)}",
        f"- Modules: {len(modules)}",
        "",
        "## Checks",
    ]
    for key, value in checks.items():
        status = value.get("status", "unknown")
        note = value.get("note", "")
        md_lines.append(f"- {key}: {status}{' - ' + note if note else ''}")
    md_lines.extend(
        [
            "",
            "## AI Review",
            "<!-- LIVE_RD_AI_REVIEW_START -->",
            "- Summary:",
            "- Defects:",
            "- Risks:",
            "- Suggestions:",
            "- Concurrency:",
            "- Transaction:",
            "- Error Handling:",
            "<!-- LIVE_RD_AI_REVIEW_END -->",
            "",
            f"Review Stamp: {stamp_path}",
        ]
    )

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    return md_path, json_path


def prune_reports(report_dir: str, keep: int) -> None:
    if keep <= 0:
        return
    entries = []
    for name in os.listdir(report_dir):
        if not (name.endswith(".md") or name.endswith(".json")):
            continue
        path = os.path.join(report_dir, name)
        if os.path.isfile(path):
            entries.append((os.path.getmtime(path), path))
    if len(entries) <= keep * 2:
        return
    entries.sort()
    to_remove = entries[: max(0, len(entries) - keep * 2)]
    for _, path in to_remove:
        try:
            os.remove(path)
        except OSError:
            pass


def main() -> int:
    parser = argparse.ArgumentParser(description="live_rd Go review runner")
    parser.add_argument(
        "--scope",
        choices=["staged", "working", "all"],
        default="staged",
        help="Which diff scope to analyze",
    )
    parser.add_argument(
        "--module-mode",
        choices=["repo", "module"],
        default="module",
        help="Run checks at repo root or per module",
    )
    parser.add_argument(
        "--lint-mode",
        choices=["incremental", "full"],
        default="incremental",
        help="Run incremental or full linting",
    )
    parser.add_argument(
        "--report-keep",
        type=int,
        default=int(os.environ.get("LIVE_RD_REPORT_KEEP", "10")),
        help="Keep latest N reports",
    )
    parser.add_argument("--no-fmt", action="store_true")
    parser.add_argument("--no-lint", action="store_true")
    args = parser.parse_args()

    root = git_root()

    if not shutil.which("go"):
        print("go not found in PATH.", file=sys.stderr)
        return 1

    go_files = list_go_files(args.scope, root)
    if go_files:
        print(f"Go files to format ({len(go_files)}):")
        for path in go_files:
            print(f"- {path}")
    else:
        print("No Go files detected in scope.")

    checks: dict = {}

    if not args.no_fmt and go_files:
        print("Running gofmt...")
        for batch in chunked(go_files, 50):
            code, output = run_cmd(["gofmt", "-w"] + batch, cwd=root)
            if code != 0:
                checks["gofmt"] = {"status": "fail", "note": "gofmt failed"}
                return code
        checks["gofmt"] = {"status": "success", "note": "formatted Go files"}

        goimports_path = shutil.which("goimports")
        if goimports_path:
            print("Running goimports...")
            for batch in chunked(go_files, 50):
                code, output = run_cmd([goimports_path, "-w"] + batch, cwd=root)
                if code != 0:
                    checks["goimports"] = {
                        "status": "fail",
                        "note": "goimports failed",
                    }
                    return code
            checks["goimports"] = {"status": "success", "note": "imports adjusted"}
        else:
            print("goimports not found, skipped.")
            checks["goimports"] = {
                "status": "skipped",
                "note": "goimports not found",
            }
    else:
        checks["gofmt"] = {"status": "skipped", "note": "no Go files or disabled"}
        checks["goimports"] = {
            "status": "skipped",
            "note": "no Go files or disabled",
        }

    if not args.no_lint:
        if not go_files:
            print("No Go files detected, skip go vet and golangci-lint.")
            checks["go_vet"] = {"status": "skipped", "note": "no Go files"}
            checks["golangci_lint"] = {"status": "skipped", "note": "no Go files"}
        else:
            targets = module_roots(go_files, root, args.module_mode)
            if not targets:
                targets = [root]
            print(f"Lint targets ({len(targets)}):")
            for target in targets:
                print(f"- {os.path.relpath(target, root)}")

            for target in targets:
                rel_target = os.path.relpath(target, root)
                print(f"Running go vet in {rel_target}...")
                code, output = run_cmd(["go", "vet", "./..."], cwd=target)
                if code != 0:
                    checks["go_vet"] = {
                        "status": "fail",
                        "note": f"go vet failed in {rel_target}",
                    }
                    return code
            checks["go_vet"] = {"status": "success", "note": "modules checked"}

            golangci = shutil.which("golangci-lint")
            if golangci:
                lint_args = [golangci, "run"]
                if args.lint_mode == "incremental":
                    if has_git_head(root):
                        lint_args.append("--new-from-rev=HEAD")
                    else:
                        print("Git HEAD not found, fallback to full lint.")
                for target in targets:
                    rel_target = os.path.relpath(target, root)
                    print(f"Running golangci-lint in {rel_target}...")
                    code, output = run_cmd(lint_args, cwd=target)
                    if code != 0:
                        checks["golangci_lint"] = {
                            "status": "fail",
                            "note": f"golangci-lint failed in {rel_target}",
                        }
                        return code
                checks["golangci_lint"] = {
                    "status": "success",
                    "note": f"mode={args.lint_mode}",
                }
            else:
                print("golangci-lint not found, skipped.")
                checks["golangci_lint"] = {
                    "status": "skipped",
                    "note": "golangci-lint not found",
                }
    else:
        checks["go_vet"] = {"status": "skipped", "note": "lint disabled"}
        checks["golangci_lint"] = {"status": "skipped", "note": "lint disabled"}

    diff_text = git_diff(args.scope, root)
    stamp_path = write_stamp(root, args.scope, diff_text)
    branch = git_branch(root)
    modules = module_roots(go_files, root, args.module_mode)
    md_path, json_path = write_report(
        root,
        args.scope,
        args.module_mode,
        args.lint_mode,
        branch,
        go_files,
        modules,
        checks,
        stamp_path,
        diff_text,
    )
    print(f"Report written: {md_path}")
    print(f"Report written: {json_path}")
    prune_reports(os.path.dirname(md_path), args.report_keep)
    return 0


if __name__ == "__main__":
    sys.exit(main())
