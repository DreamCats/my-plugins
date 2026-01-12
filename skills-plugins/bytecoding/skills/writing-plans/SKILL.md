---
name: writing-plans
description: Use when converting design documents into executable task lists. This skill analyzes design docs, breaks down work into fine-grained tasks (2-5 minutes each), and includes local + Repotalk MCP reference search for each task.
---

# Writing Plans 技能

## 目标

将设计方案转化为可执行的任务列表，每个任务足够细粒度（2-5 分钟完成）。

**输出**：`tasks.md`

---

## 工作流程

### 阶段 1: 分析设计文档

**目标**：完全理解设计文档的内容

**步骤**：
1. 仔细阅读 `design.md`
2. 识别核心组件和模块
3. 确定依赖关系
4. 识别潜在风险点

**分析检查清单**：
- [ ] 理解架构设计
- [ ] 识别所有新增/修改的文件
- [ ] 确定数据模型变更
- [ ] 识别 API 端点变更
- [ ] 确认测试策略

---

### 阶段 2: 细粒度任务拆分

**目标**：将设计拆分为 2-5 分钟可完成的任务

**粒度原则**：

#### ✅ 正确的粒度（2-5 分钟）

```markdown
- [ ] 创建 `EmailVerificationToken` 模型类
- [ ] 实现 `generateToken()` 方法（生成 6 位数字）
- [ ] 实现 `hashToken()` 方法（使用 bcrypt）
- [ ] 实现 `verifyToken()` 方法（验证令牌）
- [ ] 为 `EmailVerificationToken` 编写单元测试
```

#### ❌ 错误的粒度（太大）

```markdown
- [ ] 实现 EmailVerificationService（包含所有方法）
- [ ] 完成数据库迁移
- [ ] 实现 API 端点
```

#### ❌ 错误的粒度（太小）

```markdown
- [ ] 定义类名
- [ ] 添加 import 语句
- [ ] 编写左括号
```

**拆分技巧**：

1. **按方法拆分**：每个公共方法是一个任务
2. **按测试拆分**：每个测试场景是一个任务
3. **按文件拆分**：每个文件创建是一个任务
4. **按 TDD 循环拆分**：RED-GREEN-REFACTOR 各为一个任务

**TDD 任务拆分示例**：

```markdown
## EmailVerificationService

### RED Phase（写失败测试）
- [ ] 编写 `generateToken()` 失败测试
- [ ] 验证测试失败（看到正确错误）

### GREEN Phase（写最少代码）
- [ ] 实现 `generateToken()` 最少代码
- [ ] 验证测试通过

### REFACTOR Phase（重构）
- [ ] 重构 `generateToken()` 代码质量
- [ ] 验证测试仍然通过
```

---

### 阶段 3: 任务模板

**每个任务必须包含**：

```markdown
### [任务编号] [任务名称]

**描述**：[一句话描述任务内容]

**文件**：[精确的文件路径，如 `src/services/EmailVerificationService.ts`]

**参考**：
- 本地：`src/services/EmailService.ts`（类似实现）
- Repotalk：`project-a/auth/verification.go`（参考方案）

**输入**：[任务输入/依赖]
**输出**：[任务产出]

**验证**：
- [ ] 测试通过
- [ ] 代码符合 ESLint 规范
- [ ] 无 TypeScript 错误

**预计时间**：2-5 分钟
```

**任务示例**：

```markdown
### 1.1 创建 EmailVerificationToken 模型

**描述**：定义邮箱验证令牌的数据模型

**文件**：`src/models/EmailVerificationToken.ts`

**参考**：
- 本地：`src/models/User.ts`（模型模式）
- Repotalk：`project-b/models/verification_token.go`

**输入**：设计文档中的数据模型定义
**输出**：完整的 TypeORM 模型类

**代码框架**：
```typescript
@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryColumn('uuid')
  id: string;

  @Column('varchar')
  email: string;

  @Column('varchar')
  tokenHash: string;

  @Column('timestamp')
  expiresAt: Date;

  @Column('timestamp', { default: () => 'NOW()' })
  createdAt: Date;
}
```

**验证**：
- [ ] 模型类编译通过
- [ ] 字段类型正确
- [ ] 包含必要的装饰器

**预计时间**：3 分钟

---

### 1.2 创建数据库迁移

**描述**：创建 email_verification_tokens 表的迁移脚本

**文件**：`migrations/20250112_create_email_verification_tokens.sql`

**参考**：
- 本地：`migrations/20250110_create_users.sql`（迁移格式）
- Repotalk：`project-c/migrations/001_verification.up.sql`

**输入**：EmailVerificationToken 模型定义
**输出**：SQL 迁移脚本

**代码框架**：
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
);
```

**验证**：
- [ ] SQL 语法正确
- [ ] 包含索引（查询优化）
- [ ] 迁移脚本可回滚

**预计时间**：3 分钟
```

---

### 阶段 4: 本地参考搜索

**目标**：为每个任务找到本地参考实现

**搜索策略**：

#### 查找类似模型

```bash
# 查找现有模型
Glob: "**/models/*.ts"
Glob: "**/entities/*.ts"

# 读取类似模型
Read: src/models/User.ts
```

#### 查找类似服务

```bash
# 查找现有服务
Glob: "**/services/*.ts"

# 搜索服务方法
Grep: "class.*Service"
Grep: "async.*generate"
Grep: "async.*verify"
```

#### 查找测试模式

```bash
# 查找测试文件
Glob: "**/*.test.ts"
Glob: "**/*.spec.ts"

# 搜索测试模式
Grep: "describe.*Service"
Grep: "it.*should.*"
```

**本地参考检查清单**：
- [ ] 为每个模型找到参考模型
- [ ] 为每个服务找到参考服务
- [ ] 为每个测试找到参考测试
- [ ] 记录参考文件的路径

---

### 阶段 5: Repotalk 参考搜索

**目标**：为每个任务找到 Repotalk 参考实现

**搜索策略**：

#### 搜索类似实现

```javascript
// 搜索令牌生成
repotalk.search_code("token generation 6 digit")
repotalk.search_code("verification code generate")

// 搜索哈希存储
repotalk.search_code("hash token storage")
repotalk.search_code("bcrypt token")

// 搜索验证逻辑
repotalk.search_code("verify token email")
repotalk.search_code("email validation flow")

// 搜索数据库设计
repotalk.search_files("verification_token migration")
repotalk.search("CREATE TABLE verification")
```

**搜索技巧**：
- 使用具体的技术术语（TypeScript, TypeORM, bcrypt）
- 搜索"best practices"或"pattern"
- 查找字节内部类似项目
- 优先搜索同一语言/框架的实现

**Repotalk 参考检查清单**：
- [ ] 找到 1-2 个参考实现
- [ ] 记录参考项目路径
- [ ] 识别可复用的代码片段
- [ ] 注意安全和性能考虑

**注意**：如果 Repotalk MCP 连接失败，在任务中标注 `Repotalk: (连接失败，仅使用本地参考)`

---

## 输出格式

### tasks.md 结构

```markdown
# 任务列表：[变更名称]

**变更 ID**：[change-id]
**创建时间**：[YYYY-MM-DD]
**状态**：pending | in_progress | completed

---

## 概览

**总任务数**：X
**预计总时间**：X-Y 分钟

**任务分组**：
- 阶段 1: 数据模型 (X 个任务)
- 阶段 2: 服务层 (X 个任务)
- 阶段 3: API 层 (X 个任务)
- 阶段 4: 测试 (X 个任务)

---

## 阶段 1: [阶段名称]

### [任务组名称]

#### 1.1 [任务名称]

**描述**：[任务描述]

**文件**：[文件路径]

**参考**：
- 本地：`[本地参考路径]` - [参考说明]
- Repotalk：`[Repotalk 路径]` - [参考说明]

**输入**：[任务输入]
**输出**：[任务输出]

**代码框架**：
```typescript
// [代码框架]
```

**验证**：
- [ ] [验证条件 1]
- [ ] [验证条件 2]

**预计时间**：X 分钟

---

## 完成标准

- [ ] 所有任务完成
- [ ] 所有测试通过
- [ ] 代码审查通过
- [ ] 设计文档一致性确认

---

## 备注

[任何额外说明、注意事项、依赖关系]
```

---

## 任务依赖关系

**使用任务编号表示依赖**：

```markdown
## 依赖关系图

```
1.1 (创建模型)
  ↓
1.2 (创建迁移)
  ↓
2.1 (生成令牌) ← 1.1, 1.2
  ↓
2.2 (验证令牌) ← 2.1
  ↓
3.1 (API 端点) ← 2.2
```

**依赖原则**：
- 任务编号反映依赖关系（如 1.1 → 1.2 → 2.1）
- 明确标注依赖任务
- 避免循环依赖
```

---

## MCP 工具使用清单

**本技能强制使用以下 MCP 工具**：

### 本地工具
- [x] `Read` - 读取 `design.md`
- [x] `Glob` - 查找参考文件
- [x] `Grep` - 搜索代码模式

### Repotalk MCP（如果已配置）
- [x] `repotalk.search_code()` - 搜索实现参考
- [x] `repotalk.search_files()` - 查找文件参考
- [x] `repotalk.search()` - 组合搜索

---

## 禁止行为

- ❌ 任务粒度过大（> 5 分钟）
- ❌ 任务粒度过小（< 2 分钟）
- ❌ 跳过本地参考搜索
- ❌ 跳过 Repotalk 参考搜索
- ❌ 不包含验证标准
- ❌ 不标注依赖关系

---

## 完成标志

当以下条件满足时，本技能完成：

- [x] 完整分析 `design.md`
- [x] 任务粒度合适（2-5 分钟/任务）
- [x] 每个任务包含本地参考
- [x] 每个任务包含 Repotalk 参考（如果可用）
- [x] 依赖关系清晰
- [x] 验证标准明确
- [x] 生成 `tasks.md`
- [x] 用户确认任务列表

---

## 与其他技能的集成

**前置技能**：`bytecoding:brainstorming`
- 依赖 `brainstorming` 产出的 `design.md`

**后置技能**：`bytecoding:subagent-driven-development`
- 产出的 `tasks.md` 将由 `subagent-driven-development` 执行

**集成流程**：
```
brainstorming → writing-plans → subagent-driven-development
     ↓                ↓                      ↓
design.md       tasks.md           执行任务
```
