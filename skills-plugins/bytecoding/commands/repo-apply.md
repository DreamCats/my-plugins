---
description: 执行落地（触发 git-worktrees + dispatching-parallel-agents + subagent-dev + 编译验证驱动）
argument-hint: [change-id]
allowed-tools: Bash(bash*), Bash(node*), Bash(git*), Bash(mkdir*), Bash(cd*), Bash(pwd*), Bash(npm*), Bash(pnpm*), Bash(bun*), Bash(go*), Bash(lark-cli*), Read, Write, Edit, Glob, Grep, Task, TaskOutput
---

# /repo-apply 命令

本命令引导你完成执行阶段，通过触发技能链来实施变更。

## 工作流程检查清单（强制执行）

**复制或者使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Repo-Apply Progress:
- [ ] 步骤 1: 运行脚本验证与创建 Worktree
- [ ] 步骤 2: 读取任务列表
- [ ] 步骤 3: dispatching-parallel-agents - 可并行任务派发
- [ ] 步骤 4: subagent-driven-development - 执行任务
- [ ] 步骤 5: test-driven-development - 编译验证
- [ ] 步骤 6: 标记 PlanSpec 状态为 completed
- [ ] 步骤 7: 提交变更
- [ ] 步骤 8: repo-apply-lark.js - 发送飞书摘要
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

## 参数

- `$1` 或 `$ARGUMENTS` - 变更 ID（如 `change-email-verification-20250112`）

## 步骤 1: 运行脚本验证与创建 Worktree（推荐）

脚本会完成 PlanSpec 校验、必要文件检查与 worktree 创建，并写入 worktree 元信息：

- `"$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/worktree.path"`
- `"$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/worktree.branch"`

```bash
CHANGE_ID="${1:-$ARGUMENTS}"
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
# Some environments set CLAUDE_PLUGIN_ROOT to scripts/bytecoding already.
if [ -f "$PLUGIN_ROOT/repo-apply.js" ]; then
  SCRIPT_DIR="$PLUGIN_ROOT"
fi
node "$SCRIPT_DIR/repo-apply.js" --change-id "$CHANGE_ID"
```

记录输出的 `worktree` 与 `branch`，后续步骤使用该工作区。

## 步骤 2: 读取任务列表

读取任务列表，了解需要执行的工作：

```bash
# 读取 tasks.md
cat "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/tasks.md"
```

**关键信息**：

- 总任务数
- 任务分组
- 依赖关系
- 预计时间

## 步骤 2.5: 任务进度自动化（repo-apply.js 自动同步）

执行步骤 1 时，脚本会自动解析 `tasks.md` 并生成进度状态文件：

- `"$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/tasks.state.json"`

该文件记录每个任务的 `pending/in_progress/completed` 状态、开始/完成时间与统计信息。

**常用操作**（可在任意时间执行）：

```bash
# 标记任务开始
node "$SCRIPT_DIR/repo-apply.js" --change-id "$CHANGE_ID" --task-start 1.1

# 标记任务完成
node "$SCRIPT_DIR/repo-apply.js" --change-id "$CHANGE_ID" --task-done 1.1

# 重置任务状态
node "$SCRIPT_DIR/repo-apply.js" --change-id "$CHANGE_ID" --task-reset 1.1

# 查看任务统计
node "$SCRIPT_DIR/repo-apply.js" --change-id "$CHANGE_ID" --task-status
```

## 步骤 3: 使用 dispatching-parallel-agents 技能（可选）

当任务**彼此独立**且可并行时，先使用 **bytecoding:dispatching-parallel-agents** 并行派发子代理。

**并行判断标准**：

- 任务之间无顺序依赖
- 不修改同一文件/同一函数
- 不共享全局状态

**执行流程**：

1. 按文件/子系统分组任务
2. 为每组编写 Task Prompt（包含 worktree 路径）
3. 并行派发 Task

**获取 Worktree 路径**：

```bash
WORKTREE_ROOT="$(cat "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/worktree.path")"
echo "Worktree: $WORKTREE_ROOT"
```

**示例**：

```javascript
Task({
  subagent_type: "general-purpose",
  description: "任务 A",
  prompt: "工作目录: $WORKTREE_ROOT ...",
});

Task({
  subagent_type: "general-purpose",
  description: "任务 B",
  prompt: "工作目录: $WORKTREE_ROOT ...",
});
```

如不满足独立性要求，**跳过本步骤**，进入步骤 4。

## 步骤 4: 使用 subagent-driven-development 技能

在 Worktree 中，使用 **bytecoding:subagent-driven-development** 技能执行任务列表。
若步骤 3 已并行派发，本步骤以**等待 + 两阶段审查**为主，不重复派发。

**切换到 Worktree 并设置工作根目录**：

```bash
# 从 worktree 元信息读取路径
WORKTREE_ROOT="$(cat "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/worktree.path")"
cd "$WORKTREE_ROOT"
echo "Worktree: $WORKTREE_ROOT"
```

**路径约束**：

- tasks.md 中的文件路径必须是**仓库相对路径**
- 在 Worktree 中执行 Read/Write/Edit/Glob/Grep，确保修改落在 worktree
- 如发现绝对路径，先改为相对路径再执行任务

> 请使用 **bytecoding:subagent-driven-development** 技能来执行任务列表。

**读取任务列表**：

```bash
# 确保 tasks.md 已读取
Read: "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/tasks.md"
```

**subagent-driven-development 技能将引导你**：

1. **任务准备** - 读取任务定义，明确验收标准
2. **派发子代理** - 使用 Task 工具派发子代理执行任务
3. **等待完成** - 监控子代理执行状态
4. **两阶段审查**：
   - 阶段 1: 规范符合性审查
   - 阶段 2: 代码质量审查
5. **审查结果处理** - 通过或要求修复

**审查记录格式**：

```markdown
## 审查记录：[任务名称]

**任务 ID**：1.1
**子代理 ID**：xxx
**审查时间**：YYYY-MM-DD HH:MM
**审查人**：主代理

### 阶段 1: 规范符合性审查

| 审查项           | 状态 | 说明             |
| ---------------- | ---- | ---------------- |
| 实现了所有功能   | ✅   | 所有要求都已实现 |
| 使用指定文件路径 | ✅   | 文件路径正确     |
| 遵循设计文档     | ✅   | 与设计一致       |
| 参考推荐实现     | ✅   | 参考了本地实现   |

**结果**：✅ 通过

### 阶段 2: 代码质量审查

| 审查项   | 状态 | 说明               |
| -------- | ---- | ------------------ |
| 代码规范 | ✅   | ESLint 通过        |
| 类型检查 | ✅   | 无 TypeScript 错误 |
| 安全性   | ✅   | 安全               |
| 性能     | ✅   | 合理               |
| 错误处理 | ✅   | 完整               |
| 命名清晰 | ✅   | 语义化             |

**结果**：✅ 通过

### 最终结论

**审查结果**：✅ **通过**
```

## 步骤 5: 使用 test-driven-development 技能（简化版）

对于需要编写代码的任务，使用 **bytecoding:test-driven-development** 技能执行**编译验证驱动**流程。

> 当前阶段不要求编写单测，默认以“编译/构建通过”作为最低质量门。

**test-driven-development（简化版）技能要求**：

1. **实现最小改动**
2. **编译/构建通过**
3. **记录编译结果**

**铁律**：

- ❌ 禁止跳过编译验证
- ❌ 禁止未编译就标记完成
- ❌ 禁止执行 `go build ./...`（除非用户明确要求）

## 步骤 6: 标记 PlanSpec 状态为 completed

完成任务并通过验证后，更新 PlanSpec 状态：

```bash
CHANGE_ID="${1:-$ARGUMENTS}"
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
# Some environments set CLAUDE_PLUGIN_ROOT to scripts/bytecoding already.
if [ -f "$PLUGIN_ROOT/repo-apply.js" ]; then
  SCRIPT_DIR="$PLUGIN_ROOT"
fi
node "$SCRIPT_DIR/repo-apply.js" --change-id "$CHANGE_ID" --mark-completed
```

## 步骤 7: 提交变更

验证通过后，提交变更：

```bash
CHANGE_ID="${1:-$ARGUMENTS}"
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
# Some environments set CLAUDE_PLUGIN_ROOT to scripts/bytecoding already.
if [ -f "$PLUGIN_ROOT/repo-apply-git.js" ]; then
  SCRIPT_DIR="$PLUGIN_ROOT"
fi
node "$SCRIPT_DIR/repo-apply-git.js" \
  --change-id "$CHANGE_ID" \
  --message "feat: $CHANGE_ID" \
  --item "实现核心改动并完成验证" \
  --item "更新相关文档与说明"
```

**提交信息要求**：

- 必须使用列表式正文（`--item` 可重复传入）。
- 脚本会自动注入 `Co-Authored-By: <name> <email>`（基于 git user 配置，可用 `--co-author-*` 覆盖）。

**推送链接处理**：

- 如果 `git push` 输出中包含 merge request 创建链接（例如 `https://.../merge_requests/new?...`），脚本会写入 `planspec.yaml` 的 `mr_url`
- 如果未输出链接，脚本会提示 `mr_url: not found in push output`

## 步骤 8: 发送飞书摘要（使用 repo-apply-lark.js）

在命令结束后，使用 **repo-apply-lark.js** 发送飞书摘要。

**接收人**：默认使用 `planspec.yaml` 的 `lark_email`（初始化时取 Git 用户邮箱）。  
**如果未配置邮箱**：提示用户补充邮箱或使用 `--receive-id` 覆盖。

**摘要内容建议**：

- 变更 ID / 任务目标
- 关键变更文件
- 编译验证结果（命令 + 通过/失败）
- 提交信息（commit）
- 推送链接（MR 链接，如有）

**执行方式**（示例）：

```bash
CHANGE_ID="${1:-$ARGUMENTS}"
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
# Some environments set CLAUDE_PLUGIN_ROOT to scripts/bytecoding already.
if [ -f "$PLUGIN_ROOT/repo-apply-lark.js" ]; then
  SCRIPT_DIR="$PLUGIN_ROOT"
fi
node "$SCRIPT_DIR/repo-apply-lark.js" \
  --change-id "$CHANGE_ID" \
  --verify "go build ./handler/...: pass" \
  --verify "eslint: pass"
```

脚本会读取 `planspec.yaml` 的 `lark_docs` 与 `mr_url` 组装摘要并直接发送。接收人默认使用 `lark_email`（由 repo-plan 初始化），可用 `--receive-id` 覆盖。

如需自定义接收人或格式，可追加 `--receive-id`/`--receive-id-type`/`--msg-type` 等参数。

## 完成标志

当以下条件满足时，本命令完成：

- [x] PlanSpec 验证通过
- [x] Git Worktree 已创建（可选但推荐）
- [x] 所有任务已通过两阶段审查
- [x] 编译验证已通过
- [x] 变更已提交到 Git
- [x] 推送链接已记录（如有）
- [x] 已执行 `lark-cli send-message` 发送飞书摘要（如 git 邮箱可用）

## 下一步

使用 `/bytecoding:repo-archive $CHANGE_ID` 命令来归档已完成的变更。
