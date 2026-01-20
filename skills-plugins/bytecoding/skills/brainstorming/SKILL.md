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
- [ ] 步骤 1: 理解需求 - 需求不清晰时用 "use ask question" 单轮提问并等待确认；需求明确时可直接确认理解
- [ ] 步骤 2: Repotalk MCP 搜索 - 复杂/模糊需求优先执行；简单明确可跳过并说明原因（repo_names=org/repo）
- [ ] 步骤 3: 本地定向搜索 - 基于候选路径/术语验证与补充
- [ ] 步骤 4: 综合分析 - 结合 Repotalk 和本地搜索结果
- [ ] 步骤 5: 方案设计 - 提出 2-3 种方案，分节呈现并给出推荐方案
- [ ] 步骤 6: 生成文档 - 必须生成 proposal.md 和 design.md
- [ ] 步骤 7: 验证完成 - 确认所有文档已生成
```

**重要**：完成每个步骤后，更新检查清单。对允许跳过的步骤必须标注原因。

---

## 步骤 1: 理解需求（必要时提问并确认）

在开始任何搜索之前，先确保理解需求。若需求清晰且简单，可直接复述理解并进入下一步。

**若需要提问，必须显式使用 "use ask question" 方式发起提问**，不要直接进入搜索。

**提问必须包括**（最多 4 个）：

1. 具体的功能范围是什么？
2. 有哪些技术约束或偏好？
3. 是否需要考虑向后兼容性？
4. 预期的性能或安全要求？

**提问原则**：

- 使用开放式问题（避免是/否回答）
- 聚焦于"为什么"而非"是什么"
- 探索边界条件和约束
- **单轮提问**：最多 1 轮，用户回答后不得再次追问
- **若用户已提供路径/函数/语言/范围信息，减少问题数量，直接进入步骤 2**
- **若回答中出现"需要搜索/不确定"，视为允许搜索，直接进入步骤 2**

**禁止重复提问**：除非关键前置条件缺失（例如无法确定仓库或语言），否则不得发起第二轮提问。

---

## 步骤 2: Repotalk MCP 搜索（复杂/模糊需求优先执行）

**目标**：搜索字节内部代码库，**收敛候选路径与术语**，减少本地"盲搜"成本。

**适用场景**：需求模糊、涉及最佳实践或跨模块联动时优先执行；需求明确且范围小可跳过，但必须说明原因。

**顺序约束**：若执行 Repotalk，在完成前禁止任何本地 Search/Glob/Grep/Read。

### 2.1 检查 Cookie 配置

```bash
# 检查 CAS Session Cookie 是否已配置
cat ~/.bytecoding/config.json
```

如果 Cookie 未配置或过期，在输出中明确标注，但仍继续执行本地搜索。

### 2.2 Repotalk MCP 搜索策略

**重要**：使用正确的 `repo_names` 参数格式（`org/repo`）

**推荐流程**：

```javascript
// 1. 获取仓库详情（概览 + 包列表）
repotalk.get_repos_detail({ repo_names: ["org/repo"] });

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

**完成标志**：

- 找到 2-3 个参考实现
- 产出候选路径/模块名/函数名
- 识别常用模式和规范
- 记录潜在的安全/性能考虑

**如果 Repotalk 无结果**：检查格式、Cookie、关键词；标注后降级到本地搜索。

---

## 步骤 3: 本地定向搜索分析

**目标**：基于 Repotalk 产出的候选路径/术语（或用户已明确的范围）做**定向验证**，避免全仓库关键词搜索。

**硬性约束**：若选择执行步骤 2，未完成 Repotalk 搜索前，禁止使用本地搜索工具。若跳过步骤 2，需说明原因后再执行本地搜索。

### 3.1 工具选择优先级

| 用户需求示例 | 使用工具 | 原因 |
|------------|---------|------|
| "FindAllReferences 在哪里被调用？" | serena/LSP | 精确引用链 |
| "IUserHandler 接口有哪些实现？" | serena/LSP | 符号/实现关系 |
| "所有叫 `HandleUpdate` 的函数" | serena/LSP | 符号搜索，更快更准 |
| "查找处理用户认证的代码" | bcindex | 自然语言语义检索 |
| "这个项目有哪些 HTTP handler？" | bcindex | 按职责定位模块 |
| "xxx.go 文件里的具体实现" | Read | 已知具体路径 |
| "所有包含 'update' 关键词的代码" | Grep | 泛化关键词搜索 |

**优先级**：serena/LSP（符号/引用链清晰） > bcindex（语义定位） > Glob/Grep/Read（兜底）

### 3.2 本地搜索策略

**先收敛范围**（优先使用候选路径/模块名）：

```bash
# 在候选目录内列出 handler 文件
Glob: "path/to/candidate/dir/**/*handler*.go"
```

**再做定向搜索**（只在候选范围内）：

```bash
# 在候选范围内搜索方法或路由
Grep: "Update.*Promotion" path/to/candidate/dir
Grep: "Register.*Handler" path/to/candidate/dir
```

**范围约束**：

- 用户需求限定在 handler 时，优先在 `handler/` 或 `handlers/` 目录内搜索
- 未经用户确认，不要扩展到 service/biz 层
- 禁止全仓库泛化关键词搜索

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

### 本地发现

| 维度     | 发现                                         |
| -------- | -------------------------------------------- |
| 相关文件 | `src/services/auth.ts`, `src/models/user.ts` |
| 现有实现 | 使用 bcrypt 进行密码哈希                     |
| 数据模型 | User 模型已有 `email_verified` 字段          |

### 综合建议

1. **采纳**：Redis 缓存方案
2. **改进**：复用现有 `EmailService`
3. **注意**：已有 email_verified 字段
```

---

## 步骤 5: 方案设计（分节呈现并给出推荐）

**目标**：提出 2-3 种具体方案，**分节呈现**，并给出推荐方案。

**呈现顺序**：

1. 需求确认摘要
2. Repotalk 搜索结果摘要
3. 本地搜索结果摘要
4. 综合分析
5. 逐个展示方案（实现方式 + 优缺点）
6. **最终推荐方案**（带理由，无需用户选择）

**重要**：可以一次性输出所有内容，但必须保持分节清晰。

---

## 步骤 6: 生成文档（强制要求）

**必须生成以下文件**：

### proposal.md（变更提案）

```markdown
# 变更提案：[功能名称]

## 需求描述
[简洁描述功能需求]

## 变更范围
- 新增/修改的组件

## 影响范围
- **新增**：[服务/文件]
- **修改**：[文件]

## 风险评估
- **性能**：[评估]
- **安全**：[考虑]
- **兼容性**：[分析]

## 采纳方案
[方案名称及理由]
```

### design.md（设计文档）

```markdown
# 设计文档：[功能名称]

## 架构设计
### 组件划分
- 组件 1：[职责]
- 组件 2：[职责]

## 数据模型
[表结构或模型定义]

## API 设计
### [端点名称]
**请求**：[格式]
**响应**：[格式]

## 安全考虑
- [安全点]

## 验证与发布
- 验证方式：编译/构建或手动验证
- 发布策略：小流量/灰度
```

**职责划分**：

- 本技能：proposal.md + design.md
- writing-plans：tasks.md
- repo-plan：planspec.yaml

---

## 步骤 7: 验证完成

**完成标志检查清单**：

```
✓ 需求理解已确认（若有提问）
✓ 若执行 Repotalk MCP 搜索，已产出候选路径/术语
✓ 完成本地定向搜索（基于候选范围验证）
✓ 产出综合分析表（结合两者结果）
✓ 提出 2-3 种方案并推荐其一
✓ 生成 proposal.md
✓ 生成 design.md
```

**当且仅当所有上述条件满足时，本技能完成。**

---

## 禁止行为

- ❌ **需求模糊仍跳过澄清提问** - 必须先提问再进入搜索
- ❌ **repo_names 格式错误** - 必须使用 `org/repo` 格式
- ❌ **盲目全仓库关键词搜索** - 必须先收敛范围
- ❌ **跳过本地定向搜索** - 必须在完成 Repotalk 或明确跳过后执行
- ❌ **跳过综合分析** - 必须结合两者结果
- ❌ **跳过文档生成** - 必须生成 proposal.md 和 design.md
- ❌ **生成 tasks.md** - 应由 writing-plans 技能负责
- ❌ **生成 planspec.yaml** - 应由 repo-plan 命令负责
- ❌ **不分节呈现方案** - 必须清晰分节展示
- ❌ **需求不清晰却不提问就进入搜索** - 必须显式使用 "use ask question"
- ❌ **重复提问** - 只允许一轮澄清提问
- ❌ **未确认就扩展到 service/biz 层** - 需保持在用户指定范围
- ❌ **方案没有基于已收集证据** - 必须基于 Repotalk 或本地搜索结果
- ❌ **在生成文档前修改代码** - 文档必须先于代码修改

---

## MCP 工具使用

### Repotalk MCP（步骤 2）

```javascript
repotalk.search_nodes({ repo_names: ["org/repo"], question: "..." });
repotalk.get_repos_detail({ repo_names: ["org/repo"] });
repotalk.get_packages_detail({ repo_name: "org/repo", package_ids: ["..."] });
repotalk.get_nodes_detail({ repo_name: "org/repo", node_ids: ["..."] });
```

**重要**：使用正确的 `repo_names` 格式（`org/repo`）

### 本地工具（步骤 3）

- `bcindex` - 语义检索（自然语言 → 候选）
- `serena/LSP` - 符号/引用链（精确定义/调用关系）
- `Glob/Grep/Read` - 兜底工具

---

## 参考资源

- [Repotalk MCP 工具使用说明](../../scripts/session-start-hook.js)
- [writing-plans 技能](../writing-plans/SKILL.md)
