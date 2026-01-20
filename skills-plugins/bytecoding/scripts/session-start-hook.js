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

  // Check Serena status and auto-install if needed
  const serenaStatus = serenaInstaller.checkSerenaStatus();
  let serenaTip = '';

  if (!serenaStatus.installed && serenaStatus.needsInstall) {
    // Try to auto-install serena
    const installResult = serenaInstaller.installSerena();

    if (installResult.success) {
      // Installation succeeded, recheck status
      const newStatus = serenaInstaller.checkSerenaStatus();
      if (newStatus.installed) {
        serenaTip = `
---
**🎉 Serena 自动安装成功！**

Serena 已成功安装并缓存，现在可以使用语义代码分析功能了。
如需验证，可以运行：\`uvx serena --help\`
---
`;
      } else {
        serenaTip = serenaInstaller.getSerenaSetupTip();
      }
    } else {
      // Installation failed, show manual instructions
      serenaTip = serenaInstaller.getSerenaSetupTip();
      serenaTip = serenaTip.replace(
        '**自动安装**（推荐）：',
        '**自动安装失败**：\n' + installResult.message + '\n\n**手动安装**：'
      );
    }
  }

  // Build welcome message
  const welcomeMsg = welcomeMessage.buildWelcomeMessage(lspCheckResult);

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
