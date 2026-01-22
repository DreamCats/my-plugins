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

**重要**：完成每个步骤后，继续执行下一步骤，不能停止，不要跳过任何步骤。

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

## 步骤 2: brainstorming - 需求精化与方案设计（必须）

**在步骤 1 完成后立即执行此步骤，不要停止。**

基于用户的变更描述 `$ARGUMENTS` 和生成的 change-id，开始需求精化和方案设计。

**工作目录**：`.bytecoding/changes/$CHANGE_ID/`

**需要完成**：

1. 理解用户需求（必要时使用 AskUserQuestion 澄清）
2. 执行 Repotalk MCP 搜索（复杂需求）或本地搜索（简单需求）
3. 综合分析并提出 1-2 种方案
4. 生成 `proposal.md` 和 `design.md`

**注意**：完成 proposal.md 和 design.md 后，继续进入步骤 3。

## 步骤 3: writing-plans - 生成任务列表（必须）

**在步骤 2 完成后立即执行此步骤，不要停止。**

基于生成的 `design.md`，将其转化为可执行的任务列表。

**工作目录**：`.bytecoding/changes/$CHANGE_ID/`

**需要完成**：

1. 完全理解 `design.md` 内容
2. 将设计拆分为 2-5 分钟可完成的任务
3. 生成 `tasks.md`（包含依赖关系和验证标准）

**重要约束**：
- 任务粒度必须控制在 2-5 分钟
- 必须标注依赖关系
- 必须明确验证标准
- 禁止 "编译整个项目" 或 "go build ./..."
- 验证范围必须最小化

**注意**：完成 tasks.md 后，继续进入步骤 4。

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
- [x] brainstorming skill 已完成，产出 `proposal.md` 和 `design.md`
- [x] writing-plans skill 已完成，产出 `tasks.md`
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
