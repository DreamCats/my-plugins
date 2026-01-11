/**
 * RepoTalk MCP Server
 * 完全零依赖实现，仅使用 Node.js 原生 http 模块
 */
import http from 'http';
import { TokenManager } from '../token-manager.js';
import { RepoTalkClient } from '../repotalk-client.js';
export class RepoTalkMCPServer {
    httpServer = null;
    // 每个 sessionId 对应一个 TokenManager 和 RepoTalkClient
    sessions = new Map();
    constructor() {
        // 无需初始化
    }
    /**
     * 解析 HTTP 请求
     */
    async parseRequest(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const ctx = {
                    method: req.method || 'GET',
                    url: req.url || '/',
                    headers: req.headers,
                };
                // 尝试解析 JSON body
                if (body && req.headers['content-type']?.includes('application/json')) {
                    try {
                        ctx.body = JSON.parse(body);
                    }
                    catch {
                        ctx.body = body;
                    }
                }
                // 提取 CAS_SESSION
                const casSession = req.headers['x-cas-session'];
                if (casSession) {
                    ctx.casSession = casSession;
                }
                resolve(ctx);
            });
            req.on('error', reject);
        });
    }
    /**
     * 获取或创建 session
     */
    async getOrCreateSession(casSession) {
        const sessionKey = 'default';
        let session = this.sessions.get(sessionKey);
        if (!session) {
            const tokenManager = new TokenManager(casSession);
            await tokenManager.initialize();
            const client = new RepoTalkClient(() => tokenManager.getMcpHeaders());
            session = { tokenManager, client };
            this.sessions.set(sessionKey, session);
        }
        return session;
    }
    /**
     * MCP 工具定义
     */
    getTools() {
        return [
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
    }
    /**
     * HTTP 请求处理器
     */
    async handleRequest(req, res) {
        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CAS-Session');
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
        }
        // 只处理 /mcp 路径
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        if (url.pathname !== '/mcp') {
            res.statusCode = 404;
            res.end('Not Found');
            return;
        }
        // 解析请求
        const requestCtx = await this.parseRequest(req);
        const sessionId = url.searchParams.get('sessionId') || 'default';
        // GET 请求：SSE 初始化
        if (requestCtx.method === 'GET') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            // 发送初始化完成消息
            res.write(`data: ${JSON.stringify({
                jsonrpc: '2.0',
                method: 'notifications/initialized'
            })}\n\n`);
            return;
        }
        // POST 请求：JSON-RPC 调用
        if (requestCtx.method === 'POST') {
            try {
                const rpcRequest = requestCtx.body;
                if (!rpcRequest || !rpcRequest.method) {
                    res.statusCode = 400;
                    res.end('Invalid JSON-RPC request');
                    return;
                }
                console.log(`[MCP] ${rpcRequest.method} from session ${sessionId}`);
                let result;
                let isError = false;
                switch (rpcRequest.method) {
                    case 'initialize':
                        result = {
                            protocolVersion: '2024-11-05',
                            capabilities: { tools: {} },
                            serverInfo: { name: 'repotalk-mcp-server', version: '1.0.0' }
                        };
                        break;
                    case 'tools/list':
                        result = { tools: this.getTools() };
                        break;
                    case 'tools/call': {
                        const params = rpcRequest.params;
                        const { name, arguments: args } = params;
                        // 从环境变量获取 CAS_SESSION
                        const casSession = requestCtx.casSession || process.env.CAS_SESSION;
                        if (!casSession) {
                            isError = true;
                            result = {
                                content: [{
                                        type: 'text',
                                        text: 'Error: CAS_SESSION not found. Please send X-CAS-Session header.'
                                    }],
                                isError: true
                            };
                            break;
                        }
                        // 获取或创建 session
                        const session = await this.getOrCreateSession(casSession);
                        // 特殊处理：token_status
                        if (name === 'token_status') {
                            const status = session.tokenManager.getStatus();
                            result = {
                                content: [{
                                        type: 'text',
                                        text: JSON.stringify(status, null, 2)
                                    }]
                            };
                            break;
                        }
                        // 调用 RepoTalk API
                        const apiResult = await session.client.callTool({ name, arguments: args });
                        result = {
                            content: apiResult.content || [],
                            isError: apiResult.isError,
                        };
                        if (apiResult.isError) {
                            isError = true;
                        }
                        break;
                    }
                    default:
                        isError = true;
                        result = {
                            code: -32601,
                            message: `Method not found: ${rpcRequest.method}`
                        };
                }
                // 构建响应
                const response = {
                    jsonrpc: '2.0',
                    id: rpcRequest.id,
                    ...(isError && !result.content ? { error: result } : { result })
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(response));
            }
            catch (error) {
                console.error('[MCP] Request handling error:', error);
                const errorResponse = {
                    jsonrpc: '2.0',
                    id: 'error',
                    error: {
                        code: -32603,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(errorResponse));
            }
            return;
        }
        res.statusCode = 405;
        res.end('Method Not Allowed');
    }
    /**
     * 启动服务器
     */
    async start(port = 3005) {
        return new Promise((resolve, reject) => {
            this.httpServer = http.createServer(async (req, res) => {
                try {
                    await this.handleRequest(req, res);
                }
                catch (error) {
                    console.error('[Server] Request error:', error);
                    if (!res.headersSent) {
                        res.statusCode = 500;
                        res.end('Internal Server Error');
                    }
                }
            });
            this.httpServer.listen(port, '127.0.0.1', () => {
                console.log(`[RepoTalkMCPServer] Server started on http://localhost:${port}/mcp`);
                console.log(`[RepoTalkMCPServer] Fully zero-dependency (no Express, no MCP SDK)`);
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
