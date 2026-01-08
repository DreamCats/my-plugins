---
name: figma-mcp
description: This skill should be used when the user asks to "Figma MCP", "figma-developer-mcp", "列出 Figma 工具", "调用 Figma 工具", or debug MCP interactions with Figma files/nodes.
---

# Figma MCP

## 快速开始

注意：
1. 不能 cd 到技能目录，必须在工作/仓库目录下执行。
2. 输出文档与 `assets/` 必须写入工作/仓库目录，禁止写入技能目录（例如 `~/.xxx/skills/...`）。
3. 确认密钥文件：`~/.config/figma-mcp/.env`（内容示例：`key=xxx`）。
4. 列出工具：`python3 scripts/figma_mcp.py list-tools`
5. 调用工具：
   `python3 scripts/figma_mcp.py call --name <tool> --args '{"key":"value"}'`

## 配置与规则

- 默认从 `~/.config/figma-mcp/.env` 读取 `key=...`，也可通过 `FIGMA_API_KEY` 或 `--api-key` 覆盖。
- 脚本使用 stdio 协议启动：`npx -y figma-developer-mcp --figma-api-key=... --stdio`。
- 脚本会自动执行 `initialize` 与 `notifications/initialized`；如需跳过，使用 `--no-init`。

## 常用命令

- 列工具：`python3 scripts/figma_mcp.py list-tools --pretty`
- 调用工具：
  `python3 scripts/figma_mcp.py call --name <tool> --args-file /path/to/args.json`
- 调用自定义方法：
  `python3 scripts/figma_mcp.py rpc --method <method> --params '{"foo":"bar"}'`

## 脚本说明

- `scripts/figma_mcp.py`：标准 MCP stdio 客户端，负责握手、请求、输出结果。
- 遇到非 JSON 输出或启动日志会打印到 stderr，不影响主输出。

## 参考

- `references/examples.md`：常见调用示例与排查思路。
