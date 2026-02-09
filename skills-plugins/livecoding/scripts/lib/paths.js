'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Get user-level livecoding config directory
 * @returns {string} Path to ~/.livecoding/
 */
function getUserConfigDir() {
  return path.join(os.homedir(), '.livecoding');
}

/**
 * Get user-level config file path
 * @returns {string} Path to ~/.livecoding/config.json
 */
function getUserConfigPath() {
  return path.join(getUserConfigDir(), 'config.json');
}

/**
 * Find git root from given directory
 * @param {string} startDir - Starting directory
 * @returns {string|null} Git root path or null
 */
function findGitRoot(startDir) {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Ensure .livecoding directory exists in project root
 * @param {string} projectRoot - Project root path
 * @returns {boolean} True if directory was created
 */
function ensureLivecodingDir(projectRoot) {
  const livecodingDir = path.join(projectRoot, '.livecoding');
  const changesDir = path.join(livecodingDir, 'changes');
  const plansDir = path.join(livecodingDir, 'plans');

  let created = false;

  if (!fs.existsSync(livecodingDir)) {
    fs.mkdirSync(livecodingDir, { recursive: true });
    created = true;
  }

  if (!fs.existsSync(changesDir)) {
    fs.mkdirSync(changesDir, { recursive: true });
    created = true;
  }

  if (!fs.existsSync(plansDir)) {
    fs.mkdirSync(plansDir, { recursive: true });
    created = true;
  }

  return created;
}

/**
 * Ensure .livecoding is in .gitignore
 * @param {string} projectRoot - Project root path
 * @returns {Object} Result with added property
 */
function ensureGitignore(projectRoot) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const entry = '# Livecoding\n.livecoding/';

  // If .gitignore doesn't exist, create it
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, entry + '\n');
    return { added: true, reason: 'created' };
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8');

  // Check if .livecoding/ is already in .gitignore
  if (content.includes('.livecoding/')) {
    return { added: false, reason: 'already_exists' };
  }

  // Append to .gitignore
  fs.writeFileSync(gitignorePath, content + '\n' + entry + '\n');
  return { added: true, reason: 'added' };
}

module.exports = {
  getUserConfigDir,
  getUserConfigPath,
  findGitRoot,
  ensureLivecodingDir,
  ensureGitignore,
};
