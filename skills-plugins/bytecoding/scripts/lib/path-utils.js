/**
 * Path Utilities for Bytecoding
 *
 * Provides centralized path management for user and project directories.
 */

const path = require('path');
const os = require('os');

/**
 * Get user's bytecoding directory
 * @returns {string} Path to ~/.bytecoding
 */
function getUserBytecodingDir() {
  return path.join(os.homedir(), '.bytecoding');
}

/**
 * Get serena install flag path
 * @returns {string} Path to serena installed flag file
 */
function getSerenaInstallFlagPath() {
  return path.join(getUserBytecodingDir(), '.serena_installed');
}

/**
 * Get serena installing flag path (used for background installation tracking)
 * @returns {string} Path to serena installing flag file
 */
function getSerenaInstallingFlagPath() {
  return path.join(getUserBytecodingDir(), '.serena_installing');
}

/**
 * Get user plans directory
 * @returns {string} Path to ~/.bytecoding/changes
 */
function getUserPlansDir() {
  return path.join(getUserBytecodingDir(), 'changes');
}

/**
 * Get user archive directory
 * @returns {string} Path to ~/.bytecoding/changes/archive
 */
function getUserArchiveDir() {
  return path.join(getUserPlansDir(), 'archive');
}

/**
 * Get user config path
 * @returns {string} Path to ~/.bytecoding/config.json
 */
function getUserConfigPath() {
  return path.join(getUserBytecodingDir(), 'config.json');
}

/**
 * Get project bytecoding directory
 * @returns {string} Path to .bytecoding in current project
 */
function getProjectBytecodingDir() {
  return path.join(process.cwd(), '.bytecoding');
}

module.exports = {
  getUserBytecodingDir,
  getSerenaInstallFlagPath,
  getSerenaInstallingFlagPath,
  getUserPlansDir,
  getUserArchiveDir,
  getUserConfigPath,
  getProjectBytecodingDir,
};
