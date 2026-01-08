---
name: claude-cli-wrapper
description: 用非交互 JSON 协议封装本机 claude CLI，统一返回包含 session_id 的结果，便于其他技能/工作流复用。
---

# Claude CLI Wrapper（非交互）

当你需要通过稳定的 JSON 接口调用本机 `claude` CLI（不进入交互式 REPL）时，使用该技能。
它面向可组合的技能/工作流，强调确定性输入输出、session_id 解析，以及可选的 `--allowedTools` 控制。

## 能力概览

- 多模块 Python3 封装，调用本机 `claude` CLI 的 `-p` 模式。
- 支持 JSON 或 NDJSON（批量）输入。
- 统一输出 JSON，包含 `session_id`、解析文本与原始 stdout/stderr。
- 支持 `--allowedTools`、`--add-dir`、`--resume`、`--continue` 等常用参数。

## 文件

- `skills/claude-cli-wrapper/scripts/claude_wrapper.py`（入口）
- `skills/claude-cli-wrapper/scripts/claude_wrap/`（模块目录）

## 输入协议（JSON）

包装器读取单个 JSON 对象或 NDJSON（每行一个对象）。

```json
{
  "prompt": "Explain this function",
  "stdin": "optional content to pipe into claude",
  "options": {
    "model": "sonnet",
    "max_turns": 3,
    "append_system_prompt": "Always use TypeScript",
    "system_prompt": "",
    "system_prompt_file": "./prompt.txt",
    "add_dir": ["../apps"],
    "continue": false,
    "resume": "",
    "allowed_tools": ["Bash(git log:*)"],
    "permission_mode": "",
    "permission_prompt_tool": "",
    "output_format": "json",
    "include_partial_messages": false,
    "dangerously_skip_permissions": false
  }
}
```

说明：

- `prompt` 必填，除非设置了 `options.continue` 或 `options.resume`。
- `stdin` 可选，会作为管道内容传入 `claude -p`。
- `options.output_format` 支持 `text` / `json` / `stream-json`。
- `options.system_prompt` 与 `options.system_prompt_file` 互斥。
- `options.allowed_tools` 映射为重复的 `--allowedTools` CLI 参数。
- `options.add_dir` 映射为重复的 `--add-dir` CLI 参数。

## 输出协议（JSON）

每个请求输出一行 JSON。

```json
{
  "ok": true,
  "response_text": "...",
  "response_json": {"...": "..."},
  "response_events": [],
  "session_id": "abc123",
  "raw": "...",
  "stderr": "",
  "error": null
}
```

说明：

- `response_json` 仅在 `output_format=json` 时填充。
- `response_events` 仅在 `output_format=stream-json` 时填充。
- `session_id` 从 JSON 或流事件中提取（如果存在）。
- `raw` 始终保留原始 stdout。

## 使用示例

从文件读取单条请求：

```bash
python3 skills/claude-cli-wrapper/scripts/claude_wrapper.py --input ./request.json
```

从 stdin 读取单条请求：

```bash
echo '{"prompt":"Explain this file","options":{"output_format":"json"}}' | \
  python3 skills/claude-cli-wrapper/scripts/claude_wrapper.py
```

NDJSON 批量：

```bash
cat requests.ndjson | python3 skills/claude-cli-wrapper/scripts/claude_wrapper.py
```

## Wrapper CLI 参数

- `--input PATH`：从文件读取 JSON/NDJSON（不传则读 stdin）
- `--claude-bin PATH`：自定义 `claude` 二进制路径
- `--timeout-seconds N`：单次请求超时（秒）

## 行为说明

- 包装器调用 `claude -p`，不会进入交互模式。
- 不对 Claude 的返回内容做语义加工，只做解析与归一化。
- 当返回内容不是有效 JSON 时，`ok=false` 并保留 `raw`。
