#!/usr/bin/env node

/**
 * SessionStart hook for Bytecoding
 *
 * This hook runs when a Claude Code session starts and provides:
 * - Welcome message with plugin status
 * - Checks Repotalk Cookie configuration
 * - Lists available commands
 * - User and project configuration status
 *
 * @module session-start-hook
 */

const lspGuidelines = require('./lib/lsp-guidelines');
const codingGuidelines = require('./lib/coding-guidelines');
const repotalkAuth = require('./lib/repotalk-auth');
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

  // Check and ensure coding guidelines in CLAUDE.md
  const codingCheckResult = codingGuidelines.checkAndEnsureCodingGuidelines();

  // Check Repotalk Cookie
  const cookieTip = repotalkAuth.checkRepotalkAuth();

  // Build welcome message
  const welcomeMsg = welcomeMessage.buildWelcomeMessage(lspCheckResult, codingCheckResult);

  // Build output
  const output = {
    systemMessage: welcomeMsg
  };

  // Add additional context for setup instructions
  const additionalContextParts = [];

  if (cookieTip) {
    additionalContextParts.push(cookieTip);
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
