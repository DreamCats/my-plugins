---
description: 一键完成简单变更
argument-hint: [变更描述]
---

# /quick 命令

本命令通过子代理一键完成简单变更。

## 工作流程（Tasks 系统）

使用 Tasks 系统管理 3 个任务及其依赖关系：

```
Task 1: 初始化 planspec.yaml
  │
  ▼ (blocks Task 2)
Task 2: 派发子代理实现代码 ──────► Task 工具派发 general-purpose 子代理
  │                              │
  ▼ (blocks Task 3)              ▼
Task 3: 编译验证与飞书通知      子代理独立执行代码实现
  │
  ▼
完成
```

## 参数

- `$ARGUMENTS` - 变更描述（如 "添加用户登录日志记录"）

## 执行步骤

### 步骤 1: 创建任务列表

```javascript
// 创建 3 个任务，建立依赖关系
const task1 = await TaskCreate({
  subject: "初始化 planspec.yaml",
  description: "运行 repo-quick.js 脚本",
  activeForm: "正在初始化变更目录...",
});

const task2 = await TaskCreate({
  subject: "派发子代理实现代码",
  description: "使用 Task 工具派发 general-purpose 子代理",
  addBlockedBy: [task1.taskId],
  activeForm: "正在派发子代理...",
});

const task3 = await TaskCreate({
  subject: "编译验证与飞书通知",
  description: "编译验证通过后发送飞书摘要",
  addBlockedBy: [task2.taskId],
  activeForm: "正在编译验证...",
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

### 步骤 4: 执行 Task 3 - 编译验证与飞书通知

#### 4.1 编译验证

**只编译改动的包/模块**，不要全量编译：

```bash
# 只编译改动的包
go build ./path/to/changed/package/...
```

#### 4.2 读取 planspec.yaml 获取 lark_email

```bash
# 读取 lark_email
lark_email=$(grep 'lark_email' "${CHANGE_DIR}/planspec.yaml" | awk '{print $2}')
```

#### 4.3 发送飞书摘要

根据子代理返回的变更内容，发送飞书消息：

```bash
lark-cli send-message \
  --receive-id "${lark_email}" \
  --receive-id-type email \
  --msg-type text \
  --content '{
    "text": "✅ 快速变更已完成\n\n变更描述：'"${DESCRIPTION}"'\n变更ID：'"${CHANGE_ID}"'\n\n变更文件：\n- 文件1（简短说明）\n- 文件2（简短说明）\n\n验证结果：\n- 编译: ✅ 通过\n\n请检查代码后手动提交。"
  }'
```

**重要**：
- 根据子代理实际返回的变更文件调整 `变更文件` 部分
- 如果编译失败，标注 ❌ 失败并说明原因
- 如果 `lark_email` 为空，跳过飞书通知

## 下一步

用户需要：

1. 检查代码变更
2. 确认无误后手动提交：
   ```bash
   git add .
   git commit -m "feat: ${DESCRIPTION}"
   git push
   ```
