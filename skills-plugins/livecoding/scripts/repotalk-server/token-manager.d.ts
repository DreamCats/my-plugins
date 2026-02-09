/**
 * Token 管理模块
 * 负责使用 CAS_SESSION Cookie 获取并自动刷新 JWT Token
 */
export declare class TokenManager {
    private readonly casSession;
    private token;
    private expiresAt;
    private refreshTimer;
    private readonly REFRESH_BEFORE_EXPIRY;
    private readonly MIN_REFRESH_INTERVAL;
    constructor(casSession: string);
    /**
     * 初始化 Token 管理器，获取第一个 Token 并启动自动刷新
     */
    initialize(): Promise<void>;
    /**
     * 从字节内部 API 获取 JWT Token
     */
    private fetchToken;
    /**
     * 解析 JWT Token 获取 payload
     */
    private parseJwt;
    /**
     * 启动自动刷新定时器
     */
    private startAutoRefresh;
    /**
     * 获取当前有效的 Token
     */
    getCurrentToken(): string;
    /**
     * 获取 API 调用所需的 headers
     * 返回格式: { 'x-jwt-token': token }
     */
    getMcpHeaders(): {
        'x-jwt-token': string;
    };
    /**
     * 停止自动刷新
     */
    stop(): void;
    /**
     * 获取 Token 状态信息
     */
    getStatus(): {
        token: string | null;
        expiresAt: number;
        isExpired: boolean;
    };
}
