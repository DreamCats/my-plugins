---
description: 执行落地（触发 git-worktrees + subagent-dev + TDD + verification 技能）
argument-hint: [change-id]
allowed-tools: Bash(git*), Bash(mkdir*), Bash(cd*), Bash(pwd*), Bash(npm*), Bash(pnpm*), Bash(bun*), Read, Write, Edit, Glob, Grep, Task, TaskOutput
---

# /repo-apply 命令

本命令引导你完成执行阶段，通过触发技能链来实施变更。

## 参数

- `$1` 或 `$ARGUMENTS` - 变更 ID（如 `change-email-verification-20250112`）

## 步骤 1: 验证 PlanSpec

首先，验证指定的变更是否存在 PlanSpec（项目级）：

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

## 步骤 3: 使用 using-git-worktrees 技能

在执行任务前，建议创建 Git Worktree 以保持主工作区整洁。

**检查当前 Git 状态**：
```bash
# 检查当前分支
git branch --show-current

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
4. 安装依赖
5. 验证基线

**完成标志**：
- [x] Worktree 已创建
- [x] 在正确分支上
- [x] 依赖已安装
- [x] 基线验证通过

## 步骤 4: 使用 subagent-driven-development 技能

在 Worktree 中，使用 **bytecoding:subagent-driven-development** 技能执行任务列表。

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

## 步骤 5: 使用 test-driven-development 技能

对于需要编写代码的任务，使用 **bytecoding:test-driven-development** 技能确保 TDD 流程。

> 对于涉及代码实现的任务，请遵循 **bytecoding:test-driven-development** 技能的 RED-GREEN-REFACTOR 循环。

**test-driven-development 技能强制要求**：
1. **RED** - 先写失败测试
2. **GREEN** - 写最少代码使测试通过
3. **REFACTOR** - 重构代码质量

**铁律**：
- ❌ 禁止跳过 RED 阶段
- ❌ 禁止一次写完所有代码再写测试
- ❌ 禁止在 GREEN 阶段写"完美代码"

## 步骤 6: 使用 verification-before-completion 技能

所有任务完成后，使用 **bytecoding:verification-before-completion** 技能进行最终验证。

> 请使用 **bytecoding:verification-before-completion** 技能对已完成的变更进行全面验证。

**verification-before-completion 技能执行六维度验证**：

1. **功能验证** - 所有测试通过，手动测试通过
2. **质量验证** - 0 Lint 错误，0 TS 错误
3. **规范验证** - 100% 任务完成，符合设计
4. **集成验证** - 0 回归失败，0 漏洞
5. **文档验证** - 所有公共 API 有文档
6. **部署验证** - 构建成功，配置正确

**质量门标准**：
```
🟢 绿色（通过）：所有验证通过 → 可以标记完成
🟡 黄色（警告）：非关键验证未通过 → 需要评估风险
🔴 红色（失败）：关键验证未通过 → 不能标记完成
```

## 步骤 7: 提交变更

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

## 完成标志

当以下条件满足时，本命令完成：

- [x] PlanSpec 验证通过
- [x] Git Worktree 已创建（可选但推荐）
- [x] 所有任务已通过两阶段审查
- [x] TDD 流程已遵循
- [x] 六维度验证已通过
- [x] 变更已提交到 Git

## 下一步

使用 `/repo-archive $CHANGE_ID` 命令来归档已完成的变更。
