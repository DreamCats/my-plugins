/**
 * Git Utilities for Bytecoding
 *
 * Provides git configuration reading and git root detection.
 * Optimized with caching to reduce repeated git process spawns.
 */

const { execFileSync } = require('child_process');
const path = require('path');

// Cache for git config values to avoid repeated slow process spawns
const gitConfigCache = new Map();

/**
 * Clear the git config cache
 * Useful when git config may have changed
 */
function clearGitConfigCache() {
  gitConfigCache.clear();
}

/**
 * Create cache key for git config
 * @param {string[]} args - Git config arguments
 * @param {string} cwd - Working directory
 * @returns {string} Cache key
 */
function getCacheKey(args, cwd) {
  return `${cwd || ''}:${args.join(':')}`;
}

/**
 * Read git config value (with caching)
 * @param {string[]} args - Git config arguments
 * @param {string} cwd - Working directory
 * @param {boolean} useCache - Whether to use cached value
 * @returns {string|null} Git config value or null
 */
function readGitConfig(args, cwd, useCache = true) {
  const cacheKey = getCacheKey(args, cwd);

  if (useCache && gitConfigCache.has(cacheKey)) {
    return gitConfigCache.get(cacheKey);
  }

  try {
    const output = execFileSync('git', ['config', ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim();

    const result = output || null;
    gitConfigCache.set(cacheKey, result);
    return result;
  } catch (error) {
    gitConfigCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Batch read multiple git config values in a single git call
 * More efficient than multiple separate git calls
 * @param {string[]} keys - Array of config keys to read (e.g., ['user.email', 'user.name'])
 * @param {string} cwd - Working directory
 * @param {boolean} useCache - Whether to use cached values
 * @returns {Object} Map of key to value
 */
function readGitConfigBatch(keys, cwd, useCache = true) {
  const result = {};

  if (useCache) {
    let allCached = true;
    for (const key of keys) {
      const cacheKey = getCacheKey([key], cwd);
      if (gitConfigCache.has(cacheKey)) {
        result[key] = gitConfigCache.get(cacheKey);
      } else {
        allCached = false;
        break;
      }
    }
    if (allCached) {
      return result;
    }
  }

  // Read all configs in a single git call using --get-regexp
  try {
    const output = execFileSync('git', ['config', '--get-regexp', '^(user\\.)(email|name)$'], {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim();

    // Parse output: format is "key value"
    const lines = output.split('\n');
    for (const line of lines) {
      const parts = line.match(/^(\S+)\s+(.+)$/);
      if (parts) {
        const key = parts[1];
        const value = parts[2];
        const cacheKey = getCacheKey([key], cwd);
        result[key] = value;
        gitConfigCache.set(cacheKey, value);
      }
    }
  } catch (error) {
    // Batch read failed, fall back to individual reads
    for (const key of keys) {
      result[key] = readGitConfig([key], cwd, useCache);
    }
  }

  return result;
}

/**
 * Get git identity (user name and email) - optimized with batch reading
 * @param {string} startDir - Directory to start searching from
 * @returns {Object} Git identity info with status, name, email
 */
function getGitIdentity(startDir) {
  const gitRoot = findGitRoot(startDir || process.cwd());
  if (!gitRoot) {
    return { status: 'no-git' };
  }

  // Batch read both user.email and user.name in a single git call (local scope)
  const localConfigs = readGitConfigBatch(['user.email', 'user.name'], gitRoot);
  if (localConfigs['user.email'] || localConfigs['user.name']) {
    return {
      status: 'local',
      name: localConfigs['user.name'],
      email: localConfigs['user.email']
    };
  }

  // Batch read global configs
  const globalConfigs = readGitConfigBatch(['--global', 'user.email', '--global', 'user.name'], gitRoot);
  if (globalConfigs['user.email'] || globalConfigs['user.name']) {
    return {
      status: 'global',
      name: globalConfigs['user.name'],
      email: globalConfigs['user.email']
    };
  }

  return { status: 'missing' };
}

/**
 * Format git identity for display
 * @param {Object} identity - Git identity object
 * @returns {string} Formatted identity string
 */
function formatGitIdentity(identity) {
  const parts = [];
  if (identity.name) {
    parts.push(identity.name);
  }
  if (identity.email) {
    parts.push(`<${identity.email}>`);
  }
  return parts.length ? parts.join(' ') : '未配置';
}

/**
 * Find git root directory
 * @param {string} startDir - Directory to start searching from
 * @returns {string|null} Git root path or null if not found
 */
function findGitRoot(startDir) {
  let currentDir = startDir;

  while (true) {
    const gitPath = path.join(currentDir, '.git');
    const fs = require('fs');
    if (fs.existsSync(gitPath)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

module.exports = {
  readGitConfig,
  readGitConfigBatch,
  getGitIdentity,
  formatGitIdentity,
  findGitRoot,
  clearGitConfigCache,
};
