/**
 * RepoTalk MCP Server
 * 完全零依赖实现，仅使用 Node.js 原生 http 模块
 */
export declare class RepoTalkMCPServer {
    private httpServer;
    private sessions;
    constructor();
    /**
     * 解析 HTTP 请求
     */
    private parseRequest;
    /**
     * 获取或创建 session
     */
    private getOrCreateSession;
    /**
     * MCP 工具定义
     */
    private getTools;
    /**
     * HTTP 请求处理器
     */
    private handleRequest;
    /**
     * 启动服务器
     */
    start(port?: number): Promise<void>;
    /**
     * 停止服务器
     */
    stop(): Promise<void>;
}
