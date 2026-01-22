/**
 * RepoTalk API 客户端
 * 直接调用字节内部 RepoTalk HTTP API
 *
 * API 格式:
 * URL: https://repotalk.byted.org/api/v1/abcoder/mcp/{tool_name}
 * Header: x-jwt-token (JWT token)
 * Body: 工具参数 JSON
 */
export interface RepoTalkToolCallRequest {
    name: string;
    arguments?: Record<string, any>;
}
export interface RepoTalkToolCallResponse {
    content?: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
export declare class RepoTalkClient {
    private readonly getHeaders;
    private readonly baseUrl;
    constructor(getHeaders: () => {
        'x-jwt-token': string;
    }, config?: {
        baseUrl?: string;
    });
    /**
     * 调用 RepoTalk 工具
     */
    callTool(request: RepoTalkToolCallRequest): Promise<RepoTalkToolCallResponse>;
}
