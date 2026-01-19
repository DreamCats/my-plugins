#!/usr/bin/env python3

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple


@dataclass
class Violation:
    line_no: int
    message: str
    line: str


FORBIDDEN_SUBSTRINGS = [
    "!include",
    "!includeurl",
    "!include_many",
    "!define",
    "!ifdef",
    "!ifndef",
    "!endif",
    "http://",
    "https://",
    "file://",
    "/Users/",
]

FORBIDDEN_REGEXES: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"\bC:\\\\"), "local Windows path hint is forbidden"),
    (re.compile(r"\bsprite\b", re.IGNORECASE), "sprite usage is forbidden"),
]

ALLOWED_SKINPARAM_PATTERNS: List[re.Pattern] = [
    re.compile(r"^skinparam\s+componentStyle\s+rectangle\s*$"),
    re.compile(r"^skinparam\s+shadowing\s+false\s*$"),
    re.compile(r"^skinparam\s+monochrome\s+(true|false)\s*$"),
    re.compile(r"^skinparam\s+defaultTextAlignment\s+left\s*$"),
]


def extract_plantuml_blocks(md: str) -> List[Tuple[int, str]]:
    lines = md.splitlines()
    blocks: List[Tuple[int, str]] = []

    in_block = False
    start_line_no = 0
    buf: List[str] = []

    for idx, line in enumerate(lines, start=1):
        if not in_block:
            if line.strip() == "```plantuml":
                in_block = True
                start_line_no = idx
                buf = []
            continue

        if line.strip() == "```":
            blocks.append((start_line_no, "\n".join(buf)))
            in_block = False
            start_line_no = 0
            buf = []
            continue

        buf.append(line.rstrip("\n"))

    return blocks


def validate_block(start_line_no: int, content: str) -> List[Violation]:
    violations: List[Violation] = []
    lines = content.splitlines()

    has_title = any(l.startswith("title ") for l in lines)
    if not has_title:
        violations.append(
            Violation(
                line_no=start_line_no,
                message="missing required 'title ...' line in PlantUML block",
                line="(block start)",
            )
        )

    for i, raw in enumerate(lines, start=0):
        line_no = start_line_no + 1 + i
        line = raw.strip()

        for token in FORBIDDEN_SUBSTRINGS:
            if token in line:
                violations.append(
                    Violation(
                        line_no=line_no,
                        message=f"forbidden token '{token}'",
                        line=raw,
                    )
                )

        for rx, msg in FORBIDDEN_REGEXES:
            if rx.search(line):
                violations.append(Violation(line_no=line_no, message=msg, line=raw))

        if line.startswith("skinparam"):
            ok = any(p.match(line) for p in ALLOWED_SKINPARAM_PATTERNS)
            if not ok:
                violations.append(
                    Violation(
                        line_no=line_no,
                        message="skinparam is not in whitelist",
                        line=raw,
                    )
                )

    return violations


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate PlantUML fences in Markdown against a conservative Lark-safe subset."
    )
    parser.add_argument("--md", required=True, help="Path to Markdown file")
    args = parser.parse_args(argv)

    md_path = Path(args.md)
    if not md_path.exists():
        print(f"error: file not found: {md_path}", file=sys.stderr)
        return 2

    md = md_path.read_text(encoding="utf-8")
    blocks = extract_plantuml_blocks(md)

    if not blocks:
        print("no ```plantuml blocks found")
        return 0

    all_violations: List[Violation] = []
    for start_line_no, content in blocks:
        all_violations.extend(validate_block(start_line_no, content))

    if not all_violations:
        print(f"ok: {len(blocks)} PlantUML block(s) validated")
        return 0

    print(f"found {len(all_violations)} violation(s) across {len(blocks)} block(s):")
    for v in all_violations:
        print(f"- L{v.line_no}: {v.message}\n  {v.line}")

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
