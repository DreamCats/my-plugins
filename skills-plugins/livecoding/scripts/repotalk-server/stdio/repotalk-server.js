/**
 * RepoTalk MCP Server - stdio 版本
 * 完全零依赖实现，基于 stdin/stdout 通信
 */
import { createStdioServer } from './mcp-stdio-protocol.js';
import { TokenManager } from '../token-manager.js';
import { RepoTalkClient } from '../repotalk-client.js';
export class RepoTalkMCPServerStdio {
    mcpServer;
    tokenManager = null;
    client = null;
    constructor() {
        // 创建 MCP stdio 服务器
        this.mcpServer = createStdioServer({
            // 初始化
            initialize: (params) => {
                return {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'repotalk-mcp-server', version: '1.0.0' }
                };
            },
            // 列出工具
            listTools: () => {
                return { tools: this.getTools() };
            },
            // 调用工具
            callTool: async (params) => {
                return await this.handleToolCall(params);
            }
        });
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
     * 处理工具调用
     */
    async handleToolCall(params) {
        const { name, arguments: args } = params;
        try {
            // 特殊处理：token_status
            if (name === 'token_status') {
                if (this.tokenManager) {
                    const status = this.tokenManager.getStatus();
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(status, null, 2)
                            }]
                    };
                }
                return {
                    content: [{
                            type: 'text',
                            text: 'TokenManager not initialized. CAS_SESSION not set.'
                        }]
                };
            }
            // 从环境变量获取 CAS_SESSION
            const casSession = process.env.CAS_SESSION;
            if (!casSession) {
                return {
                    content: [{
                            type: 'text',
                            text: 'Error: CAS_SESSION not found. Please set CAS_SESSION environment variable.'
                        }],
                    isError: true
                };
            }
            // 初始化 TokenManager 和 Client（如果还没初始化）
            if (!this.tokenManager || !this.client) {
                this.tokenManager = new TokenManager(casSession);
                await this.tokenManager.initialize();
                this.client = new RepoTalkClient(() => this.tokenManager.getMcpHeaders());
            }
            // 调用 RepoTalk API
            const result = await this.client.callTool({
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
    /**
     * 启动服务器
     */
    async start() {
        // 检查 CAS_SESSION
        if (!process.env.CAS_SESSION) {
            console.error('[Server] Warning: CAS_SESSION environment variable not set');
            console.error('[Server] Tools will not work without CAS_SESSION');
        }
        this.mcpServer.start();
    }
    /**
     * 停止服务器
     */
    async stop() {
        if (this.tokenManager) {
            this.tokenManager.stop();
            this.tokenManager = null;
        }
        this.client = null;
        this.mcpServer.stop();
    }
}
