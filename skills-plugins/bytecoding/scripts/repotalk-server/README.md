# RepoTalk MCP Server

基于 **streamable HTTP** 协议的 RepoTalk MCP 服务器，支持客户端通过 `X-CAS-Session` header 传递 Cookie，自动刷新 JWT Token，直接调用字节内部 RepoTalk API。

## 功能特性

- 从客户端请求 header 中获取 CAS_SESSION
- 自动 Token 刷新：使用长效的 CAS_SESSION Cookie，自动获取和刷新 JWT Token
- Streamable HTTP 协议：支持双向流式通信
- 直接调用 RepoTalk API：通过 `https://repotalk.byted.org/api/v1/abcoder/mcp/` 直接访问
- 完整的 RepoTalk 工具支持：提供所有 RepoTalk MCP 工具

## 安装

```bash
npm install
npm run build
```

## 配置

### 1. 获取 CAS_SESSION Cookie

1. 登录字节内部平台（如 [cloud.bytedance.net](https://cloud.bytedance.net)）
2. 打开浏览器开发者工具（F12）
3. 切换到 **Network（网络）** 标签
4. 刷新页面，找到任意请求
5. 在 **Request Headers** 中找到 `Cookie` 字段
6. 复制 `CAS_SESSION=xxxxx` 这部分的值

### 2. 配置 Claude Code

在 Claude Code 的配置文件中添加 RepoTalk MCP 服务器配置：

**配置文件位置**：
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

**配置内容**：

```json
{
  "mcpServers": {
    "repotalk": {
      "transport": "streamable-http",
      "url": "http://localhost:3005/mcp",
      "headers": {
        "X-CAS-Session": "你的_CAS_SESSION_值"
      }
    }
  }
}
```

> 将 `你的_CAS_SESSION_值` 替换为第一步中获取的实际 Cookie 值

### 3. 启动服务器

**⚠️ 重要：在使用 MCP 服务之前，必须先启动 repotalk-index 服务**

```bash
# 方式一：使用 npm 脚本（推荐）
npm run repotalk:start

# 方式二：使用启动脚本
./plugin/scripts/repotalk-server/start-server.sh

# 方式三：手动启动（前台运行）
node plugin/scripts/repotalk-server/repotalk-index.js

# 方式四：指定端口
PORT=3005 npm run repotalk:start
```

**查看服务状态**：
```bash
npm run repotalk:status
```

**停止服务**：
```bash
npm run repotalk:stop
```

服务器启动后会显示：

```
[RepoTalkMCPServer] Server started on http://localhost:3005/mcp
[RepoTalkMCPServer] Streamable HTTP endpoint ready
[RepoTalkMCPServer] Clients should send X-CAS-Session header
```

### 验证配置

重启 Claude Code 后，可以使用 `token_status` 工具查看 Token 状态：

```
请调用 token_status 工具查看当前 Token 状态
```

## 可用工具

| 工具名 | 说明 |
|--------|------|
| `get_repos_detail` | 获取仓库详细信息，包括概览、包列表、服务 API 列表 |
| `get_packages_detail` | 精确获取指定包的功能、流程及包内的文件列表 |
| `get_nodes_detail` | 精确获取指定函数（FUNC）、类型（TYPE）、变量（VAR）的详细信息 |
| `search_nodes` | 执行语义化的代码搜索，使用自然语言查询代码 |
| `get_files_detail` | 获取指定路径文件的 AST 信息或配置文件、IDL 文件等 |
| `get_service_apis` | 获取指定仓库 API 接口的功能描述、处理流程及参数信息 |
| `get_rpcinfo` | 获取向目标 PSM 的目标 method 发起 RPC 调用的方式和相关信息 |
| `infra_search` | 获取字节跳动内部基础设施和基础组件的用法 |
| `get_asset_file` | 获取仓库内的 asset 文件，包括 README、IDL 文件、配置文件等 |
| `token_status` | 获取当前 Token 状态（调试用） |

## API 调用示例

### get_repos_detail

```json
{
  "repo_names": ["oec/live_promotion_core"]
}
```

### search_nodes

```json
{
  "repo_names": ["oec/live_promotion_core"],
  "question": "如何处理用户登录逻辑？"
}
```

### get_nodes_detail

```json
{
  "repo_name": "oec/live_promotion_core",
  "node_ids": ["node_id_1", "node_id_2"],
  "need_related_codes": true
}
```

## 项目结构

```
repotalk/
├── src/
│   ├── index.ts           # 主入口
│   ├── server.ts          # MCP 服务器实现
│   ├── token-manager.ts   # Token 自动刷新管理
│   └── repotalk-client.ts # RepoTalk API 客户端
├── dist/                  # 编译输出目录
├── package.json
├── tsconfig.json
└── README.md
```

## 工作原理

```
┌─────────────────┐      streamable HTTP      ┌─────────────────────┐
│  Claude Code    │ ────────────────────────> │  RepoTalk MCP Server │
│                 │ <──────────────────────── │  (本地 HTTP 服务)    │
│  (X-CAS-Session │                           │                     │
│   header)       │                           │                     │
└─────────────────┘                             └─────────────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────────────┐
                                                  │   Token Manager     │
                                                  │ (每连接自动刷新JWT)  │
                                                  └─────────────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────────────┐
                                                  │  RepoTalk API       │
                                                  │ repotalk.byted.org  │
                                                  │ /api/v1/abcoder/mcp │
                                                  └─────────────────────┘
```

1. 客户端在每次请求中携带 `X-CAS-Session` header
2. 服务器从 header 中提取 CAS_SESSION
3. 每个客户端连接对应一个独立的 TokenManager
4. TokenManager 使用 CAS_SESSION 从 `cloud.bytedance.net/auth/api/v1/jwt` 获取 JWT Token
5. Token 即将过期时自动刷新（提前 5 分钟）
6. 所有工具调用直接通过 HTTP POST 到 `https://repotalk.byted.org/api/v1/abcoder/mcp/{tool_name}`

## API 协议格式

### 请求格式

```
POST https://repotalk.byted.org/api/v1/abcoder/mcp/{tool_name}
Content-Type: application/json
x-jwt-token: {JWT_TOKEN}

{工具参数 JSON}
```

### 响应格式

```json
{
  "content": [
    {
      "type": "text",
      "text": "{API 返回结果}"
    }
  ],
  "isError": false
}
```

## 常见问题

### Q: Token 刷新失败怎么办？

A: 检查 CAS_SESSION 是否过期，重新获取并更新配置。CAS_SESSION 通常有效期较长（数天），但如果频繁失效可能需要重新登录字节内部平台。

### Q: 如何查看 Token 状态？

A: 在 Claude Code 中调用 `token_status` 工具，会显示当前 Token 的过期时间和是否有效。

### Q: 服务器端口冲突怎么办？

A: 通过 `PORT` 环境变量指定其他端口，如 `PORT=8080 npm start`，并同步更新 Claude Code 配置中的 `url`。

### Q: 多个用户可以同时使用吗？

A: 可以。每个客户端连接（session）都有独立的 TokenManager，互不干扰。

### Q: API 调用失败怎么办？

A: 检查以下几点：
1. Token 是否有效（使用 `token_status` 检查）
2. 网络是否可以访问 `repotalk.byted.org`
3. 工具参数格式是否正确
4. 仓库名称和权限是否正确

### Q: 支持哪些 RepoTalk 工具？

A: 目前支持所有 RepoTalk MCP 工具，包括仓库详情、包详情、节点详情、代码搜索、文件详情、服务 API、RPC 信息、基础设施搜索等。

## 许可证

MIT
