---
name: brainstorming
description: Use when discussing requirements, exploring implementation approaches, or designing solutions. This skill orchestrates multi-source code analysis (repotalk MCP + local) to understand the codebase and propose well-researched solutions.
---

# Brainstorming 技能

## 目标

通过苏格拉底式提问和多源代码分析，将模糊想法转化为精化的设计方案。

**输出**：`proposal.md`（变更提案）+ `design.md`（设计文档）+ `tasks.md`（任务列表）+ `planspec.yaml`（规格说明）

---

## 执行顺序（强制遵守）

**重要**：必须严格按照以下顺序执行，不得跳过任何阶段：

```
阶段 1: 理解需求（苏格拉底式提问）
        ↓
阶段 2: Repotalk MCP 搜索（必须优先执行）
        ↓
阶段 3: 本地搜索分析
        ↓
阶段 4: 综合分析（结合两者结果）
        ↓
阶段 5: 方案设计（2-3 种方案）
        ↓
阶段 6: 分节呈现（逐步确认）
        ↓
阶段 7: 生成文档（proposal.md + design.md + tasks.md + planspec.yaml）
```

---

## 阶段 1: 理解需求

**目标**：确保完全理解用户意图

**步骤**：
1. 仔细阅读需求描述
2. 识别关键术语和不明确之处
3. **提问澄清**（苏格拉底式提问）

**提问原则**：
- 开放式问题（避免是/否回答）
- 聚焦于"为什么"而非"是什么"
- 探索边界条件和约束

**示例问题**：
```
- "这个功能的主要用户场景是什么？"
- "你期望的性能指标是多少？"
- "是否需要考虑向后兼容？"
- "有安全或合规方面的要求吗？"
```

**不要跳过此阶段**。即使需求看起来很清晰，也要至少问一个确认性问题。

---

## 阶段 2: Repotalk MCP 搜索（必须优先执行）

**目标**：优先搜索字节内部代码库，查找参考实现和最佳实践

**强制要求**：必须先执行 Repotalk MCP 搜索，再进行本地搜索

### 2.1 搜索前准备

**检查 Cookie 配置**：
```bash
# 检查 CAS Session Cookie 是否已配置
cat ~/.bytecoding/config.json
```

如果 Cookie 未配置或过期，在输出中明确标注，但仍继续执行本地搜索。

### 2.2 Repotalk MCP 搜索策略

**重要**：使用正确的 `repo_names` 参数格式

```javascript
// 正确格式：org/repo
repo_names: ["oec/live_promotion_core"]

// 错误格式：只有仓库名（会导致无结果）
repo_names: ["live_promotion_core"]  // ❌ 错误！
```

**搜索查询模式**：

```javascript
// 1. 使用 search_nodes 搜索代码实现
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "handler 注释规范 最佳实践"
})

// 2. 搜索类似功能实现
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "秒杀活动 handler 实现"
})

// 3. 搜索特定技术方案
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "Go 语言 package 注释规范"
})

// 4. 使用 get_repos_detail 获取仓库信息
repotalk.get_repos_detail({
  repo_names: ["org/repo"]
})
```

**搜索技巧**：
- 使用具体的技术术语（如 "handler", "注释", "package"）
- 包含语言名称（如 "Go", "TypeScript"）
- 搜索"最佳实践"或"设计模式"
- 查找字节内部类似项目

**Repotalk 搜索检查清单**：
- [ ] 确认 Cookie 已配置
- [ ] 确认 `repo_names` 格式正确（`org/repo`）
- [ ] 找到 2-3 个参考实现
- [ ] 识别常用模式和规范
- [ ] 记录潜在的安全/性能考虑
- [ ] 收集可复用的代码片段

**如果 Repotalk 无结果**：
1. 检查 `repo_names` 格式是否正确
2. 检查 Cookie 是否过期
3. 尝试不同的搜索关键词
4. 在输出中明确标注"Repotalk 搜索无结果"

---

## 阶段 3: 本地搜索分析

**目标**：了解项目现有代码结构和实现

**重要**：必须在 Repotalk MCP 搜索之后执行

### 3.1 本地搜索策略

**使用 Glob 工具**：查找相关文件

```bash
# 查找相关类型/接口
Glob: "**/*User*.ts"
Glob: "**/*auth*.ts"

# 查找测试文件
Glob: "**/*.test.ts"
Glob: "**/*.spec.ts"

# 查找配置文件
Glob: "**/config/*.json"
Glob: "**/*.config.js"
```

**使用 Grep 工具**：搜索代码模式

```bash
# 搜索函数/类定义
Grep: "class.*AuthService"
Grep: "function validateEmail"

# 搜索接口/类型
Grep: "interface.*User"
Grep: "type.*Config"

# 搜索错误模式
Grep: "throw new.*Error"
Grep: "catch.*Error"

# 搜索注释/文档
Grep: "TODO|FIXME|XXX"
Grep: "@deprecated"
Grep: "^// Package"
```

**本地搜索检查清单**：
- [ ] 找到相关的核心文件（3-10 个）
- [ ] 理解现有数据模型
- [ ] 识别相关服务和模块
- [ ] 发现潜在依赖关系

---

## 阶段 4: 综合分析

**目标**：结合 Repotalk 和本地搜索结果，识别最佳实践

**输出格式**：对比分析表

```markdown
## 综合分析

### Repotalk 搜索结果（字节内部参考）
| 项目 | 方案 | 亮点 |
|------|------|------|
| project-a | 使用 Redis 缓存验证码 | 5分钟过期 |
| project-b | 分离验证服务 | 独立部署 |
| project-c | Token 加盐存储 | 增强安全性 |

### 本地发现
| 维度 | 发现 |
|------|------|
| 相关文件 | `src/services/auth.ts`, `src/models/user.ts` |
| 现有实现 | 使用 bcrypt 进行密码哈希 |
| 数据模型 | User 模型已有 `email_verified` 字段 |
| 依赖关系 | 依赖 `EmailService`（已存在） |

### 综合建议
1. **采纳**：Redis 缓存方案（5分钟过期）- 来自 Repotalk 参考
2. **改进**：复用现有 `EmailService`，无需新建服务
3. **注意**：现有 User 模型已有 `email_verified` 字段，直接使用

### 风险评估
- **性能**：验证码生成很快，无需优化
- **安全**：需限制单个邮箱的验证请求频率
- **兼容性**：不影响现有登录流程
```

**分析要点**：
- 对比 2-3 种可能的方案
- 识别每种方案的优缺点
- 评估风险和注意事项
- 推荐最合适的方案（带理由）

---

## 阶段 5: 方案设计

**目标**：提出 2-3 种具体方案，分小节呈现

**方案格式**：

```markdown
## 方案 A: 基于令牌的邮箱验证

### 概述
生成 6 位数字令牌，通过邮件发送，用户输入令牌完成验证。

### 架构
```
User → API → EmailVerificationService → EmailService
                  ↓
              存储令牌（Redis，5分钟过期）
```

### 数据模型
- `email_verification_tokens` 表
  - `id: UUID`
  - `email: string`
  - `token: string`（哈希存储）
  - `expires_at: timestamp`

### API 端点
- `POST /api/auth/send-verification` - 发送验证码
- `POST /api/auth/verify-email` - 验证邮箱

### 优点
- 实现简单，无需外部依赖
- 令牌短期有效，安全性好

### 缺点
- 需要用户手动输入验证码
- 依赖邮件送达速度

---

## 方案 B: 基于链接的邮箱验证

### 概述
发送带签名的验证链接，用户点击链接自动验证。

### 架构
```
User → 点击链接 → API → 验证签名 → 标记邮箱已验证
```

### 数据模型
- 无需额外表，使用现有 User 表
- `email_verification_token: string`（JWT 签名）

### API 端点
- `POST /api/auth/send-verification` - 发送验证链接
- `GET /api/auth/verify?token=xxx` - 验证邮箱

### 优点
- 用户体验好，无需手动输入
- 链接一次性使用，安全性高

### 缺点
- JWT 签名管理稍复杂
- 链接可能被邮件客户端拦截
```

**方案呈现原则**：
- 每个方案独立完整
- 使用图表/表格清晰展示
- 明确优缺点
- 基于搜索结果提供证据

---

## 阶段 6: 分节呈现

**目标**：让用户逐步确认设计，避免信息过载

**呈现顺序**：

1. **先展示需求确认**
   ```
   "基于我们的讨论，我理解需求如下：
   - [x] 支持邮箱验证
   - [x] 6位数字验证码
   - [x] 5分钟过期
   - [ ] 需要短信验证（你提到暂不需要）

   是否正确？"
   ```

2. **再展示 Repotalk 搜索结果**
   ```
   "我优先搜索了字节内部代码库，发现：
   - 项目 A 使用了 Redis 缓存方案
   - 项目 B 使用了 JWT 签名方案
   - Go 语言 handler 注释规范：..."

   详细分析见上方表格。"
   ```

3. **再展示本地搜索结果**
   ```
   "本地代码分析发现：
   - 现有代码已有 EmailService
   - User 模型已有 email_verified 字段
   - ..."
   ```

4. **展示综合分析**
   ```
   "综合 Repotalk 和本地搜索结果，我建议：
   - 采纳方案 A（来自 Repotalk 参考）
   - 改进点：..."
   ```

5. **逐个展示方案**
   ```
   "方案 A：基于令牌的邮箱验证
   [方案 A 详细内容]

   这个方案可行吗？需要我调整什么？"
   ```

6. **最终确认**
   ```
   "推荐方案 A（令牌验证），理由：
   - 复用现有 EmailService
   - 实现简单，3-5 个文件
   - 与现有登录流程兼容

   是否采用此方案？"
   ```

**不要一次性输出所有内容**。分小节呈现，每节等待用户确认。

---

## 阶段 7: 生成文档（强制要求）

**目标**：生成完整的规划文档

**必须生成的文件**：

### 7.1 proposal.md（变更提案）

```markdown
# 变更提案：邮箱验证功能

## 需求描述
为用户系统添加邮箱验证功能，确保用户邮箱的有效性。

## 变更范围
- 新增邮箱验证服务
- 修改用户注册流程
- 添加验证码发送和验证逻辑

## 影响范围
- **新增**：`EmailVerificationService`
- **修改**：`UserService`（注册流程）
- **新增**：2 个 API 端点

## 风险评估
- **性能**：低风险，验证码生成快速
- **安全**：中风险，需限制请求频率
- **兼容性**：无影响，新增功能

## 采纳方案
方案 A：基于令牌的邮箱验证

## 理由
- 复用现有 EmailService
- 实现简单，3-5 个文件
- 与现有登录流程兼容
```

### 7.2 design.md（设计文档）

```markdown
# 设计文档：邮箱验证功能

## 架构设计

### 组件划分
- `EmailVerificationService`: 验证码生成和验证
- `EmailService`: 邮件发送（已存在）
- `AuthController`: API 接口

### 数据模型
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API 设计

### POST /api/auth/send-verification
请求：
```json
{ "email": "user@example.com" }
```
响应：
```json
{ "message": "验证码已发送", "expires_in": 300 }
```

### POST /api/auth/verify-email
请求：
```json
{ "email": "user@example.com", "token": "123456" }
```
响应：
```json
{ "verified": true }
```

## 安全考虑
- 验证码哈希存储（不存储明文）
- 5分钟过期
- 单个邮箱每小时最多 10 次请求
```

### 7.3 tasks.md（任务列表）

```markdown
# 任务列表：邮箱验证功能

## 任务分组

### 组 1: 基础设施（预计 15 分钟）
- [ ] 创建 `email_verification_tokens` 数据库表
- [ ] 配置 Redis 连接
- [ ] 编写迁移脚本

### 组 2: 核心服务（预计 30 分钟）
- [ ] 实现 `EmailVerificationService.generateToken()`
- [ ] 实现 `EmailVerificationService.verifyToken()`
- [ ] 集成 `EmailService` 发送验证码

### 组 3: API 端点（预计 20 分钟）
- [ ] 实现 `POST /api/auth/send-verification`
- [ ] 实现 `POST /api/auth/verify-email`
- [ ] 添加请求验证

### 组 4: 测试（预计 20 分钟）
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 手动测试验证流程

## 总计
- 任务数：10
- 预计时间：85 分钟
```

### 7.4 planspec.yaml（规格说明）

```yaml
# PlanSpec for 邮箱验证功能

change_id: change-email-verification-20250112
description: 为用户系统添加邮箱验证功能
created_at: 2025-01-12T10:00:00Z
status: pending

# 产出文件
proposal: proposal.md
design: design.md
tasks: tasks.md

spec_deltas: []
```

---

## MCP 工具使用清单

**本技能强制按顺序使用以下 MCP 工具**：

### 优先执行：Repotalk MCP
- [x] `repotalk.search_nodes()` - 语义化代码搜索
- [x] `repotalk.get_repos_detail()` - 获取仓库详情
- [x] `repotalk.get_files_detail()` - 获取文件详情
- [x] `repotalk.get_packages_detail()` - 获取包详情

**重要**：使用正确的 `repo_names` 格式（`org/repo`）

### 后续执行：本地工具
- [x] `Glob` - 查找相关文件
- [x] `Grep` - 搜索代码模式
- [x] `Read` - 读取文件内容

---

## 禁止行为

- ❌ **跳过 Repotalk MCP 搜索** - 必须优先执行
- ❌ **repo_names 格式错误** - 必须使用 `org/repo` 格式
- ❌ **跳过本地搜索** - 必须在 Repotalk 搜索后执行
- ❌ **跳过综合分析** - 必须结合两者结果
- ❌ **跳过文档生成** - 必须生成所有 4 个文件
- ❌ **一次性输出所有内容** - 必须分节呈现
- ❌ **不提问就假设理解需求** - 必须苏格拉底式提问
- ❌ **方案没有基于搜索结果** - 必须基于 Repotalk 和本地搜索

---

## 完成标志

当以下条件**全部满足**时，本技能完成：

- [x] 用户确认需求理解正确
- [x] 完成 Repotalk MCP 搜索（找到 2-3 个参考实现）
- [x] 完成本地搜索（找到 3-10 个相关文件）
- [x] 产出综合分析表（结合两者结果）
- [x] 提出 2-3 种方案并详细说明
- [x] 用户确认采纳某个方案
- [x] **生成 `proposal.md`**
- [x] **生成 `design.md`**
- [x] **生成 `tasks.md`**
- [x] **生成 `planspec.yaml`**

**重要**：所有 4 个文件必须生成，技能才算完成。
