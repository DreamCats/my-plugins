# Code Reviewer 工具使用指南

本文档提供 code-reviewer agent 在代码审查过程中使用 MCP 工具的详细示例和最佳实践。

## 🎯 工具使用策略

### 优先级

```
1. LSP (byte-lsp-mcp) - 优先使用
   适用场景：已知符号名、需要精确查找引用/实现

2. bcindex - 次优选择
   适用场景：需要查找类似实现、对比代码风格

3. Read/Grep - 兜底方案
   适用场景：MCP 工具不可用时
```

### 与 brainstorming 的区别

| 维度 | brainstorming | code-reviewer |
|------|--------------|---------------|
| **目标** | 理解需求、设计方案 | 审查代码质量 |
| **Repotalk** | ✅ 优先使用（找参考实现） | ❌ 不使用 |
| **LSP** | ✅ 精确定位符号 | ✅ **必须使用**（理解上下文） |
| **bcindex** | ✅ 语义检索 | ✅ **必须使用**（对比风格） |

**重要**：code-reviewer 不使用 Repotalk，因为审查对象是明确的本地代码，不需要搜索字节内部代码库。

---

## 🔍 步骤 3.2: 正确性与安全性审查

### LSP 工具使用

#### 查看函数定义和类型信息

```javascript
mcp__byte_lsp_mcp__go_to_definition({
  code: fileContent,
  file_path: "internal/service/user_service.go",
  symbol: "GetUserByID",
  use_disk: true,
});
```

#### 查找 error 的所有引用，检查是否被正确处理

```javascript
mcp__byte_lsp_mcp__find_references({
  code: fileContent,
  file_path: "internal/handler/user_handler.go",
  symbol: "error",
  include_declaration: false,
  use_disk: true,
});
```

#### 查看接口类型定义

```javascript
mcp__byte_lsp_mcp__go_to_definition({
  code: fileContent,
  file_path: "internal/handler/user_handler.go",
  symbol: "IUserService",
  use_disk: true,
});
```

#### 获取符号的文档信息

```javascript
mcp__byte_lsp_mcp__get_hover({
  code: fileContent,
  file_path: "internal/service/user_service.go",
  symbol: "UpdateUser",
  use_disk: true,
});
```

### bcindex 工具使用

#### 查找项目中类似的错误处理实现

```javascript
mcp__plugin_bcindex__locate({
  query: "错误处理 error check 验证",
  top_k: 5,
});
```

#### 查找用户输入验证的实现

```javascript
mcp__plugin_bcindex__locate({
  query: "参数验证 用户输入 检查",
  top_k: 3,
});
```

---

## ⚡ 步骤 3.3: 性能与并发审查

### LSP 工具使用

#### 查找 goroutine 的创建位置

```javascript
mcp__byte_lsp_mcp__find_references({
  code: fileContent,
  file_path: "internal/service/async_service.go",
  symbol: "go",
  include_declaration: false,
  use_disk: true,
});
```

#### 查找 channel 的定义和使用

```javascript
mcp__byte_lsp_mcp__go_to_definition({
  code: fileContent,
  file_path: "internal/queue/worker.go",
  symbol: "chan",
  use_disk: true,
});
```

#### 查找 sync.Mutex 的使用

```javascript
mcp__byte_lsp_mcp__find_references({
  code: fileContent,
  file_path: "internal/cache/concurrent_map.go",
  symbol: "Mutex",
  include_declaration: false,
  use_disk: true,
});
```

#### 查找 context 的使用

```javascript
mcp__byte_lsp_mcp__find_references({
  code: fileContent,
  file_path: "internal/handler/request_handler.go",
  symbol: "context.Context",
  include_declaration: false,
  use_disk: true,
});
```

### bcindex 工具使用

#### 查找缓存使用模式

```javascript
mcp__plugin_bcindex__locate({
  query: "缓存 sync.Map redis 性能优化",
  top_k: 5,
});
```

#### 查找并发处理的实现

```javascript
mcp__plugin_bcindex__locate({
  query: "并发处理 worker pool goroutine",
  top_k: 5,
});
```

#### 查找数据库操作的性能优化

```javascript
mcp__plugin_bcindex__locate({
  query: "数据库 批量查询 性能优化 batch",
  top_k: 3,
});
```

---

## 🎨 步骤 3.4: 风格与可维护性审查

### LSP 工具使用

#### 查找接口的所有实现，对比命名和结构

```javascript
mcp__byte_lsp_mcp__find_references({
  code: fileContent,
  file_path: "internal/handler/user_handler.go",
  symbol: "IUserHandler",
  include_declaration: false,
  use_disk: true,
});
```

#### 查看结构体的定义和字段命名

```javascript
mcp__byte_lsp_mcp__go_to_definition({
  code: fileContent,
  file_path: "internal/model/user.go",
  symbol: "User",
  use_disk: true,
});
```

#### 查找函数的调用关系，分析函数职责

```javascript
mcp__byte_lsp_mcp__find_references({
  code: fileContent,
  file_path: "internal/service/user_service.go",
  symbol: "UpdateUser",
  include_declaration: false,
  use_disk: true,
});
```

#### 搜索类似命名的函数，对比命名风格

```javascript
mcp__byte_lsp_mcp__search_symbols({
  query: "Handle",
  file_path: "internal/handler",
});
```

### bcindex 工具使用

#### 查找项目中类似的 handler 实现

```javascript
mcp__plugin_bcindex__locate({
  query: "HTTP handler 处理函数 路由注册",
  top_k: 5,
});
```

#### 查找 service 层的实现模式

```javascript
mcp__plugin_bcindex__locate({
  query: "service 业务逻辑 服务层实现",
  top_k: 5,
});
```

#### 查找错误处理的标准模式

```javascript
mcp__plugin_bcindex__context({
  query: "错误返回 error wrap 处理模式",
  top_k: 3,
});
```

#### 查找配置和初始化的实现

```javascript
mcp__plugin_bcindex__locate({
  query: "配置初始化 config 加载",
  top_k: 3,
});
```

---

## 🌳 工具选择决策流程

```
开始审查
  │
  ├─ 需要查看函数/类型的定义？
  │   YES → LSP go_to_definition
  │   NO  → 下一步
  │
  ├─ 需要查找符号的所有引用？
  │   YES → LSP find_references
  │   NO  → 下一步
  │
  ├─ 需要对比类似的实现模式？
  │   YES → bcindex locate/context
  │   NO  → 下一步
  │
  └─ 需要查看具体的代码内容？
      → Read
```

---

## 📚 相关文档

- [工具选择决策树](../guides/tool-selection-decision-tree.md)
- [brainstorming SKILL](../skills/brainstorming/SKILL.md)
- [local_search_strategy](../skills/brainstorming/references/local_search_strategy.md)
