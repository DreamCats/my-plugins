/**
 * RepoTalk MCP Server - stdio 版本
 * 完全零依赖实现，基于 stdin/stdout 通信
 */
export declare class RepoTalkMCPServerStdio {
    private mcpServer;
    private tokenManager;
    private client;
    constructor();
    /**
     * MCP 工具定义
     */
    private getTools;
    /**
     * 处理工具调用
     */
    private handleToolCall;
    /**
     * 启动服务器
     */
    start(): Promise<void>;
    /**
     * 停止服务器
     */
    stop(): Promise<void>;
}
