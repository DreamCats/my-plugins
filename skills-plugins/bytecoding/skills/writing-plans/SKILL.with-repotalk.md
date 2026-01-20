---
name: writing-plans
description: Use when converting design documents into executable task lists. This skill enforces a mandatory workflow: analyze design → Repotalk MCP reference search → generate fine-grained tasks (2-5 minutes each) with comprehensive reference documentation.
---

# Writing Plans 技能

通过强制工作流和 Repotalk 参考搜索，将设计方案转化为可执行的任务列表。

**默认策略**：除非用户明确要求，否则不安排单元测试任务；验证以编译/构建或手动验证为主。

## 工作流程检查清单（强制执行）

**复制或者 使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Writing Plans Progress:
- [ ] 步骤 1: 分析设计文档 - 完全理解 design.md 内容
- [ ] 步骤 2: Repotalk MCP 搜索 - 查找字节内部参考实现
- [ ] 步骤 3: 综合参考分析 - 结合设计文档和 Repotalk 参考
- [ ] 步骤 4: 细粒度任务拆分 - 2-5 分钟/任务
- [ ] 步骤 5: 生成任务列表 - 创建 tasks.md
- [ ] 步骤 6: 验证完成 - 确认任务列表完整
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

## 步骤 2: Repotalk MCP 搜索（必须优先执行）

**目标**：查找字节内部参考实现。

### 2.1 检查 Cookie 配置

```bash
# 检查 CAS Session Cookie 是否已配置
cat ~/.bytecoding/config.json
```

如果 Cookie 未配置或过期，在输出中明确标注，但仍继续执行后续步骤。

### 2.2 Repotalk MCP 搜索策略

**搜索类似实现**：

```javascript
// 搜索令牌生成
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "token generation 6 digit verification",
});

// 搜索哈希存储
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "bcrypt hash token storage",
});

// 搜索验证逻辑
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "verify token email validation",
});

// 搜索数据库设计
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "verification token table migration",
});
```

**搜索技巧**：

- 使用具体的技术术语（TypeScript, TypeORM, bcrypt）
- 搜索"最佳实践"或"设计模式"
- 查找字节内部类似项目
- 优先搜索同一语言/框架的实现

**完成标志**：

- 找到 1-2 个参考实现
- 记录参考项目路径
- 识别可复用的代码片段
- 注意安全和性能考虑

**如果 Repotalk 无结果**：

1. 检查 `repo_names` 格式是否正确（必须是 `org/repo`）
2. 检查 Cookie 是否过期
3. 尝试不同的搜索关键词
4. 在输出中明确标注"Repotalk 搜索无结果"

---

## 步骤 3: 综合参考分析

**目标**：结合设计文档与 Repotalk 搜索结果，为每个任务提供可复用参考。

**输出格式**：参考对照表

```markdown
## 参考分析结果

### 设计文档要点

- [要点 1]
- [要点 2]

### Repotalk 参考（字节内部）

| 任务类型 | 项目路径                  | 参考说明              |
| -------- | ------------------------- | --------------------- |
| 令牌生成 | `project-a/auth/token.go` | 使用 crypto/rand 生成 |
| 哈希存储 | `project-b/auth/hash.go`  | bcrypt cost=10        |
| 验证逻辑 | `project-c/api/verify.go` | 包含过期检查          |

### 综合建议

1. **模型设计**：以 design.md 定义为准
2. **令牌生成**：采纳 Repotalk 的 crypto/rand 方案
3. **验证策略**：按 design.md 的验证要求，默认不写单元测试
```

**分析要点**：

- 对齐设计文档与 Repotalk 参考
- 识别最佳实践
- 评估每种方案的适用性
- 推荐最合适的参考（带理由）

---

## 步骤 4: 细粒度任务拆分

**目标**：将设计拆分为 2-5 分钟可完成的任务。

### 4.1 粒度原则

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

### 4.2 拆分技巧

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

## 步骤 5: 生成任务列表（强制要求）

**目标**：生成完整的任务列表文档。

**必须生成 tasks.md 文件**

### 5.1 任务模板

**每个任务必须包含**：

````markdown
### [任务编号] [任务名称]

**描述**：[一句话描述任务内容]

**文件**：[仓库相对路径（以 Git worktree 根目录为准，禁止绝对路径）]

**参考（可选）**：

- 设计文档：`design.md` - [引用章节]
- Repotalk：`[Repotalk 路径]` - [参考说明]

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

### 5.2 tasks.md 结构

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
- 设计文档：`design.md` - 设计约束
- Repotalk：`project-a/models/verification.go` - 验证令牌模型

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
- 每个任务必须包含 Repotalk 参考（如果可用）
- 任务粒度必须控制在 2-5 分钟
- 必须明确标注依赖关系

---

## 步骤 6: 验证完成

**完成标志检查清单**：

```

✓ 完整分析 design.md
✓ 完成 Repotalk MCP 搜索（找到 1-2 个参考实现）
✓ 产出综合参考分析表
✓ 任务粒度合适（2-5 分钟/任务）
✓ 每个任务包含 Repotalk 参考（如果可用）
✓ 依赖关系清晰
✓ 验证标准明确
✓ 生成 tasks.md

````

**当且仅当所有上述条件满足时，本技能完成。**

---

## 禁止行为

- ❌ **跳过 Repotalk MCP 搜索** - 必须查找字节内部参考
- ❌ **repo_names 格式错误** - 必须使用 `org/repo` 格式
- ❌ **跳过综合分析** - 必须结合设计文档与 Repotalk 参考
- ❌ **任务粒度过大** - 超过 5 分钟的任务需要拆分
- ❌ **任务粒度过小** - 小于 2 分钟的任务需要合并
- ❌ **不包含验证标准** - 每个任务必须有明确的验证条件
- ❌ **不标注依赖关系** - 必须明确标注任务依赖
- ❌ **在 tasks.md 中写“编译整个项目”** - 禁止出现该表述；验证必须描述为最小范围（仅改动相关包/模块）
- ❌ **在 tasks.md 中默认全量 Go 编译** - 禁止 `go build ./...` / `go build -v ./...` / `go test ./...`（除非用户明确要求全量）
- ❌ **使用绝对路径** - 任务文件路径必须是仓库相对路径

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

// get_packages_detail - 获取包详情
repotalk.get_packages_detail({
  repo_name: "org/repo",
  package_ids: ["package_id"]
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
````

**重要**：使用正确的 `repo_names` 格式（`org/repo`）

### 后续执行：本地工具（可选）

- `Read` - 读取 design.md

---

## 输出格式

**技能完成时的输出应包括**：

1. **工作流程检查清单**（所有项目已勾选）
2. **设计文档分析摘要**
3. **参考搜索结果摘要**（Repotalk）
4. **综合参考分析表**
5. **任务拆分摘要**
6. **生成的文档路径**：`tasks.md`

**示例输出**：

```markdown
## Writing Plans 技能完成

### 工作流程

✓ 所有 6 个步骤已完成

### 设计文档分析

- 架构：服务层 + 数据层 + API 层
- 数据模型：EmailVerificationToken
- API 端点：POST /api/auth/verify-email

### 参考搜索结果

- Repotalk：找到 2 个参考实现（令牌生成、哈希存储）

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

- [Repotalk MCP 工具使用说明](../../scripts/session-start-hook.js) - 在 SessionStart Hook 的 additionalContext 中
- [Bytecoding 技术设计文档](../../BYTECODING_TECHNICAL_DESIGN.md) - 完整架构说明
- [brainstorming 技能](../brainstorming/SKILL.md) - 前置技能，生成 design.md

---

## 技能元数据

- **技能类型**：规划类技能
- **强制流程**：是（6 步工作流）
- **必需输出**：tasks.md
- **工具限制**：Repotalk MCP 必须优先于本地工具
- **用户交互**：必须在步骤 1 确认理解设计文档
- **完成标志**：所有检查清单项目已完成
- **核心铁律**：每个任务必须包含明确的验证标准
