/**
 * Serena Installation Module
 *
 * Handles Serena installation checking and auto-installation.
 */

const fs = require('fs');
const { spawnSync } = require('child_process');
const pathUtils = require('./path-utils');

/**
 * Check if serena can be run via uvx
 * @returns {boolean} true if serena is available
 */
function checkSerenaInstalled() {
  try {
    const result = spawnSync('uvx', ['--help'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000
    });

    if (result.status !== 0) {
      return false;
    }

    // Check if serena is in uvx cache or can be fetched
    const serenaCheck = spawnSync('uvx', ['serena', '--help'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 30000
    });

    return serenaCheck.status === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Install serena using uvx
 * This will download and cache serena for future use
 * @returns {Object} { success: boolean, message: string }
 */
function installSerena() {
  try {
    // Use uvx to install serena from GitHub
    const result = spawnSync(
      'uvx',
      ['--from', 'git+https://github.com/oraios/serena', 'serena', '--help'],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 120000 // 2 minutes timeout
      }
    );

    if (result.status === 0) {
      // Mark as installed
      const flagPath = pathUtils.getSerenaInstallFlagPath();
      fs.writeFileSync(flagPath, new Date().toISOString());
      return { success: true, message: 'Serena 安装成功' };
    } else {
      const error = result.stderr ? result.stderr.toString() : '未知错误';
      return {
        success: false,
        message: `Serena 安装失败: ${error}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Serena 安装异常: ${error.message}`
    };
  }
}

/**
 * Check serena status and provide installation guidance
 * @returns {Object} { installed: boolean, message: string, needsInstall: boolean }
 */
function checkSerenaStatus() {
  const flagPath = pathUtils.getSerenaInstallFlagPath();
  const wasInstalled = fs.existsSync(flagPath);

  // Check if serena is currently available
  const isAvailable = checkSerenaInstalled();

  if (isAvailable) {
    // Update flag if it was missing
    if (!wasInstalled) {
      fs.writeFileSync(flagPath, new Date().toISOString());
    }
    return {
      installed: true,
      needsInstall: false,
      message: '✅ Serena 已就绪'
    };
  }

  // Serena was installed before but not available now
  if (wasInstalled) {
    return {
      installed: false,
      needsInstall: true,
      message: '⚠️ Serena 缓存可能已失效，需要重新安装'
    };
  }

  // Serena never installed
  return {
    installed: false,
    needsInstall: true,
    message: 'ℹ️ Serena 尚未安装'
  };
}

/**
 * Get Serena setup instructions
 * @returns {string} Setup instructions in markdown format
 */
function getSerenaSetupTip() {
  return `
---
**🔧 Serena MCP 未就绪**

Serena 是一个强大的代码语义分析工具，可以提升 Claude Code 的代码理解能力。

**自动安装**（推荐）：
- Hook 会在下次会话启动时自动尝试安装 Serena
- 确保你的网络可以访问 GitHub
- 安装过程可能需要 1-2 分钟

**手动安装**（如果自动安装失败）：
\`\`\`bash
# 方法1: 使用 uvx（推荐）
uvx --from git+https://github.com/oraios/serena serena --help

# 方法2: 安装到 Python 环境
uv pip install --user git+https://github.com/oraios/serena
\`\`\`

**网络问题？**
- 如果在公司网络环境无法访问 GitHub，可以：
  1. 使用代理或 VPN
  2. 在网络良好的环境提前运行上述命令
  3. 暂时禁用 Serena（编辑 .mcp.json）

**验证安装**：
\`\`\`bash
uvx serena --help
\`\`\`

安装完成后，重启 Claude Code 即可生效。
---
`;
}

module.exports = {
  checkSerenaInstalled,
  installSerena,
  checkSerenaStatus,
  getSerenaSetupTip,
};
