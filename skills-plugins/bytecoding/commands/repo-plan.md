---
description: 生成方案与 PlanSpec（触发 brainstorming + writing-plans 技能）
argument-hint: [变更描述]
allowed-tools: Bash(bash*), Bash(node*), Bash(mkdir*), Bash(git*), Bash(pwd*), Bash(lark-cli*), Read, Write, Edit, Glob, Grep
---

# /repo-plan 命令

本命令引导你完成规划阶段，通过触发 **brainstorming** 和 **writing-plans** 技能来生成完整的变更提案和任务列表。

## 工作流程检查清单（强制执行）

**使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Repo-Plan Progress:
- [ ] 步骤 1: 运行脚本初始化 - 创建 change 目录与 PlanSpec
- [ ] 步骤 2: brainstorming - 需求精化与方案设计
- [ ] 步骤 3: writing-plans - 生成任务列表
- [ ] 步骤 4: 生成飞书文档并发送摘要 - 转换 Markdown 并发送消息
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

## 步骤 1: 运行脚本初始化（必须）

使用脚本完成变更目录与 PlanSpec 初始化：

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
# Some environments set CLAUDE_PLUGIN_ROOT to scripts/bytecoding already.
if [ -f "$PLUGIN_ROOT/repo-plan.js" ]; then
  SCRIPT_DIR="$PLUGIN_ROOT"
fi
node "$SCRIPT_DIR/repo-plan.js" --desc "$ARGUMENTS"
```

**必须先执行完此脚本再进入下一步**。脚本会创建 `planspec.yaml` 以及 `proposal.md`/`design.md`/`tasks.md` 模板（含变更标题与固定章节）。记录输出的 `change-id`、`change-dir`、`planspec`，后续步骤使用该 `change-id`。若脚本失败，先排查报错原因，不要直接进入 brainstorming。

## 步骤 2: 使用 brainstorming agent

现在使用 **brainstorming agent** 开始需求精化和方案设计。

**如果用户提供了变更描述**，使用 Task 工具调用 brainstorming agent：

```
使用 Task 工具启动 brainstorming agent：

{
  "subagent_type": "brainstorming",
  "description": "完成需求澄清和方案设计",
  "prompt": "你正在执行 brainstorming 工作流，遵循 agents/brainstorming.md 中定义的强制流程。\n\n用户需求：$ARGUMENTS\n\n工作目录：.bytecoding/changes/$CHANGE_ID/\n\n请严格按照 brainstorming agent 的 5 步流程执行，最终产出 proposal.md 和 design.md。"
}
```

**agent 将遵循 `agents/brainstorming.md` 的 5 步强制流程**：

1. 理解需求（需求不清晰时用 "use ask question" 单轮提问并等待确认；需求明确时可直接确认理解）
2. Repotalk MCP 搜索（复杂/模糊需求优先执行；简单明确可跳过该步骤并说明原因）
3. 本地定向搜索（基于候选路径/术语验证与补充）
4. 综合分析与方案设计（结合搜索结果，提出 1-2 种方案并给出推荐方案）
5. 生成文档（必须生成 proposal.md 和 design.md）

**agent 工作目录**: `.bytecoding/changes/$CHANGE_ID/`

**产出文件**：

- `proposal.md` - 变更提案
- `design.md` - 设计文档

**重要**: brainstorming agent 完成后会自动触发 writing-plans agent 生成 tasks.md。

## 步骤 3: 使用 writing-plans agent

**注意**: brainstorming agent 会自动触发此步骤。但如果需要单独执行，使用以下方式：

在完成 `design.md` 后，使用 **writing-plans agent** 将设计文档转化为可执行任务列表。

```
使用 Task 工具启动 writing-plans agent：

{
  "subagent_type": "writing-plans",
  "description": "将设计文档转化为任务列表",
  "prompt": "你正在执行 writing-plans 工作流，遵循 agents/writing-plans.md 中定义的强制流程。\n\n工作目录：.bytecoding/changes/$CHANGE_ID/\n\n请严格按照 writing-plans agent 的 4 步流程执行，读取 design.md 并生成 tasks.md。\n\n重要约束：\n- 任务粒度必须控制在 2-5 分钟\n- 必须标注依赖关系\n- 必须明确验证标准\n- 禁止 \"编译整个项目\" 或 \"go build ./...\"\n- 验证范围必须最小化"
}
```

**agent 将遵循 `agents/writing-plans.md` 的 4 步强制流程**：

1. 分析设计文档（完全理解）
2. 细粒度任务拆分（2-5 分钟/任务）
3. 为每个任务找本地参考（使用搜索工具）
4. 生成任务列表（创建 tasks.md）

**agent 工作目录**: `.bytecoding/changes/$CHANGE_ID/`

**产出文件**：

- `tasks.md` - 可执行任务列表（含依赖关系和验证标准）

**重要约束**：

- 任务粒度必须控制在 2-5 分钟
- 必须标注依赖关系
- 必须明确验证标准
- 禁止 "编译整个项目" 或 "go build ./..."
- 验证范围必须最小化

## 步骤 4: 生成飞书文档并发送摘要

本步骤将完成两个任务：将 Markdown 文档转换为飞书文档，并发送飞书摘要消息。

### 4.1 转换 Markdown 文档（使用 repo-plan-lark.js）

使用 **repo-plan-lark.js** 批量渲染并记录文档链接。脚本会调用插件内渲染器，避免技能重名冲突，并自动开通协作权限。

**标题规范**：`[repo-plan] $CHANGE_ID <文档名>`（如 `proposal`/`design`/`tasks`）。

**执行方式**：

```bash
node "$SCRIPT_DIR/repo-plan-lark.js" \
  --change-id "$CHANGE_ID" \
  --title-prefix "[repo-plan] $CHANGE_ID" \
  --share-email "$(grep 'lark_email' ${CHANGE_DIR}/planspec.yaml | awk '{print $2}')" \
  --share-perm edit \
  --share-notify
```

该脚本会批量渲染 `proposal.md`/`design.md`/`tasks.md` 并回写 `planspec.yaml` 的 `lark_docs` 字段（包含 `doc_id` 与 `url`），同时自动给用户开通文档编辑权限并发送飞书通知。

### 4.2 发送飞书摘要（使用 repo-plan-send.js）

在生成飞书文档后，使用 **repo-plan-send.js** 发送飞书摘要。

**接收人**：默认使用 `planspec.yaml` 的 `lark_email`（初始化时取 Git 用户邮箱）。
**如果未配置邮箱**：提示用户补充邮箱或使用 `--receive-id` 覆盖。

**摘要内容建议**：

- 变更 ID
- 规划产出（proposal/design/tasks）
- 文档链接（由 `repo-plan-lark.js` 生成）
- 下一步建议（`/repo-apply $CHANGE_ID`）

**执行方式**：

```bash
node "$SCRIPT_DIR/repo-plan-send.js" \
  --change-id "$CHANGE_ID"
```

如需自定义接收人或格式，可追加 `--receive-id`/`--receive-id-type`/`--msg-type` 等参数。

## 完成标志

当以下条件满足时，本命令完成：

- [x] 项目级变更目录已创建 `.bytecoding/changes/$CHANGE_ID/`
- [x] brainstorming 技能已完成，产出 `proposal.md` 和 `design.md`
- [x] writing-plans 技能已完成，产出 `tasks.md`
- [x] PlanSpec 文件已创建
- [x] 已创建飞书文档（proposal/design/tasks）
- [x] 已执行 `lark-cli send-message` 发送飞书摘要（如 git 邮箱可用）

## 下一步

先使用 `/compact` 命令压缩变更目录，然后再使用 `/bytecoding:repo-apply $CHANGE_ID` 命令来执行这个变更。

## 目录结构

```
项目根目录/
├── .bytecoding/
│   └── changes/
│       ├── change-xxx/
│       │   ├── planspec.yaml
│       │   ├── proposal.md
│       │   ├── design.md
│       │   └── tasks.md
│       └── archive/          # 已归档的变更
│           └── change-yyy/
└── ...
```
