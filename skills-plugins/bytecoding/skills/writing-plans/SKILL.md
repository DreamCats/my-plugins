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

粒度示例见：`references/granularity_examples.md`

拆分技巧和编译验证示例见：`references/splitting_techniques.md`

---

## 步骤 3: 生成任务列表（强制要求）

**目标**：生成完整的任务列表文档。

**必须生成 tasks.md 文件**

文档模板详见：
- `references/task_template.md`（单个任务模板）
- `references/tasks_md_template.md`（tasks.md 完整结构）

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

```

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

输出格式示例见：`references/output_format_example.md`

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
