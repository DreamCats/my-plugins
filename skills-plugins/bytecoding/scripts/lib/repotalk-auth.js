'use strict';

const fs = require('fs');
const { getUserConfigPath } = require('./paths');

/**
 * Check if CAS Session Cookie is valid (32-character hex string)
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
 * Check Repotalk Cookie configuration status
 * @returns {{ configured: boolean, tip: string|null }}
 */
function checkRepotalkCookie() {
  const configPath = getUserConfigPath();

  if (!fs.existsSync(configPath)) {
    return { configured: false, tip: getCookieSetupTip() };
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const cookie = config.repotalk?.auth?.cas_session_cookie;

    if (isValidCasSessionCookie(cookie)) {
      return { configured: true, tip: null };
    }

    return { configured: false, tip: getCookieSetupTip() };
  } catch (error) {
    return { configured: false, tip: getCookieSetupTip() };
  }
}

/**
 * Get Cookie setup instructions
 * @returns {string} Setup instructions
 */
function getCookieSetupTip() {
  return `
**Repotalk Cookie 未配置**

配置步骤：
1. 登录 https://cloud.bytedance.net
2. 浏览器 F12 → Application → Cookies → 复制 CAS_SESSION 值
3. 编辑 ~/.bytecoding/config.json：
   {
     "repotalk": {
       "auth": {
         "cas_session_cookie": "你的32位cookie值"
       }
     }
   }
`;
}

module.exports = {
  isValidCasSessionCookie,
  checkRepotalkCookie,
  getCookieSetupTip,
};
