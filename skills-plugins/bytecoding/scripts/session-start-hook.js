#!/usr/bin/env node

/**
 * SessionStart hook for Bytecoding
 *
 * This hook runs when a Claude Code session starts and provides:
 * - Welcome message with plugin status
 * - Checks Repotalk Cookie configuration
 * - Auto-installs Serena if needed
 * - Lists available commands
 * - User and project configuration status
 *
 * @module session-start-hook
 */

const lspGuidelines = require('./lib/lsp-guidelines');
const repotalkAuth = require('./lib/repotalk-auth');
const serenaInstaller = require('./lib/serena-installer');
const welcomeMessage = require('./lib/welcome-message');

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
  const lspCheckResult = lspGuidelines.checkAndEnsureLspGuidelines();

  // Check Repotalk Cookie
  const cookieTip = repotalkAuth.checkRepotalkAuth();

  // Check Serena status and auto-install if needed (non-blocking)
  const serenaStatus = serenaInstaller.checkSerenaStatusSync();
  let serenaTip = '';

  if (!serenaStatus.installed && serenaStatus.needsInstall && !serenaStatus.installing) {
    // Start serena installation in background (non-blocking)
    const bgInstallResult = serenaInstaller.startSerenaInstallBackground();

    if (bgInstallResult.started) {
      // Installation started in background
      serenaTip = `
---
**⏳ Serena 正在后台安装中...**

Serena 安装已启动，正在后台下载和缓存。
安装完成后，下次会话启动时即可使用语义代码分析功能。
安装过程通常需要 1-2 分钟，不会阻塞当前会话。

**验证安装**：
\`\`\`bash
uvx serena --help
\`\`\`
---
`;
    } else {
      // Installation couldn't be started, show manual instructions
      serenaTip = serenaInstaller.getSerenaSetupTip();
      if (bgInstallResult.message) {
        serenaTip = serenaTip.replace(
          '**自动安装**（推荐）：',
          `**自动安装**：${bgInstallResult.message}\n\n**手动安装**（如果自动安装失败）：`
        );
      }
    }
  } else if (serenaStatus.installing) {
    // Installation is already in progress
    serenaTip = `
---
**⏳ Serena 正在后台安装中...**

安装进程已在运行，预计还需 1-2 分钟完成。
请稍后重启 Claude Code 以使用 Serena 功能。
---
`;
  }

  // Build welcome message (pass cached serenaStatus to avoid re-checking)
  const welcomeMsg = welcomeMessage.buildWelcomeMessage(lspCheckResult, serenaStatus);

  // Build output
  const output = {
    systemMessage: welcomeMsg
  };

  // Add additional context for setup instructions
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
