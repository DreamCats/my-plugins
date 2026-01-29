# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Claude Code 插件集合，包含技能插件（Skills Plugins）和 MCP 插件。核心插件是 **bytecoding**，一个简化版 spec-driven 开发工作流系统。

## Project Architecture

### 插件类型

1. **Skills Plugins** (`skills-plugins/`)
   - 每个 skill 通过 `.claude-plugin/plugin.json` 配置
   - 结构：`commands/`（斜杠命令）、`skills/`（技能文档 SKILL.md）、`hooks/`、`scripts/`

2. **MCP Plugins** (`mcp-plugins/`)
   - MCP 服务器集成，通过 `.mcp.json` 配置

### Bytecoding 插件架构

**核心命令**：
| 命令 | 场景 | 说明 |
|------|------|------|
| `/bytecoding:init` | 新项目 | 初始化配置（目录、gitignore、CLAUDE.md） |
| `/bytecoding:brainstorming` | 不确定怎么做 | 探索式问答，将想法转化为设计 |
| `/bytecoding:do` | 需求明确 | 直接执行改动 |

**MCP 集成**（配置在 `.mcp.json`）：
- `repotalk-stdio` - 跨仓库代码搜索
- `bcindex` - 语义搜索，自然语言定位代码
- `byte-lsp-mcp` - 符号定位，查找定义/引用（基于 gopls）

**目录结构**：
```
.bytecoding/
├── plans/             # 设计文档
│   └── YYYY-MM-DD-xxx-design.md
└── imports/           # 飞书文档导入
    ├── YYYY-MM-DD-xxx.md
    └── assets/
```

## Common Development Commands

```bash
# 飞书文档导入
node skills-plugins/bytecoding/scripts/bytecoding/lark-import.js --url "<飞书链接>"

# 飞书 CLI（由 lark-cli 提供）
lark-cli send-message <ID> --receive-id-type email --msg-type text '{"text":"内容"}'
lark-cli get-blocks <DOC_ID> --all
```

## Coding Style

- 技能文件夹名：kebab-case（如 `lark-doc-to-md`）
- Python 脚本文件名：snake_case（如 `lark_doc_to_md.py`）
- Commit 信息：emoji 前缀（`✨ feat:`, `🐛 fix:`, `♻️ refactor:`, `🔧 chore:`）

## Coding Guidelines

- Preserve existing behavior and configuration
- Prefer explicit if/else over nested ternaries
- Avoid one-liners that reduce readability
- Keep functions small and focused
- Do not refactor architecture-level code
