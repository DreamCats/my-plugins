---
description: 一键完成简单变更
argument-hint: [变更描述]
allowed-tools: Bash(bash*), Bash(node*), Bash(git*), Bash(mkdir*), Bash(cd*), Bash(pwd*), Bash(lark-cli*), Read, Write, Edit, Task, TaskOutput, Glob, Grep
---

# /quick 命令

本命令通过子代理一键完成简单变更。

## 工作流程检查清单（强制执行）

**使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Quick Change Progress:
- [ ] 步骤 1: 运行脚本初始化 - 创建 change 目录与 PlanSpec
- [ ] 步骤 2: 读取子代理 Prompt 模板
- [ ] 步骤 3: 启动 Task 工具派发子代理
- [ ] 步骤 4: 等待子代理完成
- [ ] 步骤 5: 显示完成摘要
```

**重要**：完成每个步骤后，继续执行下一步骤，不能停止，不要跳过任何步骤。

## 参数

- `$ARGUMENTS` - 变更描述（如 "添加用户登录日志记录"）

## 步骤 1: 运行脚本初始化（必须）

使用脚本完成变更目录与 PlanSpec 初始化：

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
# Some environments set CLAUDE_PLUGIN_ROOT to scripts/bytecoding already.
if [ -f "$PLUGIN_ROOT/repo-quick.js" ]; then
  SCRIPT_DIR="$PLUGIN_ROOT"
fi
node "$SCRIPT_DIR/repo-quick.js" --desc "$ARGUMENTS"
```

**必须先执行完此脚本再进入下一步**。脚本会创建 `planspec.yaml`（简化版，包含 `lark_email`）。记录输出的 `change-id`、`change-dir`，后续步骤使用该 `change-id`。若脚本失败，先排查报错原因，不要直接派发子代理。

## 步骤 2: 读取子代理 Prompt 模板（必须）

读取子代理 Prompt 模板：

```bash
# 读取 quick-fixer.md 模板
PROMPT_TEMPLATE="$PLUGIN_ROOT/agents/quick-fixer.md"
```

**记录以下变量**，后续步骤会使用：
- `CHANGE_ID`：从步骤 1 输出获取
- `CHANGE_DIR`：从步骤 1 输出获取
- `WORKTREE_ROOT`：使用 `$PROJECT_ROOT`（quick 模式不创建 worktree，直接在主仓库修改）
- `DESCRIPTION`：用户输入的变更描述（`$ARGUMENTS`）

## 步骤 3: 启动 Task 工具派发子代理（必须）

**在步骤 1 和步骤 2 完成后立即执行此步骤，不要停止。**

使用 Task 工具派发 general-purpose 子代理：

```javascript
// 读取 prompt 模板
const promptTemplate = await Read({
  file_path: "${PLUGIN_ROOT}/agents/quick-fixer.md"
});

// 替换模板变量
const prompt = promptTemplate
  .replace(/\{\{DESCRIPTION\}\}/g, "${ARGUMENTS}")
  .replace(/\{\{CHANGE_ID\}\}/g, "${CHANGE_ID}")
  .replace(/\{\{CHANGE_DIR\}\}/g, "${CHANGE_DIR}")
  .replace(/\{\{WORKTREE_ROOT\}\}/g, "${PROJECT_ROOT}");

// 启动子代理
Task({
  subagent_type: "general-purpose",
  description: "快速实现：${ARGUMENTS}",
  prompt: prompt,
  model: "sonnet",
});
```

**注意事项**：
- 必须替换所有模板变量（`{{DESCRIPTION}}`, `{{CHANGE_ID}}`, `{{CHANGE_DIR}}`, `{{WORKTREE_ROOT}}`）
- 子代理会在主仓库目录直接修改文件（不创建 worktree）
- 子代理会发送飞书摘要给 `planspec.yaml` 中的 `lark_email`

## 步骤 4: 等待子代理完成（必须）

**等待子代理执行完成**：

```javascript
// 等待子代理完成（block: true）
TaskOutput({
  task_id: subagent_id,
  block: true,
  timeout: 600000, // 10 分钟超时
});
```

**等待期间**：
- 不要打断子代理
- 不要修改子代理正在编辑的文件
- 准备显示完成摘要

## 步骤 5: 显示完成摘要（必须）

**接收子代理输出，显示完成摘要**：

子代理会返回以下格式的摘要：

```markdown
## 完成摘要

**变更描述**: {{DESCRIPTION}}
**变更 ID**: {{CHANGE_ID}}

### 变更文件
- 文件1（简短说明）
- 文件2（简短说明）

### 验证结果
- 编译: ✅ 通过
- Lint: ✅ 通过

### 飞书摘要
- 接收人: {{lark_email}}
- 发送状态: ✅ 成功

### 下一步
请检查代码变更，确认无误后手动提交：
```

**将子代理的输出直接显示给用户**，不做修改。

## 完成标志

当以下条件满足时，本命令完成：

- [x] 项目级变更目录已创建 `.bytecoding/changes/$CHANGE_ID/`
- [x] planspec.yaml 已创建（包含 lark_email）
- [x] 子代理已执行完成
- [x] 代码已实现
- [x] 编译验证已通过
- [x] 飞书摘要已发送（如 lark_email 可用）

## 下一步

用户需要：
1. 检查代码变更
2. 确认无误后手动提交：
   ```bash
   git add .
   git commit -m "feat: ${DESCRIPTION}"
   git push
   ```

## 适用场景

**推荐使用**：
- 添加简单功能（如日志记录、字段校验）
- 修复小 bug（如边界条件、错误处理）
- 重构小范围代码（如提取函数、重命名）
- 调整配置（如修改常量、环境变量）

**不推荐使用**（应使用 `/plan` + `/apply`）：
- 需求不明确
- 涉及多个子系统
- 需要详细设计
- 需要多人协作
- 预计超过 10 分钟的任务

## 注意事项

1. **不自动提交代码**：由用户决定是否提交
2. **不创建 worktree**：直接在主仓库修改
3. **不生成文档**：只生成 planspec.yaml
4. **必须编译通过**：子代理不会停止，直到编译通过
5. **飞书通知**：会发送给 `planspec.yaml` 中的 `lark_email`

## 目录结构

```
项目根目录/
├── .bytecoding/
│   └── changes/
│       ├── change-xxx-quick-YYYYMMDD-HHMMSS/
│       │   └── planspec.yaml    # 简化版，包含 lark_email
│       └── archive/             # 已归档的变更
└── ...
```

## 与 /plan + /apply 的区别

| 特性 | /plan + /apply | /quick |
|------|---------------|--------|
| **步骤** | 8+ 步 | 2 步（初始化 + 等待） |
| **文档** | proposal + design + tasks | planspec.yaml（简化） |
| **时间** | 15-30 分钟 | 5-10 分钟 |
| **Worktree** | ✅ 创建 | ❌ 不创建 |
| **Git 提交** | ✅ 自动 commit + push | ❌ 不自动提交 |
| **飞书通知** | ✅ 发送摘要 | ✅ 发送摘要 |
| **适用场景** | 复杂需求 | 简单需求 |
