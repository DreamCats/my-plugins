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
 * SSE 消息编码
 */
function encodeSSEMessage(data) {
    return `data: ${data}\n\n`;
}
/**
 * JSON-RPC 响应构建
 */
function buildJsonRpcResponse(id, result, error) {
    const response = { jsonrpc: '2.0', id };
    if (error) {
        response.error = error;
    }
    else {
        response.result = result;
    }
    return JSON.stringify(response);
}
/**
 * 解析 SSE 数据行
 */
function parseSSEData(line) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data:')) {
        return trimmed.slice(5).trim();
    }
    return null;
}
/**
 * 从 HTTP 请求读取 SSE 消息体
 */
async function readSSEBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', reject);
    });
}
/**
 * 从 SSE body 提取 JSON-RPC 消息
 */
function extractJsonRpcFromSSE(body) {
    const lines = body.split('\n');
    for (const line of lines) {
        const data = parseSSEData(line);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (parsed.jsonrpc === '2.0' && parsed.method) {
                    return parsed;
                }
            }
            catch {
                // 忽略解析失败
            }
        }
    }
    return null;
}
/**
 * 创建初始化响应 SSE 流
 */
export function createInitializeResponse(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();
    // 发送初始化完成消息
    res.write(encodeSSEMessage(JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized'
    })));
}
/**
 * 处理 JSON-RPC 请求并返回响应
 */
export async function handleJsonRpcRequest(req, res, handlers, sessionId) {
    try {
        // 读取请求体
        const body = await readSSEBody(req);
        const rpcRequest = extractJsonRpcFromSSE(body);
        if (!rpcRequest) {
            res.statusCode = 400;
            res.end('Invalid JSON-RPC request');
            return;
        }
        console.log(`[MCP] ${rpcRequest.method} from session ${sessionId}`);
        // 处理不同的方法
        let result;
        let isError = false;
        switch (rpcRequest.method) {
            case 'initialize':
                if (handlers.initialize) {
                    result = handlers.initialize(rpcRequest.params);
                }
                else {
                    // 默认初始化响应
                    result = {
                        protocolVersion: '2024-11-05',
                        capabilities: { tools: {} },
                        serverInfo: { name: 'repotalk-mcp-server', version: '1.0.0' }
                    };
                }
                break;
            case 'tools/list':
                if (handlers.listTools) {
                    result = handlers.listTools();
                }
                else {
                    result = { tools: [] };
                }
                break;
            case 'tools/call':
                if (handlers.callTool) {
                    const toolResult = await handlers.callTool(rpcRequest.params, sessionId);
                    if (toolResult.isError) {
                        isError = true;
                        result = toolResult;
                    }
                    else {
                        result = toolResult;
                    }
                }
                else {
                    isError = true;
                    result = {
                        content: [{ type: 'text', text: 'Tool handler not implemented' }],
                        isError: true
                    };
                }
                break;
            default:
                isError = true;
                result = {
                    code: -32601,
                    message: `Method not found: ${rpcRequest.method}`
                };
        }
        // 构建响应
        const response = buildJsonRpcResponse(rpcRequest.id, isError ? undefined : result, isError ? result.code || result.content ? undefined : {
            code: -32603,
            message: 'Internal error',
            data: result
        } : undefined);
        // 如果是错误响应且有 isError 字段，作为正常结果返回
        if (isError && result.content) {
            const successResponse = buildJsonRpcResponse(rpcRequest.id, result);
            res.end(successResponse);
        }
        else if (isError) {
            res.end(buildJsonRpcResponse(rpcRequest.id, undefined, result));
        }
        else {
            res.end(response);
        }
    }
    catch (error) {
        console.error('[MCP] Request handling error:', error);
        res.statusCode = 500;
        res.end(buildJsonRpcResponse('error', undefined, { code: -32603, message: error instanceof Error ? error.message : 'Unknown error' }));
    }
}
/**
 * 创建 MCP HTTP 端点处理器
 */
export function createMcpEndpoint(handlers) {
    return async (req, res) => {
        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CAS-Session');
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
        }
        // 提取 sessionId
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const sessionId = url.searchParams.get('sessionId') || 'default';
        // GET 请求：创建 SSE 连接（用于初始化）
        if (req.method === 'GET') {
            createInitializeResponse(req, res);
            return;
        }
        // POST 请求：处理 JSON-RPC 调用
        if (req.method === 'POST') {
            await handleJsonRpcRequest(req, res, handlers, sessionId);
            return;
        }
        res.statusCode = 405;
        res.end('Method Not Allowed');
    };
}
