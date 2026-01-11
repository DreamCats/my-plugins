/**
 * RepoTalk MCP Server - 主入口
 *
 * 环境变量:
 * - PORT: 可选，服务端口，默认 3005
 *
 * 客户端配置:
 * 客户端需要在每个请求中携带 X-CAS-Session header
 */
import { RepoTalkMCPServer } from './repotalk-server.js';
async function main() {
    const port = parseInt(process.env.PORT || '3005', 10);
    // 创建并启动服务器
    const server = new RepoTalkMCPServer();
    // 优雅关闭
    process.on('SIGINT', async () => {
        console.log('\n[Server] Shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        console.log('\n[Server] Shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    try {
        await server.start(port);
    }
    catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}
main();
