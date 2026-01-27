# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Repository Overview

这是一个 Claude Code 插件集合，包含技能插件（Skills Plugins）和 MCP 插件。插件主要用于开发工具、飞书集成、图像处理和生产力提升。

核心插件是 **bytecoding**，一个 spec-driven development 工作流系统，提供 PlanSpec 生成、repotalk MCP 集成和自动化变更执行。


## Project Architecture

### 插件类型

1. **Skills Plugins** (`skills-plugins/`)
   - 每个 skill 是一个独立的功能单元，通过 `.claude-plugin/plugin.json` 配置
   - 典型结构：`skills/<skill-name>/` (技能文档), `commands/` (斜杠命令), `hooks/` (钩子), `scripts/` (可执行脚本)
   - 技能文档位于 `skills/<skill-name>/SKILL.md`，是使用该技能的权威文档

2. **MCP Plugins** (`mcp-plugins/`)
   - 提供 MCP 服务器集成，通过 `.mcp.json` 配置
   - 例如 `docshub` 提供文档中心集成功能

### Bytecoding 插件架构

Bytecoding 是一个复杂的 spec-driven 开发工作流系统：

**Commands（顶层操作）**:
- `/repo-plan` - 生成方案与 PlanSpec（触发 brainstorming + writing-plans 技能）
- `/repo-apply` - 执行落地（触发 git-worktrees + parallel-agents + test-driven skills）
- `/repo-archive` - 归档已完成的变更

**Skills（可独立调用或通过 Commands 自动触发）**:
- `brainstorming` - 需求精化与方案设计
- `writing-plans` - 设计文档转任务列表
- `test-driven-development` - 编译验证驱动实现
- `using-git-worktrees` - 隔离工作环境
- `subagent-driven-development` - 子代理执行与审查
- `dispatching-parallel-agents` - 并行任务派发

**MCP 集成** (配置在 `.mcp.json`):
- `repotalk-stdio` - 代码库搜索和语义理解
- `bcindex` - 字节代码库索引
- `serena` - IDE 助手上下文服务

**脚本工具** (`scripts/bytecoding/`):
- `repo-plan.js` - 初始化变更目录与 PlanSpec
- `repo-apply.js` - 执行变更
- `repo-archive.js` - 归档变更
- `repo-*-lark.js` - 飞书文档集成
- `repo-*-send.js` - 飞书消息发送

### 关键目录结构

```
项目根目录/
├── skills-plugins/          # 技能插件
│   ├── bytecoding/         # 核心工作流插件
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── .mcp.json       # MCP 服务器配置
│   │   ├── commands/       # 斜杠命令定义
│   │   ├── skills/         # 技能实现（SKILL.md）
│   │   ├── hooks/          # 钩子脚本
│   │   └── scripts/        # 可执行工具
│   │       ├── bytecoding/ # 工作流脚本
│   │       └── repotalk-server/  # Repotalk MCP 服务
│   └── [其他插件]/
├── mcp-plugins/            # MCP 服务器插件
│   └── docshub/
└── .claude-plugin/
    └── marketplace.json    # 插件市场配置
```

**变更管理结构**（在项目根目录）:
```
.bytecoding/
└── changes/
    ├── change-xxx/         # 活跃变更
    │   ├── planspec.yaml   # 变更规范
    │   ├── proposal.md     # 变更提案
    │   ├── design.md       # 设计文档
    │   └── tasks.md        # 任务列表
    └── archive/            # 已归档变更
```

### 技能触发规则

**铁律**：如果技能适用，就必须使用（即使只有 1% 的可能性）。

参考 `skills-plugins/bytecoding/skills/using-bytecoding/SKILL.md` 中的完整映射表和触发时机。

## Common Development Commands

### 插件开发

在各个 skill 目录下直接运行脚本：
```bash
# 示例：运行 Python 脚本
python3 skills-plugins/<skill-name>/scripts/<script>.py

# 示例：运行 Node.js 脚本
node skills-plugins/bytecoding/scripts/bytecoding/repo-plan.js --desc "变更描述"
```

### Bytecoding 工作流

```bash
# 初始化变更规划
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
node "$PLUGIN_ROOT/scripts/bytecoding/repo-plan.js" --desc "变更描述"

# 执行变更（使用 /repo-apply 命令或脚本）
node "$PLUGIN_ROOT/scripts/bytecoding/repo-apply.js"

# 归档变更
node "$PLUGIN_ROOT/scripts/bytecoding/repo-archive.js"
```

### 飞书集成工具

常用飞书 CLI 命令（由 lark-cli 提供）：
```bash
# 发送消息
lark-cli send-message <RECEIVE_ID> --receive-id-type open_id --msg-type text '{"text":"消息内容"}'

# 创建文档
lark-cli create-document --title "文档标题"

# 更新文档内容
lark-cli update-document --doc-id <DOC_ID> --content "内容"
```

## Coding Style & Naming Conventions

- Python 脚本使用 4 空格缩进
- 技能文件夹名使用 kebab-case（例如 `lark-doc-to-md`）
- 脚本文件名使用小写字母加下划线（例如 `lark_doc_to_md.py`）
- Commit 信息使用 emoji 前缀：`✨ feat:`, `📝 docs:`, `🔧 chore:`
- 文档保持在 `SKILL.md` 中，清晰描述输入/输出

### 技能文档规范

每个技能的 `SKILL.md` 应包含：
- YAML frontmatter (`name`, `description`)
- 目标
- 输入收集
- 使用场景
- 产出文件
- 示例

## Testing

目前没有统一的测试框架。如果需要测试：
1. 在技能目录下创建 `tests/` 目录
2. 在该技能的 `SKILL.md` 中记录如何运行测试

## Marketplace Installation

通过 `.claude-plugin/marketplace.json` 安装所有插件：

```bash
# 在 Claude Code 中
/marketplace add /path/to/my-plugins/.claude-plugin/marketplace.json
```

或直接将 `marketplace.json` 拖入 Claude Code 界面。


<< ------- lsp intro start ------->>

## LSP 定位与查询准则

请务必使用 LSP (Language Server Protocol) 进行代码定位与查询，优先于传统的文本搜索和正则表达式匹配。

### 核心原则

1. **优先使用 LSP**: 当需要查找定义、引用、类型信息时，优先使用 LSP 相关工具而非 Grep/Glob
2. **语义理解**: LSP 能够理解代码语义，提供更准确的代码定位结果
3. **跨语言支持**: 利用各语言的 LSP 服务实现智能代码查询

### LSP 工具使用场景

| 场景 |   说明 |
|------|------|
| 查找定义 | 跳转到符号定义位置 |
| 查找引用 | 查找符号的所有引用 |
| 查找类型 | 跳转到类型定义 |
| 查找实现 | 查找接口实现 |
| 符号搜索 | 在工作区中搜索符号 |
| 代码补全 | 获取代码补全建议 |
| 悬停信息 | 获取符号的文档信息 |
| 重命名 | 重命名符号并更新所有引用 |

### 与传统工具的对比

- **Grep/Grep**: 基于文本匹配，无法理解代码语义，容易产生误报
- **LSP**: 基于语义理解，精确定位符号，减少误报

### 注意事项

- 确保项目已配置相应的 LSP 服务器
- 对于大型项目，LSP 索引可能需要时间初始化
- 当 LSP 不可用时，可以降级使用传统搜索工具

<< ------- lsp intro end ------->>


<< ------- coding guidelines start ------->>

# Coding Guidelines

- Preserve existing behavior and configuration
- Prefer explicit if/else over nested ternaries
- Avoid one-liners that reduce readability
- Keep functions small and focused
- Do not refactor architecture-level code

<< ------- coding guidelines end ------->>
