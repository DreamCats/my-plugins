/**
 * RepoTalk MCP Server - stdio 版本主入口
 *
 * 环境变量:
 * - CAS_SESSION: 必需，字节内部的 CAS_SESSION cookie
 *
 * 使用方式:
 * export CAS_SESSION="your-cas-session-value"
 * node dist/stdio/repotalk-index.js
 *
 * 或者在 Claude Code 中配置:
 * claude mcp add repotalk-stdio node /path/to/dist/stdio/repotalk-index.js
 */
import { RepoTalkMCPServerStdio } from './repotalk-server.js';
async function main() {
    // 创建并启动服务器
    const server = new RepoTalkMCPServerStdio();
    // 优雅关闭
    process.on('SIGINT', async () => {
        process.stderr.write('\n[Server] Shutting down gracefully...\n');
        await server.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        process.stderr.write('\n[Server] Shutting down gracefully...\n');
        await server.stop();
        process.exit(0);
    });
    try {
        await server.start();
    }
    catch (error) {
        process.stderr.write(`[Server] Failed to start: ${error}\n`);
        process.exit(1);
    }
}
main();
