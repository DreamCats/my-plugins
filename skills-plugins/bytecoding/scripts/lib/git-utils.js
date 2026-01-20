/**
 * Git Utilities for Bytecoding
 *
 * Provides git configuration reading and git root detection.
 */

const { execFileSync } = require('child_process');
const path = require('path');

/**
 * Read git config value
 * @param {string[]} args - Git config arguments
 * @param {string} cwd - Working directory
 * @returns {string|null} Git config value or null
 */
function readGitConfig(args, cwd) {
  try {
    const output = execFileSync('git', ['config', ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim();
    return output || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get git identity (user name and email)
 * @param {string} startDir - Directory to start searching from
 * @returns {Object} Git identity info with status, name, email
 */
function getGitIdentity(startDir) {
  const gitRoot = findGitRoot(startDir || process.cwd());
  if (!gitRoot) {
    return { status: 'no-git' };
  }

  const localEmail = readGitConfig(['user.email'], gitRoot);
  const localName = readGitConfig(['user.name'], gitRoot);
  if (localEmail || localName) {
    return { status: 'local', name: localName, email: localEmail };
  }

  const globalEmail = readGitConfig(['--global', 'user.email'], gitRoot);
  const globalName = readGitConfig(['--global', 'user.name'], gitRoot);
  if (globalEmail || globalName) {
    return { status: 'global', name: globalName, email: globalEmail };
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
  getGitIdentity,
  formatGitIdentity,
  findGitRoot,
};
