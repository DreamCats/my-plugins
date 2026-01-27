---
description: 初始化项目的 bytecoding 配置
argument-hint:
allowed-tools: Bash(bash*), Bash(node*), Bash(git*), Bash(bcindex*), Read, Write, Edit, Glob
---

# /init 命令

为当前项目初始化 bytecoding 配置，降低接入门槛。

## 工作流程

```
/bytecoding:init
  │
  ├─ Step 1: 检查 Git 仓库
  ├─ Step 2: 创建 .bytecoding/ 目录结构
  ├─ Step 3: 检查/创建用户配置
  ├─ Step 4: 更新 .gitignore
  ├─ Step 5: 注入 CLAUDE.md Coding Guidelines
  ├─ Step 6: 询问是否安装 gopls
  ├─ Step 7: 询问是否运行 bcindex index
  │
  └─► 输出初始化摘要
```

## Step 1: 检查 Git 仓库

确认当前目录是 Git 仓库：

```bash
git rev-parse --is-inside-work-tree
```

如果不是 Git 仓库，提示用户先执行 `git init`。

## Step 2: 创建 .bytecoding/ 目录结构

```bash
mkdir -p .bytecoding/changes
mkdir -p .bytecoding/plans
```

## Step 3: 检查/创建用户配置

检查 `~/.bytecoding/config.json` 是否存在：

- **存在** → 跳过
- **不存在** → 创建默认配置：

```json
{
  "repotalk": {
    "auth": {
      "cas_session_cookie": ""
    }
  }
}
```

提示用户配置 Repotalk Cookie（如为空）。

## Step 4: 更新 .gitignore

检查 `.gitignore` 是否包含 `.bytecoding/`：

- **已包含** → 跳过
- **未包含** → 追加：

```
# Bytecoding
.bytecoding/
```

## Step 5: 注入 CLAUDE.md Coding Guidelines

检查项目根目录 `CLAUDE.md`：

- **不存在** → 创建并添加 Coding Guidelines
- **存在但无 Guidelines** → 追加 Coding Guidelines
- **已有 Guidelines** → 跳过

Coding Guidelines 内容：

```markdown
<< ------- coding guidelines start ------->>

# Coding Guidelines

- Preserve existing behavior and configuration
- Prefer explicit if/else over nested ternaries
- Avoid one-liners that reduce readability
- Keep functions small and focused
- Do not refactor architecture-level code

<< ------- coding guidelines end ------->>
```

## Step 6: 询问是否安装 gopls

检查 gopls 是否已安装：

```bash
which gopls
```

如果未安装，使用 AskUserQuestion 询问用户：

```
是否安装 gopls（Go Language Server）？

gopls 是 byte-lsp MCP 的依赖，用于代码符号定位、跳转定义、查找引用等功能。
```

**选项**：
- 是，立即安装
- 否，稍后手动安装

如果用户选择"是"：

```bash
go install golang.org/x/tools/gopls@latest
```

## Step 7: 询问是否运行 bcindex index

使用 AskUserQuestion 询问用户：

```
是否运行 bcindex index 构建代码索引？

（大仓库可能耗时较长）
```

**选项**：
- 是，立即构建
- 否，稍后手动执行

如果用户选择"是"：

```bash
bcindex index
```

## 完成标志

输出初始化摘要：

```
Bytecoding 初始化完成！

✅ .bytecoding/ 目录已创建
✅ .gitignore 已更新
✅ CLAUDE.md Coding Guidelines 已添加
✅ gopls 已安装（或：跳过）
✅ bcindex 索引已构建（或：跳过）

用户配置：~/.bytecoding/config.json
  - Repotalk Cookie: [已配置 / 未配置，请手动配置]

下一步：
  - /bytecoding:design - 探索式方案设计
  - /bytecoding:plan - 需求分析与任务生成
  - /bytecoding:do - 直接执行明确的改动

Tips: 经常运行 `bcindex index` 可以提高代码搜索准确度
```
