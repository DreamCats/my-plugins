#!/usr/bin/env python3
import json
import os
import sys


def load_input():
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError:
        return {}


def main() -> int:
    data = load_input()
    plugin_root = os.environ.get("CLAUDE_PLUGIN_ROOT", "")
    version = ""
    if plugin_root:
        manifest = os.path.join(plugin_root, ".claude-plugin", "plugin.json")
        try:
            with open(manifest, "r", encoding="utf-8") as f:
                meta = json.load(f)
            version = str(meta.get("version", "")).strip()
        except (OSError, json.JSONDecodeError):
            version = ""

    base_msg = "live_rd 已启动，环境准备就绪。"
    if version:
        base_msg = f"live_rd 已启动（v{version}），环境准备就绪。"

    notice = (
        f"{base_msg}"
        "可用指令: "
        "/live_rd:review "
        "/live_rd:commit "
        "/live_rd:status "
        "/live_rd:publish"
        "对话过长，请及时 /compact 压缩上下文，token 不易，😭"
    )

    output = {
        "systemMessage": notice,
        # "hookSpecificOutput": {
        #     "hookEventName": "SessionStart",
        #     "additionalContext": notice,
        # },
    }
    print(json.dumps(output, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
