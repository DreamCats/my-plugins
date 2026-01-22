---
name: using-git-worktrees
description: Use when creating isolated workspaces for parallel development. This skill sets up Git worktrees to keep the main workspace clean while working on multiple features simultaneously.
---

# Using Git Worktrees 技能

## 目标

创建隔离的 Git 工作区，支持并行开发多个功能，保持主工作区整洁。

---

## 什么是 Git Worktree？

**Git Worktree** 允许你在同一个仓库中检出多个分支到不同目录，每个目录是独立的工作区。

**优势**：
- 并行开发多个功能，无需频繁切换分支
- 保持主工作区整洁（不受 WIP 分支影响）
- 快速上下文切换（只需 `cd` 到不同目录）
- 独立的构建状态（每个 worktree 有自己的 `node_modules`）

---

## 使用场景

**适用场景**：
- 同时开发多个功能
- 需要对比不同分支的实现
- 主分支有未提交的更改，需要切换到其他分支
- CI/CD 构建需要隔离环境

**不适用场景**：
- 只有一个功能分支
- 简单的 bug 修复（直接在主工作区操作即可）

---

## 工作流程

### 阶段 1: 检查当前状态

**目标**：确认 Git 仓库状态和分支情况

```bash
# 检查当前分支
git branch -a

# 检查当前状态
git status

# 列出现有 worktrees
git worktree list
```

**检查清单**：
- [ ] 确认在主分支（通常是 `main` 或 `master`）
- [ ] 确认没有未提交的更改（或 stash 它们）
- [ ] 确认目标分支存在或需要创建

---

### 阶段 2: 创建 Worktree

**目标**：为 feature 分支创建隔离的工作区

#### 2.1 确定目录位置

**推荐位置**：与主仓库同级目录

```
# 主仓库
/path/to/main-repo/

# Worktree 目录（与主仓库同级）
/path/to/feature-email-verification/
/path/to/feature-user-profile/
```

#### 2.2 创建 Worktree

**创建新分支**：
```bash
# 从当前分支创建新分支 + worktree
git worktree add ../feature-email-verification feature/email-verification

# 指定基础分支
git worktree add ../feature-email-verification -b feature/email-verification main
```

**使用现有分支**：
```bash
# 从现有分支创建 worktree
git worktree add ../feature-email-verification feature/email-verification
```

#### 2.3 验证 Worktree

```bash
# 列出所有 worktrees
git worktree list

# 输出示例：
# /path/to/main-repo              main
# /path/to/feature-email-verification  feature/email-verification
```

**验证清单**：
- [ ] Worktree 目录已创建
- [ ] Worktree 在正确分支上
- [ ] `git worktree list` 显示正确

---

### 阶段 3: 设置 Worktree 环境（可选）

**目标**：按需准备依赖环境，避免创建 worktree 时的无效耗时。

**默认策略**：不在创建 worktree 时预先安装依赖或执行编译/测试。只有当任务需要或后续验证失败时才执行。

**注意**：禁止在此阶段主动执行 `go mod download` / `go build` / `go test` 之类的验证，编译验证应在后续 `test-driven-development` 阶段完成。

#### 3.1 按需安装依赖

**仅当任务需要依赖或出现构建失败时执行**：

```bash
# 进入 worktree 目录
cd ../feature-email-verification

# 安装依赖（独立于主工作区）
npm install
# 或
pnpm install
# 或
bun install
```

**说明**：
- 每个 worktree 有独立的 `node_modules`
- 不强制预装，避免空跑

#### 3.2 按需验证环境

**仅当任务需要或构建失败时执行**：

```bash
# 依赖验证
npm test

# 构建验证
npm run build

# 类型检查
npm run type-check
```

**验证清单（可选）**：
- [ ] 依赖安装成功（如需）
- [ ] 测试通过（如需）
- [ ] 构建成功（如需）
- [ ] 无 TypeScript 错误（如需）

---

### 阶段 4: 在 Worktree 中工作

**目标**：在隔离环境中执行变更

```bash
# 在 worktree 中工作
cd ../feature-email-verification

# 正常使用 Git 命令
git status
git add .
git commit -m "feat: add email verification"

# 推送到远程
git push -u origin feature/email-verification
```

**注意事项**：
- Worktree 中的 Git 操作是独立的
- 不能在不同 worktree 中检出同一个分支
- 一个分支只能被一个 worktree 检出

---

## 与 Bytecoding 集成

### 与 /apply 集成

**当使用 `/apply` 命令时**：

1. **自动提示创建 Worktree**
   ```
   检测到你在主分支上执行变更。

   建议创建 Git Worktree 以保持主工作区整洁：
   - Worktree 位置：../feature-xxx
   - 分支名称：feature/xxx

   是否创建 Worktree？(y/n)
   ```

2. **自动创建 Worktree**
   ```bash
   git worktree add ../feature-xxx -b feature/xxx
   cd ../feature-xxx
   ```

3. **在 Worktree 中执行任务**
   ```bash
   # 执行 /apply 的任务
   # 所有操作在 worktree 中进行
   ```

### 与子代理/并行派发集成

**当使用 `subagent-driven-development` 或 `dispatching-parallel-agents` 技能时**：

在派发子代理前，先创建 Worktree：

```
1. 创建 Worktree
2. 在 Worktree 中派发子代理
3. 子代理在隔离环境中工作
```

---

## Worktree 管理命令

### 列出 Worktrees

```bash
git worktree list

# 输出：
# /path/to/main-repo              3a1b2c3 [main]
# /path/to/feature-a              7d8e9f0 [feature/a]
# /path/to/feature-b              1a2b3c4 [feature/b]
```

### 删除 Worktree

**清理 Worktree**：
```bash
# 方法 1: 先删除目录，再清理
rm -rf ../feature-email-verification
git worktree prune

# 方法 2: 直接删除（Git 2.17+）
git worktree remove ../feature-email-verification
```

### 移动 Worktree

```bash
# Git 不直接支持移动 worktree
# 使用以下步骤：
mv ../feature-email-verification ../new-location
git worktree prune
# 重新创建 worktree（不推荐）
```

### Worktree 信息

```bash
# 查看 worktree 详细信息
git worktree list --porcelain

# 输出：
# worktree /path/to/main-repo
# HEAD 3a1b2c3a1b2c3a1b2c3a1b2c3a1b2c3a1b2c3
# branch refs/heads/main
```

---

## 常见问题

### Q: 如何在不同 worktree 之间共享依赖？

**A**: 使用符号链接（不推荐）或 pnpm workspace（推荐）。

```bash
# pnpm workspace 配置
# pnpm-workspace.yaml
packages:
  - '/*'
```

### Q: Worktree 会增加磁盘空间吗？

**A**: 会的。每个 worktree 有完整的源代码副本和 `node_modules`。

**解决方案**：
- 使用 Git alternates（共享 `.git` 对象）
- 定期清理不需要的 worktree
- 使用 pnpm workspace 共享依赖

### Q: 能否在同一分支创建多个 worktree？

**A**: 不能。一个分支只能被一个 worktree 检出。

**解决方案**：
```bash
# 创建临时分支
git worktree add ../temp-branch -b temp/feature-xxx feature/xxx

# 完成后删除
git worktree remove ../temp-branch
git branch -d temp/feature-xxx
```

### Q: 如何在 worktree 中使用 MCP 工具？

**A**: MCP 工具使用 `process.cwd()` 确定当前目录。

```bash
# 确保在正确的 worktree 中
cd ../feature-xxx

# MCP 工具会自动使用当前目录
# Glob/Grep 搜索范围是当前 worktree
```

---

## 最佳实践

### 1. 命名约定

**Worktree 目录命名**：
```
../feature-<name>          # 功能开发
../bugfix-<name>           # Bug 修复
../hotfix-<name>           # 紧急修复
../experiment-<name>       # 实验性功能
../refactor-<name>         # 重构
```

**分支命名**：
```
feature/<name>             # 功能开发
bugfix/<name>              # Bug 修复
hotfix/<name>              # 紧急修复
experiment/<name>          # 实验性功能
refactor/<name>            # 重构
```

### 2. 并行开发限制

**建议最多 3-4 个并行 worktree**，原因：
- 上下文切换成本
- 磁盘空间占用
- 依赖安装时间

### 3. 定期清理

**每周清理不需要的 worktree**：
```bash
# 查看所有 worktrees
git worktree list

# 删除已合并的分支 worktree
git worktree remove ../feature-xxx
git branch -d feature/xxx
```

### 4. 主工作区保护

**保持主工作区整洁**：
- 主工作区只用于代码审查、快速测试
- 所有开发工作在 worktree 中进行
- 主工作区保持在 `main`/`master` 分支

---

## MCP 工具使用

**本技能使用的 MCP 工具**：

### 本地工具
- [x] `Bash` - 执行 Git 命令
- [x] `Glob` - 查找 worktree 目录
- [x] `Grep` - 搜索 Git 配置

### Repotalk MCP（可选）
- [ ] `repotalk.search_code()` - 搜索 Git worktree 最佳实践

---

## 禁止行为

- ❌ 在主工作区进行大规模开发
- ❌ 同时在多个 worktree 中修改同一文件
- ❌ 忘记清理 worktree（导致磁盘空间浪费）
- ❌ 在 worktree 中直接修改 `.git` 目录
- ❌ 在创建 worktree 阶段强制执行编译/测试（交给后续编译验证阶段）

---

## 完成标志

当以下条件满足时，本技能完成：

- [x] Worktree 已创建
- [x] Worktree 在正确分支上
- [ ] 依赖已安装（如需）
- [ ] 基线验证通过（如需）
- [x] 用户确认在 worktree 中工作

---

## 与其他技能的集成

**前置技能**：无  
**后置技能**：`bytecoding:dispatching-parallel-agents`（可选）→ `bytecoding:subagent-driven-development`

**集成流程**：
```
using-git-worktrees → dispatching-parallel-agents → subagent-driven-development
       ↓                     ↓                        ↓
  创建隔离工作区        并行派发任务               在工作区中审查结果
```
