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
const { execFileSync } = require('child_process');

// ============================================================================
// Path Utilities
// ============================================================================

function getUserBytecodingDir() {
  return path.join(os.homedir(), '.bytecoding');
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

/**
 * Get Repotalk MCP tool usage instructions
 */
function getRepotalkUsageTip() {
  return `
---
**🔍 Repotalk MCP 工具使用说明**

使用 repotalk MCP 工具搜索字节内部代码库时，请注意以下参数格式：

**repo_names / repo_name 参数格式**：
- ✅ 正确格式：\`org/repo\`（如 \`oec/live_promotion_core\`）
- ❌ 错误格式：仅仓库名（如 \`live_promotion_core\`）

**从项目路径推断仓库名**：
- 项目路径：\`/data00/home/xxx/go/src/code.byted.org/org/repo_name\`
- 对应仓库名：\`org/repo_name\`

**常见需要 repo_names 参数的工具**：
- \`get_repos_detail\` - 获取仓库详细信息
- \`search_nodes\` - 语义化代码搜索
- \`get_packages_detail\` - 获取包详细信息
- \`get_nodes_detail\` - 获取函数/类型/变量详情
- \`get_files_detail\` - 获取文件详情
- \`get_service_apis\` - 获取 API 接口信息
- \`get_asset_file\` - 获取 asset 文件

**提示**：如果搜索没有返回结果，请首先检查 \`repo_names\` 参数格式是否正确。
---
`;
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
function buildWelcomeMessage() {
  // Ensure directories and config exist (auto-initialize)
  const dirsCreated = ensureBytecodingDirs();
  const configCreated = ensureDefaultConfig();
  const gitignoreStatus = ensureGitignoreHasBytecoding();

  // Sync CAS_SESSION to .mcp.json
  const cookieSync = syncCasSessionToMcpConfig();
  const gitIdentity = getGitIdentity();

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
      statusInfo += `\n⚙️ **配置**: prefer_local=${preferLocal}, verify_mode=${verifyMode}`;

      // Cookie status with helpful messages
      if (cookieSync.sync) {
        statusInfo += `\n🍪 **Repotalk Cookie**: ✅ 已同步到 .mcp.json`;
      } else if (cookieValid) {
        statusInfo += `\n🍪 **Repotalk Cookie**: ✅ 已配置`;
      } else {
        statusInfo += `\n🍪 **Repotalk Cookie**: ❌ 未配置`;
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
    } catch (e) {
      // Ignore config parse errors
    }
  }

  let initMessage = '';
  if (dirsCreated || configCreated) {
    initMessage = '\n✅ Bytecoding 目录结构已自动创建。';
  }
  if (gitignoreStatus.status === 'added' || gitignoreStatus.status === 'created') {
    initMessage += '\n🧹 已更新 .gitignore（添加 .bytecoding，避免误提交）。';
  }

  // Build status section
  const statusSection = statusInfo ? `\n---\n${statusInfo}` : '';

  return `
🔌 **Bytecoding 插件已加载**

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
  // Check Repotalk Cookie
  const cookieTip = checkRepotalkAuth();

  // Get Repotalk usage tip
  const repotalkUsageTip = getRepotalkUsageTip();

  // Build welcome message
  const welcomeMessage = buildWelcomeMessage();

  // Build output
  const output = {
    systemMessage: welcomeMessage
  };

  // Add skill rules to additional context
  const additionalContextParts = [];

  if (cookieTip) {
    additionalContextParts.push(cookieTip);
  }

  // Add repotalk usage tip to additional context
  additionalContextParts.push(repotalkUsageTip);

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
