/**
 * Serena Installation Module
 *
 * Handles Serena installation checking and auto-installation.
 * Optimized to avoid blocking the session start hook.
 */

const fs = require('fs');
const { spawn } = require('child_process');
const pathUtils = require('./path-utils');

// Cache for checkSerenaInstalled result to avoid repeated slow checks
let cachedCheckResult = null;

/**
 * Asynchronously check if serena can be run via uvx
 * Returns cached result if available to avoid repeated slow operations
 * @returns {Promise<boolean>} true if serena is available
 */
async function checkSerenaInstalled() {
  // Return cached result if available
  if (cachedCheckResult !== null) {
    return cachedCheckResult;
  }

  return new Promise((resolve) => {
    const listProcess = spawn('uv', ['tool', 'list'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000
    });

    let stdout = '';

    listProcess.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    listProcess.on('close', (code) => {
      if (code !== 0) {
        cachedCheckResult = false;
        resolve(false);
        return;
      }

      const installed = /(^|\s)serena(\s|$)/m.test(stdout);
      cachedCheckResult = installed;
      resolve(installed);
    });

    listProcess.on('error', () => {
      cachedCheckResult = false;
      resolve(false);
    });
  });
}

/**
 * Synchronously check if serena can be run via uvx
 * This version uses spawnSync for synchronous checking (for backward compatibility)
 * @returns {boolean} true if serena is available
 */
function checkSerenaInstalledSync() {
  try {
    const { spawnSync } = require('child_process');
    const result = spawnSync('uv', ['tool', 'list'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000
    });

    if (result.status !== 0) {
      return false;
    }

    const stdout = result.stdout ? result.stdout.toString() : '';
    return /(^|\s)serena(\s|$)/m.test(stdout);
  } catch (error) {
    return false;
  }
}

/**
 * Start serena installation in the background
 * This does not block the hook execution
 * @returns {Object} { started: boolean, message: string }
 */
function startSerenaInstallBackground() {
  try {
    const installFlagPath = pathUtils.getSerenaInstallFlagPath();
    const installingFlagPath = pathUtils.getSerenaInstallingFlagPath();

    // Check if already installing
    if (fs.existsSync(installingFlagPath)) {
      return {
        started: false,
        message: 'Serena 正在后台安装中...'
      };
    }

    // Check if already installed
    if (fs.existsSync(installFlagPath)) {
      return {
        started: false,
        message: 'Serena 已安装'
      };
    }

    // Mark as installing
    fs.writeFileSync(installingFlagPath, new Date().toISOString());

    // Start installation in background (detached)
    const process = spawn('uv', [
      'tool',
      'install',
      'git+https://github.com/oraios/serena'
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    });

    process.unref();

    // Handle installation completion in background
    process.on('close', (code) => {
      // Remove installing flag
      try {
        fs.unlinkSync(installingFlagPath);
      } catch (e) {
        // Ignore errors
      }

      if (code === 0) {
        // Mark as installed
        fs.writeFileSync(installFlagPath, new Date().toISOString());
      }
    });

    return {
      started: true,
      message: 'Serena 已在后台开始安装，请稍后...'
    };
  } catch (error) {
    return {
      started: false,
      message: `启动 Serena 安装失败: ${error.message}`
    };
  }
}

/**
 * Install serena using uvx (synchronous - may block up to 120s)
 * NOTE: This is kept for backward compatibility. Consider using startSerenaInstallBackground instead.
 * @returns {Object} { success: boolean, message: string }
 */
function installSerenaSync() {
  try {
    const { spawnSync } = require('child_process');
    const result = spawnSync('uv', ['tool', 'install', 'git+https://github.com/oraios/serena'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120000 // 2 minutes timeout
    });

    if (result.status === 0) {
      const flagPath = pathUtils.getSerenaInstallFlagPath();
      fs.writeFileSync(flagPath, new Date().toISOString());
      return { success: true, message: 'Serena 安装成功' };
    }

    const error = result.stderr ? result.stderr.toString() : '未知错误';
    return {
      success: false,
      message: `Serena 安装失败: ${error}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Serena 安装异常: ${error.message}`
    };
  }
}

/**
 * Install serena using uvx (backward compatible wrapper)
 * NOTE: For non-blocking behavior, use startSerenaInstallBackground instead.
 * @returns {Object} { success: boolean, message: string }
 */
function installSerena() {
  return installSerenaSync();
}

/**
 * Check serena status and provide installation guidance
 * @param {boolean} useAsyncCheck - Use async check (slower but more accurate)
 * @returns {Promise<Object>|Object} { installed: boolean, message: string, needsInstall: boolean, installing: boolean }
 */
async function checkSerenaStatus(useAsyncCheck = false) {
  const flagPath = pathUtils.getSerenaInstallFlagPath();
  const installingFlagPath = pathUtils.getSerenaInstallingFlagPath();
  const wasInstalled = fs.existsSync(flagPath);
  const isInstalling = fs.existsSync(installingFlagPath);

  // Check if serena is currently available
  const isAvailable = useAsyncCheck
    ? await checkSerenaInstalled()
    : checkSerenaInstalledSync();

  if (isAvailable) {
    // Update flag if it was missing
    if (!wasInstalled) {
      fs.writeFileSync(flagPath, new Date().toISOString());
    }
    return {
      installed: true,
      needsInstall: false,
      installing: false,
      message: '✅ Serena 已就绪'
    };
  }

  // Check if installation is in progress
  if (isInstalling) {
    return {
      installed: false,
      needsInstall: false,
      installing: true,
      message: '⏳ Serena 正在后台安装中...'
    };
  }

  // Serena was installed before but not available now
  if (wasInstalled) {
    return {
      installed: false,
      needsInstall: true,
      installing: false,
      message: '⚠️ Serena 缓存可能已失效，需要重新安装'
    };
  }

  // Serena never installed
  return {
    installed: false,
    needsInstall: true,
    installing: false,
    message: 'ℹ️ Serena 尚未安装'
  };
}

/**
 * Synchronous version of checkSerenaStatus for backward compatibility
 * @returns {Object} { installed: boolean, message: string, needsInstall: boolean, installing: boolean }
 */
function checkSerenaStatusSync() {
  const flagPath = pathUtils.getSerenaInstallFlagPath();
  const installingFlagPath = pathUtils.getSerenaInstallingFlagPath();
  const wasInstalled = fs.existsSync(flagPath);
  const isInstalling = fs.existsSync(installingFlagPath);

  // Check if serena is currently available
  const isAvailable = checkSerenaInstalledSync();

  if (isAvailable) {
    // Update flag if it was missing
    if (!wasInstalled) {
      fs.writeFileSync(flagPath, new Date().toISOString());
    }
    return {
      installed: true,
      needsInstall: false,
      installing: false,
      message: '✅ Serena 已就绪'
    };
  }

  // Check if installation is in progress
  if (isInstalling) {
    return {
      installed: false,
      needsInstall: false,
      installing: true,
      message: '⏳ Serena 正在后台安装中...'
    };
  }

  // Serena was installed before but not available now
  if (wasInstalled) {
    return {
      installed: false,
      needsInstall: true,
      installing: false,
      message: '⚠️ Serena 缓存可能已失效，需要重新安装'
    };
  }

  // Serena never installed
  return {
    installed: false,
    needsInstall: true,
    installing: false,
    message: 'ℹ️ Serena 尚未安装'
  };
}

/**
 * Clear the cached check result
 * Useful when serena status may have changed
 */
function clearCache() {
  cachedCheckResult = null;
}

function getSerenaSetupTip() {
  return `
---
**🔧 Serena 未就绪**

**安装**（推荐）：
\`\`\`bash
uv tool install git+https://github.com/oraios/serena
\`\`\`

**验证安装**：
\`\`\`bash
uv tool run serena --help
\`\`\`
---
`;
}

module.exports = {
  checkSerenaInstalled,
  checkSerenaInstalledSync,
  installSerena,
  installSerenaSync,
  startSerenaInstallBackground,
  checkSerenaStatus,
  checkSerenaStatusSync,
  getSerenaSetupTip,
  clearCache,
};
