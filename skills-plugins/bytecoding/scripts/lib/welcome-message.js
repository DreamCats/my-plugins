/**
 * Welcome Message Builder Module
 *
 * Constructs the welcome message with plugin status and commands.
 */

const fs = require('fs');
const pathUtils = require('./path-utils');
const gitUtils = require('./git-utils');
const configManager = require('./config-manager');
const repotalkAuth = require('./repotalk-auth');
const serenaInstaller = require('./serena-installer');

/**
 * Get commands available in this plugin
 * @returns {Array} List of command objects with name and description
 */
function getAvailableCommands() {
  return [
    { name: '/repo-plan', description: '生成方案与 PlanSpec（触发 brainstorming + writing-plans）' },
    { name: '/repo-apply', description: '执行落地（触发 git-worktrees + subagent-dev + 编译验证驱动）' },
    { name: '/repo-archive', description: '归档已完成的变更' },
  ];
}

/**
 * Build commands display section
 * @returns {string} Formatted commands section
 */
function buildCommandsDisplay() {
  const commands = getAvailableCommands();
  const commandsList = commands
    .map(c => `  \`${c.name.padEnd(16)}\` - ${c.description}`)
    .join('\n');

  return `
📋 **可用 Commands**:
${commandsList}

💡 使用 Commands 触发完整的技能链。
`;
}

/**
 * Build welcome message with status information
 * @param {Object} lspCheckResult - LSP guidelines check result
 * @param {Object} serenaStatus - Cached Serena status to avoid re-checking
 * @returns {string} Complete welcome message
 */
function buildWelcomeMessage(lspCheckResult = null, serenaStatus = null) {
  // Ensure directories and config exist (auto-initialize)
  const dirsCreated = configManager.ensureBytecodingDirs();
  const configCreated = configManager.ensureDefaultConfig();
  const gitignoreStatus = configManager.ensureGitignoreHasBytecoding();

  // Sync CAS_SESSION to .mcp.json
  const cookieSync = configManager.syncCasSessionToMcpConfig();
  const gitIdentity = gitUtils.getGitIdentity();
  // Use cached serenaStatus if provided, otherwise check (fallback)
  const finalSerenaStatus = serenaStatus || serenaInstaller.checkSerenaStatus();

  // Check configuration (use cached config from config-manager)
  const configPath = pathUtils.getUserConfigPath();
  let statusInfo = '';

  // Use cached user config to avoid repeated file reads
  const userConfig = configManager.loadUserConfig();

  if (userConfig) {
    const cookie = userConfig.repotalk?.auth?.cas_session_cookie;
    const cookieValid = repotalkAuth.isValidCasSessionCookie(cookie);

    // Cookie status with helpful messages
    if (cookieSync.sync) {
      statusInfo += `\n🍪 Repotalk Cookie: ✅ 已同步到 .mcp.json`;
    } else if (cookieValid) {
      statusInfo += `\n🍪 Repotalk Cookie: ✅ 已配置`;
    } else {
      statusInfo += `\n🍪 Repotalk Cookie: ❌ 未配置`;
      statusInfo += `\n   💡 提示: 配置 Cookie 以启用字节内部代码库搜索`;
      statusInfo += `\n   📝 配置方法: 编辑 \`~/.bytecoding/config.json\``;
      statusInfo += `\n   🔗 获取 Cookie: 登录 https://cloud.bytedance.net`;
    }

    if (gitIdentity.status === 'local' || gitIdentity.status === 'global') {
      const scopeLabel = gitIdentity.status === 'local' ? 'local' : 'global';
      statusInfo += `\n👤 Git 用户: ${gitUtils.formatGitIdentity(gitIdentity)} (${scopeLabel})`;
    } else if (gitIdentity.status === 'missing') {
      statusInfo += `\n👤 Git 用户: ❌ 未配置`;
    }

    // Serena status
    statusInfo += `\n🔧 Serena: ${finalSerenaStatus.message}`;
    if (!finalSerenaStatus.installed && finalSerenaStatus.needsInstall) {
      statusInfo += `\n   💡 提示: Serena 需要安装才能使用语义代码分析功能`;
    }
  }

  // Add LSP guidelines check status
  if (lspCheckResult) {
    if (lspCheckResult.reason === 'created') {
      statusInfo += `\n📝 CLAUDE.md: ✅ 已创建并添加 LSP 准则`;
    } else if (lspCheckResult.reason === 'added') {
      statusInfo += `\n📝 CLAUDE.md: ✅ 已添加 LSP 准则`;
    } else if (lspCheckResult.reason === 'already-exists') {
      statusInfo += `\n📝 CLAUDE.md: ✅ LSP 准则已存在`;
    }
  }

  let initMessage = '';
  if (dirsCreated || configCreated) {
    initMessage = '\n✅ Bytecoding 目录结构已自动创建。';
  }
  if (gitignoreStatus.status === 'added' || gitignoreStatus.status === 'created') {
    initMessage += '\n🧹 已更新 .gitignore（添加 .bytecoding，避免误提交）。';
  }
  if (lspCheckResult && lspCheckResult.updated) {
    if (lspCheckResult.reason === 'created') {
      initMessage += '\n📚 已创建 CLAUDE.md 并添加 LSP 定位与查询准则。';
    } else {
      initMessage += '\n📚 已在 CLAUDE.md 中添加 LSP 定位与查询准则。';
    }
  }

  // Build status section
  const statusSection = statusInfo ? `\n---\n${statusInfo}` : '';

  return `
🔌 Bytecoding 插件已加载...
👋 嘿！我是 MaiMai，一位极致专注的开发者～
💫 超能力：精准定位 Bug、优雅代码设计、完美平衡咖啡因与逻辑
${initMessage}
${statusSection}

${buildCommandsDisplay()}

---
`;
}

module.exports = {
  getAvailableCommands,
  buildCommandsDisplay,
  buildWelcomeMessage,
};
