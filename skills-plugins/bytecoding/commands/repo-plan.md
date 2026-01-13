---
description: 生成方案与 PlanSpec（触发 brainstorming + writing-plans 技能）
argument-hint: [变更描述]
allowed-tools: Bash(bash*), Bash(mkdir*), Bash(git*), Bash(pwd*), Bash(lark-cli*), Bash(python3*), Read, Write, Edit, Glob, Grep
---

# /repo-plan 命令

本命令引导你完成规划阶段，通过触发 **brainstorming** 和 **writing-plans** 技能来生成完整的变更提案和任务列表。

## 步骤 1: 运行脚本初始化（必须）

使用脚本完成变更目录与 PlanSpec 初始化：

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/plugins/bytecoding}"
if [ ! -x "$PLUGIN_ROOT/scripts/bytecoding/repo-plan.sh" ]; then
  echo "错误：找不到插件脚本，请确认插件路径"
  exit 1
fi
bash "$PLUGIN_ROOT/scripts/bytecoding/repo-plan.sh" --desc "$ARGUMENTS"
```

**必须先执行完此脚本再进入下一步**。记录输出的 `change-id`、`change-dir`、`planspec`，后续步骤使用该 `change-id`。若脚本失败，先排查报错原因，不要直接进入 brainstorming。

**手动备用**（仅当脚本不可用时）：

```bash
# 获取当前项目根目录
PROJECT_ROOT=$(pwd)

# 生成变更 ID（基于当前时间戳）
CHANGE_ID="change-$(date +%Y%m%d-%H%M)"

# 创建项目级变更目录
mkdir -p "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID"

echo "变更 ID: $CHANGE_ID"
echo "项目目录: $PROJECT_ROOT"
echo "工作目录: $PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID"
```

## 步骤 2: 使用 brainstorming 技能

现在使用 **bytecoding:brainstorming** 技能开始需求精化和方案设计。

**注意**：必须通过 **Skill 工具**调用（`/bytecoding:brainstorming` 或 `Skill(bytecoding:brainstorming)`），不要用子代理/agent 调用语法。

**如果用户提供了变更描述**，使用：
> 请使用 **bytecoding:brainstorming** 技能来讨论以下变更需求：
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

脚本已创建 PlanSpec。若为手动模式，请创建 PlanSpec 文件：

```bash
cat > "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/planspec.yaml" << 'EOF'
# PlanSpec for $CHANGE_ID

change_id: $CHANGE_ID
description: $ARGUMENTS
created_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
status: pending

# 产出文件
proposal: proposal.md
design: design.md
tasks: tasks.md

spec_deltas: []
EOF
```

## 步骤 5: 转换 Markdown 文档（使用 lark-md-to-doc）

当摘要包含 Markdown 文档时（本命令固定包含 `proposal.md`/`design.md`/`tasks.md`），先用 **lark-md-to-doc** 将文档转为飞书文档，并记录返回的文档链接。

**标题规范**：`[repo-plan] $CHANGE_ID <文档名>`（如 `proposal`/`design`/`tasks`）。

**执行方式**：
1. 通过 `Skill(lark-md-to-doc)` 确认调用方式。
2. 使用脚本渲染（示例）：
```bash
python3 "$PLUGIN_ROOT/skills/lark-md-to-doc/scripts/render_lark_doc.py" \
  --md "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/proposal.md" \
  --title "[repo-plan] $CHANGE_ID proposal"
```
分别渲染 `design.md` 和 `tasks.md`，记录输出中的 `doc_id`/链接，用于飞书摘要。

## 步骤 6: 发送飞书摘要（使用 lark-send-msg）

在命令结束后，使用 **lark-send-msg** 技能**生成消息内容并执行发送**（通过 Skill 工具调用 + `lark-cli send-message`）。

**接收人**：使用 SessionStart Hook 展示的 Git 用户邮箱（`user.email`）。  
**如果未配置邮箱**：提示用户补充邮箱后再发送。

**摘要内容建议**：
- 变更 ID
- 规划产出（proposal/design/tasks）
- 文档链接（由 `lark-md-to-doc` 生成）
- 下一步建议（`/repo-apply $CHANGE_ID`）

**执行方式**：
1. 通过 `Skill(lark-send-msg)` 选择 `msg_type` 并生成单行 `content` JSON。
2. 执行发送（示例）：
```bash
lark-cli send-message --receive-id-type email --msg-type text "$GIT_EMAIL" '{"text":"变更 ID: ...\n产出: proposal/design/tasks\n下一步: /repo-apply ..."}'
```
如需富文本排版，请使用 `msg_type=post` 并按 `lark-send-msg` 的结构生成 JSON。

## 完成标志

当以下条件满足时，本命令完成：

- [x] 项目级变更目录已创建 `.bytecoding/changes/$CHANGE_ID/`
- [x] brainstorming 技能已完成，产出 `proposal.md` 和 `design.md`
- [x] writing-plans 技能已完成，产出 `tasks.md`
- [x] PlanSpec 文件已创建
- [x] 已创建飞书文档（proposal/design/tasks）
- [x] 已执行 `lark-cli send-message` 发送飞书摘要（如 git 邮箱可用）

## 下一步

使用 `/repo-apply $CHANGE_ID` 命令来执行这个变更。

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
