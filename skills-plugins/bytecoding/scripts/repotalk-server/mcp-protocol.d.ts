/**
 * MCP 协议的零依赖实现
 * 基于 JSON-RPC over SSE (Server-Sent Events)
 *
 * MCP 协议规范:
 * - 传输: HTTP with SSE (text/event-stream)
 * - 消息格式: JSON-RPC 2.0
 * - 初始化: endpoint?sessionId=xxx 返回 SSE stream
 * - 消息: data: {"jsonrpc":"2.0",...}
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
 * MCP 服务器信息
 */
export interface McpServerInfo {
    name: string;
    version: string;
}
/**
 * MCP 能力声明
 */
export interface McpCapabilities {
    tools?: {};
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
 * MCP 初始化结果
 */
export interface InitializeResult {
    protocolVersion: string;
    capabilities: McpCapabilities;
    serverInfo: McpServerInfo;
}
/**
 * 工具调用请求
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
    callTool?: (params: CallToolParams, sessionId: string) => Promise<CallToolResult>;
}
/**
 * 创建初始化响应 SSE 流
 */
export declare function createInitializeResponse(req: import('http').IncomingMessage, res: any): void;
/**
 * 处理 JSON-RPC 请求并返回响应
 */
export declare function handleJsonRpcRequest(req: import('http').IncomingMessage, res: any, handlers: McpRequestHandlers, sessionId: string): Promise<void>;
/**
 * 创建 MCP HTTP 端点处理器
 */
export declare function createMcpEndpoint(handlers: McpRequestHandlers): (req: import("http").IncomingMessage, res: any) => Promise<void>;
