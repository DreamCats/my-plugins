---
name: test-driven-development
description: Use when implementing new features or fixing bugs. This skill enforces the RED-GREEN-REFACTOR TDD cycle, ensuring test coverage and high code quality.
---

# Test-Driven Development 技能

## 目标

强制执行 TDD 流程，通过 RED-GREEN-REFACTOR 循环确保代码质量。

**核心铁律**：没有失败的测试，就没有生产代码。

---

## TDD 循环

### RED → GREEN → REFACTOR

```
┌─────────┐    ┌─────────┐    ┌─────────────┐
│   RED   │ →  │  GREEN  │ →  │  REFACTOR   │
│ 写失败测试 │    │ 写最少代码 │    │    重构    │
└─────────┘    └─────────┘    └─────────────┘
     ↑                              │
     └──────────────────────────────┘
```

**每个循环**：
1. **RED**：写一个失败的测试
2. **Verify**：确认测试失败（看到正确的错误）
3. **GREEN**：写最少的代码让测试通过
4. **Verify**：确认测试通过
5. **REFACTOR**：重构代码（保持测试通过）
6. **Verify**：确认测试仍然通过

---

## 铁律

### 1. 没有失败的测试，就没有生产代码

**永远先写测试**。

❌ **错误**：
```typescript
// 先写代码
function generateToken() {
  return '123456';
}

// 后写测试
test('generateToken', () => {
  expect(generateToken()).toBe('123456');
});
```

✅ **正确**：
```typescript
// 先写测试
test('generateToken should return 6-digit string', () => {
  const token = generateToken();
  expect(token).toMatch(/^\d{6}$/);
});

// 后写代码
function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### 2. 必须看到正确的失败

**测试失败后，必须确认失败原因是正确的**。

❌ **错误**：
```typescript
// 测试失败，但直接写代码
test('generateToken', () => {
  expect(generateToken()).toBe('123456');
  // 失败：Expected '123456', received 'undefined'
  // 立即写代码，不分析失败原因
});

function generateToken() {
  return '123456';  // 直接返回固定值通过测试
}
```

✅ **正确**：
```typescript
// 测试失败
test('generateToken', () => {
  const token = generateToken();
  expect(token).toMatch(/^\d{6}$/);  // 失败：token 是 undefined
});

// 分析失败原因：函数未实现
// 写最少的代码让测试通过
function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### 3. 不要保留"参考代码"

**测试通过后，删除所有参考代码/注释**。

❌ **错误**：
```typescript
function generateToken() {
  // TODO: 使用更安全的随机数生成
  // 参考：https://example.com/secure-random
  return Math.random().toString().slice(2, 8);
}
```

✅ **正确**：
```typescript
function generateToken() {
  return crypto.randomInt(100000, 999999).toString();
}
```

### 4. 测试后编写是绝对禁止的

**即使是"显而易见"的代码，也要先写测试**。

---

## RED 阶段：写失败测试

### 步骤

1. **理解需求**
   - 阅读任务描述
   - 确定输入和输出
   - 识别边界条件

2. **编写测试**
   - 使用清晰的测试名称
   - 测试单个行为
   - 包含边界条件

3. **运行测试**
   - 确认测试失败
   - 确认失败原因正确

### 测试命名

**好的测试名称**：
```
✅ "should return 6-digit string"
✅ "should throw error when email is invalid"
✅ "should hash token with bcrypt"
```

**不好的测试名称**：
```
❌ "test1"
❌ "generateToken"
❌ "it works"
```

### 测试结构（AAA 模式）

```typescript
test('should return 6-digit string', () => {
  // Arrange（准备）
  const expectedLength = 6;

  // Act（执行）
  const token = generateToken();

  // Assert（断言）
  expect(token).toHaveLength(expectedLength);
  expect(token).toMatch(/^\d{6}$/);
});
```

### RED 阶段检查清单

- [ ] 测试名称清晰
- [ ] 测试单个行为
- [ ] 包含边界条件
- [ ] 测试运行失败
- [ ] 失败原因正确
- [ ] 记录失败信息

---

## GREEN 阶段：写最少代码

### 步骤

1. **分析失败原因**
   - 为什么测试失败？
   - 缺少什么代码？

2. **写最少的代码**
   - 只写让测试通过的代码
   - 不考虑通用性
   - 不考虑优化

3. **运行测试**
   - 确认测试通过

### 代码示例

**测试**：
```typescript
test('should return 6-digit string', () => {
  const token = generateToken();
  expect(token).toMatch(/^\d{6}$/);
});
```

**最少的代码（GREEN）**：
```typescript
function generateToken() {
  return '123456';  // 最少代码，让测试通过
}
```

**注意**：这样看似"作弊"，但符合 TDD 原则：
- 先让测试通过
- 下一个测试会强制改进

**下一个测试**：
```typescript
test('should return different values', () => {
  const token1 = generateToken();
  const token2 = generateToken();
  expect(token1).not.toBe(token2);
});
```

**改进代码**：
```typescript
function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### GREEN 阶段检查清单

- [ ] 只写必要的代码
- [ ] 测试通过
- [ ] 没有引入额外功能
- [ ] 代码可运行

---

## REFACTOR 阶段：重构

### 步骤

1. **识别改进点**
   - 重复代码
   - 命名不清
   - 复杂逻辑

2. **重构代码**
   - 提取函数
   - 改进命名
   - 简化逻辑

3. **运行测试**
   - 确认测试仍然通过

### 重构示例

**重构前**：
```typescript
function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

**重构后**：
```typescript
function generateNumericCode(length: number = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
}

function generateToken(): string {
  return generateNumericCode(6);
}

function generateOTP(): string {
  return generateNumericCode(6);
}
```

### REFACTOR 阶段检查清单

- [ ] 代码更清晰
- [ ] 消除重复
- [ ] 命名改进
- [ ] 测试仍然通过
- [ ] 没有改变行为

---

## 完整示例：邮箱验证服务

### 测试文件

```typescript
// EmailVerificationService.test.ts

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;

  beforeEach(() => {
    service = new EmailVerificationService();
  });

  describe('generateToken', () => {
    it('should generate 6-digit string', () => {
      const token = service.generateToken();
      expect(token).toMatch(/^\d{6}$/);
    });

    it('should generate different tokens', () => {
      const token1 = service.generateToken();
      const token2 = service.generateToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens within valid range', () => {
      const token = service.generateToken();
      const num = parseInt(token, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    });
  });

  describe('hashToken', () => {
    it('should hash token with bcrypt', async () => {
      const token = '123456';
      const hash = await service.hashToken(token);
      expect(hash).not.toBe(token);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same token', async () => {
      const token = '123456';
      const hash1 = await service.hashToken(token);
      const hash2 = await service.hashToken(token);
      expect(hash1).not.toBe(hash2);  // bcrypt 使用随机盐
    });
  });

  describe('verifyToken', () => {
    it('should verify correct token', async () => {
      const token = '123456';
      const hash = await service.hashToken(token);
      const isValid = await service.verifyToken(token, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect token', async () => {
      const token = '123456';
      const hash = await service.hashToken(token);
      const isValid = await service.verifyToken('654321', hash);
      expect(isValid).toBe(false);
    });
  });
});
```

### 实现文件（逐步完成）

#### 循环 1: generateToken

**RED**：
```typescript
it('should generate 6-digit string', () => {
  const token = service.generateToken();
  expect(token).toMatch(/^\d{6}$/);
});
```
运行：❌ 失败（方法不存在）

**GREEN**：
```typescript
generateToken(): string {
  return '123456';
}
```
运行：✅ 通过

**REFACTOR**：
```typescript
generateToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```
运行：✅ 通过

#### 循环 2: hashToken

**RED**：
```typescript
it('should hash token with bcrypt', async () => {
  const hash = await service.hashToken('123456');
  expect(hash).not.toBe('123456');
});
```
运行：❌ 失败

**GREEN**：
```typescript
async hashToken(token: string): Promise<string> {
  return await bcrypt.hash(token, 10);
}
```
运行：✅ 通过

**REFACTOR**：
```typescript
async hashToken(token: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(token, saltRounds);
}
```
运行：✅ 通过

---

## 与任务执行集成

### 在 subagent-driven-development 中使用 TDD

**派发子代理时**：
```javascript
Task({
  subagent_type: "general-purpose",
  description: "实现邮箱验证令牌生成（TDD）",
  prompt: `请使用 TDD 实现 generateToken() 方法。

## TDD 要求

1. RED：先写测试（包含 3 个测试用例）
2. Verify：确认测试失败
3. GREEN：写最少代码让测试通过
4. Verify：确认测试通过
5. REFACTOR：重构代码
6. Verify：确认测试仍然通过

## 测试要求
- 生成 6 位数字
- 每次生成不同值
- 在有效范围内（100000-999999）

请严格遵循 TDD 流程，不要跳过任何阶段。
`
})
```

### 审查 TDD 合规性

**审查项**：
- [ ] 测试文件存在
- [ ] 测试先于代码编写
- [ ] 测试覆盖核心逻辑
- [ ] 测试全部通过
- [ ] 代码有测试保护

---

## MCP 工具使用

**本技能使用的 MCP 工具**：

### 测试阶段
- [x] `Write` - 编写测试文件
- [x] `Bash` - 运行测试（`npm test`）
- [x] `Read` - 阅读测试输出

### 实现阶段
- [x] `Write`/`Edit` - 编写生产代码
- [x] `Bash` - 运行测试验证
- [x] `Read` - 阅读代码

### 重构阶段
- [x] `Edit` - 重构代码
- [x] `Bash` - 运行测试验证
- [x] `Grep` - 查找重复代码

---

## 禁止行为

- ❌ 跳过 RED 阶段（直接写代码）
- ❌ 跳过 Verify（不确认失败/通过）
- ❌ 跳过 GREEN（一次写完所有功能）
- ❌ 跳过 REFACTOR（不改进代码质量）
- ❌ 测试后编写
- ❌ 保留"参考代码"
- ❌ 一次性编写多个测试

---

## 完成标志

当以下条件满足时，本技能完成：

- [x] 所有测试已编写（RED）
- [x] 所有失败已验证（Verify RED）
- [x] 所有代码已实现（GREEN）
- [x] 所有测试已通过（Verify GREEN）
- [x] 代码已重构（REFACTOR）
- [x] 测试仍然通过（Verify REFACTOR）
- [x] 测试覆盖率 ≥ 80%

---

## 与其他技能的集成

**前置技能**：
- `bytecoding:subagent-driven-development` - 任务派发

**并行技能**：
- `bytecoding:verification-before-completion` - 最终验证

**集成流程**：
```
subagent-driven-development → test-driven-development → verification-before-completion
        ↓                           ↓                          ↓
    派发任务                  TDD 实施代码                 最终验证
```
