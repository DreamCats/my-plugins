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
| `/bytecoding:design` | 不确定怎么做 | 探索式问答，产出 design.md |
| `/bytecoding:plan` | 需求明确，需分析 | 搜索分析 → 生成 tasks.md |
| `/bytecoding:apply` | 承接 plan | 执行 tasks.md 中的任务 |
| `/bytecoding:do` | 需求明确，直接干 | 跳过规划，直接执行 |

**MCP 集成**（配置在 `.mcp.json`）：
- `repotalk-stdio` - 跨仓库代码搜索
- `bcindex` - 语义搜索，自然语言定位代码
- `byte-lsp-mcp` - 符号定位，查找定义/引用（基于 gopls）

**变更管理结构**：
```
.bytecoding/
├── changes/           # 变更目录
│   └── change-xxx/
│       ├── planspec.yaml
│       └── tasks.md
├── plans/             # 设计文档
│   └── YYYY-MM-DD-xxx-design.md
└── imports/           # 飞书文档导入
    ├── YYYY-MM-DD-xxx.md
    └── assets/
```

## Common Development Commands

```bash
# 运行 Node.js 脚本
node skills-plugins/bytecoding/scripts/bytecoding/plan.js --desc "变更描述"

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

## byte-lsp MCP 使用

当需要查看 RPC 入参/出参定义或外部依赖时，**必须优先使用 byte-lsp MCP**：

```yaml
# 按符号名查询（推荐）
go_to_definition:
  file_path: "handler/user.go"
  symbol: "GetUserInfoRequest"
  use_disk: true

# 快速查看类型信息
get_hover:
  file_path: "handler/user.go"
  symbol: "GetUserInfoRequest"
  use_disk: true
```

**工具列表**：
- `go_to_definition` - 跳转定义（支持 $GOPATH/pkg/mod 外部依赖）
- `get_hover` - 类型签名和注释
- `find_references` - 查找所有引用
- `search_symbols` - 符号搜索（`include_external: true` 搜外部）

**避免**：在 `$GOPATH/pkg/mod` 下 Grep 搜索（路径含版本号，效率极低）

## Coding Guidelines

- Preserve existing behavior and configuration
- Prefer explicit if/else over nested ternaries
- Avoid one-liners that reduce readability
- Keep functions small and focused
- Do not refactor architecture-level code
