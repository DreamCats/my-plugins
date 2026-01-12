---
name: test-driven-development
description: Use when implementing new features or fixing bugs. This skill enforces a mandatory RED-GREEN-REFACTOR cycle with verification checkpoints: RED (write failing test → verify failure) → GREEN (write minimal code → verify passing) → REFACTOR (improve code → verify still passing).
---

# Test-Driven Development 技能

通过强制 RED-GREEN-REFACTOR 循环和验证检查点，确保测试覆盖和代码质量。

## 工作流程检查清单（强制执行）

**复制以下检查清单并跟踪进度：**

```
TDD Cycle Progress:
- [ ] RED: 写失败测试
- [ ] RED Verify: 确认测试失败（看到正确的错误）
- [ ] GREEN: 写最少代码
- [ ] GREEN Verify: 确认测试通过
- [ ] REFACTOR: 重构代码
- [ ] REFACTOR Verify: 确认测试仍然通过
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

**核心铁律**：没有失败的测试，就没有生产代码。

---

## 步骤 1: RED - 写失败测试

**目标**：先写测试，确保测试失败并确认失败原因正确。

### 1.1 理解需求

**必须理解以下内容**：
- 阅读任务描述
- 确定输入和输出
- 识别边界条件

### 1.2 编写测试

**测试命名规则**：
```
✅ "should return 6-digit string"
✅ "should throw error when email is invalid"
✅ "should hash token with bcrypt"

❌ "test1"
❌ "generateToken"
❌ "it works"
```

**测试结构（AAA 模式）**：
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

### 1.3 运行测试并验证失败

**必须验证以下内容**：
- 测试运行失败
- 失败原因正确
- 记录失败信息

**在继续下一步之前，确认测试失败且失败原因正确。**

---

## 步骤 2: RED Verify - 确认失败

**目标**：必须看到正确的失败，不能跳过此步骤。

### 2.1 验证失败原因

**❌ 错误示例**：
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

**✅ 正确示例**：
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

### 2.2 失败验证检查清单

- [ ] 测试失败
- [ ] 失败原因正确（不是测试本身的问题）
- [ ] 理解为什么失败
- [ ] 记录失败信息

**当且仅当失败验证通过后，继续 GREEN 阶段。**

---

## 步骤 3: GREEN - 写最少代码

**目标**：写最少的代码让测试通过，不考虑通用性和优化。

### 3.1 分析失败原因

**关键问题**：
- 为什么测试失败？
- 缺少什么代码？

### 3.2 写最少的代码

**最少的代码示例**：
```typescript
// 测试
test('should return 6-digit string', () => {
  const token = generateToken();
  expect(token).toMatch(/^\d{6}$/);
});

// 最少的代码（GREEN）
function generateToken() {
  return '123456';  // 最少代码，让测试通过
}
```

**注意**：这样看似"作弊"，但符合 TDD 原则：
- 先让测试通过
- 下一个测试会强制改进

### 3.3 运行测试

**必须验证**：
- 测试通过
- 没有引入额外功能
- 代码可运行

**在继续下一步之前，确认测试通过。**

---

## 步骤 4: GREEN Verify - 确认通过

**目标**：确认测试通过，不引入额外功能。

### 4.1 验证通过

**GREEN Verify 检查清单**：
- [ ] 只写必要的代码
- [ ] 测试通过
- [ ] 没有引入额外功能
- [ ] 代码可运行

**当且仅当测试通过后，继续 REFACTOR 阶段。**

---

## 步骤 5: REFACTOR - 重构

**目标**：改进代码质量，保持测试通过。

### 5.1 识别改进点

**常见改进点**：
- 重复代码
- 命名不清
- 复杂逻辑

### 5.2 重构代码

**重构示例**：

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

### 5.3 运行测试

**必须验证**：
- 代码更清晰
- 消除重复
- 命名改进
- 测试仍然通过
- 没有改变行为

**在完成前，确认测试仍然通过。**

---

## 步骤 6: REFACTOR Verify - 确认仍然通过

**目标**：确认重构后测试仍然通过，行为未改变。

### 6.1 验证重构

**REFACTOR Verify 检查清单**：
- [ ] 代码更清晰
- [ ] 消除重复
- [ ] 命名改进
- [ ] 测试仍然通过
- [ ] 没有改变行为

**当且仅当所有条件满足时，本循环完成。**

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

### 逐步实现

#### 循环 1: generateToken

**RED**：
```typescript
it('should generate 6-digit string', () => {
  const token = service.generateToken();
  expect(token).toMatch(/^\d{6}$/);
});
```
运行：❌ 失败（方法不存在）

**RED Verify**：
- 失败原因：generateToken 方法未实现 ✅

**GREEN**：
```typescript
generateToken(): string {
  return '123456';
}
```
运行：✅ 通过

**GREEN Verify**：
- 测试通过 ✅
- 代码最少 ✅

**REFACTOR**：
```typescript
generateToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```
运行：✅ 通过

**REFACTOR Verify**：
- 测试仍然通过 ✅
- 代码改进 ✅

#### 循环 2: hashToken

**RED**：
```typescript
it('should hash token with bcrypt', async () => {
  const hash = await service.hashToken('123456');
  expect(hash).not.toBe('123456');
});
```
运行：❌ 失败

**RED Verify**：
- 失败原因：hashToken 方法未实现 ✅

**GREEN**：
```typescript
async hashToken(token: string): Promise<string> {
  return await bcrypt.hash(token, 10);
}
```
运行：✅ 通过

**GREEN Verify**：
- 测试通过 ✅

**REFACTOR**：
```typescript
async hashToken(token: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(token, saltRounds);
}
```
运行：✅ 通过

**REFACTOR Verify**：
- 测试仍然通过 ✅
- 命名改进 ✅

---

## 禁止行为

- ❌ **跳过 RED 阶段** - 直接写代码
- ❌ **跳过 RED Verify** - 不确认失败原因
- ❌ **跳过 GREEN** - 一次写完所有功能
- ❌ **跳过 GREEN Verify** - 不确认测试通过
- ❌ **跳过 REFACTOR** - 不改进代码质量
- ❌ **跳过 REFACTOR Verify** - 不确认测试仍然通过
- ❌ **测试后编写** - 先写代码后写测试
- ❌ **保留"参考代码"** - TODO 注释或参考链接
- ❌ **一次性编写多个测试** - 违反 TDD 循环原则

---

## MCP 工具使用

**本技能使用的 MCP 工具**：

### RED 阶段
- `Write` - 编写测试文件
- `Bash` - 运行测试（`npm test`）
- `Read` - 阅读测试输出

### GREEN 阶段
- `Write`/`Edit` - 编写生产代码
- `Bash` - 运行测试验证
- `Read` - 阅读代码

### REFACTOR 阶段
- `Edit` - 重构代码
- `Bash` - 运行测试验证
- `Grep` - 查找重复代码

---

## 输出格式

**技能完成时的输出应包括**：

1. **TDD 循环检查清单**（所有项目已勾选）
2. **测试文件摘要**
3. **实现代码摘要**
4. **测试结果**

**示例输出**：

```markdown
## TDD 技能完成

### TDD 循环
✓ 所有 6 个步骤已完成

### 测试覆盖
- generateToken: 3 个测试
- hashToken: 2 个测试
- verifyToken: 2 个测试

### 测试结果
```
PASS  src/services/EmailVerificationService.test.ts
  EmailVerificationService
    generateToken
      ✓ should generate 6-digit string (5 ms)
      ✓ should generate different tokens (2 ms)
      ✓ should generate tokens within valid range (3 ms)
    hashToken
      ✓ should hash token with bcrypt (15 ms)
      ✓ should generate different hashes for same token (12 ms)
    verifyToken
      ✓ should verify correct token (10 ms)
      ✓ should reject incorrect token (8 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

### 代码质量
- 测试覆盖率：95%
- 代码行数：45 行
- 重构次数：2 次
```

---

## 参考资源

- [Bytecoding 技术设计文档](../../BYTECODING_TECHNICAL_DESIGN.md) - 完整架构说明
- [subagent-driven-development 技能](../subagent-driven-development/SKILL.md) - 任务派发

---

## 技能元数据

- **技能类型**：开发类技能
- **强制流程**：是（6 步 TDD 循环）
- **核心铁律**：没有失败的测试，就没有生产代码
- **用户交互**：每个 Verify 步骤必须确认
- **完成标志**：所有检查清单项目已完成
- **测试覆盖率要求**：≥ 80%
