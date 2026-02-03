#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findGitRoot, ensureBytecodingDir, ensureGitignore } = require('./lib/paths');
// const { checkRepotalkCookie } = require('./lib/repotalk-auth');
const { checkAndEnsureCodingGuidelines } = require('./lib/coding-guidelines');

// bcindex 状态缓存文件路径
const BCINDEX_STATUS_CACHE = '/tmp/bytecoding-bcindex-status.json';

/**
 * 异步检查 bcindex 索引状态并写入缓存文件
 * 不阻塞主流程，fire-and-forget
 */
function checkBcindexStatusAsync() {
  const child = spawn('bcindex', ['stats', '-json'], {
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 3000,
  });

  let stdout = '';

  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  child.on('close', (code) => {
    let available = false;
    if (code === 0 && stdout) {
      try {
        const stats = JSON.parse(stdout);
        available = stats.symbols > 0;
      } catch {
        // 解析失败，保持 false
      }
    }

    // 写入缓存文件
    try {
      fs.writeFileSync(
        BCINDEX_STATUS_CACHE,
        JSON.stringify({ available, checkedAt: Date.now() }),
        'utf-8'
      );
    } catch {
      // 写入失败，忽略
    }
  });

  child.on('error', () => {
    // bcindex 命令不存在或执行失败，写入 false
    try {
      fs.writeFileSync(
        BCINDEX_STATUS_CACHE,
        JSON.stringify({ available: false, checkedAt: Date.now() }),
        'utf-8'
      );
    } catch {
      // 忽略
    }
  });
}

/**
 * Get available commands
 * @returns {Array} List of command objects
 */
function getAvailableCommands() {
  return [
    { name: '/bytecoding:init', desc: '初始化项目配置（新项目首次使用）' },
    { name: '/bytecoding:brainstorming', desc: '探索式问答，将想法转化为设计' },
    { name: '/bytecoding:do', desc: '直接执行明确的改动' },
  ];
}

/**
 * Build welcome message
 * @param {Object} options - Options
 * @returns {string} Welcome message
 */
function buildWelcomeMessage(options = {}) {
  const { dirCreated, /* cookieStatus, */ guidelinesResult, gitignoreResult } = options;

  const lines = [];
  lines.push('Bytecoding 插件已加载');
  lines.push('');

  // Directory status
  if (dirCreated) {
    lines.push('已创建 .bytecoding/ 目录');
  }

  // .gitignore status
  if (gitignoreResult) {
    if (gitignoreResult.reason === 'created') {
      lines.push('.gitignore: 已创建并添加 .bytecoding/');
    } else if (gitignoreResult.reason === 'added') {
      lines.push('.gitignore: 已添加 .bytecoding/');
    }
  }

  // Cookie status (已移除 repotalk)
  // if (cookieStatus.configured) {
  //   lines.push('Repotalk Cookie: 已配置');
  // } else {
  //   lines.push('Repotalk Cookie: 未配置');
  // }

  // Coding Guidelines status
  if (guidelinesResult) {
    if (guidelinesResult.reason === 'created') {
      lines.push('CLAUDE.md: 已创建并添加 Coding Guidelines');
    } else if (guidelinesResult.reason === 'added') {
      lines.push('CLAUDE.md: 已添加 Coding Guidelines');
    }
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
  let gitignoreResult = null;

  if (gitRoot) {
    dirCreated = ensureBytecodingDir(gitRoot);
    gitignoreResult = ensureGitignore(gitRoot);
    guidelinesResult = checkAndEnsureCodingGuidelines();
  }

  // const cookieStatus = checkRepotalkCookie();

  const welcomeMsg = buildWelcomeMessage({
    dirCreated,
    // cookieStatus,
    guidelinesResult,
    gitignoreResult,
  });

  const output = {
    systemMessage: welcomeMsg,
  };

  // Add cookie tip if not configured (已移除 repotalk)
  // if (!cookieStatus.configured && cookieStatus.tip) {
  //   output.hookSpecificOutput = {
  //     hookEventName: 'SessionStart',
  //     additionalContext: cookieStatus.tip,
  //   };
  // }

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

  // 异步检查 bcindex 状态（不阻塞输出）
  checkBcindexStatusAsync();
})();
