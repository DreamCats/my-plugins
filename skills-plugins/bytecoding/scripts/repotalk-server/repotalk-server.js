/**
 * RepoTalk MCP Server
 * 零依赖实现，基于原生 HTTP 和自实现的 MCP 协议
 */
import express from 'express';
import { createMcpEndpoint } from './mcp-protocol.js';
import { TokenManager } from './token-manager.js';
import { RepoTalkClient } from './repotalk-client.js';
export class RepoTalkMCPServer {
    app;
    httpServer = null;
    // 每个 sessionId 对应一个 TokenManager 和 RepoTalkClient
    sessions = new Map();
    constructor() {
        this.app = express();
        // 中间件：解析 JSON body
        this.app.use(express.json());
        // 中间件：提取 CAS_SESSION header
        this.app.use((req, res, next) => {
            const casSession = req.headers['x-cas-session'];
            if (casSession) {
                req.casSession = casSession;
            }
            next();
        });
        // 设置 MCP 端点
        this.setupMcpEndpoint();
    }
    /**
     * 设置 MCP 端点
     */
    setupMcpEndpoint() {
        // MCP 工具定义
        const tools = [
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
        ];
        // 获取或创建 session（从请求上下文）
        const getSession = (req) => {
            // 这里需要从某个地方获取 sessionId 和 CAS_SESSION
            // 暂时用默认值
            const sessionId = 'default';
            const casSession = req.casSession || process.env.CAS_SESSION;
            if (!casSession) {
                throw new Error('CAS_SESSION not found. Please send X-CAS-Session header.');
            }
            let session = this.sessions.get(sessionId);
            if (!session) {
                const tokenManager = new TokenManager(casSession);
                // 初始化是异步的，但我们需要同步返回
                // 实际初始化会在第一次使用时完成
                tokenManager.initialize().catch(err => {
                    console.error('[Server] TokenManager init failed:', err);
                });
                const client = new RepoTalkClient(() => tokenManager.getMcpHeaders());
                session = { tokenManager, client };
                this.sessions.set(sessionId, session);
            }
            return session;
        };
        // 创建 MCP 端点处理器
        const mcpHandler = createMcpEndpoint({
            // 初始化
            initialize: (_params) => {
                return {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'repotalk-mcp-server', version: '1.0.0' }
                };
            },
            // 列出工具
            listTools: () => {
                return { tools };
            },
            // 调用工具
            callTool: async (params, _sessionId) => {
                const { name, arguments: args } = params;
                try {
                    // 特殊处理：token_status
                    if (name === 'token_status') {
                        // 需要从请求中获取 session，但这里无法访问
                        // 暂时返回错误提示
                        return {
                            content: [{
                                    type: 'text',
                                    text: 'token_status requires active session with CAS_SESSION'
                                }],
                            isError: false
                        };
                    }
                    // 从环境变量或请求获取 CAS_SESSION
                    const casSession = process.env.CAS_SESSION;
                    if (!casSession) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: 'Error: CAS_SESSION not found. Please configure the client to send X-CAS-Session header.'
                                }],
                            isError: true
                        };
                    }
                    // 获取或创建 session
                    const sessionKey = 'default'; // 简化处理
                    let session = this.sessions.get(sessionKey);
                    if (!session) {
                        const tokenManager = new TokenManager(casSession);
                        await tokenManager.initialize();
                        const client = new RepoTalkClient(() => tokenManager.getMcpHeaders());
                        session = { tokenManager, client };
                        this.sessions.set(sessionKey, session);
                    }
                    // 特殊处理：token_status
                    if (name === 'token_status') {
                        const status = session.tokenManager.getStatus();
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify(status, null, 2)
                                }]
                        };
                    }
                    // 调用 RepoTalk API
                    const result = await session.client.callTool({
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
                        content: [{
                                type: 'text',
                                text: `Error calling tool ${name}: ${error instanceof Error ? error.message : String(error)}`
                            }],
                        isError: true
                    };
                }
            }
        });
        // 注册路由
        this.app.use('/mcp', mcpHandler);
    }
    /**
     * 启动服务器
     */
    async start(port = 3005) {
        return new Promise((resolve, reject) => {
            this.httpServer = this.app.listen(port, '127.0.0.1', () => {
                console.log(`[RepoTalkMCPServer] Server started on http://localhost:${port}/mcp`);
                console.log(`[RepoTalkMCPServer] Zero-dependency MCP implementation`);
                console.log(`[RepoTalkMCPServer] Clients should send X-CAS-Session header`);
                resolve();
            });
            this.httpServer.on('error', reject);
        });
    }
    /**
     * 停止服务器
     */
    async stop() {
        // 停止所有 TokenManager
        for (const session of this.sessions.values()) {
            session.tokenManager.stop();
        }
        this.sessions.clear();
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
