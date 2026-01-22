/**
 * Repotalk Authentication Module
 *
 * Handles Repotalk CAS Session Cookie validation and setup instructions.
 */

const fs = require('fs');
const pathUtils = require('./path-utils');

/**
 * Check if CAS Session Cookie is valid
 * CAS Session Cookie is typically a 32-character hexadecimal string
 * @param {string} cookie - Cookie value to validate
 * @returns {boolean} True if cookie is valid
 */
function isValidCasSessionCookie(cookie) {
  if (!cookie) {
    return false;
  }
  const casSessionRegex = /^[a-f0-9]{32}$/i;
  return casSessionRegex.test(cookie);
}

/**
 * Check Repotalk authentication configuration
 * @returns {string} Setup tip if cookie not configured, empty string otherwise
 */
function checkRepotalkAuth() {
  const configPath = pathUtils.getUserConfigPath();

  if (!fs.existsSync(configPath)) {
    return getCookieSetupTip();
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const cookie = config.repotalk?.auth?.cas_session_cookie;

    if (!isValidCasSessionCookie(cookie)) {
      return getCookieSetupTip();
    }

    return '';
  } catch (error) {
    return getCookieSetupTip();
  }
}

/**
 * Get Cookie setup instructions
 * @returns {string} Setup instructions in markdown format
 */
function getCookieSetupTip() {
  return `
---
**🍪 Repotalk Cookie 未配置**

Bytecoding 的 repotalk MCP 功能需要配置 CAS Session Cookie 才能访问字节内部代码库。

**配置步骤**：

1. **获取 Cookie**：
   - 登录 https://cloud.bytedance.net
   - 打开浏览器开发者工具 (F12)
   - 进入 Application/存储 → Cookies
   - 找到 \`CAS_SESSION\` 并复制其值

2. **配置到用户级配置**：
   编辑 \`~/.bytecoding/config.json\`：
   \`\`\`json
   {
     "repotalk": {
       "auth": {
         "cas_session_cookie": "你的32位cookie值"
       }
     }
   }
   \`\`\`

3. **自动同步**：
   - Hook 会在每次会话启动时自动同步 Cookie 到 \`plugin/.mcp.json\`
   - 如果 MCP 连接失败，说明 Cookie 过期，请重新获取并更新 \`~/.bytecoding/config.json\`

**注意**：只需维护 \`~/.bytecoding/config.json\` 一处配置，Hook 会自动同步到 .mcp.json。
---
`;
}

module.exports = {
  isValidCasSessionCookie,
  checkRepotalkAuth,
  getCookieSetupTip,
};
