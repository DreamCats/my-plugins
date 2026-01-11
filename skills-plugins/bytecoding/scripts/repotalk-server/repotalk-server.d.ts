/**
 * RepoTalk MCP Server
 * 零依赖实现，基于原生 HTTP 和自实现的 MCP 协议
 */
export declare class RepoTalkMCPServer {
    private app;
    private httpServer;
    private sessions;
    constructor();
    /**
     * 设置 MCP 端点
     */
    private setupMcpEndpoint;
    /**
     * 启动服务器
     */
    start(port?: number): Promise<void>;
    /**
     * 停止服务器
     */
    stop(): Promise<void>;
}
