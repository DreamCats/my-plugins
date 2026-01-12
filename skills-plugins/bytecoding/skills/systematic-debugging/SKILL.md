---
name: systematic-debugging
description: Use when debugging code issues, errors, or unexpected behavior. This skill enforces a mandatory four-phase root cause analysis process: Root Cause Investigation → Pattern Analysis → Hypothesis Testing → Root Cause Fix. BEFORE any fix, you must complete multi-source search (local + Repotalk MCP) and systematic hypothesis verification.
---

# Systematic Debugging 技能

通过强制四阶段工作流和多源代码分析，找到问题的根本原因并实施正确的修复。

## 工作流程检查清单（强制执行）

**复制以下检查清单并跟踪进度：**

```
Debugging Progress:
- [ ] 步骤 1: 根因调查 - 收集信息，不修复任何东西
- [ ] 步骤 2: Repotalk MCP 搜索 - 查找类似问题和解决方案
- [ ] 步骤 3: 本地搜索分析 - 使用 Glob/Grep 找到相关代码
- [ ] 步骤 4: 综合分析 - 结合 Repotalk 和本地搜索结果
- [ ] 步骤 5: 模式分析 - 识别共性模式和系统性风险
- [ ] 步骤 6: 假设验证 - 科学验证修复假设
- [ ] 步骤 7: 根因修复 - 实施正确的修复
- [ ] 步骤 8: 验证完成 - 确认修复有效
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

---

## 步骤 1: 根因调查（必须等待理解问题）

在开始任何搜索之前，先完全理解问题。

**必须收集的信息**：
1. 错误消息是什么？
2. 何时发生？
3. 如何复现？
4. 影响范围是什么？

**信息收集模板**：
```markdown
## 问题描述

**错误消息**：
[完整的错误堆栈]

**发生时间**：[时间戳]

**复现步骤**：
1. [步骤 1]
2. [步骤 2]
3. [错误发生]

**影响范围**：
- [受影响的功能]
- [受影响的用户]

**环境**：
- [运行环境信息]
```

**在继续下一步之前，确认已收集完整信息。**

---

## 步骤 2: Repotalk MCP 搜索（必须优先执行）

**目标**：优先搜索字节内部代码库，查找类似问题和解决方案。

### 2.1 检查 Cookie 配置

```bash
# 检查 CAS Session Cookie 是否已配置
cat ~/.bytecoding/config.json
```

如果 Cookie 未配置或过期，在输出中明确标注，但仍继续执行本地搜索。

### 2.2 Repotalk MCP 搜索策略

**搜索类似错误**：
```javascript
// 搜索相同错误消息
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "Cannot read property email of undefined 错误修复"
})

// 搜索类似场景
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "undefined user email verify 处理"
})

// 搜索最佳实践
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "null check defensive programming TypeScript"
})
```

**搜索技巧**：
- 使用完整的错误消息片段
- 包含语言名称（TypeScript, Go 等）
- 搜索"最佳实践"或"修复方案"
- 查找防御性编程模式

**完成标志**：
- 找到 2-3 个类似问题
- 识别常见修复模式
- 记录预防措施

**如果 Repotalk 无结果**：
1. 检查 `repo_names` 格式是否正确（必须是 `org/repo`）
2. 检查 Cookie 是否过期
3. 尝试不同的搜索关键词
4. 在输出中明确标注"Repotalk 搜索无结果"

---

## 步骤 3: 本地搜索分析

**目标**：找到错误相关的代码。

### 3.1 本地搜索策略

**搜索错误位置**：
```bash
# 1. 搜索错误相关代码
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

**完成标志**：
- 找到错误发生的确切位置
- 理解相关代码逻辑
- 找到数据流（调用链）
- 找到相关测试

---

## 步骤 4: 综合分析

**目标**：结合 Repotalk 和本地搜索结果，识别根因。

**输出格式**：对比分析表

```markdown
## 综合分析

### Repotalk 搜索结果（字节内部参考）
| 项目 | 问题 | 修复方案 |
|------|------|----------|
| project-a | 直接访问属性导致错误 | 添加可选链操作符 |
| project-b | 未检查 null 返回值 | 添加早期返回 |
| project-c | 类型定义不严格 | 使用 NonNullable 类型 |

### 本地发现
| 维度 | 发现 |
|------|------|
| 错误位置 | src/services/UserService.ts:42 |
| 调用链 | API → Controller → UserService.verifyEmail |
| 代码逻辑 | 直接访问 user.email，未检查 user 是否存在 |
| 数据来源 | getUserByToken() 可能返回 null |
| 测试覆盖 | 缺少 null 情况的测试 |

### 根因分析
1. **直接原因**：getUserByToken() 返回 null 时，代码未检查直接访问 user.email
2. **根本原因**：缺少防御性编程实践
3. **系统性问题**：类型定义不严格，测试覆盖不足

### 风险评估
- **严重性**：高（导致服务崩溃）
- **影响范围**：所有类似方法
- **紧急程度**：高（生产环境错误）
```

**分析要点**：
- 对比 2-3 种可能的修复方案
- 识别每种方案的优缺点
- 评估风险和注意事项
- 推荐最合适的方案（带理由）

---

## 步骤 5: 模式分析

**目标**：识别问题的共性模式和潜在风险。

### 5.1 代码模式识别

**识别危险模式**：
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
  // 可能返回 null，但类型未标注
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

### 5.2 影响范围分析

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

### 5.3 系统性建议

**识别系统性问题**：
- 是否缺乏类型安全？
- 是否缺少防御性编程规范？
- 测试覆盖是否不足？
- 代码审查是否未发现此问题？

**输出格式**：
```markdown
## 模式分析结果

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

**系统性建议**：
1. 启用 strictNullChecks
2. 添加 ESLint 规则强制防御性编程
3. 要求所有新代码包含边界测试
```

---

## 步骤 6: 假设验证（科学方法）

**目标**：科学验证修复假设，确保找到真正的根因。

### 6.1 假设验证流程

**科学方法**：
1. **形成假设**："添加 null 检查可以修复问题"
2. **设计实验**：编写测试验证假设
3. **执行实验**：运行测试
4. **分析结果**：确认或否定假设
5. **迭代假设**：如果否定，形成新假设

### 6.2 假设 1：添加 null 检查

**假设**：添加 null 检查可以修复 TypeError

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

### 6.3 对比备选方案（可选）

**假设 2：使用可选链**
```typescript
async verifyEmail(token: string): Promise<boolean> {
  const user = await this.getUserByToken(token);
  return user?.emailVerified ?? false;
}
```

**对比验证**：
- 假设 1：显式 null 检查（更清晰）
- 假设 2：可选链（更简洁）

**决策**：采用假设 1（显式检查更符合项目风格）

**输出格式**：
```markdown
## 假设验证结果

### 假设 1：添加显式 null 检查
**实验结果**：✅ 假设成立

### 假设 2：使用可选链（备选）
**结论**：❌ 不采用（项目风格要求显式检查）

### 最终方案
采用假设 1：添加显式 null 检查 + 抛出错误
```

---

## 步骤 7: 根因修复

**目标**：实施正确的修复，确保问题不再发生。

### 7.1 实施修复

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

### 7.2 添加测试

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

### 7.3 预防措施

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

---

## 步骤 8: 验证完成

**完成标志检查清单**：

```
✓ 完成根因调查（收集完整信息）
✓ 完成 Repotalk MCP 搜索（找到 2-3 个参考实现）
✓ 完成本地搜索（找到错误位置和相关代码）
✓ 产出综合分析表（结合两者结果）
✓ 完成模式分析（识别系统性风险）
✓ 完成假设验证（科学验证修复）
✓ 实施根因修复（不是表面修复）
✓ 添加测试覆盖
✓ 验证修复有效
✓ 实施预防措施
```

**当且仅当所有上述条件满足时，本技能完成。**

---

## 禁止行为

- ❌ **跳过 Repotalk MCP 搜索** - 必须优先执行
- ❌ **repo_names 格式错误** - 必须使用 `org/repo` 格式
- ❌ **跳过本地搜索** - 必须在 Repotalk 搜索后执行
- ❌ **跳过综合分析** - 必须结合两者结果
- ❌ **跳过模式分析** - 只修复当前问题，不查找类似风险
- ❌ **跳过假设验证** - 不测试就部署修复
- ❌ **只修复表面** - 添加 try-catch 忽略错误
- ❌ **单一来源搜索** - 只用本地 OR 只用 Repotalk

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

## MCP 工具使用

**本技能强制按顺序使用以下 MCP 工具**：

### 优先执行：Repotalk MCP

```javascript
// search_nodes - 语义化代码搜索
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "搜索问题"
})

// get_repos_detail - 获取仓库详情
repotalk.get_repos_detail({
  repo_names: ["org/repo"]
})

// get_nodes_detail - 获取节点详情
repotalk.get_nodes_detail({
  repo_name: "org/repo",
  node_ids: ["node_id"]
})

// get_files_detail - 获取文件详情
repotalk.get_files_detail({
  repo_name: "org/repo",
  file_path: "path/to/file"
})
```

**重要**：使用正确的 `repo_names` 格式（`org/repo`）

### 后续执行：本地工具

- `Glob` - 查找相关文件
- `Grep` - 搜索代码模式
- `Read` - 读取文件内容

---

## 输出格式

**技能完成时的输出应包括**：

1. **工作流程检查清单**（所有项目已勾选）
2. **问题描述摘要**
3. **搜索结果摘要**（Repotalk + 本地）
4. **综合分析表**
5. **模式分析结果**
6. **假设验证结果**
7. **修复方案摘要**
8. **验证结果**

**示例输出**：

```markdown
## Systematic Debugging 技能完成

### 工作流程
✓ 所有 8 个步骤已完成

### 问题描述
- 错误：TypeError: Cannot read property 'email' of undefined
- 位置：src/services/UserService.ts:42
- 影响：所有邮箱验证请求失败

### 搜索结果
- Repotalk：找到 3 个类似问题和修复方案
- 本地：找到 6 处类似风险点

### 根因分析
根本原因：getUserByToken() 返回 null 时未检查直接访问属性

### 修复方案
采用显式 null 检查 + 抛出 ValidationError

### 验证结果
- ✅ 所有测试通过
- ✅ 覆盖率从 70% 提升到 95%
- ✅ 手动验证通过

### 预防措施
- 启用 strictNullChecks
- 添加 ESLint 严格布尔表达式规则
- 要求所有新代码包含边界测试
```

---

## 参考资源

- [Repotalk MCP 工具使用说明](../../scripts/session-start-hook.js) - 在 SessionStart Hook 的 additionalContext 中
- [Bytecoding 技术设计文档](../../BYTECODING_TECHNICAL_DESIGN.md) - 完整架构说明

---

## 技能元数据

- **技能类型**：调试类技能
- **强制流程**：是（8 步工作流）
- **工具限制**：Repotalk MCP 必须优先于本地工具
- **用户交互**：必须在步骤 1 确认理解问题
- **完成标志**：所有检查清单项目已完成
- **核心铁律**：没有根因调查，不允许修复
