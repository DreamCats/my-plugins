---
name: writing-skills
description: Use when creating or modifying skill files. This meta-skill defines the standards, best practices, and testing methods for writing effective skills in the Bytecoding system.
---

# Writing Skills 技能（元技能）

## 目标

为 Bytecoding 技能系统编写高质量的技能文档。

**这是元技能**：用于编写其他技能的技能。

---

## 技能文件格式

### YAML Frontmatter

每个技能文件必须以 YAML frontmatter 开头：

```yaml
---
name: skill-name
description: Use when...（第三人称，描述使用场景）
---
```

**规则**：
- `name`：小写字母、数字、连字符（无空格）
- `description`：清晰描述何时使用此技能（第三人称）

**示例**：
```yaml
---
name: brainstorming
description: Use when discussing requirements, exploring implementation approaches, or designing solutions.
---
```

---

## 技能结构

### 推荐结构

```markdown
---
name: skill-name
description: Use when...
---

# 技能名称

## 目标
[一句话描述技能目标]

## 工作流程
[详细步骤]

## MCP 工具使用
[工具清单]

## 禁止行为
[禁止列表]

## 完成标志
[完成标准]

## 与其他技能的集成
[集成说明]
```

### 可选章节

- **概述/概念**：解释核心概念
- **使用场景**：何时使用/不使用
- **示例**：具体示例
- **最佳实践**：推荐做法
- **常见问题**：FAQ
- **输出格式**：产出格式说明

---

## MCP 流程编排指南

### 双源搜索原则

**核心原则**：必须结合本地搜索 + Repotalk MCP 搜索

```markdown
### 本地搜索
- 使用 Glob/Grep 查找相关代码
- 理解项目现状
- 找到参考实现

### Repotalk MCP 搜索
- 搜索字节内部代码库
- 查找类似实现
- 学习最佳实践

### 综合分析
- 对比本地和 Repotalk 结果
- 识别最佳实践
- 提出综合建议
```

### MCP 工具清单

**在技能中明确列出使用的 MCP 工具**：

```markdown
## MCP 工具使用清单

**本技能强制使用以下 MCP 工具**：

### 本地工具
- [x] `Glob` - 查找文件
- [x] `Grep` - 搜索代码
- [x] `Read` - 阅读文件
- [x] `Write`/`Edit` - 编辑文件
- [x] `Bash` - 执行命令

### Repotalk MCP（如果已配置）
- [x] `repotalk.search_code()` - 搜索代码实现
- [x] `repotalk.search_files()` - 查找文件
- [x] `repotalk.search()` - 组合搜索
```

---

## 技能编写最佳实践

### 1. 清晰的使用场景

**好的描述**：
```yaml
description: Use when debugging code issues, errors, or unexpected behavior.
```

**不好的描述**：
```yaml
description: A skill for debugging.
```

### 2. 具体的工作流程

**好的工作流程**：
```markdown
## 工作流程

### 步骤 1: 收集信息
- [ ] 读取错误消息
- [ ] 定位错误代码
- [ ] 理解调用链

### 步骤 2: 分析根因
- [ ] 搜索相关代码
- [ ] 查找类似问题
- [ ] 形成假设
```

**不好的工作流程**：
```markdown
## 工作流程

分析问题并修复。
```

### 3. 明确的禁止行为

**好的禁止列表**：
```markdown
## 禁止行为

- ❌ 跳过根因调查
- ❌ 只修复表面问题
- ❌ 不记录分析过程
```

### 4. 可验证的完成标志

**好的完成标志**：
```markdown
## 完成标志

当以下条件满足时，本技能完成：

- [x] 根因已确认
- [x] 修复已实施
- [x] 测试已通过
- [x] 报告已生成
```

### 5. 集成说明

**好的集成说明**：
```markdown
## 与其他技能的集成

**前置技能**：`brainstorming`
**后置技能**：`writing-plans`

**集成流程**：
```
brainstorming → writing-plans
     ↓              ↓
  设计方案        任务列表
```
```

---

## 技能测试方法

### TDD 应用于文档

**测试驱动文档**：

1. **RED**：识别技能应该解决的问题
2. **GREEN**：编写技能文档解决问题
3. **REFACTOR**：改进技能文档

### 测试场景

**压力场景测试**：

**场景 1：模糊需求**
```
用户："帮我做个用户系统"
触发技能：brainstorming
验证：技能是否引导用户澄清需求？
```

**场景 2：调试错误**
```
用户："代码报错了"
触发技能：systematic-debugging
验证：技能是否收集错误信息？
```

**场景 3：完成验证**
```
用户："我写完了"
触发技能：verification-before-completion
验证：技能是否执行验证清单？
```

### 子代理测试

**使用子代理测试技能效果**：

```javascript
Task({
  subagent_type: "general-purpose",
  description: "测试 brainstorming 技能",
  prompt: `你正在使用 bytecoding:brainstorming 技能。

用户请求："添加用户登录功能"

请按照技能文档执行流程：
1. 理解需求（提问澄清）
2. 本地搜索（Glob/Grep）
3. Repotalk MCP 搜索
4. 综合分析
5. 提出方案

观察技能是否有效引导你完成流程。`
})
```

---

## 技能命名约定

### 命名格式

**动名词结构**（推荐）：
```
using-git-worktrees      # 使用 Git Worktrees
writing-plans            # 编写计划
test-driven-development  # 测试驱动开发
```

**名词结构**（特殊情况）：
```
brainstorming            # 头脑风暴
systematic-debugging     # 系统化调试
```

### 命名空间

**所有技能使用 `bytecoding:` 命名空间**：
```
bytecoding:brainstorming
bytecoding:writing-plans
bytecoding:systematic-debugging
```

---

## 技能分类

### 按功能分类

**入口技能**：
- `using-bytecoding` - 技能系统规则

**规划技能**：
- `brainstorming` - 需求精化
- `writing-plans` - 任务规划

**执行技能**：
- `using-git-worktrees` - 环境隔离
- `subagent-driven-development` - 子代理执行
- `test-driven-development` - TDD 实施

**质量保证技能**：
- `systematic-debugging` - 调试
- `verification-before-completion` - 完成验证

**元技能**：
- `writing-skills` - 编写技能

### 按优先级分类

**核心技能**（强制 MCP 编排）：
- `brainstorming`
- `systematic-debugging`

**重要技能**：
- `writing-plans`
- `subagent-driven-development`
- `test-driven-development`

**辅助技能**：
- `using-git-worktrees`
- `verification-before-completion`

---

## 技能文档模板

### 基础模板

```markdown
---
name: skill-name
description: Use when...
---

# 技能名称

## 目标
[一句话描述]

## 工作流程

### 阶段 1: [阶段名称]
[步骤]

### 阶段 2: [阶段名称]
[步骤]

## MCP 工具使用

**本技能使用的 MCP 工具**：
- [x] [工具名] - [用途]

## 禁止行为

- ❌ [禁止项]

## 完成标志

- [x] [完成标准]

## 与其他技能的集成

**前置技能**：[技能名]
**后置技能**：[技能名]
```

### 高级模板（带 MCP 编排）

```markdown
---
name: skill-name
description: Use when...
---

# 技能名称

## 目标
[一句话描述]

## 使用场景

**适用**：
- [场景 1]
- [场景 2]

**不适用**：
- [场景 3]

---

## 工作流程

### 阶段 1: [阶段名称]

**目标**：[阶段目标]

#### 步骤 1.1

**本地搜索**：
```bash
# 搜索相关文件
Glob: "**/*.ts"
Grep: "function.*name"
```

**Repotalk MCP 搜索**：
```javascript
repotalk.search_code("keyword")
```

**综合分析**：
[分析方法说明]

#### 步骤 1.2

[后续步骤]

---

## MCP 工具使用清单

**本技能强制使用以下 MCP 工具**：

### 本地工具
- [x] `Glob` - [用途]
- [x] `Grep` - [用途]
- [x] `Read` - [用途]

### Repotalk MCP
- [x] `repotalk.search_code()` - [用途]
- [x] `repotalk.search()` - [用途]

---

## 输出格式

[输出模板]

---

## 禁止行为

- ❌ [禁止项 1]
- ❌ [禁止项 2]

---

## 完成标志

- [x] [完成标准 1]
- [x] [完成标准 2]

---

## 与其他技能的集成

**前置技能**：[技能名]
**后置技能**：[技能名]

**集成流程**：
```
[前置技能] → [本技能] → [后置技能]
     ↓            ↓            ↓
  [输出]      [处理]       [输出]
```
```

---

## 技能审查清单

**在标记技能完成前，验证以下项**：

### 格式检查
- [ ] YAML frontmatter 正确
- [ ] 技能名称符合命名约定
- [ ] 描述清晰（第三人称）

### 内容检查
- [ ] 目标明确
- [ ] 工作流程详细
- [ ] MCP 工具清单完整
- [ ] 禁止行为明确
- [ ] 完成标志可验证
- [ ] 集成说明清晰

### 质量检查
- [ ] 无语法错误
- [ ] 无拼写错误
- [ ] 格式一致
- [ ] 示例正确

### MCP 编排检查（如适用）
- [ ] 本地搜索策略明确
- [ ] Repotalk MCP 搜索策略明确
- [ ] 综合分析方法明确
- [ ] MCP 工具清单完整

---

## 技能迭代

### 版本控制

**技能文档纳入 Git 管理**：
- 变更历史可追溯
- 支持回滚
- 贡献流程标准化

### 改进流程

**基于反馈改进技能**：

1. **收集反馈**
   - 用户使用体验
   - 子代理测试结果
   - 代码审查意见

2. **分析问题**
   - 技能是否触发？
   - 流程是否清晰？
   - MCP 工具是否有效？

3. **实施改进**
   - 更新技能文档
   - 添加示例
   - 优化流程

4. **验证改进**
   - 子代理测试
   - 真实场景验证

---

## 禁止模式

### ❌ 禁止的技能模式

**1. 过于笼统**：
```yaml
name: helper
description: Use when you need help.
```

**2. 流程不清晰**：
```markdown
## 工作流程

做正确的事情。
```

**3. 缺少验证**：
```markdown
## 完成标志

做完了。
```

### ✅ 推荐的技能模式

**1. 具体明确**：
```yaml
name: systematic-debugging
description: Use when debugging code issues, errors, or unexpected behavior.
```

**2. 流程详细**：
```markdown
## 工作流程

### 阶段 1: 根因调查
- 收集错误信息
- 本地搜索分析
- Repotalk MCP 搜索
```

**3. 验证明确**：
```markdown
## 完成标志

- [x] 根因已确认
- [x] 修复已验证
- [x] 报告已生成
```

---

## 示例技能

**参考现有技能作为模板**：
- `brainstorming` - MCP 编排示例
- `systematic-debugging` - 四阶段流程示例
- `test-driven-development` - 铁律和禁止行为示例

---

## 完成标志

当以下条件满足时，本技能完成：

- [x] 技能文件格式正确
- [x ] YAML frontmatter 有效
- [x] 工作流程清晰
- [x] MCP 工具清单完整
- [x] 禁止行为明确
- [x] 完成标志可验证
- [x] 审查清单通过
- [x] 子代理测试通过
