# 工具选择决策树

本文档提供 Repotalk、bcindex、LSP 三大工具的统一选择策略，帮助在不同场景下做出最佳决策。

## 🎯 快速决策树

```
开始
  │
  ├─ 需求：分析字节内部代码库/找最佳实践？
  │   YES → Repotalk
  │   NO  → 下一步
  │
  ├─ 已知准确的符号名/接口名？
  │   YES → LSP (byte-lsp-mcp)
  │   NO  → 下一步
  │
  ├─ 有清晰的功能描述（自然语言）？
  │   YES → bcindex
  │   NO  → 下一步
  │
  └─ 兜底方案 → Glob/Grep/Read
```

## 📊 详细决策流程

### 第一层：Repotalk - 字节内部代码库搜索

#### ✅ 使用条件（满足任一即使用）

1. **需求模糊或复杂**
   - 示例："如何设计一个可扩展的促销活动引擎？"
   - 示例："用户权限验证的最佳实践是什么？"

2. **需要跨仓库参考**
   - 示例："其他项目是怎么实现缓存的？"
   - 示例："字节内部推荐使用的 RPC 框架是什么？"

3. **寻找基础设施和组件用法**
   - 示例："如何使用字节内部的配置中心？"
   - 示例："字节内部的日志库怎么用？"

4. **需要了解代码库结构**
   - 示例："这个仓库有哪些主要的包和服务？"
   - 示例："这个包提供了哪些 API？"

#### 🔧 可用工具

```javascript
// 语义搜索
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "如何处理用户登录逻辑？"
})

// 获取仓库详情
repotalk.get_repos_detail({
  repo_names: ["org/repo"]
})

// 获取包详情
repotalk.get_packages_detail({
  repo_name: "org/repo",
  package_path: "internal/service"
})

// 获取节点详情
repotalk.get_nodes_detail({
  repo_name: "org/repo",
  node_ids: ["node_id_1", "node_id_2"],
  need_related_codes: true
})

// 获取 API 信息
repotalk.get_service_apis({
  repo_name: "org/repo",
  service_name: "UserService"
})

// 基础设施搜索
repotalk.infra_search({
  query: "Redis 缓存使用"
})
```

#### 📤 完成标志

- 找到 2-3 个参考实现
- 产出候选路径/模块名/函数名
- 识别常用模式和规范
- 记录潜在的安全/性能考虑

#### ⚠️ 注意事项

- 需要有效的 `CAS_SESSION` Cookie
- 适用于字节内部代码库
- 搜索速度相对较慢，适合需求分析阶段

---

### 第二层：LSP (byte-lsp-mcp) - 符号级精确查询

#### ✅ 使用条件（满足任一即使用）

1. **已知准确的符号名**
   - 示例："IUserHandler 接口有哪些实现？"
   - 示例："GetUserByID 函数在哪里被调用？"

2. **需要理解类型关系**
   - 示例："这个结构体实现了哪些接口？"
   - 示例："这个函数的返回类型是什么？"

3. **需要查找引用或实现**
   - 示例："所有调用 UpdateUser 的地方"
   - 示例："谁实现了 IValidator 接口？"

4. **需要精确的代码导航**
   - 示例："跳转到这个函数的定义"
   - 示例："查看这个类型的完整定义"

#### 🔧 可用工具

```javascript
// 查找定义
mcp__byte_lsp_mcp__go_to_definition({
  code: fileContent,
  file_path: "internal/service/user_service.go",
  symbol: "GetUserByID",
  use_disk: true,
})

// 查找引用
mcp__byte_lsp_mcp__find_references({
  code: fileContent,
  file_path: "internal/handler/user_handler.go",
  symbol: "IUserHandler",
  include_declaration: false,
  use_disk: true,
})

// 符号搜索
mcp__byte_lsp_mcp__search_symbols({
  query: "HandleUpdate",
  file_path: "internal/handler",
})

// 查看类型定义
mcp__byte_lsp_mcp__go_to_definition({
  code: fileContent,
  file_path: "internal/model/user.go",
  symbol: "User",
  use_disk: true,
})

// 获取悬停信息（文档）
mcp__byte_lsp_mcp__get_hover({
  code: fileContent,
  file_path: "internal/service/user_service.go",
  symbol: "GetUserByID",
  use_disk: true,
})
```

#### 📤 完成标志

- 找到符号的准确定义位置
- 定位所有引用或实现
- 理解类型层次和继承关系
- 获取符号的文档信息

#### ⚠️ 注意事项

- 需要准确的符号名（拼写敏感）
- LSP 服务器需要初始化索引（大型项目可能需要时间）
- 最适合精确的符号级查询

---

### 第三层：bcindex - 自然语言语义检索

#### ✅ 使用条件（满足任一即使用）

1. **有功能描述但不确定符号名**
   - 示例："查找处理用户认证的代码"
   - 示例："项目中的日志记录在哪里？"

2. **按职责定位模块**
   - 示例："所有的验证逻辑在哪个包？"
   - 示例："这个项目有哪些 HTTP handler？"

3. **关键词可能拼写/断词不准确**
   - 示例："找 'auth' 相关的代码"（可能是 authentication、authorize 等）
   - 示例："用户权限检查"（可能是 checkPermission、verifyPermission 等）

4. **需要理解代码的语义含义**
   - 示例："这个项目的错误处理是怎么做的？"
   - 示例："有哪些数据库操作的代码？"

#### 🔧 可用工具

```javascript
// 定位符号定义
mcp__plugin_bcindex__locate({
  query: "用户认证验证 JWT",
  top_k: 5,
})

// 查询上下文
mcp__plugin_bcindex__context({
  query: "数据库连接池管理",
  top_k: 3,
})

// 查询引用关系
mcp__plugin_bcindex__refs({
  query: "Redis 缓存",
  top_k: 5,
})
```

#### 📤 完成标志

- 找到相关的代码位置（文件路径、行号）
- 收敛真实的术语（符号名、函数名）
- 理解代码的组织结构和模块划分
- 定位到具体的实现细节

#### ⚠️ 注意事项

- 适合本地代码库的语义检索
- 当术语不可靠时优先使用
- 可以作为 LSP 的前置步骤（先收敛术语，再用 LSP 精确定位）

---

### 第四层：Glob/Grep/Read - 兜底方案

#### ✅ 使用条件

1. MCP 工具全部不可用
2. 已知具体的文件路径（直接 Read）
3. 简单的关键词匹配（Grep）
4. 文件模式匹配（Glob）

#### 🔧 可用工具

```bash
# 列出文件
Glob: "**/*handler*.go"

# 搜索关键词
Grep: "UpdateUser" --type go

# 读取文件
Read: "internal/service/user_service.go"
```

#### ⚠️ 注意事项

- ⚠️ **最后的选择**：只在 MCP 工具不可用时使用
- ⚠️ 基于文本匹配，无法理解代码语义
- ⚠️ 容易产生误报（如注释、字符串中的关键词）

---

## 🎯 场景示例

### 场景 1：快速实现（quick-fixer）

**用户需求**："给 GetUserByID 添加日志"

```
决策路径：
1. 已知符号名 "GetUserByID"
   → LSP find_references 查找所有调用
2. 找到定义位置
   → LSP go_to_definition 查看实现
3. 查看周边代码
   → Read 读取文件内容
```

**工具优先级**：LSP > Read > bcindex > Grep

---

### 场景 2：代码审查（code-reviewer）

**用户需求**："审查这段代码的正确性"

```
决策路径：
1. Git diff 找到改动文件
2. 对每个改动文件：
   - 查看类型定义 → LSP go_to_definition
   - 查找类似实现 → bcindex locate
   - 对比代码风格 → bcindex context
   - 检查错误处理 → LSP find_references (error)
```

**工具优先级**：LSP + bcindex 并行使用 > Read

---

### 场景 3：需求分析（brainstorming）

**用户需求**："添加用户权限验证"

```
决策路径：
1. 需求模糊 → Repotalk search_nodes
   - 查询："用户权限验证 最佳实践"
   - 产出：候选方案、参考实现
2. 收敛候选路径 → bcindex locate
   - 查询："权限检查 验证"
   - 产出：真实术语、模块位置
3. 精确定位符号 → LSP search_symbols
   - 查询："CheckPermission"
   - 产出：具体实现
```

**工具优先级**：Repotalk > bcindex > LSP > Read

---

### 场景 4：系统性调试（systematic-debugging）

**用户需求**："为什么这个接口返回 500 错误？"

```
决策路径：
1. 定位错误日志 → Grep (日志关键词)
2. 找到错误处理代码 → bcindex locate ("错误处理 exception")
3. 追踪调用链 → LSP find_references
4. 查看相关实现 → Read
```

**工具优先级**：Grep (日志) > bcindex > LSP > Read

---

## 📋 工具对比总结

| 维度 | Repotalk | LSP | bcindex | Glob/Grep/Read |
|------|----------|-----|---------|----------------|
| **搜索范围** | 字节内部代码库 | 本地代码库 | 本地代码库 | 本地代码库 |
| **搜索方式** | 语义 + 结构化 | 符号级精确 | 自然语言语义 | 文本匹配 |
| **准确性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **速度** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **主要用途** | 需求分析、找最佳实践 | 精确定位符号 | 语义检索代码 | 兜底方案 |
| **输入要求** | 自然语言问题 | 准确的符号名 | 功能描述 | 关键词/路径 |
| **适用阶段** | 设计阶段 | 实现/审查阶段 | 分析/实现阶段 | 任何阶段 |

---

## ⚡ 快速参考

### 我应该用哪个工具？

- **我有准确的符号名** → LSP
- **我有功能描述但不知道符号名** → bcindex
- **我需要参考其他项目的实现** → Repotalk
- **我需要了解字节内部基础设施** → Repotalk
- **我要查找接口的所有实现** → LSP
- **我要找类似的代码实现** → bcindex
- **我要找包含某个关键词的所有文件** → Grep (最后的兜底)
- **MCP 工具都不可用** → Glob/Grep/Read

---

## 🔗 相关文档

- [最佳实践](./tool-usage-best-practices.md)
- [brainstorming 工作流](../skills/brainstorming/SKILL.md)
- [local_search_strategy](../skills/brainstorming/references/local_search_strategy.md)
- [repotalk_workflow](../skills/brainstorming/references/repotalk_workflow.md)
