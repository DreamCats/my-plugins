---
name: writing-plans
description: Use when converting design documents into executable task lists. This skill enforces a mandatory workflow: analyze design → generate fine-grained tasks (2-5 minutes each) with clear task documentation.
---

# Writing Plans 技能

通过强制工作流，将设计方案转化为可执行的任务列表。

**默认策略**：除非用户明确要求，否则不安排单元测试任务；验证以编译/构建或手动验证为主。

## 工作流程检查清单（强制执行）

**复制或者 使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Writing Plans Progress:
- [ ] 步骤 1: 分析设计文档 - 完全理解 design.md 内容
- [ ] 步骤 2: 细粒度任务拆分 - 2-5 分钟/任务
- [ ] 步骤 3: 生成任务列表 - 创建 tasks.md
- [ ] 步骤 4: 验证完成 - 确认任务列表完整
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

---

## 步骤 1: 分析设计文档（必须完全理解）

**目标**：完全理解设计文档的内容。

### 1.1 读取设计文档

```bash
# 读取设计文档
Read: .bytecoding/changes/$CHANGE_ID/design.md
```

### 1.2 分析检查清单

**必须理解以下内容**：

- [ ] 架构设计和组件划分
- [ ] 数据模型变更
- [ ] API 端点变更
- [ ] 安全考虑事项
- [ ] 验证策略（默认不写单元测试）

**在继续下一步之前，确认已完全理解设计文档。**

---

## 步骤 2: 细粒度任务拆分

**目标**：将设计拆分为 2-5 分钟可完成的任务。

### 2.1 粒度原则

**✅ 正确的粒度（2-5 分钟）**

```markdown
- [ ] 创建 `EmailVerificationToken` 模型类
- [ ] 实现 `generateToken()` 方法（生成 6 位数字）
- [ ] 实现 `hashToken()` 方法（使用 bcrypt）
- [ ] 实现 `verifyToken()` 方法（验证令牌）
- [ ] 记录验证方式（编译/构建或手动验证）
```

**❌ 错误的粒度（太大）**

```markdown
- [ ] 实现 EmailVerificationService（包含所有方法）
- [ ] 完成数据库迁移
- [ ] 实现 API 端点
```

**❌ 错误的粒度（太小）**

```markdown
- [ ] 定义类名
- [ ] 添加 import 语句
- [ ] 编写左括号
```

### 2.2 拆分技巧

**按方法拆分**：每个公共方法是一个任务

**按验证拆分**：每个验证步骤是一个任务（如编译/构建）

**按文件拆分**：每个文件创建是一个任务

**按编译验证循环拆分**：实现 → 编译 → 修复 各为一个任务

**编译验证任务拆分示例**：

```markdown
## EmailVerificationService

### 实现

- [ ] 实现 `generateToken()` 最小改动

### 编译验证

- [ ] 执行编译/构建命令
- [ ] 确认编译通过

### 修复与复验

- [ ] 修复编译错误（如有）
- [ ] 重新编译确认通过
```

**编译命令选择规则**：
- 默认选择**最小范围**的编译命令，覆盖本次改动涉及的包/模块即可。
- **禁止**在 tasks.md 中使用 `go build -v ./...` 或 `go build ./...` 作为默认选项（除非用户明确要求全量编译）。
- 对 Go 项目优先使用类似 `go build ./path/to/pkg/...` 的包级编译命令；不确定范围时先澄清。

---

## 步骤 3: 生成任务列表（强制要求）

**目标**：生成完整的任务列表文档。

**必须生成 tasks.md 文件**

### 3.1 任务模板

**每个任务必须包含**：

````markdown
### [任务编号] [任务名称]

**描述**：[一句话描述任务内容]

**文件**：[仓库相对路径（以 Git worktree 根目录为准，禁止绝对路径）]

**参考（可选）**：

- 设计文档：`design.md` - [引用章节]

**输入**：[任务输入/依赖]
**输出**：[任务产出]

**代码框架**：

```typescript
// [代码框架]
```
````

**验证**：

- [ ] [验证条件 1]
- [ ] [验证条件 2]

**预计时间**：2-5 分钟

````

### 3.2 tasks.md 结构

```markdown
# 任务列表：[变更名称]

**变更 ID**：[change-id]
**创建时间**：[YYYY-MM-DD]
**状态**：pending

---

## 概览

**总任务数**：X
**预计总时间**：X-Y 分钟

**任务分组**：
- 阶段 1: 数据模型 (X 个任务)
- 阶段 2: 服务层 (X 个任务)
- 阶段 3: API 层 (X 个任务)
- 阶段 4: 验证 (X 个任务)

---

## 阶段 1: [阶段名称]

### [任务组名称]

#### 1.1 [任务名称]

**描述**：[任务描述]

**文件**：[仓库相对路径]

**参考**：
- 设计文档：`design.md` - 数据模型定义

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
````

**验证**：

- [ ] 模型类编译通过
- [ ] 字段类型正确
- [ ] 包含必要的装饰器

**预计时间**：3 分钟

---

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

---

## 完成标准

- [ ] 所有任务完成
- [ ] 验证通过（编译/构建或手动验证）
- [ ] 代码审查通过
- [ ] 设计文档一致性确认

---

## 备注

[任何额外说明、注意事项、依赖关系]

```

**重要**：
- 任务粒度必须控制在 2-5 分钟
- 必须明确标注依赖关系

---

## 步骤 4: 验证完成

**完成标志检查清单**：

```

✓ 完整分析 design.md
✓ 任务粒度合适（2-5 分钟/任务）
✓ 依赖关系清晰
✓ 验证标准明确
✓ 生成 tasks.md

````

**当且仅当所有上述条件满足时，本技能完成。**

---

## 禁止行为

- ❌ **任务粒度过大** - 超过 5 分钟的任务需要拆分
- ❌ **任务粒度过小** - 小于 2 分钟的任务需要合并
- ❌ **不包含验证标准** - 每个任务必须有明确的验证条件
- ❌ **不标注依赖关系** - 必须明确标注任务依赖
- ❌ **使用绝对路径** - 任务文件路径必须是仓库相对路径

---

## MCP 工具使用

**本技能使用以下本地工具**：

- `Read` - 读取 design.md

---

## 输出格式

**技能完成时的输出应包括**：

1. **工作流程检查清单**（所有项目已勾选）
2. **设计文档分析摘要**
3. **任务拆分摘要**
4. **生成的文档路径**：`tasks.md`

**示例输出**：

```markdown
## Writing Plans 技能完成

### 工作流程

✓ 所有 4 个步骤已完成

### 设计文档分析

- 架构：服务层 + 数据层 + API 层
- 数据模型：EmailVerificationToken
- API 端点：POST /api/auth/verify-email

### 任务拆分

- 总任务数：18
- 预计时间：45-60 分钟
- 任务分组：数据模型(4) + 服务层(6) + API 层(4) + 验证(4)

### 生成的文档

- tasks.md: .bytecoding/changes/change-email-verification/tasks.md

下一步：若任务可并行，先使用 dispatching-parallel-agents；否则使用 subagent-driven-development 执行任务
```

---

## 参考资源

- [Bytecoding 技术设计文档](../../BYTECODING_TECHNICAL_DESIGN.md) - 完整架构说明
- [brainstorming 技能](../brainstorming/SKILL.md) - 前置技能，生成 design.md

---

## 技能元数据

- **技能类型**：规划类技能
- **强制流程**：是（4 步工作流）
- **必需输出**：tasks.md
- **用户交互**：必须在步骤 1 确认理解设计文档
- **完成标志**：所有检查清单项目已完成
- **核心铁律**：每个任务必须包含明确的验证标准
