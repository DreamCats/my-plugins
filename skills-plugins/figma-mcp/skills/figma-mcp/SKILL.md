---
name: figma-mcp
description: 当用户提供 Figma URL（figma.com/design/... 或 figma.com/file/...）、或要求查看/分析 Figma 设计稿、导出 Figma 图片、列出 Figma 工具时使用此 skill。触发关键词："Figma MCP"、"figma-developer-mcp"、"列出 Figma 工具"、"调用 Figma 工具"、"查看设计稿"、"导出 Figma 图片"。
---

# Figma MCP

## 脚本路径

脚本位于插件目录下的 `scripts/figma_mcp.py`，通过 `${CLAUDE_PLUGIN_ROOT}` 环境变量引用：

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py call --name <tool> --args '...'
```

**禁止使用相对路径或硬编码绝对路径**，因为工作目录不在插件目录内。

## URL 解析规则

当用户提供 Figma URL 时，按以下规则自动提取参数：

- **fileKey**: URL 中 `/design/<fileKey>/` 或 `/file/<fileKey>/` 部分
- **nodeId**: URL 参数 `node-id=<nodeId>`，将 `-` 替换为 `:`（如 `113-25054` → `113:25054`）

示例：
```
https://www.figma.com/design/1Dtd6zlbn9TQpF7E9LoMTO/文件名?node-id=113-25054&t=xxx
  → fileKey = "1Dtd6zlbn9TQpF7E9LoMTO"
  → nodeId  = "113:25054"
```

## 可用工具（2 个）

### 1. get_figma_data — 获取设计数据

获取文件/节点的布局、内容、样式、组件信息。

```bash
# 获取指定节点（最常用）
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py call --name get_figma_data \
  --args '{"fileKey":"<fileKey>", "nodeId":"<nodeId>"}' 2>&1

# 仅获取文件顶层信息
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py call --name get_figma_data \
  --args '{"fileKey":"<fileKey>"}' 2>&1

# 控制遍历深度（仅在用户明确要求时使用）
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py call --name get_figma_data \
  --args '{"fileKey":"<fileKey>", "nodeId":"<nodeId>", "depth": 1}' 2>&1
```

**参数说明**：
- `fileKey`（必填）: Figma 文件 key
- `nodeId`（可选）: 节点 ID，格式 `1234:5678`
- `depth`（可选）: 遍历深度，**默认不要使用**，数据量会很大

**输出处理**：
- 输出通常很大，使用 `| head -N` 或 `| tail -N` 截取
- stderr 包含日志信息（`[figma-mcp]` 前缀），stdout 是 JSON 结果
- JSON 内的 `content[0].text` 字段包含 YAML 格式的设计数据

### 2. download_figma_images — 下载图片资源

下载 SVG/PNG 图片到本地。

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py call --name download_figma_images \
  --args-file /tmp/figma_images.json 2>&1
```

args JSON 文件格式：
```json
{
  "fileKey": "AbCdEf123456",
  "localPath": ".figma/assets",
  "nodes": [
    {"nodeId": "1234:5678", "fileName": "icon.svg"},
    {"nodeId": "2345:6789", "imageRef": "abc123", "fileName": "banner.png"}
  ],
  "pngScale": 2
}
```

**参数说明**：
- `fileKey`（必填）: Figma 文件 key
- `localPath`（必填）: 图片保存目录，建议使用 `.figma/assets`（相对于当前工作目录）
- `nodes`（必填）: 要下载的节点数组
  - `nodeId`（必填）: 节点 ID
  - `fileName`（必填）: 保存文件名（含扩展名 .png 或 .svg）
  - `imageRef`（可选）: 位图填充引用，下载 SVG 时不需要
- `pngScale`（可选）: PNG 缩放倍数，默认 2

## 常用工作流

### 场景 1：用户给了一个 Figma URL，想了解内容

1. 从 URL 解析 `fileKey` 和 `nodeId`
2. 先用 `depth: 1` 获取浅层结构，了解整体布局
3. 根据需要深入查看子节点

### 场景 2：导出设计稿中的图片

1. 先用 `get_figma_data` 获取节点数据
2. 从返回的 YAML 中找到图片节点（有 `imageRef` 的 fill 或图标组件）
3. 用 `download_figma_images` 下载

### 场景 3：分析设计系统组件

1. 用 `get_figma_data` 获取数据
2. 查看返回的 `metadata.components` 和 `metadata.componentSets` 了解组件库

## 配置

- API Key 存储：`~/.config/figma-mcp/.env`（格式：`key=xxx`）
- 也可通过环境变量 `FIGMA_API_KEY` 或 `--api-key` 参数覆盖
- 默认超时 60 秒，可通过 `--timeout` 调整

## 注意事项

- **所有命令通过 `${CLAUDE_PLUGIN_ROOT}`** 引用脚本路径，不要用相对路径或硬编码路径
- 输出文件写入当前工作目录，**禁止写入 skill 目录**
- stderr 的 `[figma-mcp]` 日志是正常的，不是错误
- 返回数据量可能很大，建议用 `depth: 1` 先看概览
