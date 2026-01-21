#!/usr/bin/env python3
"""
lark-cli 调用与输出解析。
复用自 lark-md-to-doc 插件
"""

import json
import subprocess
import sys


def run_lark_cli(args, want_json=False, verbose=False):
    """执行 lark-cli 命令。

    - want_json=True 时解析 JSON 输出
    - verbose=True 时添加 -v
    - 失败时直接退出并输出错误信息
    """
    cmd = ["lark-cli"]
    # JSON 输出需要保持纯净，避免 -v 混入日志导致解析失败
    if verbose and not want_json:
        cmd.append("-v")
    if want_json:
        cmd += ["--format", "json"]
    cmd += args
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        # lark-cli 可能将错误写到 stdout 或 stderr，这里统一输出
        sys.stderr.write(res.stderr or res.stdout)
        raise SystemExit(res.returncode)
    if want_json:
        try:
            return json.loads(res.stdout)
        except json.JSONDecodeError as e:
            sys.stderr.write(f"Failed to parse lark-cli JSON output: {e}\n")
            sys.stderr.write(f"Output was: {res.stdout}\n")
            raise SystemExit(1)
    return res.stdout
