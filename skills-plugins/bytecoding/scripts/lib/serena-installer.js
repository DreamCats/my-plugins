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
    let uvxResolved = false;

    // Check uvx first
    const uvxProcess = spawn('uvx', ['--help'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000
    });

    uvxProcess.on('close', (code) => {
      if (code !== 0) {
        cachedCheckResult = false;
        resolve(false);
        return;
      }

      // uvx is available, now check serena
      const serenaProcess = spawn('uvx', ['serena', '--help'], {
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 30000
      });

      serenaProcess.on('close', (serenaCode) => {
        const result = serenaCode === 0;
        cachedCheckResult = result;
        resolve(result);
      });

      serenaProcess.on('error', () => {
        cachedCheckResult = false;
        resolve(false);
      });
    });

    uvxProcess.on('error', () => {
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
    const process = spawn('uvx', [
      '--from', 'git+https://github.com/oraios/serena',
      'serena',
      '--help'
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

module.exports = {
  checkSerenaInstalled,
  checkSerenaInstalledSync,
  installSerena,
  installSerenaSync,
  startSerenaInstallBackground,
  checkSerenaStatus,
  checkSerenaStatusSync,
  clearCache,
};
