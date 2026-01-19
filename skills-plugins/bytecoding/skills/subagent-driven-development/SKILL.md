---
name: subagent-driven-development
description: Use when executing complex tasks that benefit from clean context and dedicated attention. This skill enforces a mandatory workflow: task preparation → subagent delegation → two-stage review (compliance + quality) → result handling with retry logic.
---

# Subagent-Driven Development 技能

通过强制工作流和两阶段审查机制，确保子代理产出的高质量。

## 工作流程检查清单（强制执行）

**复制或者使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Subagent Progress:
- [ ] 步骤 1: 任务准备 - 明确定义和验收标准
- [ ] 步骤 2: 派发子代理 - 使用 Task 工具派发
- [ ] 步骤 3: 等待完成 - 监控子代理执行
- [ ] 步骤 4: 规范符合性审查 - 验证按计划实现
- [ ] 步骤 5: 代码质量审查 - 验证实现质量
- [ ] 步骤 6: 结果处理 - 通过或要求重做
- [ ] 路径约束 - 确认使用 Worktree 根目录
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

---

## 步骤 1: 任务准备（必须明确）

**目标**：明确任务定义和验收标准。

### 1.1 读取任务定义

```bash
# 读取任务列表
Read: .bytecoding/changes/$CHANGE_ID/tasks.md
```

### 1.2 理解任务上下文

**必须理解以下内容**：

- 设计文档要求
- 参考实现位置
- 技术栈和框架
- 验收标准
- 关键入口符号与引用链（优先使用 serena）

**在继续下一步之前，确认任务定义清晰。**

**若任务涉及入口定位或调用链**：优先使用 serena 明确符号与影响面，并将结果写入派发 prompt 的“参考”部分。

### 1.3 确定 Worktree 根目录（必须）

```bash
# 确保在 worktree 内，并记录根目录
WORKTREE_ROOT=$(git rev-parse --show-toplevel)
echo "Worktree root: $WORKTREE_ROOT"
```

**规则**：

- 后续所有文件路径必须基于 `WORKTREE_ROOT`
- 派发给子代理的路径必须明确为 worktree 绝对路径
- 禁止使用主仓库绝对路径

---

## 步骤 2: 派发子代理（必须使用 Task 工具）

**目标**：使用 Task 工具派发子代理。

**若已使用 `bytecoding:dispatching-parallel-agents` 并行派发**：
- 本步骤视为已完成
- 直接进入步骤 3 等待与审查

### 2.1 派发参数

```javascript
Task({
  subagent_type: "general-purpose", // 子代理类型
  description: "实现邮箱验证令牌生成", // 短描述（3-5词）
  prompt: `请实现以下任务：

## 任务：实现 EmailVerificationToken.generateToken()

**工作目录**：$WORKTREE_ROOT
**文件**：$WORKTREE_ROOT/src/services/EmailVerificationService.ts

**要求**：
- 生成 6 位数字验证码
- 使用 bcrypt 哈希后返回
- 包含错误处理

**参考**：
- 本地：src/services/PasswordService.ts（类似的哈希实现）
- 设计：.bytecoding/changes/xxx/design.md

**验收标准**：
- [ ] 代码编译通过
- [ ] 编译/构建通过（测试可选）
- [ ] 代码符合 ESLint 规范

请直接实现代码，不要询问确认。禁止修改 $WORKTREE_ROOT 之外的文件。
`,
  model: "sonnet", // 可选：指定模型
});
```

**派发规则**：

- 若任务文件路径为相对路径，必须先拼接 `WORKTREE_ROOT`
- Task prompt 必须包含 `工作目录` 和 worktree 绝对路径
- 发现路径不在 `WORKTREE_ROOT` 下，立即纠正并重派

### 2.2 子代理类型

| 类型              | 用途             |
| ----------------- | ---------------- |
| `general-purpose` | 通用任务（默认） |
| `Explore`         | 代码探索和分析   |

**选择原则**：

- 代码实现 → `general-purpose`
- 代码分析 → `Explore`

---

## 步骤 3: 等待完成（必须监控）

**目标**：监控子代理执行状态。

### 3.1 等待策略

**同步等待**：

```javascript
TaskOutput({
  task_id: subagent_id,
  block: true, // 阻塞等待完成
  timeout: 300000, // 5 分钟超时
});
```

### 3.2 等待期间

**禁止行为**：

- 不要打断子代理
- 不要修改子代理正在编辑的文件
- 不要派发新的子代理

**推荐行为**：

- 准备审查工作
- 阅读相关文档

---

## 步骤 4: 规范符合性审查（必须验证）

**目标**：验证是否按计划实现。

### 4.1 审查项

**规范符合性检查清单**：

- [ ] 实现了任务要求的所有功能
- [ ] 使用了指定的文件路径
- [ ] 遵循了设计文档
- [ ] 参考了推荐的实现
- [ ] 符合验收标准（包含编译/构建通过）
- [ ] 若涉及接口/调用链，已用 serena 复核引用链影响

### 4.2 审查方法

```bash
# 读取实现的代码
Read: $WORKTREE_ROOT/src/services/EmailVerificationService.ts

# 可选：使用 serena 复核符号/引用链影响范围
# （示例：find_referencing_symbols 或 find_symbol）

# 运行编译/构建（确保在 worktree 中执行，优先最小化范围）
# 注意：除非用户明确要求，否则禁止执行 go build ./...
cd $WORKTREE_ROOT && npm run build  # 或 go build ./path/to/pkg

# 可选：运行 Lint
npm run lint
```

### 4.3 审查结果

```
✅ 通过：所有功能已实现
❌ 未通过：缺少功能 XXX，需要重新实现
```

**当且仅当规范符合性审查通过后，继续代码质量审查。**

---

## 步骤 5: 代码质量审查（必须验证）

**目标**：验证实现质量。

### 5.1 代码质量检查清单

**代码质量审查项**：

- [ ] 代码符合项目规范（ESLint/Prettier）
- [ ] 无 TypeScript 错误
- [ ] 无安全漏洞
- [ ] 性能合理
- [ ] 错误处理完整
- [ ] 命名清晰
- [ ] 注释适当

### 5.2 质量标准

**命名**：驼峰命名，语义清晰

**注释**：复杂逻辑需要注释

**错误处理**：所有异常情况都处理

**编译验证**：构建通过

**编译范围**：优先最小化范围；除非用户明确要求，禁止使用 `go build ./...`

**引用链复核**：涉及公共接口/调用链的改动，使用 serena 复核调用方影响范围

### 5.3 审查方法

```bash
# 运行编译/构建（最小化范围优先）
npm run build  # 或 go build ./path/to/pkg

# 可选：运行类型检查或测试（如有）
# npm run type-check
# npm test

# 代码审查
Read: $WORKTREE_ROOT/src/services/EmailVerificationService.ts
```

**当且仅当代码质量审查通过后，标记任务完成。**

---

## 步骤 6: 结果处理（通过或重做）

**目标**：根据审查结果决定下一步。

### 6.1 审查通过

**标记任务完成**：

```markdown
### 1.1 ✅ 已完成

**实现**：src/services/EmailVerificationService.ts
**编译**：通过
**Lint**：通过
**审查人**：主代理
**审查时间**：YYYY-MM-DD HH:MM
```

**继续下一个任务**

### 6.2 审查未通过

**要求子代理重新实现**：

```javascript
Task({
  subagent_type: "general-purpose",
  description: "修复邮箱验证令牌生成",
  prompt: `你之前的实现有以下问题：

## 审查反馈

### 规范符合性：❌ 未通过
- [x] 生成了 6 位数字
- [ ] 未使用 bcrypt 哈希（直接返回了明文）
- [ ] 缺少错误处理

### 代码质量：❌ 未通过
- [ ] 未遵循项目命名规范（应该用 camelCase）
- [ ] 缺少 JSDoc 注释

## 修复要求

请修复以下问题：
1. 使用 bcrypt.hash() 哈希令牌
2. 添加 try-catch 错误处理
3. 修正命名规范
4. 添加 JSDoc 注释

请直接修复，不要询问确认。
`,
});
```

**最多允许 3 次修复**，超过则人工介入。

---

## 两阶段审查格式

### 审查记录模板

```markdown
## 审查记录：[任务名称]

**任务 ID**：1.1
**子代理 ID**：xxx
**审查时间**：YYYY-MM-DD HH:MM
**审查人**：主代理

---

### 阶段 1: 规范符合性审查

| 审查项           | 状态 | 说明             |
| ---------------- | ---- | ---------------- |
| 实现了所有功能   | ✅   | 所有要求都已实现 |
| 使用指定文件路径 | ✅   | 文件路径正确     |
| 遵循设计文档     | ✅   | 与设计一致       |
| 参考推荐实现     | ✅   | 参考了本地实现   |

**结果**：✅ 通过

---

### 阶段 2: 代码质量审查

| 审查项   | 状态 | 说明               |
| -------- | ---- | ------------------ |
| 代码规范 | ✅   | ESLint 通过        |
| 类型检查 | ✅   | 无 TypeScript 错误 |
| 安全性   | ✅   | 使用 bcrypt 哈希   |
| 性能     | ✅   | 哈希操作异步执行   |
| 错误处理 | ✅   | 完整的 try-catch   |
| 命名清晰 | ✅   | 语义化命名         |

**结果**：✅ 通过

---

### 最终结论

**审查结果**：✅ **通过**

**下一步**：继续任务 1.2

---

### 子代理产出摘要

**新增文件**：

- src/services/EmailVerificationService.ts

**修改文件**：

- src/index.ts（导出新服务）

**新增测试**：

- 无（当前阶段不强制）

**编译结果**：
```

BUILD SUCCESS

```

```

---

## 禁止行为

- ❌ **跳过任务准备** - 任务定义不清晰
- ❌ **派发后不审查** - 未验证子代理产出
- ❌ **审查不通过但接受** - 降低质量标准
- ❌ **在子代理工作期间修改文件** - 干扰子代理
- ❌ **派发模糊不清的任务** - 缺少明确要求
- ❌ **跳过规范符合性审查** - 直接审查代码质量
- ❌ **跳过代码质量审查** - 只检查规范符合性
- ❌ **超过 3 次修复** - 应人工介入
- ❌ **未指定 Worktree 根目录** - 子代理可能会修改主仓库
- ❌ **使用主仓库路径** - 必须在 worktree 内修改

---

## MCP 工具使用

**本技能强制使用以下 MCP 工具**：

### 主代理使用

- `Task` - 派发子代理
- `TaskOutput` - 获取子代理产出
- `Read` - 审查代码
- `Bash` - 运行编译/构建、Lint
- `serena` - 入口符号/引用链定位与复核（按需）

### 子代理使用

- `Read` - 读取参考实现
- `Glob`/`Grep` - 搜索代码
- `Write`/`Edit` - 编写代码
- `Bash` - 运行编译/构建
- `serena` - 符号级定位与引用分析（按需）

---

## 输出格式

**技能完成时的输出应包括**：

1. **工作流程检查清单**（所有项目已勾选）
2. **派发的任务摘要**
3. **审查结果摘要**
4. **子代理产出摘要**

**示例输出**：

```markdown
## Subagent-Driven Development 技能完成

### 工作流程

✓ 所有 6 个步骤已完成

### 派发任务

- 总任务数：5
- 成功完成：5
- 需要重做：0

### 审查结果

- 规范符合性：5/5 通过
- 代码质量：5/5 通过
- 平均修复次数：0.4 次

### 子代理产出

**新增文件**：3 个
**修改文件**：2 个
**编译结果**：
```

BUILD SUCCESS

```

```

---

## 参考资源

- [Bytecoding 技术设计文档](../../BYTECODING_TECHNICAL_DESIGN.md) - 完整架构说明
- [writing-plans 技能](../writing-plans/SKILL.md) - 前置技能，生成 tasks.md
- [test-driven-development 技能](../test-driven-development/SKILL.md) - 编译验证驱动

---

## 技能元数据

- **技能类型**：执行类技能
- **强制流程**：是（6 步工作流）
- **核心机制**：两阶段审查（规范符合性 + 代码质量）
- **用户交互**：审查未通过超过 3 次时人工介入
- **完成标志**：所有检查清单项目已完成
- **质量标准**：宁可要求重做，不要降低标准
