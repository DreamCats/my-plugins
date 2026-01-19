---
name: brainstorming
description: Use when discussing requirements, exploring implementation approaches, or designing solutions that require code analysis. This skill enforces a mandatory workflow: Repotalk MCP search (to narrow scope) → local targeted search → comprehensive analysis → generate 2 documents (proposal.md, design.md) BEFORE any code modification.
---

# Brainstorming Skill (Decision Tree)

Use a decision-tree-driven flow to turn ambiguous requirements into scoped design options, backed by evidence, before any code changes.

## Decision Tree (入口判断)

```
Start
│
├─ Q1: 需求是否清晰且范围小？(文件/模块已指定，改动≤2-3处)
│   ├─ No → Ask once (use ask question) → Confirm → Q2
│   └─ Yes → Q2
│
├─ Q2: 是否需要内部最佳实践/跨模块对齐？(规范、通用方案、跨团队依赖)
│   ├─ Yes → Repotalk MCP (Step 2) → Q3
│   └─ No  → 允许跳过 Repotalk (说明原因) → Q3
│
├─ Q3: 本地搜索应选哪类工具？
│   ├─ 符号/引用链清晰 → serena/LSP
│   ├─ 语义定位(自然语言) → bcindex (仅用于 brainstorming，候选/证据)
│   └─ 以上都不适用/不可用 → 限定范围的 Glob/Grep/Read
│
└─ Q4: 是否已形成 2-3 个方案 + 推荐方案？
    ├─ No → 综合分析 + 方案设计
    └─ Yes → 输出 proposal.md + design.md
```

---

## Workflow Checklist (必须跟踪)

复制或使用 TodoWrite：

```
Brainstorming Progress:
- [ ] Step 1: 需求澄清与确认（如不清晰，必须使用 "use ask question" 单轮提问）
- [ ] Step 2: Repotalk MCP 搜索（必要时；可跳过但需写明原因）
- [ ] Step 3: 本地定向搜索（基于候选范围）
- [ ] Step 4: 综合分析（对比 Repotalk 与本地证据）
- [ ] Step 5: 方案设计（2-3 方案 + 推荐）
- [ ] Step 6: 生成文档（proposal.md + design.md）
- [ ] Step 7: 完成验证（清单全勾选）
```

---

## Step 1: 需求澄清与确认

**只允许一轮提问**。需求不清晰时必须提问；否则简短复述确认。

**必须显式使用**：

```
Use: ask question
Q1: ...
Q2: ...
Q3: ...
```

**提问覆盖（最多 4 个）**：

1. 功能范围/边界
2. 技术约束或偏好
3. 向后兼容要求
4. 性能/安全要求

**提问后必须等待用户确认。**

---

## Step 2: Repotalk MCP 搜索（必要时）

**使用条件**：需求模糊、需要最佳实践、跨模块联动时优先执行。
**可跳过条件**：需求明确且仅限小范围本地修改（必须说明原因）。

**顺序硬约束**：若执行 Repotalk，在完成前禁止任何本地 Search/Glob/Grep/Read。

### 2.1 Cookie 检查

```bash
cat ~/.bytecoding/config.json
```

### 2.2 推荐流程

```javascript
repotalk.get_repos_detail({ repo_names: ["org/repo"] });
repotalk.search_nodes({ repo_names: ["org/repo"], question: "..." });
repotalk.get_packages_detail({ repo_name: "org/repo", package_ids: ["..."] });
repotalk.get_nodes_detail({
  repo_name: "org/repo",
  node_ids: ["..."],
  need_related_codes: true,
});
```

**完成标志**：

- 2-3 个参考实现
- 候选路径/模块/函数
- 关键模式/风险点

**无结果处理**：明确标注，并降级到本地搜索。

---

## Step 3: 本地定向搜索（基于候选范围）

**目标**：验证与补充 Repotalk 结果或用户指定范围。

### 3.1 工具选择（决策树 Q3 落地）

- 符号/引用链 → **serena 或 LSP**
- 语义定位 → **bcindex**（仅用于 brainstorming；离线索引可能有偏差；仅作候选/证据，不作为最终事实来源）
- 兜底 → **限定范围**的 Glob/Grep/Read

### 3.2 搜索策略

**先收敛范围**：

```bash
Glob: "path/to/candidate/dir/**/*handler*.go"
```

**再做定向搜索**（只在候选范围内）：

```bash
Grep: "Register.*Handler" path/to/candidate/dir
Grep: "router.*Handle" path/to/candidate/dir
```

**限制**：禁止全仓库泛化搜索。

---

## Step 4: 综合分析（必须产出对比表）

```markdown
## 综合分析

### Repotalk 参考

| 项目 | 方案       | 亮点       |
| ---- | ---------- | ---------- |
| A    | Redis 缓存 | 5 分钟过期 |

### 本地发现

| 维度     | 发现         |
| -------- | ------------ |
| 相关文件 | path/to/file |
| 现有实现 | ...          |

### 综合建议

1. 采纳 ...
2. 改进 ...
3. 注意 ...

### 风险评估

- 性能：...
- 安全：...
- 兼容性：...
```

---

## Step 5: 方案设计（2-3 方案 + 推荐）

要求：

- 分节呈现
- 明确推荐方案与理由
- 方案必须基于已收集证据

---

## Step 6: 生成文档（必须）

**proposal.md** 与 **design.md** 必须生成，且先于任何代码修改。

### proposal.md

```markdown
# 变更提案：[功能名称]

## 需求描述

## 变更范围

## 影响范围

## 风险评估

## 采纳方案

## 理由
```

### design.md

```markdown
# 设计文档：[功能名称]

## 架构设计

## 数据模型

## API 设计

## 安全考虑

## 验证与发布
```

---

## Step 7: 完成验证

完成标志：

- 需求确认已完成
- Repotalk（若执行）已产出候选
- 本地搜索已完成
- 综合分析表已输出
- 方案设计已完成
- proposal.md + design.md 已生成

---

## 禁止行为

- 需求不清晰却跳过澄清
- Repotalk 未完成就本地搜索（若选择执行）
- 全仓库泛化关键词搜索
- 跳过综合分析或方案设计
- 未生成 proposal.md/design.md 就修改代码
- 生成 tasks.md 或 planspec.yaml（非本技能职责）

---

## MCP 工具使用

### 优先：Repotalk MCP（Step 2）

```javascript
repotalk.search_nodes({ repo_names: ["org/repo"], question: "..." });
repotalk.get_repos_detail({ repo_names: ["org/repo"] });
repotalk.get_packages_detail({ repo_name: "org/repo", package_ids: ["..."] });
repotalk.get_nodes_detail({ repo_name: "org/repo", node_ids: ["..."] });
repotalk.get_files_detail({ repo_name: "org/repo", file_path: "path/to/file" });
```

### 本地工具（Step 3）

- `serena` / `LSP` / `bcindex`
- `Glob` / `Grep` / `Read`

---

## 输出格式（完成时）

1. 勾选完成的 Checklist
2. 需求确认摘要
3. 搜索结果摘要（Repotalk + 本地）
4. 综合分析表
5. 采纳方案摘要
6. 生成文档列表：`proposal.md`、`design.md`

---

## 参考资源

- [writing-plans 技能](../writing-plans/SKILL.md)
