---
name: using-bytecoding
description: Use when working with Bytecoding plugin - establishes fundamental skill usage rules, command mappings, and MCP tool orchestration principles. This skill is always active and defines when other skills must be triggered.
---

# Bytecoding 技能使用规则

## 铁律

**核心原则**：如果技能适用，就必须使用（即使只有 1% 的可能性）。

不要寻找不使用技能的理由。如果技能适用，就必须使用。

---

## Commands 与 Skills 映射

### Commands（顶层操作）

Commands 是批量触发技能的顶层命令，用于完整工作流：

| Command | 触发的技能链 | 用途 |
|---------|-------------|------|
| `/repo-plan` | `brainstorming` + `writing-plans` → `repo-plan-lark.js` → `repo-plan-send.js` | 生成方案与 PlanSpec |
| `/repo-apply` | `using-git-worktrees` → `dispatching-parallel-agents`（可并行时）→ `subagent-driven-development` → `test-driven-development` → `repo-apply-lark.js` | 执行落地 |
| `/repo-archive` | `repo-archive.js` | 归档已完成的变更 |

### Skills（可独立调用）

Skills 可以独立调用或通过 Commands 自动触发：

| 技能 | 触发时机 | 核心流程 |
|------|----------|----------|
| `bytecoding:brainstorming` | 需求讨论、设计方案探索 | 理解需求 → 多源搜索 → 综合分析 → 方案设计 → 分节呈现 |
| `bytecoding:writing-plans` | 设计文档转任务列表 | 分析设计 → 细粒度拆分（2-5分钟/任务）→ 任务模板 |
| `bytecoding:test-driven-development` | 编写代码 | 编译验证驱动（不强制单测） |
| `bytecoding:using-git-worktrees` | 需要隔离的工作环境 | 创建工作树 → 按需环境准备 |
| `bytecoding:subagent-driven-development` | 执行复杂任务 | 派发子代理 → 两阶段评审 |
| `bytecoding:dispatching-parallel-agents` | 多个任务可并行 | 识别独立任务域 → 并行派发 |

---

## 技能触发时机

### 1. 需求讨论 → `bytecoding:brainstorming`

**触发条件**：
- 用户提出新功能需求
- 需要探索多种实现方案
- 需要了解代码库现状

**输出**：`proposal.md` + `design.md`
**自动衔接**：若用户未明确要求“只做 brainstorming/只要设计文档”，完成后应自动触发 `bytecoding:writing-plans` 生成 `tasks.md`。

### 2. 生成方案 → `/repo-plan` 命令

**自动触发**：`brainstorming` → `writing-plans`

**输出**：`proposal.md` + `design.md` + `tasks.md`

### 3. 执行变更 → `/repo-apply` 命令

**自动触发技能链**：
1. `using-git-worktrees` - 创建隔离工作环境
2. `dispatching-parallel-agents` - 任务可并行时并行派发
3. `subagent-driven-development` - 子代理执行任务与审查
4. `test-driven-development` - 编译验证驱动实现

### 4. 编写代码 → `bytecoding:test-driven-development`

**触发条件**：
- 实现新功能
- 修复 bug
- 重构代码或结构调整

### 5. 发送摘要 → `repo-plan-send.js`/`repo-apply-lark.js`/`repo-archive.js`

**触发条件**：
- `/repo-plan`、`/repo-apply`、`/repo-archive` 结束后
- 需要发送飞书摘要/通知

**附加规则**：
- 如摘要包含 Markdown 文档（proposal/design/tasks），优先使用 `repo-plan-lark.js` 批量渲染并拿到链接，再发送摘要

### 6. 并行派发 → `bytecoding:dispatching-parallel-agents`

**触发条件**：
- 任务数 >= 2
- 任务之间无共享文件/顺序依赖
- 可拆分为独立子域并行执行

**输出**：并行子代理结果 + 两阶段审查记录

---

## MCP 工具使用原则

### 双源搜索策略

Bytecoding 强制使用**本地 + Repotalk MCP** 双源搜索：

#### 1. 本地搜索（优先）

**工具**：`Glob`、`Grep`

**使用场景**：
- 查找项目文件
- 搜索代码模式
- 理解现有实现

**搜索模式**：
```
# 查找文件
Glob: "**/*.ts"
Glob: "src/**/*.test.ts"

# 搜索内容
Grep: "function.*validate"
Grep: "interface.*User"
```

#### 2. Repotalk MCP 搜索（候选）

**工具**：`repotalk` MCP 工具

**使用场景**：
- 搜索字节内部代码库
- 查找类似实现
- 学习最佳实践

**前提条件**：
- 需配置 CAS Session Cookie（见 `~/.bytecoding/config.json`）
- Cookie 过期会导致搜索失败

**查询模式**：
```
# 搜索代码
repotalk.search_code("email validation pattern")

# 查找文件
repotalk.search_files("auth service")

# 组合搜索
repotalk.search("user registration flow")
```

#### 3. 综合分析

**强制要求**：结合两者结果，识别最佳实践

**分析步骤**：
1. 本地搜索 → 理解项目现状
2. Repotalk 搜索 → 查找参考实现
3. 对比分析 → 识别差异和改进点
4. 综合决策 → 选择最适合的方案

**输出格式**：
```markdown
## 分析结果

### 本地发现
- 文件位置：`src/services/auth.ts`
- 现有实现：XXX

### Repotalk 参考
- 参考项目：XXX
- 最佳实践：YYY

### 综合建议
- 采纳模式：XXX
- 改进点：YYY
```

---

## 禁止行为

### ❌ 禁止跳过技能

即使：
- 任务看起来很简单
- 之前做过类似的事情
- 用户没有明确要求

**如果技能适用，就必须使用。**

### ❌ 禁止单一来源

只使用本地搜索 OR 只使用 Repotalk 搜索，都是**禁止**的。

必须**双源搜索 + 综合分析**。

### ❌ 禁止绕过编译验证

- 不能因为"看起来没问题"就跳过
- 至少完成一次编译/构建验证并记录结果

---

## 命名空间

Bytecoding 核心技能使用 `bytecoding:` 命名空间；外部工具类技能按其自身命名：

```
bytecoding:brainstorming
bytecoding:writing-plans
bytecoding:test-driven-development
bytecoding:dispatching-parallel-agents
...

```

---

## 技能优先级

当多个技能适用时，按以下优先级：

1. **强制技能**（由命令触发的技能链）- 最高优先级
2. **用户明确指定的技能**
3. **上下文最相关的技能**
4. **通用技能**

---

## 配置检查

### Cookie 配置

在使用 Repotalk MCP 前，检查 Cookie 是否配置：

```bash
# 检查配置
cat ~/.bytecoding/config.json

# 应包含：
{
  "repotalk": {
    "auth": {
      "cas_session_cookie": "32位十六进制值"
    }
  }
}
```

### Cookie 过期处理

如果 Repotalk MCP 连接失败：

1. 重新获取 Cookie（登录 https://cloud.bytedance.net）
2. 更新 `~/.bytecoding/config.json`
3. 重启 Claude Code 会话（Hook 会自动同步到 `.mcp.json`）

---

## 总结

**记住铁律**：如果技能适用，就必须使用。

这不是建议，而是必须遵循的开发流程。
