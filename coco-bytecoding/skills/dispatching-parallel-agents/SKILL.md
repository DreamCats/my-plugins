---
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies.
---

# 并行派发子代理

当存在 2 个及以上**相互独立**的任务域时，通过并行派发子代理缩短整体等待时间。

## 工作流程检查清单（强制执行）

**复制或者使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Parallel Dispatch Progress:
- [ ] 步骤 1: 识别可并行任务域（明确边界）
- [ ] 步骤 2: 验证独立性（无共享文件/状态/顺序依赖）
- [ ] 步骤 3: 为每个任务编写独立 Task Prompt
- [ ] 步骤 4: 并行派发 Task（一次性派发）
- [ ] 步骤 5: 等待所有子代理完成
- [ ] 步骤 6: 逐一复核结果（两阶段审查）
- [ ] 步骤 7: 合并结果与解决冲突
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

---

## 何时使用

**适用场景**：
- 任务数 >= 2 且互不依赖
- 任务涉及不同文件/子系统
- 任何一个任务失败不影响其他任务的理解与修复

**不适用场景**：
- 任务存在先后依赖
- 多个任务需修改同一文件/同一函数
- 需要统一的全局上下文才能理解

---

## 核心流程

### 步骤 1: 识别独立任务域

按“文件/子系统/功能块”分组，确保每组之间**不共享文件**：

```
任务 A → 文件模块 A
任务 B → 文件模块 B
任务 C → 文件模块 C
```

### 步骤 2: 编写 Task Prompt

每个 Task Prompt 必须包含：
- **工作目录**：Worktree 根目录绝对路径
- **文件范围**：明确文件列表/路径
- **目标**：清晰验收标准
- **约束**：禁止修改范围外文件
- **输出**：总结与变更说明

**模板**：

```markdown
工作目录：$WORKTREE_ROOT
目标：修复任务 X
文件范围：$WORKTREE_ROOT/path/to/file.go
约束：不要修改其他文件；不要更改公共接口（除非任务要求）
验收标准：
- [ ] 条件 1
- [ ] 条件 2

请直接实现代码，不要询问确认。
输出：简要总结 + 改动文件列表。
```

### 步骤 3: 并行派发

```javascript
Task({ subagent_type: "general-purpose", description: "任务 A", prompt: "..." })
Task({ subagent_type: "general-purpose", description: "任务 B", prompt: "..." })
Task({ subagent_type: "general-purpose", description: "任务 C", prompt: "..." })
```

### 步骤 4: 审查与合并

并行返回后，主代理需要：
1. **逐一做两阶段审查**（遵循 subagent-driven-development 的审查模板）
2. **处理冲突/重叠修改**
3. **必要时回退为串行**

---

## 常见错误

- ❌ 把有依赖的任务并行化
- ❌ 多个 Task 修改同一文件
- ❌ Prompt 缺少工作目录或验收标准
- ❌ 只看结果不做审查

---

## 完成标志

当以下条件满足时，本技能完成：

- [x] 任务域已拆分且独立性确认
- [x] 子代理已并行派发并完成
- [x] 两阶段审查完成
- [x] 结果已合并且无冲突

---

## 与其他技能的集成

**前置技能**：`bytecoding:using-git-worktrees`  
**后置技能**：`bytecoding:subagent-driven-development`（审查与回收）、`bytecoding:test-driven-development`

**集成建议**：
- 仅当任务独立时，先使用本技能并行派发
- 主代理必须对每个任务执行两阶段审查
- 最终统一进入编译验证阶段
