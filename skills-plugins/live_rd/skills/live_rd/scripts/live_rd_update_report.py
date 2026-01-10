#!/usr/bin/env python3
import argparse
import glob
import json
import os
import re
import sys
import time
from typing import Any, Dict, List, Optional, Tuple


def latest_report(report_dir: str) -> Optional[str]:
    files = glob.glob(os.path.join(report_dir, "review_*.md"))
    if not files:
        return None
    return max(files, key=os.path.getmtime)


def load_input() -> Dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        print("No input payload.", file=sys.stderr)
        sys.exit(1)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON input: {exc}", file=sys.stderr)
        sys.exit(1)


def normalize_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str):
        return [value] if value.strip() else []
    return []


def build_ai_lines(data: Dict[str, Any]) -> List[str]:
    summary = str(data.get("summary", "")).strip()
    defects = normalize_list(data.get("defects"))
    risks = normalize_list(data.get("risks"))
    suggestions = normalize_list(data.get("suggestions"))
    concurrency = normalize_list(data.get("concurrency"))
    transaction = normalize_list(data.get("transaction"))
    error_handling = normalize_list(data.get("error_handling"))

    updated = time.strftime("%Y%m%d-%H%M%S", time.localtime())

    lines: List[str] = []
    lines.append(f"> Updated: {updated}")
    lines.append("")
    lines.append("### Summary")
    lines.append(f"- {summary}" if summary else "- None")
    lines.append("")
    lines.extend(_section("Defects", defects))
    lines.extend(_section("Risks", risks))
    lines.extend(_section("Suggestions", suggestions))
    lines.extend(_section("Concurrency", concurrency))
    lines.extend(_section("Transaction", transaction))
    lines.extend(_section("Error Handling", error_handling))
    if lines and not lines[-1].strip():
        lines.pop()
    return lines


def _section(title: str, items: List[str]) -> List[str]:
    lines = [f"### {title}"]
    if items:
        for item in items:
            lines.append(f"- {item}")
    else:
        lines.append("- None")
    lines.append("")
    return lines


def update_json(path: str, data: Dict[str, Any]) -> None:
    try:
        with open(path, "r", encoding="utf-8") as f:
            report = json.load(f)
    except (OSError, json.JSONDecodeError):
        report = {}

    ai_review = report.get("ai_review", {}) if isinstance(report, dict) else {}
    ai_review["summary"] = str(data.get("summary", "")).strip()
    ai_review["defects"] = normalize_list(data.get("defects"))
    ai_review["risks"] = normalize_list(data.get("risks"))
    ai_review["suggestions"] = normalize_list(data.get("suggestions"))
    ai_review["concurrency"] = normalize_list(data.get("concurrency"))
    ai_review["transaction"] = normalize_list(data.get("transaction"))
    ai_review["error_handling"] = normalize_list(data.get("error_handling"))
    ai_review["updated_at"] = time.strftime("%Y%m%d-%H%M%S", time.localtime())
    report["ai_review"] = ai_review

    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=True, indent=2)


def update_md(path: str, lines: List[str]) -> None:
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
    except OSError:
        print("Report markdown not found.", file=sys.stderr)
        sys.exit(1)

    start = "<!-- LIVE_RD_AI_REVIEW_START -->"
    end = "<!-- LIVE_RD_AI_REVIEW_END -->"
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    replacement = start + "\n" + "\n".join(lines) + "\n" + end

    if not pattern.search(content):
        content = content.rstrip() + "\n\n## AI Review\n" + replacement + "\n"
    else:
        content = pattern.sub(replacement, content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def main() -> int:
    parser = argparse.ArgumentParser(description="Update live_rd report with AI review")
    parser.add_argument("--report", default="", help="Report markdown path")
    args = parser.parse_args()

    root = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    report_dir = os.path.join(root, ".claude", "live_rd", "reports")
    md_path = args.report or latest_report(report_dir)
    if not md_path:
        print("No report found.", file=sys.stderr)
        return 1

    if not os.path.isabs(md_path):
        md_path = os.path.join(root, md_path)

    json_path = os.path.splitext(md_path)[0] + ".json"
    if not os.path.exists(json_path):
        print("Report JSON not found.", file=sys.stderr)
        return 1

    payload = load_input()
    update_json(json_path, payload)
    ai_lines = build_ai_lines(payload)
    update_md(md_path, ai_lines)
    print(f"Report updated: {md_path}")
    print(f"Report updated: {json_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
