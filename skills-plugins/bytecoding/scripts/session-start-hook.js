#!/usr/bin/env node
'use strict';

const { findGitRoot, ensureBytecodingDir } = require('./lib/paths');
const { checkRepotalkCookie } = require('./lib/repotalk-auth');
const { checkAndEnsureCodingGuidelines } = require('./lib/coding-guidelines');

/**
 * Get available commands
 * @returns {Array} List of command objects
 */
function getAvailableCommands() {
  return [
    { name: '/bytecoding:init', desc: '初始化项目配置（新项目首次使用）' },
    { name: '/bytecoding:design', desc: '探索式方案设计（不确定怎么做时使用）' },
    { name: '/bytecoding:plan', desc: '需求分析与任务生成（需求明确，需分析时使用）' },
    { name: '/bytecoding:apply', desc: '执行 plan 生成的任务列表' },
    { name: '/bytecoding:do', desc: '直接执行明确的改动（需求明确，直接干）' },
  ];
}

/**
 * Build welcome message
 * @param {Object} options - Options
 * @returns {string} Welcome message
 */
function buildWelcomeMessage(options = {}) {
  const { dirCreated, cookieStatus, guidelinesResult } = options;

  const lines = [];
  lines.push('Bytecoding 插件已加载');
  lines.push('');

  // Directory status
  if (dirCreated) {
    lines.push('已创建 .bytecoding/ 目录');
  }

  // Cookie status
  if (cookieStatus.configured) {
    lines.push('Repotalk Cookie: 已配置');
  } else {
    lines.push('Repotalk Cookie: 未配置');
  }

  // Coding Guidelines status
  if (guidelinesResult) {
    if (guidelinesResult.reason === 'created') {
      lines.push('CLAUDE.md: 已创建并添加 Coding Guidelines');
    } else if (guidelinesResult.reason === 'added') {
      lines.push('CLAUDE.md: 已添加 Coding Guidelines');
    }
  }

  lines.push('');
  lines.push('可用命令:');

  const commands = getAvailableCommands();
  for (const cmd of commands) {
    lines.push(`  ${cmd.name} - ${cmd.desc}`);
  }

  lines.push('');
  lines.push('Tips: 经常运行 `bcindex index` 可以提高代码搜索准确度');

  return lines.join('\n');
}

/**
 * Main hook handler
 */
function handleSessionStart() {
  const gitRoot = findGitRoot(process.cwd());

  let dirCreated = false;
  let guidelinesResult = null;

  if (gitRoot) {
    dirCreated = ensureBytecodingDir(gitRoot);
    guidelinesResult = checkAndEnsureCodingGuidelines();
  }

  const cookieStatus = checkRepotalkCookie();

  const welcomeMsg = buildWelcomeMessage({
    dirCreated,
    cookieStatus,
    guidelinesResult,
  });

  const output = {
    systemMessage: welcomeMsg,
  };

  // Add cookie tip if not configured
  if (!cookieStatus.configured && cookieStatus.tip) {
    output.hookSpecificOutput = {
      hookEventName: 'SessionStart',
      additionalContext: cookieStatus.tip,
    };
  }

  return output;
}

// CLI execution
(async () => {
  // Read stdin (hook input)
  const stdinBuffer = [];
  process.stdin.setEncoding('utf-8');

  await new Promise((resolve) => {
    process.stdin.on('data', (chunk) => stdinBuffer.push(chunk));
    process.stdin.on('end', resolve);
  });

  const output = handleSessionStart();
  console.log(JSON.stringify(output));
})();
