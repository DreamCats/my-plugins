# RepoTalk MCP Server

> **完全零依赖** 的 RepoTalk MCP 服务器实现，提供 **HTTP** 和 **stdio** 两种传输方式

基于原生 Node.js 实现，无需任何运行时依赖，支持自动刷新 JWT Token，直接调用字节内部 RepoTalk API。

## 特性

- **完全零依赖**：无任何运行时依赖，仅使用 Node.js 原生模块
- **双传输协议**：支持 HTTP 和 stdio 两种传输方式
- **自动 Token 刷新**：使用 CAS_SESSION Cookie 自动获取和刷新 JWT Token
- **完整工具支持**：提供所有 RepoTalk MCP 工具
- **轻量高效**：编译后体积小，启动快速

## 安装

```bash
npm install
npm run build
```

## 传输方式选择

### HTTP 传输

适合场景：需要通过网络访问 MCP 服务器，或多个客户端共享一个服务器实例

**启动 HTTP 服务器：**

```bash
# 使用默认端口 3005
npm run start:http

# 指定端口
PORT=8080 npm run start:http
```

**配置 Claude Code：**

在 Claude Code 配置文件中添加：

**配置文件位置**：
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

**配置内容：**

```json
{
  "mcpServers": {
    "repotalk-http": {
      "transport": "streamable-http",
      "url": "http://localhost:3005/mcp",
      "headers": {
        "X-CAS-Session": "你的_CAS_SESSION_值"
      }
    }
  }
}
```

### stdio 传输

适合场景：单用户使用，直接与 Claude Code 进程通信

**启动 stdio 服务器：**

```bash
# 设置 CAS_SESSION 环境变量
export CAS_SESSION="你的_CAS_SESSION_值"

# 启动服务器
npm run start:stdio
```

**配置 Claude Code：**

```json
{
  "mcpServers": {
    "repotalk-stdio": {
      "command": "node",
      "args": ["/absolute/path/to/dist/stdio/repotalk-index.js"],
      "env": {
        "CAS_SESSION": "你的_CAS_SESSION_值"
      }
    }
  }
}
```

> 注意：stdio 方式需要在 `env` 中设置 `CAS_SESSION`，而不是通过 header

## 获取 CAS_SESSION

1. 登录字节内部平台（如 [cloud.bytedance.net](https://cloud.bytedance.net)）
2. 打开浏览器开发者工具（F12）
3. 切换到 **Network（网络）** 标签
4. 刷新页面，找到任意请求
5. 在 **Request Headers** 中找到 `Cookie` 字段
6. 复制 `CAS_SESSION=xxxxx` 这部分的值

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

## 使用示例

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
│   ├── http/                      # HTTP 传输版本
│   │   ├── mcp-protocol.ts        # MCP HTTP 协议实现（JSON-RPC + SSE）
│   │   ├── repotalk-server.ts     # HTTP 服务器
│   │   └── repotalk-index.ts      # HTTP 版本入口
│   ├── stdio/                     # stdio 传输版本
│   │   ├── mcp-stdio-protocol.ts  # MCP stdio 协议实现（JSON-RPC）
│   │   ├── repotalk-server.ts     # stdio 服务器
│   │   └── repotalk-index.ts      # stdio 版本入口
│   ├── repotalk-client.ts         # RepoTalk API 客户端（共用）
│   └── token-manager.ts           # JWT Token 自动刷新管理（共用）
├── dist/                          # 编译输出目录
│   ├── http/                      # HTTP 版本编译输出
│   └── stdio/                     # stdio 版本编译输出
├── package.json
├── tsconfig.json
└── README.md
```

## 工作原理

### HTTP 传输

```
┌─────────────────┐      streamable HTTP      ┌─────────────────────┐
│  Claude Code    │ ────────────────────────> │  RepoTalk MCP Server │
│                 │ <──────────────────────── │  (HTTP 服务器)        │
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

### stdio 传输

```
┌─────────────────┐      stdin/stdout         ┌─────────────────────┐
│  Claude Code    │ ────────────────────────> │  RepoTalk MCP Server │
│                 │ <──────────────────────── │  (stdio 进程)         │
│  (CAS_SESSION   │                           │                     │
│   env var)      │                           │                     │
└─────────────────┘                             └─────────────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────────────┐
                                                  │   Token Manager     │
                                                  │ (自动刷新JWT)        │
                                                  └─────────────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────────────┐
                                                  │  RepoTalk API       │
                                                  │ repotalk.byted.org  │
                                                  └─────────────────────┘
```

## 技术实现

### 零依赖实现

本项目完全使用 Node.js 原生模块实现：

- **HTTP 版本**：使用 `http` 模块创建服务器，手动实现 JSON-RPC over SSE 协议
- **stdio 版本**：使用 `readline` 模块处理 stdin/stdout，实现 JSON-RPC 协议
- **Token 管理**：使用 `https` 模块调用字节内部 API
- **JWT 解析**：使用 `crypto` 模块进行 base64 解码

无任何第三方运行时依赖，编译后体积仅约 25MB（主要是 TypeScript 类型定义）。

### MCP 协议

两种传输方式都完全兼容 MCP 协议规范（2024-11-05）：

- **JSON-RPC 2.0** 消息格式
- **工具调用**：`tools/list`、`tools/call`
- **初始化握手**：`initialize`、`notifications/initialized`

## NPM 命令

```bash
# 编译
npm run build

# 启动 HTTP 版本
npm run start:http

# 启动 stdio 版本
npm run start:stdio

# 开发模式（监听文件变化自动编译）
npm run dev
```

## 常见问题

### Q: HTTP 和 stdio 应该选择哪个？

**A:**
- **HTTP**：适合需要远程访问、多客户端共享、或需要更灵活部署的场景
- **stdio**：适合单用户本地使用，性能稍好，配置简单

### Q: Token 刷新失败怎么办？

A: 检查 CAS_SESSION 是否过期，重新获取并更新配置。CAS_SESSION 通常有效期较长（数天），但如果频繁失效可能需要重新登录字节内部平台。

### Q: 如何查看 Token 状态？

A: 在 Claude Code 中调用 `token_status` 工具，会显示当前 Token 的过期时间和是否有效。

### Q: 服务器端口冲突怎么办？（HTTP 版本）

A: 通过 `PORT` 环境变量指定其他端口，如 `PORT=8080 npm run start:http`，并同步更新 Claude Code 配置中的 `url`。

### Q: 多个用户可以同时使用吗？

**A:**
- **HTTP 版本**：可以，每个客户端连接都有独立的 TokenManager，互不干扰
- **stdio 版本**：每个 Claude Code 进程启动一个独立的服务器实例

### Q: 零依赖是如何实现的？

A: 通过使用 Node.js 原生模块（`http`、`https`、`readline`、`crypto`）替代第三方库，手动实现 MCP 协议的 JSON-RPC 消息处理和 SSE 编解码。

### Q: 为什么选择零依赖？

A:
- **减小体积**：从 50MB 减少到 25MB
- **提高稳定性**：减少第三方包的漏洞风险
- **降低维护成本**：不依赖外部包的更新
- **学习价值**：深入理解 MCP 协议实现

## 许可证

MIT

---

**作者**: maifeng@bytedance.com

**项目**: @byted/repotalk-mcp-server
