---
description: 一键完成简单变更
argument-hint: [变更描述]
---

# /quick 命令

本命令通过子代理一键完成简单变更。

## 工作流程（Tasks 系统）

使用 Tasks 系统管理 4 个任务及其依赖关系：

```
Task 1: 初始化 planspec.yaml
  │
  ▼ (blocks Task 2)
Task 2: 派发 quick-fixer 子代理实现代码 ──────► Task 工具派发
  │                                      │
  ▼ (blocks Task 3)                      ▼
Task 3: 派发 code-reviewer 子代理审查 ──────► 子代理独立执行
  │                                      │
  ▼ (blocks Task 4)                      ▼
Task 4: 飞书通知                        子代理完成代码审查
  │
  ▼
完成
```

## 参数

- `$ARGUMENTS` - 变更描述（如 "添加用户登录日志记录"）

## 执行步骤

### 步骤 1: 创建任务列表

```javascript
// 创建 4 个任务，建立依赖关系
const task1 = await TaskCreate({
  subject: "初始化 planspec.yaml",
  description: "运行 repo-quick.js 脚本",
  activeForm: "正在初始化变更目录...",
});

const task2 = await TaskCreate({
  subject: "派发 quick-fixer 子代理实现代码",
  description: "使用 Task 工具派发 general-purpose 子代理",
  addBlockedBy: [task1.taskId],
  activeForm: "正在派发 quick-fixer...",
});

const task3 = await TaskCreate({
  subject: "派发 code-reviewer 子代理审查",
  description: "使用 Task 工具派发 general-purpose 子代理",
  addBlockedBy: [task2.taskId],
  activeForm: "正在派发 code-reviewer...",
});

const task4 = await TaskCreate({
  subject: "飞书通知",
  description: "根据审查结果发送飞书摘要",
  addBlockedBy: [task3.taskId],
  activeForm: "正在发送飞书通知...",
});
```

### 步骤 2: 执行 Task 1 - 初始化

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
node "$SCRIPT_DIR/repo-quick.js" --desc "$ARGUMENTS"
```

脚本输出 `CHANGE_ID` 和 `CHANGE_DIR`，然后标记 Task 1 完成。

### 步骤 3: 执行 Task 2 - 派发子代理

读取 prompt 模板，派发子代理：

```javascript
const promptTemplate = await Read({
  file_path: "${PLUGIN_ROOT}/agents/quick-fixer.md",
});

const prompt = promptTemplate
  .replace(/\{\{DESCRIPTION\}\}/g, "${ARGUMENTS}")
  .replace(/\{\{CHANGE_ID\}\}/g, "${CHANGE_ID}")
  .replace(/\{\{CHANGE_DIR\}\}/g, "${CHANGE_DIR}")
  .replace(/\{\{WORKTREE_ROOT\}\}/g, "${PROJECT_ROOT}");

const subagentResult = await Task({
  subagent_type: "general-purpose",
  description: "快速实现：${ARGUMENTS}",
  prompt: prompt,
});

// 等待子代理完成
await TaskOutput({
  task_id: subagentResult.taskId,
  block: true,
  timeout: 600000,
});
```

### 步骤 4: 执行 Task 3 - 派发 code-reviewer 子代理

读取 code-reviewer prompt 模板，派发子代理：

```javascript
const reviewerPromptTemplate = await Read({
  file_path: "${PLUGIN_ROOT}/agents/code-reviewer.md",
});

const reviewerPrompt = reviewerPromptTemplate
  .replace(/\{\{DESCRIPTION\}\}/g, "${ARGUMENTS}")
  .replace(/\{\{CHANGE_ID\}\}/g, "${CHANGE_ID}")
  .replace(/\{\{CHANGE_DIR\}\}/g, "${CHANGE_DIR}")
  .replace(/\{\{WORKTREE_ROOT\}\}/g, "${PROJECT_ROOT}")
  .replace(/\{\{TIMESTAMP\}\}/g, new Date().toISOString());

const reviewerResult = await Task({
  subagent_type: "general-purpose",
  description: "代码审查：${ARGUMENTS}",
  prompt: reviewerPrompt,
});

// 等待 code-reviewer 子代理完成
await TaskOutput({
  task_id: reviewerResult.taskId,
  block: true,
  timeout: 1200000,
});
```

### 步骤 5: 执行 Task 4 - 飞书通知

#### 5.1 读取 planspec.yaml 获取 lark_email

```bash
# 读取 lark_email
lark_email=$(grep 'lark_email' "${CHANGE_DIR}/planspec.yaml" | awk '{print $2}')
```

#### 5.2 发送飞书摘要

根据 code-reviewer 返回的审查报告，发送飞书消息：

```bash
# 构造飞书消息内容（根据审查报告调整）
cat <<EOF > /tmp/lark_message.json
{
  "text": "✅ 快速变更已完成\n\n变更描述：${DESCRIPTION}\n变更ID：${CHANGE_ID}\n\n【审查结果】\n总体评分：正确性 9/10, 风格 7/10, 性能 8/10, 安全 9/10, 可维护性 8/10\n\n严重问题：0 个\n警告：2 个\n建议：1 个\n\n代码亮点：\n- ✅ 良好的错误处理\n- ✅ 清晰的接口设计\n\n详细报告请查看审查输出。\n\n请检查代码后手动提交。"
}
EOF

lark-cli send-message \
  --receive-id "${lark_email}" \
  --receive-id-type email \
  --msg-type text \
  --content "$(cat /tmp/lark_message.json)"
```

**重要**：

- 根据 code-reviewer 实际返回的审查报告调整消息内容
- 如果有严重问题，在消息中标注 🔴 需要立即修复
- 如果 `lark_email` 为空，跳过飞书通知

## 下一步

用户需要：

1. 检查代码变更
2. 确认无误后手动提交， 建议配套 `/gcmsg`：
