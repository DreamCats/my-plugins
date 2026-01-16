---
description: 生成方案与 PlanSpec（触发 brainstorming + writing-plans 技能）
argument-hint: [变更描述]
allowed-tools: Bash(bash*), Bash(node*), Bash(mkdir*), Bash(git*), Bash(pwd*), Bash(lark-cli*), Read, Write, Edit, Glob, Grep
---

# /repo-plan 命令

本命令引导你完成规划阶段，通过触发 **brainstorming** 和 **writing-plans** 技能来生成完整的变更提案和任务列表。

## 工作流程检查清单（强制执行）

**复制或者使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Repo-Plan Progress:
- [ ] 步骤 1: 运行脚本初始化 - 创建 change 目录与 PlanSpec
- [ ] 步骤 2: brainstorming - 需求精化与方案设计
- [ ] 步骤 3: writing-plans - 生成任务列表
- [ ] 步骤 4: 确认 PlanSpec - 核对 change-id 与产出文件
- [ ] 步骤 5: repo-plan-lark.js - 转换 proposal/design/tasks 并获取链接
- [ ] 步骤 6: repo-plan-send.js - 发送飞书摘要
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

## 步骤 2: 使用 brainstorming 技能

现在使用 **bytecoding:brainstorming** 技能开始需求精化和方案设计。

**注意**：必须通过 **Skill 工具**调用（`/bytecoding:brainstorming` 或 `Skill(bytecoding:brainstorming)`），不要用子代理/agent 调用语法。

**如果用户提供了变更描述**，使用：

> 请使用 **bytecoding:brainstorming** 技能来讨论以下变更需求：
>
> ```
> $ARGUMENTS
> ```

**如果用户没有提供描述**，询问：

> 请描述你想要实现的变更需求，我将使用 **bytecoding:brainstorming** 技能帮助你进行需求精化和方案设计。

**brainstorming 技能将引导你**：

1. **理解需求** - 苏格拉底式提问澄清需求
2. **多源搜索** - 本地搜索（Glob/Grep）+ Repotalk MCP 搜索
3. **综合分析** - 结合搜索结果识别最佳实践
4. **方案设计** - 提出 2-3 种方案供选择
5. **分节呈现** - 逐步确认，避免信息过载

**产出文件**（保存到 `$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/`）：

- `proposal.md` - 变更提案
- `design.md` - 设计文档

## 步骤 3: 使用 writing-plans 技能

在完成 `design.md` 后，使用 **bytecoding:writing-plans** 技能将设计文档转化为可执行任务列表。

**注意**：必须通过 **Skill 工具**调用（`/bytecoding:writing-plans` 或 `Skill(bytecoding:writing-plans)`），不要用子代理/agent 调用语法。

> 请使用 **bytecoding:writing-plans** 技能来分析设计文档并生成任务列表。

**writing-plans 技能将引导你**：

1. **分析设计文档** - 理解架构和组件
2. **本地参考搜索** - 为每个任务找到本地参考
3. **细粒度任务拆分** - 2-5 分钟/任务
4. **生成任务列表** - 包含依赖关系和验证标准

**产出文件**（保存到 `~/.bytecoding/changes/$CHANGE_ID/`）：

- `tasks.md` - 可执行任务列表

## 步骤 4: 确认 PlanSpec

脚本已创建 PlanSpec，进入下一步即可。

## 步骤 5: 转换 Markdown 文档（使用 repo-plan-lark.js）

当摘要包含 Markdown 文档时（本命令固定包含 `proposal.md`/`design.md`/`tasks.md`），使用 **repo-plan-lark.js** 批量渲染并记录文档链接。脚本会调用插件内渲染器，避免技能重名冲突。

**标题规范**：`[repo-plan] $CHANGE_ID <文档名>`（如 `proposal`/`design`/`tasks`）。

**执行方式**：

使用批量脚本渲染并回写 PlanSpec（示例）：

```bash
node "$SCRIPT_DIR/repo-plan-lark.js" \
  --change-id "$CHANGE_ID" \
  --title-prefix "[repo-plan] $CHANGE_ID"
```

该脚本会批量渲染 `proposal.md`/`design.md`/`tasks.md` 并回写 `planspec.yaml` 的 `lark_docs` 字段（包含 `doc_id` 与 `url`）。

**可选：自动开通协作权限（示例）**：

```bash
node "$SCRIPT_DIR/repo-plan-lark.js" \
  --change-id "$CHANGE_ID" \
  --title-prefix "[repo-plan] $CHANGE_ID" \
  --share-email "user@example.com" \
  --share-perm edit \
  --share-notify
```

## 步骤 6: 发送飞书摘要（使用 repo-plan-send.js）

在命令结束后，使用 **repo-plan-send.js** 发送飞书摘要。

**接收人**：默认使用 `planspec.yaml` 的 `lark_email`（初始化时取 Git 用户邮箱）。  
**如果未配置邮箱**：提示用户补充邮箱或使用 `--receive-id` 覆盖。

**摘要内容建议**：

- 变更 ID
- 规划产出（proposal/design/tasks）
- 文档链接（由 `repo-plan-lark.js` 生成）
- 下一步建议（`/repo-apply $CHANGE_ID`）

**执行方式**（示例）：

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
