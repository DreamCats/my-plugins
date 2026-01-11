/**
 * MCP 协议的 stdio 传输实现
 * 基于 JSON-RPC 2.0 over stdin/stdout
 *
 * MCP stdio 协议规范:
 * - 传输: stdin/stdout (标准输入/输出)
 * - 消息格式: JSON-RPC 2.0 (每行一个 JSON 对象)
 * - 通信: 双向，客户端和服务器都可以发送请求
 */
import { createInterface } from 'readline';
/**
 * 发送 JSON-RPC 响应
 */
function sendResponse(id, result, error) {
    const response = {
        jsonrpc: '2.0',
        id,
    };
    if (error) {
        response.error = error;
    }
    else {
        response.result = result;
    }
    console.log(JSON.stringify(response));
}
/**
 * 发送 JSON-RPC 通知
 */
function sendNotification(method, params) {
    const notification = {
        jsonrpc: '2.0',
        method,
        params,
    };
    console.log(JSON.stringify(notification));
}
/**
 * MCP stdio 服务器类
 */
export class McpStdioServer {
    handlers;
    initialized = false;
    rl;
    constructor(handlers) {
        this.handlers = handlers;
        // 创建 readline 接口用于逐行读取 stdin
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });
    }
    /**
     * 启动 stdio 服务器
     */
    start() {
        // 设置错误输出到 stderr（避免干扰 JSON-RPC 通信）
        console.error = (...args) => {
            process.stderr.write(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n');
        };
        console.error('[MCP Stdio] Server starting...');
        // 监听 stdin 输入
        this.rl.on('line', async (line) => {
            line = line.trim();
            if (!line)
                return;
            try {
                const message = JSON.parse(line);
                // 检查是否是通知（无 id 字段）
                if ('id' in message) {
                    await this.handleRequest(message);
                }
                else {
                    // 通知通常不需要响应
                    console.error('[MCP Stdio] Received notification:', message.method);
                }
            }
            catch (error) {
                console.error('[MCP Stdio] Failed to parse message:', line);
                console.error('[MCP Stdio] Error:', error);
            }
        });
        // 处理 EOF
        this.rl.on('close', () => {
            console.error('[MCP Stdio] stdin closed, shutting down...');
            process.exit(0);
        });
        // 处理错误
        this.rl.on('error', (error) => {
            console.error('[MCP Stdio] Readline error:', error);
        });
    }
    /**
     * 处理 JSON-RPC 请求
     */
    async handleRequest(request) {
        const { id, method, params } = request;
        console.error('[MCP Stdio] Processing:', method);
        try {
            let result;
            let isError = false;
            switch (method) {
                case 'initialize':
                    if (this.handlers.initialize) {
                        result = this.handlers.initialize(params);
                    }
                    else {
                        // 默认初始化响应
                        result = {
                            protocolVersion: '2024-11-05',
                            capabilities: { tools: {} },
                            serverInfo: { name: 'repotalk-mcp-server', version: '1.0.0' }
                        };
                    }
                    this.initialized = true;
                    break;
                case 'tools/list':
                    if (!this.initialized) {
                        isError = true;
                        result = {
                            code: -32002,
                            message: 'Server not initialized'
                        };
                    }
                    else if (this.handlers.listTools) {
                        result = this.handlers.listTools();
                    }
                    else {
                        result = { tools: [] };
                    }
                    break;
                case 'tools/call':
                    if (!this.initialized) {
                        isError = true;
                        result = {
                            code: -32002,
                            message: 'Server not initialized'
                        };
                    }
                    else if (this.handlers.callTool) {
                        const toolResult = await this.handlers.callTool(params);
                        if (toolResult.isError) {
                            // 对于有 isError 字段的结果，作为正常结果返回
                            result = toolResult;
                        }
                        else {
                            result = toolResult;
                        }
                    }
                    else {
                        isError = true;
                        result = {
                            code: -32601,
                            message: 'Tool handler not implemented'
                        };
                    }
                    break;
                case 'ping':
                    // 简单的 ping/pong
                    result = { pong: true };
                    break;
                default:
                    isError = true;
                    result = {
                        code: -32601,
                        message: `Method not found: ${method}`
                    };
            }
            // 发送响应
            if (isError) {
                sendResponse(id, undefined, result);
            }
            else {
                sendResponse(id, result);
            }
        }
        catch (error) {
            console.error('[MCP Stdio] Handler error:', error);
            sendResponse(id, undefined, {
                code: -32603,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * 发送通知到客户端
     */
    sendNotification(method, params) {
        sendNotification(method, params);
    }
    /**
     * 停止服务器
     */
    stop() {
        console.error('[MCP Stdio] Stopping...');
        this.rl.close();
    }
}
/**
 * 创建 MCP stdio 端点的便捷函数
 */
export function createStdioServer(handlers) {
    return new McpStdioServer(handlers);
}
