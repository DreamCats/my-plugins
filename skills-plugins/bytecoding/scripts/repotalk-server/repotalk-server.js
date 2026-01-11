/**
 * RepoTalk MCP Server
 * 基于 streamable HTTP 协议的 MCP 服务器
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { TokenManager } from './token-manager.js';
import { RepoTalkClient } from './repotalk-client.js';
export class RepoTalkMCPServer {
    server;
    transport = null;
    // 每个连接对应一个 TokenManager
    tokenManagers = new Map();
    repotalkClients = new Map();
    app;
    httpServer = null;
    constructor() {
        this.server = new Server({
            name: 'repotalk-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        // 创建 Express 应用
        this.app = createMcpExpressApp();
        // 添加中间件从请求中提取 CAS_SESSION
        this.app.use('/mcp', (req, res, next) => {
            const casSession = req.headers['x-cas-session'] || req.headers['x-cas-session'];
            if (casSession) {
                // 将 CAS_SESSION 存储到 request 对象中，供后续使用
                req.casSession = casSession;
            }
            next();
        });
        this.setupHandlers();
    }
    /**
     * 获取或创建对应 session 的 TokenManager 和 Client
     */
    getOrCreateManagers(sessionId) {
        let tokenManager = this.tokenManagers.get(sessionId);
        let client = this.repotalkClients.get(sessionId);
        if (!tokenManager || !client) {
            // 从请求中获取 CAS_SESSION（这里需要从其他地方获取，稍后处理）
            // 暂时使用占位符，实际需要从请求上下文中获取
            throw new Error('CAS_SESSION not found for session: ' + sessionId);
        }
        return { tokenManager, client };
    }
    /**
     * 设置 MCP 请求处理器
     */
    setupHandlers() {
        // 列出可用工具
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'get_repos_detail',
                        description: '获取指定仓库的详细信息，包括仓库概览、包列表、服务 API 列表',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                repo_names: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: '仓库名称列表',
                                },
                            },
                            required: ['repo_names'],
                        },
                    },
                    {
                        name: 'get_packages_detail',
                        description: '精确获取指定包的功能、流程及包内的文件列表',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                repo_name: {
                                    type: 'string',
                                    description: '仓库名称',
                                },
                                package_ids: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: '包 ID 列表，格式：${ModPath}?${PkgPath}',
                                },
                            },
                            required: ['repo_name', 'package_ids'],
                        },
                    },
                    {
                        name: 'get_nodes_detail',
                        description: '精确获取指定函数（FUNC）、类型（TYPE）、变量（VAR）的详细信息',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                repo_name: {
                                    type: 'string',
                                    description: '仓库名称',
                                },
                                node_ids: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: '节点 ID 列表',
                                },
                                need_related_codes: {
                                    type: 'boolean',
                                    description: '是否返回相关节点的代码',
                                },
                            },
                            required: ['repo_name', 'node_ids'],
                        },
                    },
                    {
                        name: 'search_nodes',
                        description: '执行语义化的代码搜索，使用自然语言查询代码',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                repo_names: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: '仓库名称列表',
                                },
                                question: {
                                    type: 'string',
                                    description: '自然语言描述的问题',
                                },
                                package_ids: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: '可选，包 ID 列表',
                                },
                            },
                            required: ['repo_names', 'question'],
                        },
                    },
                    {
                        name: 'get_files_detail',
                        description: '获取指定路径文件的 AST 信息或配置文件、IDL 文件等',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                repo_name: {
                                    type: 'string',
                                    description: '仓库名称',
                                },
                                file_path: {
                                    type: 'string',
                                    description: '文件路径（相对于仓库根目录）',
                                },
                            },
                            required: ['repo_name', 'file_path'],
                        },
                    },
                    {
                        name: 'get_service_apis',
                        description: '获取指定仓库 API 接口的功能描述、处理流程及参数信息',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                repo_name: {
                                    type: 'string',
                                    description: '仓库名称',
                                },
                                api_names: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'API 名称列表',
                                },
                            },
                            required: ['repo_name', 'api_names'],
                        },
                    },
                    {
                        name: 'get_rpcinfo',
                        description: '获取向目标 PSM 的目标 method 发起 RPC 调用的方式和相关信息',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                PSM: {
                                    type: 'string',
                                    description: 'PSM 名称',
                                },
                                Method: {
                                    type: 'string',
                                    description: '可选，方法名',
                                },
                            },
                            required: ['PSM'],
                        },
                    },
                    {
                        name: 'infra_search',
                        description: '获取字节跳动内部基础设施和基础组件的用法',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                component: {
                                    type: 'string',
                                    description: '组件名称',
                                },
                                question: {
                                    type: 'string',
                                    description: '查询问题',
                                },
                            },
                            required: ['component', 'question'],
                        },
                    },
                    {
                        name: 'get_asset_file',
                        description: '获取仓库内的 asset 文件，包括 README、IDL 文件、配置文件等',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                repo_name: {
                                    type: 'string',
                                    description: '仓库名称',
                                },
                                file_paths: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: '文件路径列表',
                                },
                            },
                            required: ['repo_name', 'file_paths'],
                        },
                    },
                    {
                        name: 'token_status',
                        description: '获取当前 Token 状态信息（用于调试）',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                ],
            };
        });
        // 调用工具
        this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
            const { name, arguments: args } = request.params;
            // 从 extra 中获取请求上下文（包含 sessionId）
            const sessionId = extra?.sessionId || 'default';
            // 从请求 header 中获取 CAS_SESSION
            // 注意：这里需要从 transport 层获取原始请求的 header
            // 暂时使用环境变量作为 fallback
            const casSession = process.env.CAS_SESSION;
            if (!casSession) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Error: CAS_SESSION not found. Please configure the client to send X-CAS-Session header.',
                        },
                    ],
                    isError: true,
                };
            }
            // 获取或创建该 session 的 TokenManager
            let tokenManager = this.tokenManagers.get(sessionId);
            let client = this.repotalkClients.get(sessionId);
            if (!tokenManager || !client) {
                tokenManager = new TokenManager(casSession);
                await tokenManager.initialize();
                client = new RepoTalkClient(() => tokenManager.getMcpHeaders());
                this.tokenManagers.set(sessionId, tokenManager);
                this.repotalkClients.set(sessionId, client);
            }
            // 特殊处理：token_status
            if (name === 'token_status') {
                const status = tokenManager.getStatus();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(status, null, 2),
                        },
                    ],
                };
            }
            // 转发到 RepoTalk Gateway
            try {
                const result = await client.callTool({
                    name,
                    arguments: args,
                });
                return {
                    content: result.content || [],
                    isError: result.isError,
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error calling tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    /**
     * 启动服务器
     */
    async start(port = 3005) {
        // 创建 streamable HTTP transport
        this.transport = new StreamableHTTPServerTransport();
        // 连接 server 和 transport
        await this.server.connect(this.transport);
        // 设置路由 - streamable HTTP 同时支持 GET (SSE) 和 POST
        this.app.all('/mcp', (req, res) => {
            // 从请求中提取 CAS_SESSION 并存储到环境变量（临时方案）
            const casSession = req.casSession || req.headers['x-cas-session'];
            if (casSession) {
                process.env.CAS_SESSION = casSession;
            }
            // 传入 req.body 作为第三个参数，让 transport 使用已解析的 body
            this.transport?.handleRequest(req, res, req.body);
        });
        // 启动 HTTP 服务器
        return new Promise((resolve) => {
            this.httpServer = this.app.listen(port, '127.0.0.1', () => {
                console.log(`[RepoTalkMCPServer] Server started on http://localhost:${port}/mcp`);
                console.log(`[RepoTalkMCPServer] Streamable HTTP endpoint ready`);
                console.log(`[RepoTalkMCPServer] Clients should send X-CAS-Session header`);
                resolve();
            });
        });
    }
    /**
     * 停止服务器
     */
    async stop() {
        // 停止所有 TokenManager
        for (const tokenManager of this.tokenManagers.values()) {
            tokenManager.stop();
        }
        this.tokenManagers.clear();
        this.repotalkClients.clear();
        if (this.transport) {
            await this.transport.close();
            this.transport = null;
        }
        if (this.httpServer) {
            return new Promise((resolve) => {
                this.httpServer.close(() => {
                    console.log('[RepoTalkMCPServer] Server stopped');
                    resolve();
                });
            });
        }
    }
}
