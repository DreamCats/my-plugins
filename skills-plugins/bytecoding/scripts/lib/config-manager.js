/**
 * Configuration Manager for Bytecoding
 *
 * Handles directory creation, config initialization, and gitignore management.
 * Optimized with caching to avoid repeated file I/O.
 */

const fs = require('fs');
const path = require('path');
const pathUtils = require('./path-utils');
const gitUtils = require('./git-utils');

// Cache for config to avoid repeated file reads
let userConfigCache = null;
let mcpConfigCache = null;

// Flag to track if config was modified
let configModified = false;

/**
 * Clear all caches
 * Useful when config may have been modified externally
 */
function clearCache() {
  userConfigCache = null;
  mcpConfigCache = null;
}

/**
 * Load user config with caching
 * @returns {Object|null} User config object
 */
function loadUserConfig() {
  if (userConfigCache !== null) {
    return userConfigCache;
  }

  const configPath = pathUtils.getUserConfigPath();

  if (!fs.existsSync(configPath)) {
    userConfigCache = null;
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    userConfigCache = JSON.parse(content);
    return userConfigCache;
  } catch (error) {
    userConfigCache = null;
    return null;
  }
}

/**
 * Load MCP config with caching
 * @returns {Object} MCP config object
 */
function loadMcpConfig() {
  if (mcpConfigCache !== null) {
    return mcpConfigCache;
  }

  const mcpConfigPath = pathUtils.getMcpConfigPath();
  let mcpConfig = { mcpServers: {} };

  if (fs.existsSync(mcpConfigPath)) {
    try {
      mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
    } catch (error) {
      // Parse error, use default
    }
  }

  mcpConfigCache = mcpConfig;
  return mcpConfig;
}

/**
 * Save MCP config and update cache
 * @param {Object} mcpConfig - MCP config object to save
 */
function saveMcpConfig(mcpConfig) {
  const mcpConfigPath = pathUtils.getMcpConfigPath();
  fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
  mcpConfigCache = mcpConfig;
  configModified = true;
}

/**
 * Ensure bytecoding directories exist
 * @returns {boolean} True if any directories were created
 */
function ensureBytecodingDirs() {
  const dirs = [
    pathUtils.getUserBytecodingDir(),
    pathUtils.getUserPlansDir(),
    pathUtils.getUserArchiveDir(),
  ];

  let created = false;

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      created = true;
    }
  }

  return created;
}

/**
 * Ensure .gitignore includes .bytecoding
 * @returns {Object} Status object with status and path
 */
function ensureGitignoreHasBytecoding() {
  const gitRoot = gitUtils.findGitRoot(process.cwd());
  if (!gitRoot) {
    return { status: 'no-git' };
  }

  const gitignorePath = path.join(gitRoot, '.gitignore');
  const exists = fs.existsSync(gitignorePath);
  let content = '';

  if (exists) {
    try {
      content = fs.readFileSync(gitignorePath, 'utf-8');
    } catch (error) {
      return { status: 'read-failed', path: gitignorePath };
    }
  }

  const lines = content.split(/\r?\n/);
  const hasBytecoding = lines.some((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return false;
    }
    return trimmed.includes('.bytecoding');
  });

  if (hasBytecoding) {
    return { status: 'exists', path: gitignorePath };
  }

  let newContent = content;
  if (newContent && !newContent.endsWith('\n')) {
    newContent += '\n';
  }
  newContent += '.bytecoding\n';

  try {
    fs.writeFileSync(gitignorePath, newContent);
  } catch (error) {
    return { status: 'write-failed', path: gitignorePath };
  }

  return { status: exists ? 'added' : 'created', path: gitignorePath };
}

/**
 * Create default config if it doesn't exist
 * @returns {boolean} True if config was created
 */
function ensureDefaultConfig() {
  const configPath = pathUtils.getUserConfigPath();

  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      repo_plan: {
        prefer_local: true,
        verify_mode: 'smart'
      },
      repotalk: {
        auth: {
          cas_session_cookie: null
        }
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    userConfigCache = defaultConfig; // Update cache
    return true;
  }

  return false;
}

/**
 * Get plugin root directory
 * @returns {string} Plugin root path
 */
function getPluginRootDir() {
  // Claude Code sets CLAUDE_PLUGIN_ROOT to the plugin directory
  // If not set (e.g., when testing directly), resolve from scripts/ to plugin/
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    return process.env.CLAUDE_PLUGIN_ROOT;
  }
  // __dirname is lib/, go up two levels to plugin/
  return path.resolve(__dirname, '..', '..');
}

/**
 * Get MCP config path
 * @returns {string} Path to .mcp.json
 */
function getMcpConfigPath() {
  return path.join(getPluginRootDir(), '.mcp.json');
}

/**
 * Sync CAS_SESSION from user config to .mcp.json
 * User config is the source of truth, .mcp.json is updated for MCP connection
 * @returns {Object} Sync result with sync, value, source
 */
function syncCasSessionToMcpConfig() {
  const configPath = pathUtils.getUserConfigPath();

  let casSession = null;
  let source = null;

  // Read from user config (source of truth) - use cached version if available
  if (fs.existsSync(configPath)) {
    try {
      const config = loadUserConfig();
      if (config) {
        casSession = config.repotalk?.auth?.cas_session_cookie;
        if (casSession) {
          source = 'user-config';
        }
      }
    } catch (error) {
      // Parse error, use null
    }
  }

  // Load .mcp.json or create default structure (cached)
  let mcpConfig = loadMcpConfig();

  // Ensure mcpServers structure exists
  if (!mcpConfig.mcpServers) {
    mcpConfig.mcpServers = {};
  }

  // Get current value from .mcp.json (check both repotalk-stdio and repotalk)
  const mcpCookieStdio = mcpConfig.mcpServers['repotalk-stdio']?.env?.CAS_SESSION;
  const mcpCookie = mcpConfig.mcpServers.repotalk?.env?.CAS_SESSION;
  let sync = false;

  // Update .mcp.json if user config has a different value
  if (casSession && (casSession !== mcpCookieStdio || casSession !== mcpCookie)) {
    // Update repotalk-stdio (the actual MCP server)
    if (!mcpConfig.mcpServers['repotalk-stdio']) {
      mcpConfig.mcpServers['repotalk-stdio'] = {};
    }
    if (!mcpConfig.mcpServers['repotalk-stdio'].env) {
      mcpConfig.mcpServers['repotalk-stdio'].env = {};
    }
    mcpConfig.mcpServers['repotalk-stdio'].env.CAS_SESSION = casSession;

    // Also update repotalk if it exists (for consistency)
    if (mcpConfig.mcpServers.repotalk) {
      if (!mcpConfig.mcpServers.repotalk.env) {
        mcpConfig.mcpServers.repotalk.env = {};
      }
      mcpConfig.mcpServers.repotalk.env.CAS_SESSION = casSession;
    }

    // Write updated .mcp.json
    saveMcpConfig(mcpConfig);
    sync = true;
  }

  return {
    sync,
    value: casSession || mcpCookieStdio || mcpCookie,
    source: casSession ? source : (mcpCookieStdio || mcpCookie ? 'mcp' : null)
  };
}

/**
 * Check if config was modified during this session
 * @returns {boolean} True if config was modified
 */
function wasConfigModified() {
  return configModified;
}

module.exports = {
  ensureBytecodingDirs,
  ensureGitignoreHasBytecoding,
  ensureDefaultConfig,
  getPluginRootDir,
  getMcpConfigPath,
  syncCasSessionToMcpConfig,
  loadUserConfig,
  loadMcpConfig,
  clearCache,
  wasConfigModified,
};
