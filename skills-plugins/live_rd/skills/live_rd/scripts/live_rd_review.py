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
from typing import Dict, Iterable, List, Optional, Tuple


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


def is_vendor_path(path: str) -> bool:
    return path.startswith("vendor/") or "/vendor/" in path.replace("\\", "/")


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


def resolve_module_root(path: str, root: str, mode: str) -> str:
    if mode == "repo":
        return root
    mod_root = find_module_root(path, root)
    return mod_root or root


def module_roots(go_files: List[str], root: str, mode: str) -> List[str]:
    if mode == "repo":
        return [root]
    roots = set()
    for path in go_files:
        mod_root = find_module_root(path, root)
        if mod_root:
            roots.add(mod_root)
    return sorted(roots)


def packages_by_module(go_files: List[str], root: str, mode: str) -> dict:
    mapping: dict = {}
    for path in go_files:
        if is_vendor_path(path):
            continue
        mod_root = resolve_module_root(path, root, mode)
        dir_path = os.path.dirname(path) or "."
        abs_dir = os.path.abspath(os.path.join(root, dir_path))
        rel = os.path.relpath(abs_dir, mod_root)
        rel = "." if rel == "." else rel.replace(os.sep, "/")
        pkg = "./" if rel == "." else f"./{rel}"
        mapping.setdefault(mod_root, set()).add(pkg)
    return {key: sorted(list(values)) for key, values in mapping.items()}


def packages_repo_rel(go_files: List[str]) -> List[str]:
    dirs = set()
    for path in go_files:
        if is_vendor_path(path):
            continue
        dir_path = os.path.dirname(path) or "."
        dirs.add(dir_path)
    return sorted(dirs)


def has_git_head(root: str) -> bool:
    result = subprocess.run(
        ["git", "rev-parse", "--verify", "HEAD"],
        cwd=root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.returncode == 0


def trim_output(output: str, max_lines: int) -> str:
    if not output:
        return ""
    if max_lines <= 0:
        return output.strip()
    lines = output.splitlines()
    if len(lines) <= max_lines:
        return output.strip()
    head = "\n".join(lines[:max_lines]).rstrip()
    tail = len(lines) - max_lines
    return f"{head}\n... truncated {tail} lines"


def chunked(items: Iterable[str], size: int) -> Iterable[List[str]]:
    batch: List[str] = []
    for item in items:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def write_stamp(
    root: str, scope: str, diff_text: str, status: str, failed_checks: List[str]
) -> str:
    stamp_dir = os.path.join(root, ".claude")
    os.makedirs(stamp_dir, exist_ok=True)
    payload = {
        "scope": scope,
        "timestamp": int(time.time()),
        "diff_sha256": hashlib.sha256(diff_text.encode("utf-8")).hexdigest(),
        "status": status,
        "failed_checks": failed_checks,
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
    target_mode: str,
    review_status: str,
    branch: str,
    go_files: List[str],
    modules: List[str],
    packages: List[str],
    failed_checks: List[str],
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
            "target_mode": target_mode,
            "review_status": review_status,
            "failed_checks": failed_checks,
            "root": root,
            "go_files_count": len(go_files),
            "modules_count": len(modules),
            "packages_count": len(packages),
            "diff_sha256": hashlib.sha256(diff_text.encode("utf-8")).hexdigest(),
            "stamp_path": stamp_path,
        },
        "go_files": go_files,
        "modules": [os.path.relpath(path, root) for path in modules],
        "packages": packages,
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
        f"> Generated: {timestamp} | Branch: `{branch}` | Scope: `{scope}`",
        "",
        "## Overview",
        "| Key | Value |",
        "| --- | --- |",
        f"| Module Mode | `{module_mode}` |",
        f"| Target Mode | `{target_mode}` |",
        f"| Lint Mode | `{lint_mode}` |",
        f"| Review Status | `{review_status}` |",
        f"| Go Files | `{len(go_files)}` |",
        f"| Modules | `{len(modules)}` |",
        f"| Packages | `{len(packages)}` |",
        "",
        "## Checks",
        "| Check | Status | Note |",
        "| --- | --- | --- |",
    ]
    for key, value in checks.items():
        status = value.get("status", "unknown")
        note = value.get("note", "")
        md_lines.append(f"| `{key}` | `{status}` | {note or '-'} |")
    md_lines.extend(
        [
            "",
            "## Issues",
        ]
    )
    if failed_checks:
        for key in failed_checks:
            detail = checks.get(key, {}).get("errors", "")
            md_lines.append(f"### {key}")
            md_lines.append("```text")
            md_lines.append(detail or "(no output)")
            md_lines.append("```")
            md_lines.append("")
    else:
        md_lines.append("- None")
        md_lines.append("")
    md_lines.extend(
        [
            "## Changed Go Files",
            "```text",
        ]
    )
    if go_files:
        md_lines.extend(go_files)
    else:
        md_lines.append("(none)")
    md_lines.extend(
        [
            "```",
            "",
            "## Modules",
            "```text",
        ]
    )
    if modules:
        md_lines.extend([os.path.relpath(path, root) for path in modules])
    else:
        md_lines.append("(none)")
    md_lines.extend(
        [
            "```",
            "",
            "## Packages",
            "```text",
        ]
    )
    if packages:
        md_lines.extend(packages)
    else:
        md_lines.append("(none)")
    md_lines.extend(
        [
            "```",
            "",
            "## AI Review",
            "<!-- LIVE_RD_AI_REVIEW_START -->",
            "### Summary",
            "-",
            "",
            "### Defects",
            "-",
            "",
            "### Risks",
            "-",
            "",
            "### Suggestions",
            "-",
            "",
            "### Concurrency",
            "-",
            "",
            "### Transaction",
            "-",
            "",
            "### Error Handling",
            "-",
            "<!-- LIVE_RD_AI_REVIEW_END -->",
            "",
            "## Review Stamp",
            f"`{stamp_path}`",
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
        "--target-mode",
        choices=["module", "package"],
        default=os.environ.get("LIVE_RD_REVIEW_TARGET_MODE", "package"),
        help="Run checks on full module or only changed packages",
    )
    soft_fail_default = os.environ.get("LIVE_RD_REVIEW_SOFT_FAIL", "").lower() in (
        "1",
        "true",
        "yes",
    )
    parser.add_argument(
        "--soft-fail",
        action="store_true",
        default=soft_fail_default,
        help="Continue even if checks fail",
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop on first failure",
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
    soft_fail = args.soft_fail and not args.fail_fast
    max_output_lines = int(os.environ.get("LIVE_RD_REVIEW_OUTPUT_MAX_LINES", "0"))

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
    failed_checks: List[str] = []
    check_outputs: Dict[str, List[str]] = {}

    def record_failure(key: str, note: str, output: str) -> None:
        checks[key] = {"status": "fail", "note": note}
        if key not in failed_checks:
            failed_checks.append(key)
        cleaned = trim_output(output, max_output_lines)
        if cleaned:
            check_outputs.setdefault(key, []).append(cleaned)

    if not args.no_fmt and go_files:
        print("Running gofmt...")
        for batch in chunked(go_files, 50):
            code, output = run_cmd(["gofmt", "-w"] + batch, cwd=root)
            if code != 0:
                record_failure("gofmt", "gofmt failed", output)
                if not soft_fail:
                    return code
        if "gofmt" not in checks:
            checks["gofmt"] = {"status": "success", "note": "formatted Go files"}

        goimports_path = shutil.which("goimports")
        if goimports_path:
            print("Running goimports...")
            for batch in chunked(go_files, 50):
                code, output = run_cmd([goimports_path, "-w"] + batch, cwd=root)
                if code != 0:
                    record_failure("goimports", "goimports failed", output)
                    if not soft_fail:
                        return code
            if "goimports" not in checks:
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
            packages_by_target = packages_by_module(go_files, root, args.module_mode)
            packages = packages_repo_rel(go_files)
            print(f"Lint targets ({len(targets)}):")
            for target in targets:
                print(f"- {os.path.relpath(target, root)}")

            for target in targets:
                rel_target = os.path.relpath(target, root)
                if args.target_mode == "package":
                    packages_target = packages_by_target.get(target, [])
                    if not packages_target:
                        print(f"No packages detected in {rel_target}, skip go vet.")
                        continue
                    print(
                        f"Running go vet in {rel_target} (packages={len(packages_target)})..."
                    )
                    for batch in chunked(packages_target, 50):
                        code, output = run_cmd(["go", "vet"] + batch, cwd=target)
                        if code != 0:
                            record_failure(
                                "go_vet",
                                f"go vet failed in {rel_target}",
                                output,
                            )
                            if not soft_fail:
                                return code
                else:
                    print(f"Running go vet in {rel_target}...")
                    code, output = run_cmd(["go", "vet", "./..."], cwd=target)
                    if code != 0:
                        record_failure(
                            "go_vet",
                            f"go vet failed in {rel_target}",
                            output,
                        )
                        if not soft_fail:
                            return code
            if "go_vet" not in checks:
                checks["go_vet"] = {
                    "status": "success",
                    "note": f"mode={args.target_mode}",
                }

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
                    if args.target_mode == "package":
                        packages_target = packages_by_target.get(target, [])
                        if not packages_target:
                            print(
                                f"No packages detected in {rel_target}, skip golangci-lint."
                            )
                            continue
                        print(
                            f"Running golangci-lint in {rel_target} (packages={len(packages_target)})..."
                        )
                        for batch in chunked(packages_target, 50):
                            code, output = run_cmd(lint_args + batch, cwd=target)
                            if code != 0:
                                record_failure(
                                    "golangci_lint",
                                    f"golangci-lint failed in {rel_target}",
                                    output,
                                )
                                if not soft_fail:
                                    return code
                    else:
                        print(f"Running golangci-lint in {rel_target}...")
                        code, output = run_cmd(lint_args, cwd=target)
                        if code != 0:
                            record_failure(
                                "golangci_lint",
                                f"golangci-lint failed in {rel_target}",
                                output,
                            )
                            if not soft_fail:
                                return code
                if "golangci_lint" not in checks:
                    checks["golangci_lint"] = {
                        "status": "success",
                        "note": f"mode={args.lint_mode}, target={args.target_mode}",
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
    review_status = "pass" if not failed_checks else "fail"
    stamp_path = write_stamp(
        root, args.scope, diff_text, review_status, failed_checks
    )
    branch = git_branch(root)
    modules = module_roots(go_files, root, args.module_mode)
    packages = packages_repo_rel(go_files)
    for key, chunks in check_outputs.items():
        combined = "\n".join([c for c in chunks if c]).strip()
        if combined:
            checks.setdefault(key, {})
            checks[key]["errors"] = combined

    md_path, json_path = write_report(
        root,
        args.scope,
        args.module_mode,
        args.lint_mode,
        args.target_mode,
        review_status,
        branch,
        go_files,
        modules,
        packages,
        failed_checks,
        checks,
        stamp_path,
        diff_text,
    )
    print(f"Report written: {md_path}")
    print(f"Report written: {json_path}")
    prune_reports(os.path.dirname(md_path), args.report_keep)
    if failed_checks and soft_fail:
        print("Review completed with failures:", ", ".join(failed_checks))
    return 0


if __name__ == "__main__":
    sys.exit(main())
