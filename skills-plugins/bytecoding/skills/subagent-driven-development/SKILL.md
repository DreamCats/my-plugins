---
name: subagent-driven-development
description: Use when executing complex tasks that benefit from clean context and dedicated attention. This skill delegates work to subagents, performs two-stage reviews (compliance + quality), and ensures high-quality output.
---

# Subagent-Driven Development 技能

## 目标

为每个任务派发新的子代理，确保上下文清洁、专注度高、质量可控。

**核心价值**：
- **新上下文**：避免当前对话污染
- **快速迭代**：无需等待用户反馈
- **质量保证**：两阶段审查机制

---

## 什么是子代理驱动开发？

**子代理（Subagent）** 是一个独立的 Claude Code 实例，具有：
- 干净的上下文（不继承当前对话历史）
- 专注的任务（只负责一个具体任务）
- 独立的思考（不受主代理偏见影响）

**工作模式**：
```
主代理 → 派发任务 → 子代理（新上下文）
                  ↓
              执行任务
                  ↓
              产出结果
                  ↓
              主代理审查
```

---

## 使用场景

**适用场景**：
- 复杂的功能实现（> 50 行代码）
- 需要深度思考的任务
- 多个独立任务并行执行
- 需要快速迭代的任务

**不适用场景**：
- 简单的文件编辑（< 10 行）
- 单一命令执行
- 信息查询

---

## 工作流程

### 阶段 1: 任务准备

**目标**：明确任务定义和验收标准

**步骤**：
1. **读取任务定义**（从 `tasks.md`）
2. **理解任务上下文**（设计文档、参考实现）
3. **明确验收标准**（测试要求、验证标准）

**任务准备清单**：
- [x] 任务描述清晰
- [x] 文件路径明确
- [x] 参考实现已定位
- [x] 验收标准已定义

---

### 阶段 2: 派发子代理

**目标**：使用 Task 工具派发子代理

**派发参数**：

```javascript
Task({
  subagent_type: "general-purpose",  // 子代理类型
  description: "实现邮箱验证令牌生成",  // 短描述（3-5词）
  prompt: `请实现以下任务：

## 任务：实现 EmailVerificationToken.generateToken()

**文件**：src/services/EmailVerificationService.ts

**要求**：
- 生成 6 位数字验证码
- 使用 bcrypt 哈希后返回
- 包含错误处理

**参考**：
- 本地：src/services/PasswordService.ts（类似的哈希实现）
- 设计：~/.bytecoding/changes/xxx/design.md

**验收标准**：
- [ ] 代码编译通过
- [ ] 单元测试通过
- [ ] 代码符合 ESLint 规范

请直接实现代码，不要询问确认。
`,  // 详细任务描述
  model: "sonnet"  // 可选：指定模型
})
```

**子代理类型**：

| 类型 | 用途 |
|------|------|
| `general-purpose` | 通用任务（默认） |
| `Explore` | 代码探索和分析 |
| `Plan` | 架构设计和规划 |

**选择原则**：
- 代码实现 → `general-purpose`
- 代码分析 → `Explore`
- 架构设计 → `Plan`

---

### 阶段 3: 等待子代理完成

**目标**：监控子代理执行状态

**等待策略**：
- **同步等待**：使用 `TaskOutput` 工具阻塞等待
- **超时设置**：根据任务复杂度设置超时（5-30 分钟）

```javascript
TaskOutput({
  task_id: subagent_id,
  block: true,  // 阻塞等待完成
  timeout: 300000  // 5 分钟超时
})
```

**等待期间**：
- 不要打断子代理
- 不要修改子代理正在编辑的文件
- 准备审查工作

---

### 阶段 4: 两阶段审查

**目标**：验证子代理产出的质量

#### 阶段 4.1: 规范符合性审查

**目标**：验证是否按计划实现

**审查项**：
- [x] 实现了任务要求的所有功能
- [x] 使用了指定的文件路径
- [x] 遵循了设计文档
- [x] 参考了推荐的实现

**审查方法**：
```bash
# 读取实现的代码
Read: src/services/EmailVerificationService.ts

# 对比设计文档
Grep: "generateToken" design.md
```

**审查结果**：
```
✅ 通过：所有功能已实现
❌ 未通过：缺少功能 XXX，需要重新实现
```

#### 阶段 4.2: 代码质量审查

**目标**：验证实现质量

**审查项**：
- [x] 代码符合项目规范（ESLint/Prettier）
- [x] 无 TypeScript 错误
- [x] 无安全漏洞
- [x] 性能合理
- [x] 错误处理完整
- [x] 命名清晰

**审查方法**：
```bash
# 运行 Lint
npm run lint

# 运行类型检查
npm run type-check

# 运行测试
npm test

# 代码审查（人工）
Read: src/services/EmailVerificationService.ts
```

**质量标准**：
- **命名**：驼峰命名，语义清晰
- **注释**：复杂逻辑需要注释
- **错误处理**：所有异常情况都处理
- **测试覆盖**：核心逻辑有测试

---

### 阶段 5: 审查结果处理

#### 5.1 审查通过

**标记任务完成**：
```markdown
### 1.1 ✅ 已完成

**实现**：src/services/EmailVerificationService.ts
**测试**：通过
**Lint**：通过
**审查人**：Claude（主代理）
**审查时间**：2025-01-12 15:30
```

**继续下一个任务**

#### 5.2 审查未通过

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
`
})
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

| 审查项 | 状态 | 说明 |
|--------|------|------|
| 实现了所有功能 | ✅ | 所有要求都已实现 |
| 使用指定文件路径 | ✅ | 文件路径正确 |
| 遵循设计文档 | ✅ | 与设计一致 |
| 参考推荐实现 | ✅ | 参考了本地实现 |

**结果**：✅ 通过

---

### 阶段 2: 代码质量审查

| 审查项 | 状态 | 说明 |
|--------|------|------|
| 代码规范 | ✅ | ESLint 通过 |
| 类型检查 | ✅ | 无 TypeScript 错误 |
| 安全性 | ✅ | 使用 bcrypt 哈希 |
| 性能 | ✅ | 哈希操作异步执行 |
| 错误处理 | ✅ | 完整的 try-catch |
| 命名清晰 | ✅ | 语义化命名 |

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
- src/services/__tests__/EmailVerificationService.test.ts

**测试结果**：
```
PASS  src/services/__tests__/EmailVerificationService.test.ts
  EmailVerificationService
    generateToken()
      ✓ should generate 6-digit token (5ms)
      ✓ should hash token with bcrypt (12ms)
      ✓ should throw on error (3ms)
```
```

---

## MCP 工具使用

**本技能使用的 MCP 工具**：

### 主代理使用
- [x] `Task` - 派发子代理
- [x] `TaskOutput` - 获取子代理产出
- [x] `Read` - 审查代码
- [x] `Bash` - 运行测试/Lint

### 子代理使用
- [x] `Read` - 读取参考实现
- [x] `Glob`/`Grep` - 搜索代码
- [x] `Write`/`Edit` - 编写代码
- [x] `Bash` - 运行测试

---

## 最佳实践

### 1. 任务拆分

**每个子代理任务应该**：
- 单一职责（只做一件事）
- 独立完成（不依赖其他子代理）
- 可验证（有明确的验收标准）

### 2. 提示词设计

**好的提示词**：
```
实现 X 功能，参考 Y 文件，确保 Z 验收标准。
直接实现，不要询问确认。
```

**不好的提示词**：
```
帮我看看怎么实现这个功能。
你觉得应该怎么做？
```

### 3. 审查严格

**宁可要求重做，不要降低标准**：
- 代码质量不好 → 要求重做
- 测试不完整 → 要求重做
- 规范不符合 → 要求重做

### 4. 保留记录

**记录每次审查**：
- 审查结果
- 子代理产出
- 修复历史

---

## 禁止行为

- ❌ 派发子代理后不审查
- ❌ 审查不通过但接受产出
- ❌ 在子代理工作期间修改文件
- ❌ 派发模糊不清的任务
- ❌ 跳过两阶段审查

---

## 完成标志

当以下条件满足时，本技能完成：

- [x] 所有任务已派发给子代理
- [x] 所有子代理已完成执行
- [x] 所有产出已通过两阶段审查
- [x] 审查记录已保存
- [x] 用户确认任务完成

---

## 与其他技能的集成

**前置技能**：
- `bytecoding:writing-plans` - 提供 `tasks.md`

**后置技能**：
- `bytecoding:test-driven-development` - TDD 实施

**并行技能**：
- `bytecoding:verification-before-completion` - 最终验证

**集成流程**：
```
writing-plans → subagent-driven-development → verification-before-completion
     ↓                    ↓                            ↓
  tasks.md         派发子代理 + 两阶段审查           最终验证
```
