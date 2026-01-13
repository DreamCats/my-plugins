---
description: 执行落地（触发 git-worktrees + subagent-dev + 编译验证驱动）
argument-hint: [change-id]
allowed-tools: Bash(git*), Bash(mkdir*), Bash(cd*), Bash(pwd*), Bash(npm*), Bash(pnpm*), Bash(bun*), Bash(go*), Bash(lark-cli*), Bash(python3*), Read, Write, Edit, Glob, Grep, Task, TaskOutput
---

# /repo-apply 命令

本命令引导你完成执行阶段，通过触发技能链来实施变更。

## 参数

- `$1` 或 `$ARGUMENTS` - 变更 ID（如 `change-email-verification-20250112`）

## 步骤 1: 运行脚本验证与创建 Worktree（推荐）

脚本会完成 PlanSpec 校验、必要文件检查与 worktree 创建：

```bash
CHANGE_ID="${1:-$ARGUMENTS}"
plugin/scripts/bytecoding/repo-apply.sh --change-id "$CHANGE_ID"
```

记录输出的 `worktree` 与 `branch`，后续步骤使用该工作区。

**手动备用**（仅当脚本不可用时）：

```bash
# 从参数获取 change-id
CHANGE_ID="${1:-$ARGUMENTS}"

# 获取当前项目根目录
PROJECT_ROOT=$(pwd)

# 验证目录存在
if [ ! -d "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID" ]; then
  echo "错误：变更不存在 - $CHANGE_ID"
  echo "请先使用 /repo-plan 创建变更提案"
  exit 1
fi

# 验证必要文件存在
REQUIRED_FILES=("proposal.md" "design.md" "tasks.md" "planspec.yaml")
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/$file" ]; then
    echo "错误：缺少必要文件 - $file"
    echo "请先完成规划阶段（/repo-plan）"
    exit 1
  fi
done

echo "✅ PlanSpec 验证通过"
echo "变更 ID: $CHANGE_ID"
echo "项目目录: $PROJECT_ROOT"
```

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

## 步骤 3: 使用 using-git-worktrees 技能（手动备用）

若未通过脚本创建 worktree，可按以下步骤手动创建。

**检查当前 Git 状态**：
```bash
# 检查当前分支
git rev-parse --abbrev-ref HEAD

# 检查是否有未提交的更改
git status --short
```

**如果当前在主分支（main/master）**，询问用户：
> 检测到你在主分支上执行变更。建议创建 Git Worktree 以保持主工作区整洁。

**使用 **bytecoding:using-git-worktrees** 技能创建 Worktree**：
> 请使用 **bytecoding:using-git-worktrees** 技能为变更 `$CHANGE_ID` 创建隔离的工作区。

**using-git-worktrees 技能将引导你**：
1. 检查当前 Git 状态
2. 创建 Worktree 目录
3. 创建功能分支
4. 进入 Worktree 目录

**完成标志**：
- [x] Worktree 已创建
- [x] 在正确分支上
- [x] 已进入 Worktree 目录
> 注：依赖安装与编译验证放到后续任务阶段按需执行。

## 步骤 4: 使用 subagent-driven-development 技能

在 Worktree 中，使用 **bytecoding:subagent-driven-development** 技能执行任务列表。

**切换到 Worktree 并设置工作根目录**：
```bash
# 进入 worktree 目录（示例）
cd ../feature-$CHANGE_ID
WORKTREE_ROOT=$(pwd)
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
| 审查项 | 状态 | 说明 |
|--------|------|------|
| 实现了所有功能 | ✅ | 所有要求都已实现 |
| 使用指定文件路径 | ✅ | 文件路径正确 |
| 遵循设计文档 | ✅ | 与设计一致 |
| 参考推荐实现 | ✅ | 参考了本地实现 |

**结果**：✅ 通过

### 阶段 2: 代码质量审查
| 审查项 | 状态 | 说明 |
|--------|------|------|
| 代码规范 | ✅ | ESLint 通过 |
| 类型检查 | ✅ | 无 TypeScript 错误 |
| 安全性 | ✅ | 安全 |
| 性能 | ✅ | 合理 |
| 错误处理 | ✅ | 完整 |
| 命名清晰 | ✅ | 语义化 |

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

## 步骤 6: 提交变更

验证通过后，提交变更：

```bash
# 进入 worktree 目录
cd ../feature-$CHANGE_ID

# 添加所有更改
git add .

# 提交变更
git commit -m "feat: $CHANGE_ID

Co-Authored-By: Claude <noreply@anthropic.com>"

# 推送到远程
git push -u origin feature/$CHANGE_ID
```

**推送链接处理**：
- 如果 `git push` 输出中包含 merge request 创建链接（例如 `https://.../merge_requests/new?...`），需在最终摘要中展示该链接
- 如果未输出链接，明确标注“未提供 MR 链接”

## 步骤 7: 发送飞书摘要（使用 lark-send-msg）

在命令结束后，使用 **lark-send-msg** 技能**生成消息内容并执行发送**（通过 Skill 工具调用 + `lark-cli send-message`）。

**接收人**：使用 SessionStart Hook 展示的 Git 用户邮箱（`user.email`）。  
**如果未配置邮箱**：提示用户补充邮箱后再发送。

**如摘要包含 Markdown 文档**（例如引用 `proposal.md`/`design.md`/`tasks.md`），先用 **lark-md-to-doc** 转换并拿到文档链接，再发送摘要。

**转换方式**：
1. 通过 `Skill(lark-md-to-doc)` 确认调用方式。
2. 使用脚本渲染（示例）：
```bash
python3 "$PROJECT_ROOT/plugin/skills/lark-md-to-doc/scripts/render_lark_doc.py" \
  --md "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/tasks.md" \
  --title "[repo-apply] $CHANGE_ID tasks"
```

**摘要内容建议**：
- 变更 ID / 任务目标
- 关键变更文件
- 编译验证结果（命令 + 通过/失败）
- 提交信息（commit）
- 推送链接（MR 链接，如有）
- 文档链接（如有）

**执行方式**：
1. 通过 `Skill(lark-send-msg)` 选择 `msg_type` 并生成单行 `content` JSON。
2. 执行发送（示例）：
```bash
lark-cli send-message --receive-id-type email --msg-type text "$GIT_EMAIL" '{"text":"变更 ID: ...\n关键文件: ...\n编译: go build ./handler/... 通过\n提交: <commit>\nMR: <link>"}'
```
如需富文本排版，请使用 `msg_type=post` 并按 `lark-send-msg` 的结构生成 JSON。

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

使用 `/repo-archive $CHANGE_ID` 命令来归档已完成的变更。
