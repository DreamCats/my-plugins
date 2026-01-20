---
name: brainstorming
description: Turn vague requirements into a concrete design via a mandatory 6-step workflow. Docs must be done before any code changes.
---

# Brainstorming 技能

通过强制工作流和多源代码分析，将模糊需求转化为精化的设计方案。

## 工作流程检查清单（强制执行）

使用 "TodoWrite" 跟踪以下 6 步；可跳过步骤需注明原因：

```
Brainstorming Progress:
- [ ] 步骤 1: 理解需求 - 需求不清晰时用 "use ask question" 单轮提问并等待确认；需求明确时可直接确认理解
- [ ] 步骤 2: Repotalk MCP 搜索 - 复杂/模糊需求优先执行；简单明确可跳过并说明原因（repo_names=org/repo）
- [ ] 步骤 3: 本地定向搜索 - 基于候选路径/术语验证与补充
- [ ] 步骤 4: 综合分析与方案设计 - 结合搜索结果，提出 2-3 种方案并给出推荐方案
- [ ] 步骤 5: 生成文档 - 必须生成 proposal.md 和 design.md
- [ ] 步骤 6: 验证完成 - 确认所有文档已生成
```

---

## 步骤 1: 理解需求（必要时提问并确认）

在开始任何搜索之前，先确保理解需求。若需求清晰且简单，可直接复述理解并进入下一步。

**若需要提问，必须显式使用 "use ask question" 方式发起提问**，不要直接进入搜索。

**提问必须包括**（最多 4 个）：

1. 具体的功能范围是什么？
2. 有哪些技术约束或偏好？
3. 是否需要考虑向后兼容性？
4. 预期的性能或安全要求？

**规则**：最多 1 轮澄清（<=4 问）；需求已清晰则不提问直接进入步骤 2；用户回答后不再追问。

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

详细工作流程和代码示例见：`references/repotalk_workflow.md`

**完成标志**：

- 找到 2-3 个参考实现
- 产出候选路径/模块名/函数名
- 识别常用模式和规范
- 记录潜在的安全/性能考虑

**如果 Repotalk 无结果**：检查格式、Cookie、关键词；标注后降级到本地搜索。

---

## 步骤 3: 本地定向搜索分析

**目标**：基于 Repotalk 产出的候选路径/术语（或用户已明确的范围）做**定向验证**，避免全仓库关键词搜索。

**约束**：若执行步骤 2，需先完成 Repotalk；若跳过需说明原因。

**优先级**：Serena MCP/LSP（符号/引用链清晰） > bcindex mcp（语义定位） > Glob/Grep/Read（兜底）。详细策略见：`references/local_search_strategy.md`

**注意**：使用 Serena MCP/LSP 前需先执行 Activate（激活项目），之后才能使用其他 LSP 能力。

---

## 步骤 4: 综合分析与方案设计

**目标**：结合 Repotalk 和本地搜索结果，进行综合分析并提出 2-3 种具体方案，给出推荐方案。

综合分析和方案设计模板见：`references/analysis_template.md`

**重要**：综合分析与方案设计应一次性输出，保持逻辑连贯性。

---

## 步骤 5: 生成文档（强制要求）

**必须生成以下文件**：

模板：`references/proposal_template.md`、`references/design_template.md`；若 `.bytecoding/changes/$CHANGE_ID/` 下的 `proposal.md` / `design.md` 已存在，则直接使用现有文件，无需再读取模板。

**职责划分**：

- 本技能：proposal.md + design.md
- writing-plans：tasks.md
- repo-plan：planspec.yaml

---

## 步骤 6: 验证完成

**完成标志检查清单**：

```
✓ 需求理解已确认（若有提问）
✓ 若执行 Repotalk MCP 搜索，已产出候选路径/术语
✓ 完成本地定向搜索（基于候选范围验证）
✓ 完成综合分析与方案设计（提出 2-3 种方案并推荐其一）
✓ 生成 proposal.md
✓ 生成 design.md
```

**当且仅当所有上述条件满足时，本技能完成。**

---

## 禁止行为

- ❌ **需求不清晰未澄清就搜索** - 必须显式使用 "use ask question"
- ❌ **超过 1 轮澄清提问**
- ❌ **repo_names 格式错误** - 必须使用 `org/repo` 格式
- ❌ **盲目全仓库关键词搜索** - 必须先收敛范围
- ❌ **跳过本地定向搜索** - 必须在完成 Repotalk 或明确跳过后执行
- ❌ **跳过综合分析与方案设计** - 必须结合搜索结果并提出方案
- ❌ **跳过文档生成** - 必须生成 proposal.md 和 design.md
- ❌ **生成 tasks.md** - 应由 writing-plans 技能负责
- ❌ **生成 planspec.yaml** - 应由 repo-plan 命令负责
- ❌ **综合分析与方案设计分离输出** - 应一次性输出，保持逻辑连贯
- ❌ **未确认就扩展到 service/biz 层** - 需保持在用户指定范围
- ❌ **方案没有基于已收集证据** - 必须基于 Repotalk 或本地搜索结果
- ❌ **在生成文档前修改代码** - 文档必须先于代码修改

---

## 参考资源

- `references/repotalk_workflow.md`
- `references/local_search_strategy.md`
- [Repotalk MCP 工具使用说明](../../scripts/session-start-hook.js)
- [writing-plans 技能](../writing-plans/SKILL.md)
