#!/usr/bin/env python3
import json
import os
import sys


def load_input():
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError:
        return {}


def size_str(num: int) -> str:
    if num < 1024:
        return f"{num}B"
    if num < 1024 * 1024:
        return f"{num / 1024:.1f}KB"
    return f"{num / 1024 / 1024:.2f}MB"


def main() -> int:
    data = load_input()
    transcript = data.get("transcript_path", "") if isinstance(data, dict) else ""
    if not transcript or not os.path.exists(transcript):
        return 0

    warn_bytes = int(os.environ.get("LIVE_RD_COMPACT_WARN_BYTES", "400000"))
    block_bytes = int(os.environ.get("LIVE_RD_COMPACT_BLOCK_BYTES", "600000"))
    warn_lines = int(os.environ.get("LIVE_RD_COMPACT_WARN_LINES", "0"))

    try:
        size = os.path.getsize(transcript)
    except OSError:
        return 0

    lines = 0
    if warn_lines > 0:
        try:
            with open(transcript, "r", encoding="utf-8") as f:
                for _ in f:
                    lines += 1
        except OSError:
            lines = 0

    over_bytes = size >= warn_bytes if warn_bytes > 0 else False
    over_lines = lines >= warn_lines if warn_lines > 0 else False
    if not (over_bytes or over_lines):
        return 0

    hint = (
        f"上下文可能过大（transcript={size_str(size)}" +
        (f", lines={lines}" if lines else "") +
        "）。"
    )

    if block_bytes > 0 and size >= block_bytes:
        output = {
            "decision": "block",
            "reason": (
                f"{hint} 请先执行 /compact 压缩上下文后重试。"
            ),
        }
        print(json.dumps(output, ensure_ascii=True))
        return 0

    ask = (
        f"{hint} 请在本轮回复中使用 AskUserQuestion 工具询问用户是否执行 /compact。"
        " 推荐问题：当前上下文较大，是否现在执行 /compact 压缩？"
    )
    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": ask,
        }
    }
    print(json.dumps(output, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
