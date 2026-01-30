---
name: bcindex-usage
description: "bcindex CLI 和 MCP 使用指南。当用户询问 bcindex 使用方法、遇到 bcindex 错误、需要语义搜索代码或构建索引时触发。"
---

# bcindex 使用指南

bcindex 是一个为 Go 项目设计的语义代码搜索工具，通过 AST 解析、向量检索和图分析提供智能代码查找体验。

GitHub: https://github.com/DreamCats/bcindex

## 常用 CLI 命令

### 构建索引（重要）

```bash
cd /path/to/your/go/project
bcindex index

# 强制重建
bcindex index -force

# 详细输出
bcindex index -v
```

**Tips**: 代码变更后运行 `bcindex index` 可以提高搜索准确度。

### 搜索代码

```bash
# 自然语言搜索
bcindex search "处理订单状态的函数"

# 关键词搜索
bcindex search "UpdateOrder" -keyword-only

# 向量搜索
bcindex search "database connection" -vector-only

# 指定返回数量
bcindex search "error handling" -k 20

# JSON 输出
bcindex search "cache" -json

# 详细输出（包含评分和理由）
bcindex search "order status" -v
```

### 生成证据包（为 AI 优化）

证据包是为 LLM 优化的结构化上下文，包含包卡片、符号卡片、代码片段和图提示。

```bash
# 生成到标准输出
bcindex evidence "如何实现幂等性"

# 保存到文件
bcindex evidence "支付流程" -output payment_evidence.json

# 自定义大小
bcindex evidence "database migration" \
  -max-packages 5 \
  -max-symbols 20 \
  -max-snippets 10 \
  -max-lines 500
```

### 查看统计信息

```bash
bcindex stats
bcindex stats -json
```

### 生成文档注释

使用 LLM 自动为缺少文档的 Go 代码生成注释。

```bash
# 预览模式
bcindex docgen --dry-run

# 显示差异
bcindex docgen --diff

# 限制数量
bcindex docgen --max 50 --max-per-file 10

# 只处理特定路径
bcindex docgen --include internal/service --exclude vendor

# 实际生成
bcindex docgen
```

## MCP 工具

bcindex 提供 6 个 MCP 工具：

### bcindex_locate - 快速定位

适合"在哪里/是什么"类问题。

```json
{
  "query": "ProcessPayment",
  "top_k": 10,
  "include_unexported": false
}
```

### bcindex_context - 上下文证据包

适合"怎么实现/调用链/模块关系"类问题。

**参数**：
- `query`: 查询内容
- `intent`: 结果聚焦方向
  - `"design"`: 偏向接口、服务层、架构概览
  - `"implementation"`: 偏向具体代码、repository/domain 层
  - `"extension"`: 偏向接口、中间件、扩展点
- `kind_filter`: 按符号类型过滤（func/method/struct/interface/type）
- `layer_filter`: 按架构层过滤（handler/service/repository/domain/middleware/util）

```json
{
  "query": "支付处理流程",
  "intent": "implementation",
  "kind_filter": ["func", "method"],
  "layer_filter": ["service", "repository"],
  "max_symbols": 15,
  "max_lines": 300
}
```

### bcindex_refs - 引用关系

适合"被谁引用/谁实现/外部依赖"类问题。

**支持的边类型**：
- `implements`: 找到实现某接口的类型
- `imports`: 找到导入某包的包
- `embeds`: 找到嵌入某 struct 的类型
- `references`: 找到符号的引用

**注意**：函数调用关系（calls）请使用 `byte-lsp` 的 `get_call_hierarchy`。

```json
{
  "symbol_name": "PaymentService",
  "package_path": "myapp/service/payment",
  "edge_type": "implements",
  "direction": "incoming",
  "top_k": 20
}
```

### bcindex_read - 读取源码

按符号 ID 或文件路径读取源码。

```json
// 按符号 ID
{
  "symbol_id": "func:myapp/service/payment.ProcessPayment",
  "context_lines": 5,
  "max_lines": 200
}

// 按文件路径
{
  "file_path": "internal/service/payment.go",
  "start_line": 100,
  "end_line": 150,
  "include_line_no": true
}
```

### bcindex_status - 索引状态

检查索引是否存在及新鲜度。

```json
{
  "repo": "/path/to/repo"  // 可选，默认当前目录
}
```

### bcindex_repos - 列出仓库

列出所有已索引的仓库。

## MCP 配置

在 `.mcp.json` 中添加：

```json
{
  "mcpServers": {
    "bcindex": {
      "command": "bcindex",
      "args": ["mcp"]
    }
  }
}
```

固定仓库路径：

```json
{
  "mcpServers": {
    "bcindex": {
      "command": "bcindex",
      "args": ["-repo", "/path/to/your/repo", "mcp"]
    }
  }
}
```

## 配置文件

路径：`~/.bcindex/config/bcindex.yaml`

```yaml
# 向量服务配置（必需）
embedding:
  provider: volcengine
  api_key: your-api-key
  endpoint: https://ark.cn-beijing.volces.com/api/v3
  model: doubao-embedding-vision-250615
  dimensions: 2048
  batch_size: 10

# DocGen 配置（可选）
docgen:
  provider: volcengine
  api_key: your-docgen-api-key
  endpoint: https://ark.cn-beijing.volces.com/api/v3/chat/completions
  model: doubao-1-5-pro-32k-250115
```

## 领域同义词配置

首次运行 `bcindex docgen` 会在仓库根目录生成 `domain_aliases.yaml`：

```yaml
version: 1

synonyms:
  秒杀:
    - flash sale
    - promotion
    - seckill
  达人:
    - creator
    - influencer
    - koc
```

用于查询扩展，提高搜索召回率。

## 与 byte-lsp 的配合

| 场景 | 推荐工具 |
|------|---------|
| 语义搜索代码 | `bcindex_context` |
| 精确定位符号 | `bcindex_locate` 或 `byte-lsp:search_symbols` |
| 函数调用关系 | `byte-lsp:get_call_hierarchy` |
| 接口实现关系 | `bcindex_refs` |
| 符号详细信息 | `byte-lsp:explain_symbol` |
| 读取符号源码 | `bcindex_read` |

## 安装

```bash
# 从 GitHub
git clone https://github.com/DreamCats/bcindex.git
cd bcindex
go build -o bcindex ./cmd/bcindex
sudo mv bcindex /usr/local/bin/

# 或 go install
go install github.com/DreamCats/bcindex/cmd/bcindex@latest
```

## 常见问题

- **索引失败**：检查是否在 Go 项目根目录执行，确保有 `go.mod`
- **搜索无结果**：运行 `bcindex index` 重建索引
- **API 错误**：检查 `~/.bcindex/config/bcindex.yaml` 配置
- **索引过期**：使用 `bcindex_status` 检查，超过 24 小时建议重建
