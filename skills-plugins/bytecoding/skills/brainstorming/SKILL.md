---
name: brainstorming
description: Use when discussing requirements, exploring implementation approaches, or designing solutions that require code analysis. This skill enforces a mandatory workflow: Repotalk MCP search (to narrow scope) → local targeted search → comprehensive analysis → generate 2 documents (proposal.md, design.md) BEFORE any code modification.
---

# Brainstorming 技能

通过强制工作流和多源代码分析，将模糊需求转化为精化的设计方案。

## 工作流程检查清单（强制执行）

**复制或者使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Brainstorming Progress:
- [ ] 步骤 1: 理解需求 - 使用 "use ask question" 单轮提问并等待用户确认
- [ ] 步骤 2: Repotalk MCP 搜索 - 先收敛候选路径/术语（repo_names=org/repo）
- [ ] 步骤 3: 本地定向搜索 - 基于候选路径/术语验证与补充
- [ ] 步骤 4: 综合分析 - 结合 Repotalk 和本地搜索结果
- [ ] 步骤 5: 方案设计 - 提出 2-3 种方案，分节呈现并等待确认
- [ ] 步骤 6: 生成文档 - 必须生成 proposal.md 和 design.md
- [ ] 步骤 7: 验证完成 - 确认所有文档已生成
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

---

## 步骤 1: 理解需求（必须等待用户确认）

在开始任何搜索之前，先通过提问确保完全理解需求。

**必须显式使用 "use ask question" 方式发起提问**，不要直接进入搜索。

**示例**：

```
Use: ask question
Q1: ...
Q2: ...
Q3: ...
```

**提出的问题必须包括**（最多 4 个）：

1. 具体的功能范围是什么？
2. 有哪些技术约束或偏好？
3. 是否需要考虑向后兼容性？
4. 预期的性能或安全要求？

**提问原则**：

- 使用开放式问题（避免是/否回答）
- 聚焦于"为什么"而非"是什么"
- 探索边界条件和约束
- 单轮提问：最多 1 轮，用户回答后不得再次追问
- 若用户已提供路径/函数/语言/范围信息，减少问题数量，直接进入步骤 2
- 若回答中出现“需要搜索/不确定”，视为允许搜索，直接进入步骤 2

**在继续下一步之前，等待用户回答并确认理解正确。**

**禁止重复提问**：除非关键前置条件缺失（例如无法确定仓库或语言），否则不得发起第二轮提问。

---

## 步骤 2: Repotalk MCP 搜索（必须优先执行）

**目标**：优先搜索字节内部代码库，**收敛候选路径与术语**，减少本地“盲搜”成本。

**强制顺序**：在 Repotalk 完成前，禁止任何本地 Search/Glob/Grep/Read。若已误用本地搜索，必须明确说明并从步骤 2 重新开始。

### 2.1 检查 Cookie 配置

```bash
# 检查 CAS Session Cookie 是否已配置
cat ~/.bytecoding/config.json
```

如果 Cookie 未配置或过期，在输出中明确标注，但仍继续执行本地搜索。

### 2.2 Repotalk MCP 搜索策略

**重要**：使用正确的 `repo_names` 参数格式

```javascript
// 正确格式：org/repo
repo_names: ["oec/live_promotion_core"];

// 错误格式：只有仓库名（会导致无结果）
repo_names: ["live_promotion_core"]; // ❌ 错误！
```

**推荐流程**：

```javascript
// 1. 获取仓库详情（概览 + 包列表）
repotalk.get_repos_detail({
  repo_names: ["org/repo"],
});

// 2. 语义化代码搜索（收敛候选）
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "handler 注释规范 最佳实践",
});

// 3. 搜索包详情（聚焦候选包）
repotalk.get_packages_detail({
  repo_name: "org/repo",
  package_ids: ["module?path/to/pkg"],
});

// 4. 获取节点详情（确认实现与依赖）
repotalk.get_nodes_detail({
  repo_name: "org/repo",
  node_ids: ["module?path/to/pkg#FuncName"],
  need_related_codes: true,
});
```

**对外知识输出**：

- 根据场景提炼“可复用结论”：推荐实现路径、关键文件/节点、已知风险与验证点。

**成本优化建议**：

- `get_repos_detail` 只跑一次并复用包列表信息
- `search_nodes` 控制在 1-2 次查询，尽量加 `package_ids` 缩小范围
- `get_nodes_detail` 只取 Top 2-3 候选节点，必要时再递归
- 结果落盘到证据池/PlanSpec，避免重复请求

**完成标志**：

- 找到 2-3 个参考实现
- 产出候选路径/模块名/函数名
- 识别常用模式和规范
- 记录潜在的安全/性能考虑

**如果 Repotalk 无结果**：

1. 检查 `repo_names` 格式是否正确
2. 检查 Cookie 是否过期
3. 尝试不同的搜索关键词
4. 在输出中明确标注"Repotalk 搜索无结果"

---

## 步骤 3: 本地定向搜索分析

**目标**：基于 Repotalk 产出的候选路径/术语做**定向验证**，避免全仓库关键词搜索。

**硬性约束**：未完成步骤 2 的 Repotalk 搜索前，禁止使用本地搜索工具（Search/Glob/Grep/Read）。

### 3.1 本地搜索策略

**先收敛范围**（优先使用候选路径/模块名）：

```bash
# 在候选目录内列出 handler 文件
Glob: "path/to/candidate/dir/**/*handler*.go"
```

**再做定向搜索**（只在候选范围内）：

```bash
# 在候选范围内搜索方法或路由
Grep: "Update.*Promotion" path/to/candidate/dir
Grep: "Handle.*Seckill" path/to/candidate/dir

# 定位路由/注册点（入口更稳定）
Grep: "Register.*Handler" path/to/candidate/dir
Grep: "router.*Handle" path/to/candidate/dir
```

**范围约束**：

- 用户需求限定在 handler 时，优先在 `handler/` 或 `handlers/` 目录内搜索
- 未经用户确认，不要扩展到 service/biz 层
- 如必须跨层（例如定位入口链路），先明确说明原因并请求确认

**Search 使用约束**：

- 仅在候选路径内使用 Search，并带路径/模式约束
- 禁止全仓库泛化关键词搜索（如仅用“秒杀/creator”）

**如果 Repotalk 无结果或 Cookie 失效**：

1. 先做轻量级文件名收敛（例如 `*handler*.go`、`*route*.go`）
2. 再进行小范围关键词搜索
3. 在输出中标注“已降级为本地搜索”

**完成标志**：

- 基于候选范围定位到具体文件
- 理解现有实现与调用链
- 识别相关服务和模块
- 发现潜在依赖关系

---

## 步骤 4: 综合分析

**目标**：结合 Repotalk 和本地搜索结果，识别最佳实践。

**输出格式**：对比分析表

```markdown
## 综合分析

### Repotalk 搜索结果（字节内部参考）

| 项目      | 方案                  | 亮点       |
| --------- | --------------------- | ---------- |
| project-a | 使用 Redis 缓存验证码 | 5 分钟过期 |
| project-b | 分离验证服务          | 独立部署   |
| project-c | Token 加盐存储        | 增强安全性 |

### 本地发现

| 维度     | 发现                                         |
| -------- | -------------------------------------------- |
| 相关文件 | `src/services/auth.ts`, `src/models/user.ts` |
| 现有实现 | 使用 bcrypt 进行密码哈希                     |
| 数据模型 | User 模型已有 `email_verified` 字段          |
| 依赖关系 | 依赖 `EmailService`（已存在）                |

### 综合建议

1. **采纳**：Redis 缓存方案（5 分钟过期）- 来自 Repotalk 参考
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

## 步骤 5: 方案设计（分节呈现并等待确认）

**目标**：提出 2-3 种具体方案，**分节呈现**，逐步等待用户确认。

### 方案呈现原则

1. **先展示需求确认**

   ```markdown
   基于我们的讨论，我理解需求如下：

   - [x] 支持邮箱验证
   - [x] 6 位数字验证码
   - [x] 5 分钟过期
   - [ ] 需要短信验证（你提到暂不需要）

   是否正确？
   ```

2. **展示 Repotalk 搜索结果**

   ```markdown
   我优先搜索了字节内部代码库，发现：

   - 项目 A 使用了 Redis 缓存方案
   - 项目 B 使用了 JWT 签名方案
   - Go 语言 handler 注释规范：...

   详细分析见上方表格。
   ```

3. **展示本地搜索结果**

   ```markdown
   本地代码分析发现：

   - 现有代码已有 EmailService
   - User 模型已有 email_verified 字段
   - ...
   ```

4. **展示综合分析**

   ```markdown
   综合 Repotalk 和本地搜索结果，我建议：

   - 采纳方案 A（来自 Repotalk 参考）
   - 改进点：...
   ```

5. **逐个展示方案**

   ```markdown
   方案 A：基于令牌的邮箱验证
   [方案 A 详细内容]

   这个方案可行吗？需要我调整什么？

   **等待用户确认后再继续下一个方案。**
   ```

6. **最终确认**

   ```markdown
   推荐方案 A（令牌验证），理由：

   - 复用现有 EmailService
   - 实现简单，3-5 个文件
   - 与现有登录流程兼容

   是否采用此方案？
   ```

**重要**：不要一次性输出所有内容。每节输出后等待用户确认。

---

## 步骤 6: 生成文档（强制要求）

**目标**：生成完整的规划文档。

**必须生成以下所有文件**：

### 6.1 proposal.md（变更提案）

```markdown
# 变更提案：[功能名称]

## 需求描述

[简洁描述功能需求]

## 变更范围

- 新增/修改的组件
- 影响的模块

## 影响范围

- **新增**：新增的服务或文件
- **修改**：修改的现有文件

## 风险评估

- **性能**：性能影响评估
- **安全**：安全考虑事项
- **兼容性**：向后兼容性分析

## 采纳方案

[选择的方案名称及理由]

## 理由

[选择该方案的具体理由]
```

### 6.2 design.md（设计文档）

```markdown
# 设计文档：[功能名称]

## 架构设计

### 组件划分

- 组件 1：职责说明
- 组件 2：职责说明

### 数据模型

[数据库表结构或数据模型定义]

## API 设计

### API 端点 1

**请求**：[请求格式]
**响应**：[响应格式]

### API 端点 2

**请求**：[请求格式]
**响应**：[响应格式]

## 安全考虑

- 安全考虑 1
- 安全考虑 2

## 验证与发布

- 验证方式：编译/构建或手动验证（默认不写单元测试，除非用户明确要求）
- 发布策略：小流量/灰度/逐步放量
```

**重要**：

- 本技能只负责生成 `proposal.md` 和 `design.md`
- `tasks.md` 由 `writing-plans` 技能负责生成
- `planspec.yaml` 由 `repo-plan` 命令负责生成
- 如无明确要求，不在 design.md 的迁移/发布/验证步骤中加入单元测试

---

## 步骤 7: 验证完成

**完成标志检查清单**：

```
✓ 用户确认需求理解正确
✓ 完成 Repotalk MCP 搜索（产出候选路径/术语）
✓ 完成本地定向搜索（基于候选范围验证）
✓ 产出综合分析表（结合两者结果）
✓ 提出 2-3 种方案并详细说明
✓ 用户确认采纳某个方案
✓ 生成 proposal.md
✓ 生成 design.md
```

**当且仅当所有上述条件满足时，本技能完成。**

---

## 禁止行为

- ❌ **跳过 Repotalk MCP 搜索** - 必须优先执行
- ❌ **repo_names 格式错误** - 必须使用 `org/repo` 格式
- ❌ **盲目全仓库关键词搜索** - 必须先收敛范围
- ❌ **跳过本地定向搜索** - 必须在 Repotalk 搜索后执行
- ❌ **跳过综合分析** - 必须结合两者结果
- ❌ **跳过文档生成** - 必须生成 proposal.md 和 design.md
- ❌ **生成 tasks.md** - 应由 writing-plans 技能负责
- ❌ **生成 planspec.yaml** - 应由 repo-plan 命令负责
- ❌ **一次性输出所有内容** - 必须分节呈现并等待确认
- ❌ **不提问就假设理解需求** - 必须通过提问澄清
- ❌ **未使用 "use ask question" 就进入搜索** - 必须显式使用
- ❌ **重复提问** - 只允许一轮澄清提问
- ❌ **未确认就扩展到 service/biz 层** - 需保持在用户指定范围
- ❌ **方案没有基于搜索结果** - 必须基于 Repotalk 和本地搜索
- ❌ **在生成文档前修改代码** - 文档必须先于代码修改

---

## MCP 工具使用

**本技能强制按顺序使用以下 MCP 工具**：

### 优先执行：Repotalk MCP

```javascript
// search_nodes - 语义化代码搜索
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "搜索问题",
});

// get_repos_detail - 获取仓库详情
repotalk.get_repos_detail({
  repo_names: ["org/repo"],
});

// get_packages_detail - 获取包详情
repotalk.get_packages_detail({
  repo_name: "org/repo",
  package_ids: ["package_id"],
});

// get_nodes_detail - 获取节点详情
repotalk.get_nodes_detail({
  repo_name: "org/repo",
  node_ids: ["node_id"],
});

// get_files_detail - 获取文件详情
repotalk.get_files_detail({
  repo_name: "org/repo",
  file_path: "path/to/file",
});
```

**重要**：使用正确的 `repo_names` 格式（`org/repo`）

### 后续执行：本地工具（基于候选范围）

- `Glob` - 查找相关文件
- `Grep` - 搜索代码模式
- `Read` - 读取文件内容

---

## 输出格式

**技能完成时的输出应包括**：

1. **工作流程检查清单**（所有项目已勾选）
2. **需求确认摘要**
3. **搜索结果摘要**（Repotalk + 本地）
4. **综合分析表**
5. **采纳的方案摘要**
6. **生成的文档列表**：
   - `proposal.md` - [文件路径]
   - `design.md` - [文件路径]

**示例输出**：

```markdown
## Brainstorming 技能完成

### 工作流程

✓ 所有 7 个步骤已完成

### 需求确认

- 功能：邮箱验证
- 技术栈：Go + Redis
- 约束：5 分钟过期

### 搜索结果

- Repotalk：找到 3 个参考实现
- 本地：找到 5 个相关文件

### 采纳方案

方案 A：基于令牌的邮箱验证

### 生成的文档

- proposal.md: ~/.bytecoding/changes/change-email-verification/proposal.md
- design.md: ~/.bytecoding/changes/change-email-verification/design.md

下一步：使用 writing-plans 技能生成 tasks.md
```

---

## 参考资源

- [Repotalk MCP 工具使用说明](../../scripts/session-start-hook.js) - 在 SessionStart Hook 的 additionalContext 中
- [Bytecoding 技术设计文档](../../BYTECODING_TECHNICAL_DESIGN.md) - 完整架构说明
- [writing-plans 技能](../writing-plans/SKILL.md) - 任务规划详细指导

---

## 技能元数据

- **技能类型**：规划类技能
- **强制流程**：是（7 步工作流）
- **必需输出**：2 个文档文件（proposal.md, design.md）
- **工具限制**：Repotalk MCP 必须优先于本地工具
- **用户交互**：必须等待用户确认（步骤 1、5、7）
- **完成标志**：所有检查清单项目已完成
