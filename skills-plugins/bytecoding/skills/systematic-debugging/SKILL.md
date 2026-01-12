---
name: systematic-debugging
description: Use when debugging code issues, errors, or unexpected behavior. This skill enforces a four-phase root cause analysis process with multi-source search (local + repotalk MCP) and systematic hypothesis verification.
---

# Systematic Debugging 技能

## 目标

通过系统化的四阶段根因分析流程，找到问题的根本原因并实施正确的修复。

**核心铁律**：没有根因调查，不允许修复。

---

## 四阶段流程

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  阶段 1: 根因调查  │ →  │  阶段 2: 模式分析  │ →  │  阶段 3: 假设验证  │ →  │  阶段 4: 根因修复  │
│   (不修复任何东西)  │    │   (识别共性模式)   │    │  (科学验证假设)    │    │   (正确修复)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 阶段 1: 根因调查（Root Cause Investigation）

**目标**：收集所有相关信息，**不修复任何东西**

### 步骤

#### 1.1 理解问题

**收集信息**：
- 错误消息是什么？
- 何时发生？
- 如何复现？
- 影响范围是什么？

**信息收集模板**：
```markdown
## 问题描述

**错误消息**：
```
TypeError: Cannot read property 'email' of undefined
  at UserService.verifyEmail (src/services/UserService.ts:42:15)
  at processTicksAndRejections (node:internal/process/task_queues:96:5)
```

**发生时间**：2025-01-12 15:30:00

**复现步骤**：
1. 调用 POST /api/auth/verify-email
2. 传递 { "token": "123456" }
3. 错误发生

**影响范围**：
- 所有邮箱验证请求
- 用户无法完成注册流程

**环境**：
- Node.js v20.19.0
- 生产环境
```

#### 1.2 本地搜索分析

**目标**：找到错误相关的代码

**搜索策略**：

```bash
# 1. 搜索错误位置
Grep: "verifyEmail" -A 5 -B 5

# 2. 搜索相关类型定义
Grep: "interface.*User"
Grep: "type.*User"

# 3. 搜索类似错误处理
Grep: "Cannot read property"
Grep: "undefined.*email"

# 4. 查找测试文件
Glob: "**/*verify*.test.ts"
Glob: "**/*UserService*.test.ts"
```

**本地搜索检查清单**：
- [ ] 找到错误发生的确切位置
- [ ] 理解相关代码逻辑
- [ ] 找到数据流（调用链）
- [ ] 找到相关测试

#### 1.3 Repotalk MCP 搜索

**目标**：查找类似问题和解决方案

**搜索策略**：

```javascript
// 搜索类似错误
repotalk.search_code("Cannot read property email of undefined")
repotalk.search_code("undefined user email verify")

// 搜索修复方案
repotalk.search_code("fix undefined user property")
repotalk.search_code("user validation null check")

// 搜索最佳实践
repotalk.search("null check user service")
repotalk.search("defensive programming typescript")
```

**Repotalk 搜索检查清单**：
- [ ] 找到 2-3 个类似问题
- [ ] 识别常见修复模式
- [ ] 记录预防措施

### 输出格式

```markdown
## 阶段 1: 根因调查

### 错误分析
**错误类型**：TypeError
**错误位置**：src/services/UserService.ts:42
**调用链**：API → Controller → UserService.verifyEmail

### 本地发现
| 文件 | 发现 |
|------|------|
| UserService.ts:42 | 直接访问 user.email，未检查 user 是否存在 |
| UserService.ts:38 | getUserByToken() 可能返回 null |
| UserService.test.ts | 缺少 null 情况的测试 |

### Repotalk 参考
| 项目 | 问题 | 修复 |
|------|------|------|
| project-a | 直接访问属性导致错误 | 添加可选链操作符 |
| project-b | 未检查 null 返回值 | 添加早期返回 |
| project-c | 类型定义不严格 | 使用 NonNullable 类型 |

### 调查结论
问题：getUserByToken() 返回 null 时，代码未检查直接访问 user.email
根因：缺少防御性编程实践
```

---

## 阶段 2: 模式分析（Pattern Analysis）

**目标**：识别问题的共性模式和潜在风险

### 分析维度

#### 2.1 代码模式

**识别模式**：
```markdown
**模式 1：直接访问属性**
```typescript
// ❌ 危险模式
const email = user.email;  // user 可能是 null
```

**模式 2：缺少类型检查**
```typescript
// ❌ 危险模式
function getUserByToken(token: string): User {
  // 可能返回 null
}
```

**模式 3：缺少边界测试**
```typescript
// ❌ 测试覆盖不足
test('verifyEmail', () => {
  const user = mockUser();  // 总是返回有效 user
  // 未测试 null 情况
});
```
```

#### 2.2 影响范围分析

**搜索类似模式**：
```bash
# 搜索其他直接访问
Grep: "user\.email"
Grep: "user\.name"
Grep: "\.email" --type ts

# 搜索返回类型可能为 null 的函数
Grep: "Promise<User>"
Grep: "-> User"
```

**影响范围清单**：
- [ ] 列出所有类似风险点
- [ ] 评估每个风险点的严重性
- [ ] 确定修复优先级

#### 2.3 系统性风险

**识别系统性问题**：
- 是否缺乏类型安全？
- 是否缺少防御性编程规范？
- 测试覆盖是否不足？
- 代码审查是否未发现此问题？

### 输出格式

```markdown
## 阶段 2: 模式分析

### 代码模式识别
| 模式 | 风险等级 | 出现次数 |
|------|----------|----------|
| 直接访问可能为 null 的对象 | 高 | 8 处 |
| 函数返回类型未标记 nullable | 中 | 5 处 |
| 缺少 null 检查 | 高 | 12 处 |

### 影响范围
**受影响的文件**：
- src/services/UserService.ts（3 处风险）
- src/controllers/AuthController.ts（2 处风险）
- src/repositories/UserRepository.ts（1 处风险）

**潜在风险**：
- 所有类似方法都可能崩溃
- 生产环境可能出现大量错误

### 系统性建议
1. 添加 ESLint 规则：强制使用可选链
2. 启用 strictNullChecks
3. 要求所有新代码包含 null 测试
```

---

## 阶段 3: 假设验证（Hypothesis Testing）

**目标**：科学验证修复假设，确保找到真正的根因

### 假设方法

**科学方法**：
1. **形成假设**："添加 null 检查可以修复问题"
2. **设计实验**：编写测试验证假设
3. **执行实验**：运行测试
4. **分析结果**：确认或否定假设
5. **迭代假设**：如果否定，形成新假设

### 假设验证流程

#### 假设 1：添加 null 检查

**假设**：添加 null 检查可以修复错误

**实验代码**：
```typescript
// 添加 null 检查
async verifyEmail(token: string): Promise<boolean> {
  const user = await this.getUserByToken(token);

  // 添加检查
  if (!user) {
    return false;
  }

  // 现在安全访问
  return user.emailVerified;
}
```

**验证测试**：
```typescript
describe('verifyEmail with null user', () => {
  it('should return false when user not found', async () => {
    // Mock 返回 null
    jest.spyOn(service, 'getUserByToken').mockResolvedValue(null);

    const result = await service.verifyEmail('invalid-token');

    expect(result).toBe(false);
  });
});
```

**执行实验**：
```bash
npm test -- verifyEmail
```

**分析结果**：
```
✅ 测试通过
✅ 错误不再发生
✅ 假设成立
```

#### 假设 2（可选）：使用可选链

**假设**：使用可选链操作符更优雅

**实验代码**：
```typescript
async verifyEmail(token: string): Promise<boolean> {
  const user = await this.getUserByToken(token);

  // 使用可选链
  return user?.emailVerified ?? false;
}
```

**对比验证**：
- 假设 1：显式 null 检查（更清晰）
- 假设 2：可选链（更简洁）

**决策**：采用假设 1（显式检查更符合项目风格）

### 输出格式

```markdown
## 阶段 3: 假设验证

### 假设 1：添加 null 检查
**假设**：添加显式 null 检查可以修复 TypeError

**实验设计**：
- 编写 null 情况测试
- 添加 null 检查代码
- 运行测试验证

**实验结果**：
```
✅ PASS  verifyEmail should return false when user not found
✅ PASS  verifyEmail should not throw on null user
```

**结论**：✅ 假设成立

### 假设 2：使用可选链（备选）
**结论**：❌ 不采用（项目风格要求显式检查）

### 最终方案
采用假设 1：添加显式 null 检查 + 抛出错误
```

---

## 阶段 4: 根因修复（Root Cause Fix）

**目标**：实施正确的修复，确保问题不再发生

### 修复步骤

#### 4.1 实施修复

**修复代码**：
```typescript
async verifyEmail(token: string): Promise<boolean> {
  const user = await this.getUserByToken(token);

  // 修复：添加 null 检查
  if (!user) {
    throw new ValidationError('Invalid verification token');
  }

  return user.emailVerified;
}
```

**类型定义修复**：
```typescript
// 明确返回类型可能为 null
async getUserByToken(token: string): Promise<User | null> {
  const user = await this.userRepository.findByToken(token);
  return user || null;
}
```

#### 4.2 添加测试

**测试覆盖**：
```typescript
describe('verifyEmail edge cases', () => {
  it('should throw error on invalid token', async () => {
    await expect(
      service.verifyEmail('invalid')
    ).rejects.toThrow(ValidationError);
  });

  it('should handle null user gracefully', async () => {
    jest.spyOn(service, 'getUserByToken').mockResolvedValue(null);
    await expect(
      service.verifyEmail('token')
    ).rejects.toThrow();
  });
});
```

#### 4.3 预防措施

**系统性预防**：
```typescript
// 启用严格检查
// tsconfig.json
{
  "compilerOptions": {
    "strictNullChecks": true
  }
}

// 添加 ESLint 规则
// .eslintrc.js
{
  "rules": {
    "@typescript-eslint/strict-boolean-expressions": "error"
  }
}
```

### 验证修复

```markdown
## 修复验证

### 测试验证
```bash
npm test -- --coverage
```
**结果**：
```
✅ PASS  所有测试通过
✅ Coverage: 95% (之前 70%)
```

### 手动验证
```bash
# 测试正常流程
curl -X POST /api/auth/verify-email -d '{"token":"valid"}'
# ✅ 返回 200

# 测试错误流程
curl -X POST /api/auth/verify-email -d '{"token":"invalid"}'
# ✅ 返回 400，错误消息清晰
```

### 代码审查
- [ ] 修复符合项目规范
- [ ] 错误处理完整
- [ ] 类型定义正确
- [ ] 测试覆盖充分

### 部署检查
- [ ] 配置未更改
- [ ] 数据库无需迁移
- [ ] API 兼容性保持
```

---

## MCP 工具使用清单

**本技能强制使用的 MCP 工具**：

### 阶段 1：根因调查
- [x] `Grep` - 搜索错误相关代码
- [x] `Glob` - 查找相关文件
- [x] `Read` - 阅读错误代码
- [x] `repotalk.search_code()` - 搜索类似问题
- [x] `repotalk.search()` - 搜索解决方案

### 阶段 2：模式分析
- [x] `Grep` - 搜索类似模式
- [x] `Read` - 阅读相关代码
- [x] `repotalk.search_code()` - 搜索模式

### 阶段 3：假设验证
- [x] `Write` - 编写测试
- [x] `Edit` - 修改代码
- [x] `Bash` - 运行测试

### 阶段 4：根因修复
- [x] `Edit` - 实施修复
- [x] `Write` - 添加测试
- [x] `Bash` - 验证修复

---

## 禁止行为

- ❌ **跳过根因调查**：看到错误就修复
- ❌ **跳过模式分析**：只修复当前问题，不查找类似风险
- ❌ **跳过假设验证**：不测试就部署修复
- ❌ **只修复表面**：添加 try-catch 忽略错误
- ❌ **单一来源**：只用本地搜索 OR 只用 Repotalk

---

## 禁止的"修复"模式

### ❌ 吞掉错误

```typescript
// 禁止
try {
  return user.email;
} catch (e) {
  return null;  // 隐藏了真正的问题
}
```

### ❌ 添加类型断言

```typescript
// 禁止
return (user as User).email;  // 强制断言，不安全
```

### ❌ 可选链过度使用

```typescript
// 禁止（过度使用）
return user?.email?.toString()?.toLowerCase();  // 掩盖了设计问题
```

### ✅ 正确的修复

```typescript
// 正确
if (!user) {
  throw new ValidationError('User not found');
}
return user.email;
```

---

## 调试记录模板

```markdown
# 调试报告：[问题简述]

**日期**：YYYY-MM-DD
**调试人**：Claude
**状态**：Completed

---

## 问题描述
[错误消息、复现步骤、影响范围]

---

## 阶段 1: 根因调查
### 错误分析
[详细分析]

### 本地发现
[本地代码分析]

### Repotalk 参考
[类似问题和修复]

---

## 阶段 2: 模式分析
### 代码模式
[识别的模式]

### 影响范围
[受影响的代码]

### 系统性建议
[预防措施]

---

## 阶段 3: 假设验证
### 假设 1
[假设、实验、结果]

### 最终方案
[选择的方案]

---

## 阶段 4: 根因修复
### 修复代码
[修复内容]

### 测试
[添加的测试]

### 验证结果
[测试结果]

---

## 总结
**根因**：[根本原因]
**修复**：[修复方法]
**预防**：[预防措施]
**状态**：✅ 已修复并验证
```

---

## 完成标志

当以下条件满足时，本技能完成：

- [x] 完成根因调查（本地 + Repotalk）
- [x] 完成模式分析（识别系统性风险）
- [x] 完成假设验证（科学验证修复）
- [x] 实施根因修复（不是表面修复）
- [x] 添加测试覆盖
- [x] 验证修复有效
- [x] 记录调试报告
- [x] 实施预防措施

---

## 与其他技能的集成

**独立技能**：可单独调用

**集成场景**：
- `subagent-driven-development` 执行失败时调用
- `verification-before-completion` 发现问题时调用

**集成流程**：
```
subagent-driven-development
    ↓
[任务失败]
    ↓
systematic-debugging → 找到根因 → 修复
    ↓
verification-before-completion → 验证修复
```
