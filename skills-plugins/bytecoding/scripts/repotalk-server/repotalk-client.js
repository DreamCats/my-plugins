/**
 * RepoTalk API 客户端
 * 直接调用字节内部 RepoTalk HTTP API
 *
 * API 格式:
 * URL: https://repotalk.byted.org/api/v1/abcoder/mcp/{tool_name}
 * Header: x-jwt-token (JWT token)
 * Body: 工具参数 JSON
 */
/**
 * RepoTalk API 端点映射
 * 工具名 -> API 路径后缀
 */
const TOOL_ENDPOINTS = {
    get_repos_detail: 'get_repos_detail',
    get_packages_detail: 'get_packages_detail',
    get_nodes_detail: 'get_nodes_detail',
    search_nodes: 'search_nodes',
    get_files_detail: 'get_files_detail',
    get_service_apis: 'get_service_apis',
    get_rpcinfo: 'get_rpcinfo',
    infra_search: 'infra_search',
    get_asset_file: 'get_asset_file',
};
export class RepoTalkClient {
    getHeaders;
    baseUrl;
    constructor(getHeaders, config) {
        this.getHeaders = getHeaders;
        // RepoTalk API 基础 URL
        this.baseUrl = config?.baseUrl || 'https://repotalk.byted.org/api/v1/abcoder/mcp';
    }
    /**
     * 调用 RepoTalk 工具
     */
    async callTool(request) {
        const endpoint = TOOL_ENDPOINTS[request.name];
        if (!endpoint) {
            throw new Error(`Unknown tool: ${request.name}`);
        }
        const url = `${this.baseUrl}/${endpoint}`;
        const headers = this.getHeaders();
        try {
            console.log(`[RepoTalkClient] Calling tool: ${request.name} at ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-jwt-token': headers['x-jwt-token'],
                },
                body: JSON.stringify(request.arguments || {}),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            // 将 API 响应转换为 MCP 格式
            return {
                content: [
                    {
                        type: 'text',
                        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                    },
                ],
                isError: false,
            };
        }
        catch (error) {
            console.error(`[RepoTalkClient] Tool call failed for ${request.name}:`, error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }
}
