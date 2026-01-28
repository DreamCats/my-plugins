---
description: 执行任务列表
argument-hint: [change-id]
allowed-tools: Bash(bash*), Bash(node*), Bash(go*), Bash(git*), Bash(pwd*), Bash(lark-cli*), Read, Write, Edit, Glob, Grep, Task
---

# /apply 命令

在当前分支自动执行 tasks.md 中的所有任务。

## 工作流程

```
/apply $CHANGE_ID
  │
  ├─ Step 1: 读取 tasks.md
  ├─ Step 2: 自动执行所有任务
  │    ├─ 子代理执行每个 Task
  │    └─ 子代理内部自审（规范+质量）
  ├─ Step 3: 编译验证
  ├─ Step 4: 飞书通知
  │
  └─► 用户自行 review + commit
```

## Step 1: 读取任务

```bash
CHANGE_DIR=".bytecoding/changes/$ARGUMENTS"
```

读取 `$CHANGE_DIR/tasks.md`，解析任务列表。

## Step 2: 自动执行所有任务

对 tasks.md 中的每个 Task，派发子代理执行：

```javascript
// 对每个 Task
const result = await Task({
  subagent_type: "general-purpose",
  description: "执行 Task N: [任务标题]",
  prompt: `
你是代码实现助手，请完成以下任务：

## 任务信息
${taskContent}

## 约束
- 在当前工作目录修改代码
- 遵循现有代码风格
- 完成后进行自审：
  1. 规范符合性：是否按任务要求实现
  2. 代码质量：格式、命名、错误处理

## RPC 依赖查询
当需要查看 RPC 入参/出参定义时，必须优先使用 byte-lsp MCP：
- go_to_definition: file_path + symbol + use_disk:true → 跳转到定义
- get_hover: file_path + symbol + use_disk:true → 查看类型签名
- 禁止在 $GOPATH/pkg/mod 下 Grep 搜索

## 完成标志
返回修改的文件列表和简要说明
  `,
});
```

**执行模式**：自动执行完所有任务，不逐个暂停。

**子代理自审**（内置在子代理 prompt 中）：

1. **规范符合性**：是否按任务要求实现
2. **代码质量**：格式、命名、错误处理

## Step 3: 编译验证

所有任务完成后，执行最小范围编译：

```bash
# 根据 tasks.md 中的涉及文件，编译相关包
go build ./path/to/changed/package/...
```

**禁止**：`go build ./...` 全量编译

如果编译失败，尝试修复后重新验证。

## Step 4: 飞书通知

```bash
CHANGE_DIR=".bytecoding/changes/$ARGUMENTS"
lark_email=$(grep 'lark_email' "${CHANGE_DIR}/planspec.yaml" | awk '{print $2}' | tr -d '"')

if [ -n "$lark_email" ]; then
  lark-cli send-message \
    --receive-id "$lark_email" \
    --receive-id-type email \
    --msg-type text \
    --content "{\"text\":\"Apply 已完成\\n\\n变更ID：$ARGUMENTS\\n\\n请 review 代码后提交：\\ngit diff\\ngit add . && git commit\"}"
fi
```

## 完成标志

- [x] 所有 Task 已执行
- [x] 编译验证通过
- [x] 飞书通知已发送

## 下一步

提示用户：

```
Apply 已完成！

请 review 代码变更：
  git diff

可选：优化代码质量
  bytecoding:code-reviewer

确认无误后提交：
  /bytecoding:gcmsg
```
