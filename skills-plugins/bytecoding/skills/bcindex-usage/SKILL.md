---
name: bcindex-usage
description: "bcindex CLI 使用指南。当用户询问 bcindex 使用方法、遇到 bcindex 错误、或需要构建代码索引时触发。"
---

# bcindex 使用指南

bcindex 是一个 Go 项目语义代码搜索工具，通过 AST 解析、向量检索和图分析提供智能代码搜索。

GitHub: https://github.com/DreamCats/bcindex

## 常用命令

### 构建索引（重要）

```bash
cd /path/to/your/go/project
bcindex index
```

**Tips**: 经常运行 `bcindex index` 可以提高搜索准确度，特别是代码有变更后。

### 搜索代码

```bash
# 语义搜索
bcindex search "处理订单状态的函数"

# 关键词搜索
bcindex search "UpdateOrder" -keyword-only

# 指定返回数量
bcindex search "error handling" -k 20
```

### 生成证据包（为 AI 优化）

```bash
# 生成上下文证据
bcindex evidence "如何实现幂等性"

# 输出到文件
bcindex evidence "支付流程" -output payment_evidence.json
```

### 查看统计信息

```bash
bcindex stats
bcindex stats -json
```

### 生成文档注释

```bash
bcindex docgen --dry-run  # 预览
bcindex docgen            # 实际生成
```

## MCP 集成

bcindex 提供 MCP 工具，在 `.mcp.json` 中配置：

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

**MCP 工具**：
- `bcindex_locate` - 快速定位符号定义
- `bcindex_context` - 获取代码上下文证据包
- `bcindex_refs` - 查询调用关系

## 配置文件

配置文件路径：`~/.bcindex/config/bcindex.yaml`

```yaml
embedding:
  provider: volcengine
  api_key: your-api-key
  endpoint: https://ark.cn-beijing.volces.com/api/v3
  model: doubao-embedding-vision-250615
  dimensions: 2048
```

支持 VolcEngine（火山引擎）和 OpenAI 作为向量服务提供商。

## 安装

**使用 go install：**
```bash
go install github.com/DreamCats/bcindex/cmd/bcindex@latest
```

**从源码编译：**
```bash
git clone https://github.com/DreamCats/bcindex.git
cd bcindex
go build -o bcindex ./cmd/bcindex
sudo mv bcindex /usr/local/bin/
```

## 常见问题

如果遇到错误，请参考 GitHub 仓库：https://github.com/DreamCats/bcindex

常见问题：
- **索引失败**：检查是否在 Go 项目根目录执行
- **搜索无结果**：运行 `bcindex index` 重建索引
- **API 错误**：检查 `~/.bcindex/config/bcindex.yaml` 配置
