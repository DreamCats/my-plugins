---
name: brainstorming
description: Use when discussing requirements, exploring implementation approaches, or designing solutions. This skill orchestrates multi-source code analysis (local + repotalk MCP) to understand the codebase and propose well-researched solutions.
---

# Brainstorming 技能

## 目标

通过苏格拉底式提问和多源代码分析，将模糊想法转化为精化的设计方案。

**输出**：`proposal.md`（变更提案）+ `design.md`（设计文档）

---

## 五阶段工作流程

### 阶段 1: 理解需求

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

### 阶段 2: 多源搜索

**目标**：全面了解代码库现状和参考实现

**强制要求**：必须执行本地搜索 AND Repotalk MCP 搜索（如果配置了 Cookie）

#### 2.1 本地搜索策略

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
```

**本地搜索检查清单**：
- [ ] 找到相关的核心文件（3-10 个）
- [ ] 理解现有数据模型
- [ ] 识别相关服务和模块
- [ ] 发现潜在依赖关系

#### 2.2 Repotalk MCP 搜索策略

**前提**：检查 CAS Session Cookie 是否已配置

**搜索查询模式**：

```javascript
// 搜索类似功能实现
repotalk.search_code("email verification flow")
repotalk.search_code("user authentication pattern")

// 搜索特定技术方案
repotalk.search_code("JWT token validation")
repotalk.search_code("rate limiting middleware")

// 搜索最佳实践
repotalk.search_files("auth service design")
repotalk.search("email queue implementation")

// 组合搜索（关键词 + 上下文）
repotalk.search("password reset flow" + "security best practices")
```

**搜索技巧**：
- 使用具体的技术术语
- 包含语言/框架名称（如 "TypeScript", "React"）
- 搜索"最佳实践"或"设计模式"
- 查找字节内部类似项目

**Repotalk 搜索检查清单**：
- [ ] 找到 2-3 个参考实现
- [ ] 识别常用模式和模式
- [ ] 记录潜在的安全/性能考虑
- [ ] 收集可复用的代码片段

**注意**：如果 Repotalk MCP 连接失败（Cookie 过期），在输出中标注，但继续使用本地搜索结果。

---

### 阶段 3: 综合分析

**目标**：结合本地和 Repotalk 搜索结果，识别最佳实践

**输出格式**：对比分析表

```markdown
## 综合分析

### 本地发现
| 维度 | 发现 |
|------|------|
| 相关文件 | `src/services/auth.ts`, `src/models/user.ts` |
| 现有实现 | 使用 bcrypt 进行密码哈希 |
| 数据模型 | User 模型已有 `email_verified` 字段 |
| 依赖关系 | 依赖 `EmailService`（已存在） |

### Repotalk 参考
| 项目 | 方案 | 亮点 |
|------|------|------|
| project-a | 使用 Redis 缓存验证码 | 5分钟过期 |
| project-b | 分离验证服务 | 独立部署 |
| project-c | Token 加盐存储 | 增强安全性 |

### 综合建议
1. **采纳**：Redis 缓存方案（5分钟过期）
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

### 阶段 4: 方案设计

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

---

## 方案 C: 第三方验证服务

### 概述
使用第三方邮箱验证服务（如 SendGrid Verify API）

### 架构
```
User → API → 第三方服务 → 返回验证结果
```

### 优点
- 无需自己维护验证逻辑
- 通常更准确（检测临时邮箱等）

### 缺点
- 依赖外部服务
- 成本增加
- 数据隐私考虑
```

**方案呈现原则**：
- 每个方案独立完整
- 使用图表/表格清晰展示
- 明确优缺点
- 基于搜索结果提供证据

---

### 阶段 5: 分节呈现

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

2. **再展示综合分析**
   ```
   "我搜索了代码库和内部项目，发现：
   - 现有代码已有 EmailService
   - User 模型已有 email_verified 字段
   - 内部项目 A 使用了 Redis 缓存方案

   详细分析见上方表格。"
   ```

3. **逐个展示方案**
   ```
   "方案 A：基于令牌的邮箱验证
   [方案 A 详细内容]

   这个方案可行吗？需要我调整什么？"
   ```

4. **最终确认**
   ```
   "推荐方案 A（令牌验证），理由：
   - 复用现有 EmailService
   - 实现简单，3-5 个文件
   - 与现有登录流程兼容

   是否采用此方案？"
   ```

**不要一次性输出所有内容**。分小节呈现，每节等待用户确认。

---

## 输出文件

### proposal.md（变更提案）

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

### design.md（设计文档）

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

---

## MCP 工具使用清单

**本技能强制使用以下 MCP 工具**：

### 本地工具
- [x] `Glob` - 查找相关文件
- [x] `Grep` - 搜索代码模式
- [x] `Read` - 读取文件内容

### Repotalk MCP（如果已配置）
- [x] `repotalk.search_code()` - 搜索代码实现
- [x] `repotalk.search_files()` - 查找文件
- [x] `repotalk.search()` - 组合搜索

---

## 禁止行为

- ❌ 跳过多源搜索（只用本地 OR 只用 Repotalk）
- ❌ 跳过综合分析（直接给方案）
- ❌ 一次性输出所有内容（不分节）
- ❌ 不提问就假设理解需求
- ❌ 方案没有基于搜索结果

---

## 完成标志

当以下条件满足时，本技能完成：

- [x] 用户确认需求理解正确
- [x] 完成本地搜索（找到 3-10 个相关文件）
- [x] 完成 Repotalk 搜索（找到 2-3 个参考实现）
- [x] 产出综合分析表
- [x] 提出 2-3 种方案并详细说明
- [x] 用户确认采纳某个方案
- [x] 生成 `proposal.md` 和 `design.md`
