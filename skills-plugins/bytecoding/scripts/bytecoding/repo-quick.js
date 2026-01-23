#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./lib/cli');
const { die } = require('./lib/errors');
const { requireGit, getProjectRoot, getGitIdentity } = require('./lib/git');
const { changeDir } = require('./lib/paths');
const { initPlanspec } = require('./lib/planspec');
const { formatChangeIdNow, nowUtcIso } = require('./lib/time');
const { createRunLogger, registerRunLogger } = require('./lib/runlog');

function printUsage() {
  console.log('usage: repo-quick.js [--desc <description>]');
}

function normalizeDescription(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    die('error: description is required (use --desc or provide as argument)');
  }
  return trimmed.replace(/\s+/g, ' ');
}

function formatYamlScalar(value) {
  if (value === null || value === undefined || value === '') {
    return '""';
  }
  return JSON.stringify(value);
}

function initQuickPlanspec(changeId, description, outPath, options = {}) {
  const identity = options.gitIdentity || {};
  const gitName = identity.name || '';
  const gitEmail = identity.email || '';
  const larkEmail = gitEmail || '';

  const lines = [];
  lines.push(`# PlanSpec for ${changeId}`);
  lines.push('');
  lines.push(`change_id: ${changeId}`);

  if (!description) {
    lines.push('description: ""');
  } else {
    lines.push('description: |-');
    description.split(/\r?\n/).forEach((line) => {
      lines.push(`  ${line}`);
    });
  }

  lines.push(`created_at: ${nowUtcIso()}`);
  lines.push('');
  lines.push('# user');
  lines.push(`git_user_name: ${formatYamlScalar(gitName)}`);
  lines.push(`git_user_email: ${formatYamlScalar(gitEmail)}`);
  lines.push(`lark_email: ${formatYamlScalar(larkEmail)}`);
  lines.push('');
  lines.push('status: in_progress');
  lines.push('');
  lines.push('# quick mode: no proposal/design/tasks files');
  lines.push('');

  fs.writeFileSync(outPath, lines.join('\n'));
}

function main() {
  const { flags, positionals } = parseArgs(process.argv.slice(2));
  if (flags.h || flags.help) {
    printUsage();
    return;
  }

  let description = flags.desc || process.env.DESCRIPTION || '';

  if (!description && positionals.length > 0) {
    description = positionals[0];
  }

  description = normalizeDescription(description);

  // 生成 change-id (格式: change-{YYYYMMDD}-{HHMM}-quick)
  const baseId = formatChangeIdNow(); // 格式: change-YYYYMMDD-HHMM
  const changeId = `${baseId}-quick`;

  requireGit();
  const projectRoot = getProjectRoot();
  const changeDirPath = changeDir(projectRoot, changeId);
  const planspecPath = path.join(changeDirPath, 'planspec.yaml');

  // 创建 change 目录
  fs.mkdirSync(changeDirPath, { recursive: true });

  // 创建 logger
  const logger = createRunLogger({
    changeId,
    changeDir: changeDirPath,
    script: path.basename(__filename),
    argv: process.argv.slice(2),
  });
  registerRunLogger(logger);

  // 检查 planspec 是否已存在
  if (fs.existsSync(planspecPath)) {
    die(`planspec already exists: ${planspecPath}`);
  }

  // 获取 git identity (用于 lark_email)
  const gitIdentity = getGitIdentity(projectRoot);

  // 初始化 planspec.yaml (quick 简化版，不包含 proposal/design/tasks)
  initQuickPlanspec(changeId, description, planspecPath, {
    gitIdentity,
  });

  // 输出结果
  console.log(`change-id: ${changeId}`);
  console.log(`change-dir: ${changeDirPath}`);
  console.log(`planspec: ${planspecPath}`);
  console.log(`status: in_progress`);
  console.log(`lark_email: ${gitIdentity.email}`);

  logger.finishOk({
    change_id: changeId,
    change_dir: changeDirPath,
    planspec: planspecPath,
    lark_email: gitIdentity.email,
  });
}

main();
