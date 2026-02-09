/**
 * Token 管理模块
 * 负责使用 CAS_SESSION Cookie 获取并自动刷新 JWT Token
 */
export class TokenManager {
    casSession;
    token = null;
    expiresAt = 0;
    refreshTimer = null;
    REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 提前 5 分钟刷新
    MIN_REFRESH_INTERVAL = 2 * 60 * 1000; // 最小刷新间隔 2 分钟
    constructor(casSession) {
        this.casSession = casSession;
        if (!this.casSession) {
            throw new Error('CAS_SESSION is required');
        }
    }
    /**
     * 初始化 Token 管理器，获取第一个 Token 并启动自动刷新
     */
    async initialize() {
        await this.fetchToken();
        this.startAutoRefresh();
    }
    /**
     * 从字节内部 API 获取 JWT Token
     */
    async fetchToken() {
        try {
            const url = 'https://cloud.bytedance.net/auth/api/v1/jwt';
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Cookie': `CAS_SESSION=${this.casSession}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
            }
            const jwtToken = response.headers.get('X-Jwt-Token');
            if (!jwtToken) {
                throw new Error('X-Jwt-Token not found in response headers');
            }
            // 解析 JWT 获取过期时间
            const payload = this.parseJwt(jwtToken);
            this.token = jwtToken;
            this.expiresAt = payload.exp * 1000; // 转换为毫秒
            console.log(`[TokenManager] Token refreshed, expires at: ${new Date(this.expiresAt).toISOString()}`);
        }
        catch (error) {
            console.error('[TokenManager] Failed to fetch token:', error);
            throw error;
        }
    }
    /**
     * 解析 JWT Token 获取 payload
     */
    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join(''));
            return JSON.parse(jsonPayload);
        }
        catch (error) {
            console.error('[TokenManager] Failed to parse JWT:', error);
            // 如果解析失败，设置默认过期时间为 1 小时后
            return { exp: Math.floor(Date.now() / 1000) + 3600 };
        }
    }
    /**
     * 启动自动刷新定时器
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        // 计算刷新间隔：在 Token 过期前 5 分钟刷新，但至少间隔 2 分钟
        const now = Date.now();
        const timeUntilExpiry = this.expiresAt - now;
        const refreshInterval = Math.max(this.MIN_REFRESH_INTERVAL, Math.min(timeUntilExpiry - this.REFRESH_BEFORE_EXPIRY, 30 * 60 * 1000) // 最多 30 分钟
        );
        console.log(`[TokenManager] Next refresh in ${Math.floor(refreshInterval / 1000)}s`);
        this.refreshTimer = setInterval(async () => {
            try {
                await this.fetchToken();
            }
            catch (error) {
                console.error('[TokenManager] Auto refresh failed, will retry next interval');
            }
        }, refreshInterval);
    }
    /**
     * 获取当前有效的 Token
     */
    getCurrentToken() {
        if (!this.token) {
            throw new Error('Token not initialized. Call initialize() first.');
        }
        // 检查是否即将过期（提前 1 分钟）
        if (Date.now() > this.expiresAt - 60000) {
            console.warn('[TokenManager] Token is about to expire, triggering refresh...');
            this.fetchToken().catch(err => {
                console.error('[TokenManager] Failed to refresh token:', err);
            });
        }
        return this.token;
    }
    /**
     * 获取 API 调用所需的 headers
     * 返回格式: { 'x-jwt-token': token }
     */
    getMcpHeaders() {
        const token = this.getCurrentToken();
        return { 'x-jwt-token': token };
    }
    /**
     * 停止自动刷新
     */
    stop() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('[TokenManager] Auto refresh stopped');
        }
    }
    /**
     * 获取 Token 状态信息
     */
    getStatus() {
        return {
            token: this.token ? `${this.token.substring(0, 20)}...` : null,
            expiresAt: this.expiresAt,
            isExpired: Date.now() > this.expiresAt,
        };
    }
}
