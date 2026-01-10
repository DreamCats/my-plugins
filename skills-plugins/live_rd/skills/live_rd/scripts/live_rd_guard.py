#!/usr/bin/env python3
import json
import os
import re
import shlex
import subprocess
import sys
from typing import Optional

ALLOWED_TYPES = {
    "feat",
    "fix",
    "docs",
    "refactor",
    "test",
    "chore",
    "perf",
    "style",
    "build",
    "ci",
}

SCOPE_RE = re.compile(r"^[a-z][a-z0-9-]{1,19}$")


def load_event() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def block(reason: str) -> None:
    payload = {
        "decision": "block",
        "reason": reason,
    }
    print(json.dumps(payload, ensure_ascii=True))


def git_root() -> str:
    env_root = os.environ.get("CLAUDE_PROJECT_DIR")
    if env_root:
        return env_root
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode != 0:
        return os.getcwd()
    return result.stdout.strip()


def read_stamp(root: str) -> Optional[dict]:
    path = os.path.join(root, ".claude", "live_rd_review.json")
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return None


def current_diff_sha(root: str) -> str:
    result = subprocess.run(
        ["git", "diff", "--cached"],
        cwd=root,
        stdout=subprocess.PIPE,
        text=True,
    )
    return hashlib_sha(result.stdout)


def hashlib_sha(text: str) -> str:
    import hashlib

    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def extract_commit_message(cmd: str, root: str) -> Optional[str]:
    try:
        parts = shlex.split(cmd)
    except ValueError:
        return None

    if "git" not in parts or "commit" not in parts:
        return None

    message_parts = []
    i = 0
    while i < len(parts):
        part = parts[i]
        if part in {"-m", "--message"}:
            if i + 1 >= len(parts):
                return None
            message_parts.append(parts[i + 1])
            i += 2
            continue
        if part in {"-F", "--file"}:
            if i + 1 >= len(parts):
                return None
            path = parts[i + 1]
            if not os.path.isabs(path):
                path = os.path.join(root, path)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    message_parts.append(f.read())
            except OSError:
                return None
            i += 2
            continue
        i += 1

    if not message_parts:
        return None
    return "\n\n".join([p.strip() for p in message_parts if p.strip()])


def validate_message(msg: str) -> Optional[str]:
    lines = [line.rstrip() for line in msg.splitlines() if line.strip() != ""]
    if not lines:
        return "提交信息为空"

    header = lines[0]
    header_match = re.match(r"^(?P<type>[a-z]+)\((?P<scope>[^)]+)\): (?P<subject>.+)$", header)
    if not header_match:
        return "提交信息格式不正确，必须是 type(scope): subject"

    commit_type = header_match.group("type")
    if commit_type not in ALLOWED_TYPES:
        return f"type 不在允许列表中: {sorted(ALLOWED_TYPES)}"

    scope = header_match.group("scope")
    if not SCOPE_RE.match(scope):
        return "scope 必须是小写 kebab-case（2-20 字符）"

    subject = header_match.group("subject")
    if len(subject) > 50:
        return "subject 过长，需 50 字以内"

    if not re.search(r"[\u4e00-\u9fff]", subject):
        return "subject 必须包含中文"

    try:
        gen_idx = lines.index("Generated-By: live_rd")
    except ValueError:
        return "缺少 footer: Generated-By: live_rd"

    coauthor_prefix = "Co-Authored-By: "
    co_idx = None
    for idx, line in enumerate(lines):
        if line.startswith(coauthor_prefix):
            co_idx = idx
            break
    if co_idx is None:
        return "缺少 footer: Co-Authored-By: <name> <email>"

    if gen_idx > co_idx:
        return "footer 顺序错误，必须先 Generated-By 再 Co-Authored-By"

    return None


def main() -> int:
    event = load_event()
    tool_input = event.get("tool_input", {}) if isinstance(event, dict) else {}
    command = tool_input.get("command", "")
    if not isinstance(command, str) or "git" not in command or "commit" not in command:
        return 0

    root = git_root()
    stamp = read_stamp(root)
    current_sha = current_diff_sha(root)
    if not stamp or stamp.get("diff_sha256") != current_sha:
        block("请先运行 /live_rd:review，确保当前暂存区已完成 Review。")
        return 0

    message = extract_commit_message(command, root)
    if not message:
        block("请使用 /live_rd:commit 生成提交信息（必须包含 footer）。")
        return 0

    error = validate_message(message)
    if error:
        block(f"提交信息不符合规范: {error}")
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
