---
name: byte-lsp-usage
description: "byte-lsp MCP 使用指南。当用户询问 byte-lsp 使用方法、需要查找符号定义、引用或调用关系时触发。"
---

# byte-lsp MCP 使用指南

byte-lsp-mcp 是一个基于 gopls 的 Go 语言分析 MCP 服务器，提供符号搜索、定义跳转、引用查找、调用层次分析等功能。

GitHub: https://github.com/DreamCats/bcodinglsp

## MCP 工具

### search_symbols - 符号搜索

按名称模式搜索 Go 符号（函数、类型、变量、方法）。

**这是探索代码库的入口点**。

```
输入参数:
- query: 搜索模式（如 "Handler"、"New"、"Parse"）
- include_external: 是否包含外部依赖（默认 false）

输出:
- 符号名称、类型、文件路径、行号
```

**使用场景**：
- 不知道代码在哪里 → 先用 search_symbols 搜索
- 找到符号后 → 用 explain_symbol 深入了解

### explain_symbol - 符号详解

获取符号的完整信息，**一次调用获取所有需要的信息**。

```
输入参数:
- file_path: 文件路径（相对或绝对）
- symbol: 符号名称
- include_source: 是否包含源码（默认 true）
- include_references: 是否包含引用（默认 true）
- max_references: 最大引用数量（默认 10）

输出:
- 签名和类型信息
- 文档注释
- 源代码
- 定义位置
- 引用列表
```

**使用场景**：
- 理解一个函数做什么
- 查看一个类型的定义
- 找到符号被使用的地方

### get_call_hierarchy - 调用层次

分析函数的调用关系。

```
输入参数:
- file_path: 文件路径
- symbol: 函数/方法名称
- direction: "incoming"（谁调用它）/ "outgoing"（它调用谁）/ "both"（双向）

输出:
- 调用者列表（incoming）
- 被调用者列表（outgoing）
- 每个调用的文件、行号、上下文
```

**使用场景**：
- 追踪请求处理流程
- 理解代码依赖关系
- 评估重构影响范围

### explain_import - 导入包分析

获取外部包（包括第三方库）的类型/函数信息。

```
输入参数:
- import_path: 导入路径（如 "encoding/json"）
- symbol: 符号名称（如 "Decoder"）

输出:
- 类型定义
- 字段列表（struct）
- 方法列表
- 文档注释
```

**使用场景**：
- 理解第三方库的类型
- 查看 protobuf/thrift 生成的代码
- 了解标准库的接口

## 安装配置

### 前置依赖

需要安装 gopls：

```bash
go install golang.org/x/tools/gopls@latest
```

### 从源码编译

```bash
git clone https://github.com/DreamCats/bcodinglsp.git
cd bcodinglsp
go build -o byte-lsp-mcp ./cmd/byte-lsp-mcp
sudo mv byte-lsp-mcp /usr/local/bin/
```

### MCP 配置

在 `.mcp.json` 中添加：

```json
{
  "mcpServers": {
    "byte-lsp": {
      "command": "byte-lsp-mcp",
      "args": []
    }
  }
}
```

## 典型工作流

### 场景 1：找到并理解一个功能

```
1. search_symbols("UserHandler")
   → 找到 internal/handler/user.go:25

2. explain_symbol(file_path="internal/handler/user.go", symbol="UserHandler")
   → 获取完整定义、文档、引用
```

### 场景 2：追踪请求处理流程

```
1. search_symbols("HandleRequest")
   → 找到入口函数

2. get_call_hierarchy(file_path="...", symbol="HandleRequest", direction="outgoing")
   → 看它调用了哪些函数

3. 对感兴趣的被调用函数继续分析
```

### 场景 3：理解外部依赖类型

```
1. explain_import(import_path="github.com/xxx/idl/user", symbol="GetUserRequest")
   → 获取 RPC 请求类型的字段定义
```

## 与其他工具的配合

| 工具 | 用途 | 何时使用 |
|------|------|----------|
| byte-lsp | 符号级分析 | 查定义、找引用、看调用关系 |
| bcindex | 语义搜索 | 自然语言描述找代码 |
| repotalk | 跨仓库搜索 | 搜索公司内部其他仓库 |

**推荐组合**：
- 知道符号名 → byte-lsp
- 只知道功能描述 → bcindex
- 需要参考其他项目 → repotalk

## 常见问题

- **符号找不到**：确保 gopls 已安装且在 PATH 中
- **响应慢**：首次使用时 gopls 需要建立索引，稍等片刻
- **外部包报错**：使用 `explain_import` 替代 `explain_symbol`
