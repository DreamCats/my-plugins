/**
 * MCP 协议的 stdio 传输实现
 * 基于 JSON-RPC 2.0 over stdin/stdout
 *
 * MCP stdio 协议规范:
 * - 传输: stdin/stdout (标准输入/输出)
 * - 消息格式: JSON-RPC 2.0 (每行一个 JSON 对象)
 * - 通信: 双向，客户端和服务器都可以发送请求
 */
/**
 * JSON-RPC 2.0 请求
 */
export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: any;
}
/**
 * JSON-RPC 2.0 响应
 */
export interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
/**
 * JSON-RPC 2.0 通知（无响应）
 */
export interface JsonRpcNotification {
    jsonrpc: '2.0';
    method: string;
    params?: any;
}
/**
 * MCP 工具定义
 */
export interface McpTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}
/**
 * 初始化请求参数
 */
export interface InitializeParams {
    protocolVersion: string;
    capabilities: Record<string, unknown>;
    clientInfo: {
        name: string;
        version: string;
    };
}
/**
 * 初始化结果
 */
export interface InitializeResult {
    protocolVersion: string;
    capabilities: {
        tools?: {};
    };
    serverInfo: {
        name: string;
        version: string;
    };
}
/**
 * 工具调用参数
 */
export interface CallToolParams {
    name: string;
    arguments?: Record<string, any>;
}
/**
 * 工具调用结果
 */
export interface CallToolResult {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
/**
 * MCP 请求处理器
 */
export interface McpRequestHandlers {
    initialize?: (params: InitializeParams) => InitializeResult;
    listTools?: () => {
        tools: McpTool[];
    };
    callTool?: (params: CallToolParams) => Promise<CallToolResult>;
}
/**
 * MCP stdio 服务器类
 */
export declare class McpStdioServer {
    private handlers;
    private initialized;
    private rl;
    constructor(handlers: McpRequestHandlers);
    /**
     * 启动 stdio 服务器
     */
    start(): void;
    /**
     * 处理 JSON-RPC 请求
     */
    private handleRequest;
    /**
     * 发送通知到客户端
     */
    sendNotification(method: string, params?: any): void;
    /**
     * 停止服务器
     */
    stop(): void;
}
/**
 * 创建 MCP stdio 端点的便捷函数
 */
export declare function createStdioServer(handlers: McpRequestHandlers): McpStdioServer;
