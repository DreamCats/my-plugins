#!/usr/bin/env node

/**
 * SessionStart hook for Bytecoding
 *
 * This hook runs when a Claude Code session starts and provides:
 * - Welcome message with plugin status
 * - Checks Repotalk Cookie configuration
 * - Lists available commands
 * - User and project configuration status
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

// ============================================================================
// Path Utilities
// ============================================================================

function getUserBytecodingDir() {
  return path.join(os.homedir(), '.bytecoding');
}

function getSerenaInstallFlagPath() {
  return path.join(getUserBytecodingDir(), '.serena_installed');
}

function getUserPlansDir() {
  return path.join(getUserBytecodingDir(), 'changes');
}

function getUserArchiveDir() {
  return path.join(getUserPlansDir(), 'archive');
}

function getUserConfigPath() {
  return path.join(getUserBytecodingDir(), 'config.json');
}

function getProjectBytecodingDir() {
  return path.join(process.cwd(), '.bytecoding');
}

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

function getGitIdentity() {
  const gitRoot = findGitRoot(process.cwd());
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

function findGitRoot(startDir) {
  let currentDir = startDir;

  while (true) {
    const gitPath = path.join(currentDir, '.git');
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

function ensureGitignoreHasBytecoding() {
  const gitRoot = findGitRoot(process.cwd());
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
 * Ensure Bytecoding directories exist
 * Creates them if they don't exist
 */
function ensureBytecodingDirs() {
  const dirs = [
    getUserBytecodingDir(),
    getUserPlansDir(),
    getUserArchiveDir(),
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
 * Sync CAS_SESSION from user config to .mcp.json
 * User config is the source of truth, .mcp.json is updated for MCP connection
 * @returns {Object} { sync: boolean, value: string|null, source: 'user-config'|'mcp'|null }
 */
function syncCasSessionToMcpConfig() {
  const mcpConfigPath = getMcpConfigPath();
  const configPath = getUserConfigPath();

  let casSession = null;
  let source = null;

  // Read from user config (source of truth)
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      casSession = config.repotalk?.auth?.cas_session_cookie;
      if (casSession) {
        source = 'user-config';
      }
    } catch (error) {
      // Parse error, use null
    }
  }

  // Read .mcp.json or create default structure
  let mcpConfig = { mcpServers: {} };

  if (fs.existsSync(mcpConfigPath)) {
    try {
      mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
    } catch (error) {
      // Parse error, use default
    }
  }

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
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    sync = true;
  }

  return {
    sync,
    value: casSession || mcpCookieStdio || mcpCookie,
    source: casSession ? source : (mcpCookieStdio || mcpCookie ? 'mcp' : null)
  };
}

/**
 * Create default config if it doesn't exist
 */
function ensureDefaultConfig() {
  const configPath = getUserConfigPath();

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
    return true;
  }

  return false;
}


function getPluginRootDir() {
  // Claude Code sets CLAUDE_PLUGIN_ROOT to the plugin directory
  // If not set (e.g., when testing directly), resolve from scripts/ to plugin/
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    return process.env.CLAUDE_PLUGIN_ROOT;
  }
  // __dirname is scripts/, go up one level to plugin/
  return path.resolve(__dirname, '..');
}

function getMcpConfigPath() {
  return path.join(getPluginRootDir(), '.mcp.json');
}

/**
 * Get commands available in this plugin
 */
function getAvailableCommands() {
  return [
    { name: '/repo-plan', description: '生成方案与 PlanSpec（触发 brainstorming + writing-plans）' },
    { name: '/repo-apply', description: '执行落地（触发 git-worktrees + subagent-dev + 编译验证驱动）' },
    { name: '/repo-archive', description: '归档已完成的变更' },
  ];
}

// ============================================================================
// Repotalk Auth Check
// ============================================================================

/**
 * Check if CAS Session Cookie is valid
 * CAS Session Cookie is typically a 32-character hexadecimal string
 */
function isValidCasSessionCookie(cookie) {
  if (!cookie) {
    return false;
  }
  const casSessionRegex = /^[a-f0-9]{32}$/i;
  return casSessionRegex.test(cookie);
}

/**
 * Check Repotalk authentication configuration
 * @returns {string} Setup tip if cookie not configured, empty string otherwise
 */
function checkRepotalkAuth() {
  const configPath = getUserConfigPath();

  if (!fs.existsSync(configPath)) {
    return getCookieSetupTip();
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const cookie = config.repotalk?.auth?.cas_session_cookie;

    if (!isValidCasSessionCookie(cookie)) {
      return getCookieSetupTip();
    }

    return '';
  } catch (error) {
    return getCookieSetupTip();
  }
}

/**
 * Get Cookie setup instructions
 */
function getCookieSetupTip() {
  return `
---
**🍪 Repotalk Cookie 未配置**

Bytecoding 的 repotalk MCP 功能需要配置 CAS Session Cookie 才能访问字节内部代码库。

**配置步骤**：

1. **获取 Cookie**：
   - 登录 https://cloud.bytedance.net
   - 打开浏览器开发者工具 (F12)
   - 进入 Application/存储 → Cookies
   - 找到 \`CAS_SESSION\` 并复制其值

2. **配置到用户级配置**：
   编辑 \`~/.bytecoding/config.json\`：
   \`\`\`json
   {
     "repotalk": {
       "auth": {
         "cas_session_cookie": "你的32位cookie值"
       }
     }
   }
   \`\`\`

3. **自动同步**：
   - Hook 会在每次会话启动时自动同步 Cookie 到 \`plugin/.mcp.json\`
   - 如果 MCP 连接失败，说明 Cookie 过期，请重新获取并更新 \`~/.bytecoding/config.json\`

**注意**：只需维护 \`~/.bytecoding/config.json\` 一处配置，Hook 会自动同步到 .mcp.json。
---
`;
}

// ============================================================================
// Serena Installation Check
// ============================================================================

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
      const flagPath = getSerenaInstallFlagPath();
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
  const flagPath = getSerenaInstallFlagPath();
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


/**
 * Get default CLAUDE.md template content
 */
function getClaudeMdTemplate() {
  return `# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Repository Overview

在此处添加您的仓库概述信息...

`;
}

/**
 * LSP Guidelines content to be injected into CLAUDE.md
 */
function getLspGuidelines() {
  return `

<< ------- lsp intro start ------->>

## LSP 定位与查询准则

请务必使用 LSP (Language Server Protocol) 进行代码定位与查询，优先于传统的文本搜索和正则表达式匹配。

### 核心原则

1. **优先使用 LSP**: 当需要查找定义、引用、类型信息时，优先使用 LSP 相关工具而非 Grep/Glob
2. **语义理解**: LSP 能够理解代码语义，提供更准确的代码定位结果
3. **跨语言支持**: 利用各语言的 LSP 服务实现智能代码查询

### LSP 工具使用场景

| 场景 |   说明 |
|------|------|
| 查找定义 | 跳转到符号定义位置 |
| 查找引用 | 查找符号的所有引用 |
| 查找类型 | 跳转到类型定义 |
| 查找实现 | 查找接口实现 |
| 符号搜索 | 在工作区中搜索符号 |
| 代码补全 | 获取代码补全建议 |
| 悬停信息 | 获取符号的文档信息 |
| 重命名 | 重命名符号并更新所有引用 |

### 与传统工具的对比

- **Grep/Grep**: 基于文本匹配，无法理解代码语义，容易产生误报
- **LSP**: 基于语义理解，精确定位符号，减少误报

### 注意事项

- 确保项目已配置相应的 LSP 服务器
- 对于大型项目，LSP 索引可能需要时间初始化
- 当 LSP 不可用时，可以降级使用传统搜索工具

<< ------- lsp intro end ------->>
`;
}

/**
 * Check and ensure LSP guidelines in CLAUDE.md
 * Creates CLAUDE.md if it doesn't exist
 * @returns {Object} { updated: boolean, path: string|null, reason: string }
 */
function checkAndEnsureLspGuidelines() {
  const gitRoot = findGitRoot(process.cwd());
  if (!gitRoot) {
    return { updated: false, path: null, reason: 'no-git' };
  }

  const claudeMdPath = path.join(gitRoot, 'CLAUDE.md');
  const lspStartMarker = '<< ------- lsp intro start ------->>';
  const lspEndMarker = '<< ------- lsp intro end ------->>';

  let content = '';

  // Check if CLAUDE.md exists
  if (!fs.existsSync(claudeMdPath)) {
    // Create CLAUDE.md with template and LSP guidelines
    const template = getClaudeMdTemplate();
    const lspGuidelines = getLspGuidelines();

    try {
      fs.writeFileSync(claudeMdPath, template + lspGuidelines);
      return { updated: true, path: claudeMdPath, reason: 'created' };
    } catch (error) {
      return { updated: false, path: claudeMdPath, reason: 'create-failed' };
    }
  }

  // Read existing content
  try {
    content = fs.readFileSync(claudeMdPath, 'utf-8');
  } catch (error) {
    return { updated: false, path: claudeMdPath, reason: 'read-failed' };
  }

  // Check if LSP guidelines already exist
  if (content.includes(lspStartMarker) && content.includes(lspEndMarker)) {
    return { updated: false, path: claudeMdPath, reason: 'already-exists' };
  }

  // Append LSP guidelines
  const lspGuidelines = getLspGuidelines();
  let newContent = content;

  // Ensure there's a newline before adding the new section
  if (newContent && !newContent.endsWith('\n')) {
    newContent += '\n';
  }

  newContent += lspGuidelines;

  // Write updated content
  try {
    fs.writeFileSync(claudeMdPath, newContent);
    return { updated: true, path: claudeMdPath, reason: 'added' };
  } catch (error) {
    return { updated: false, path: claudeMdPath, reason: 'write-failed' };
  }
}

// ============================================================================
// Welcome Message Builder
// ============================================================================

/**
 * Build commands display section
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
 */
function buildWelcomeMessage(lspCheckResult = null) {
  // Ensure directories and config exist (auto-initialize)
  const dirsCreated = ensureBytecodingDirs();
  const configCreated = ensureDefaultConfig();
  const gitignoreStatus = ensureGitignoreHasBytecoding();

  // Sync CAS_SESSION to .mcp.json
  const cookieSync = syncCasSessionToMcpConfig();
  const gitIdentity = getGitIdentity();
  const serenaStatus = checkSerenaStatus();

  // Check configuration
  const configPath = getUserConfigPath();
  let statusInfo = '';

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const cookie = config.repotalk?.auth?.cas_session_cookie;
      const cookieValid = isValidCasSessionCookie(cookie);

      // Configuration status
      const preferLocal = config.repo_plan?.prefer_local ?? true;
      const verifyMode = config.repo_plan?.verify_mode ?? 'smart';
      statusInfo += `\n⚙️ 配置: prefer_local=${preferLocal}, verify_mode=${verifyMode}`;

      // Cookie status with helpful messages
      if (cookieSync.sync) {
        statusInfo += `\n🍪 Repotalk Cookie**: ✅ 已同步到 .mcp.json`;
      } else if (cookieValid) {
        statusInfo += `\n🍪 Repotalk Cookie**: ✅ 已配置`;
      } else {
        statusInfo += `\n🍪 Repotalk Cookie**: ❌ 未配置`;
        statusInfo += `\n   💡 提示: 配置 Cookie 以启用字节内部代码库搜索`;
        statusInfo += `\n   📝 配置方法: 编辑 \`~/.bytecoding/config.json\``;
        statusInfo += `\n   🔗 获取 Cookie: 登录 https://cloud.bytedance.net`;
      }

      if (gitIdentity.status === 'local' || gitIdentity.status === 'global') {
        const scopeLabel = gitIdentity.status === 'local' ? 'local' : 'global';
        statusInfo += `\n👤 **Git 用户**: ${formatGitIdentity(gitIdentity)} (${scopeLabel})`;
      } else if (gitIdentity.status === 'missing') {
        statusInfo += `\n👤 **Git 用户**: ❌ 未配置`;
      }

      // Serena status
      statusInfo += `\n🔧 **Serena**: ${serenaStatus.message}`;
      if (!serenaStatus.installed && serenaStatus.needsInstall) {
        statusInfo += `\n   💡 提示: Serena 需要安装才能使用语义代码分析功能`;
      }
    } catch (e) {
      // Ignore config parse errors
    }
  }

  // Add LSP guidelines check status
  if (lspCheckResult) {
    if (lspCheckResult.reason === 'created') {
      statusInfo += `\n📝 **CLAUDE.md**: ✅ 已创建并添加 LSP 准则`;
    } else if (lspCheckResult.reason === 'added') {
      statusInfo += `\n📝 **CLAUDE.md**: ✅ 已添加 LSP 准则`;
    } else if (lspCheckResult.reason === 'already-exists') {
      statusInfo += `\n📝 **CLAUDE.md**: ✅ LSP 准则已存在`;
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

// ============================================================================
// Main Hook Handler
// ============================================================================

/**
 * SessionStart hook handler
 * @param {Object} input - Hook input data
 * @returns {Object} Hook output with systemMessage and/or hookSpecificOutput
 */
function handleSessionStart(input) {
  // Check and ensure LSP guidelines in CLAUDE.md
  const lspCheckResult = checkAndEnsureLspGuidelines();

  // Check Repotalk Cookie
  const cookieTip = checkRepotalkAuth();

  // Check Serena status and auto-install if needed
  const serenaStatus = checkSerenaStatus();
  let serenaTip = '';

  if (!serenaStatus.installed && serenaStatus.needsInstall) {
    // Try to auto-install serena
    const installResult = installSerena();

    if (installResult.success) {
      // Installation succeeded, recheck status
      const newStatus = checkSerenaStatus();
      if (newStatus.installed) {
        serenaTip = `
---
**🎉 Serena 自动安装成功！**

Serena 已成功安装并缓存，现在可以使用语义代码分析功能了。
如需验证，可以运行：\`uvx serena --help\`
---
`;
      } else {
        serenaTip = getSerenaSetupTip();
      }
    } else {
      // Installation failed, show manual instructions
      serenaTip = getSerenaSetupTip();
      serenaTip = serenaTip.replace(
        '**自动安装**（推荐）：',
        '**自动安装失败**：\n' + installResult.message + '\n\n**手动安装**：'
      );
    }
  }

  // Build welcome message
  let welcomeMessage = buildWelcomeMessage(lspCheckResult);

  // Build output
  const output = {
    systemMessage: welcomeMessage
  };

  // Add skill rules to additional context
  const additionalContextParts = [];

  if (cookieTip) {
    additionalContextParts.push(cookieTip);
  }

  if (serenaTip) {
    additionalContextParts.push(serenaTip);
  }

  if (additionalContextParts.length > 0) {
    output.hookSpecificOutput = {
      hookEventName: 'SessionStart',
      additionalContext: additionalContextParts.join('\n')
    };
  } else {
    output.hookSpecificOutput = {
      hookEventName: 'SessionStart'
    };
  }

  return output;
}

// ============================================================================
// CLI Execution
// ============================================================================

(async () => {
  let inputData = {};

  try {
    // Read JSON input from stdin
    const stdinBuffer = [];
    process.stdin.setEncoding('utf-8');

    await new Promise((resolve) => {
      process.stdin.on('data', (chunk) => {
        stdinBuffer.push(chunk);
      });

      process.stdin.on('end', () => {
        resolve();
      });
    });

    const stdinText = stdinBuffer.join('');
    if (stdinText.trim()) {
      try {
        inputData = JSON.parse(stdinText);
      } catch (e) {
        // Parse failed, use empty object
      }
    }
  } catch (error) {
    // No stdin input or parse failed, use empty object
  }

  const output = handleSessionStart(inputData);

  // Output JSON to stdout (Claude Code will parse this)
  console.log(JSON.stringify(output));
})();
