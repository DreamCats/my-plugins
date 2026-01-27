#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./lib/cli');
const { requireGit, getProjectRoot, getGitIdentity } = require('./lib/git');
const { formatChangeIdNow, nowUtcIso } = require('./lib/time');

function printUsage() {
  console.log('usage: plan.js --desc <description>');
  console.log('');
  console.log('Creates a new change directory with planspec.yaml and tasks.md template.');
}

function normalizeDescription(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    console.error('error: description is required (use --desc)');
    process.exit(1);
  }
  return trimmed.replace(/\s+/g, ' ');
}

function formatYamlScalar(value) {
  if (value === null || value === undefined || value === '') {
    return '""';
  }
  return JSON.stringify(value);
}

function createPlanspec(changeId, description, outPath, options = {}) {
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
  lines.push('status: pending');
  lines.push('');

  fs.writeFileSync(outPath, lines.join('\n'));
}

function createTasksTemplate(description, outPath) {
  const lines = [];
  lines.push(`# 任务列表：${description}`);
  lines.push('');
  lines.push('## 概述');
  lines.push('[由 /plan 命令的搜索分析步骤填充]');
  lines.push('');
  lines.push('## 涉及文件');
  lines.push('- [待分析]');
  lines.push('');
  lines.push('## 任务');
  lines.push('');
  lines.push('### Task 1: [任务标题]');
  lines.push('- **文件**: path/to/file');
  lines.push('- **内容**: [具体做什么]');
  lines.push('- **验证**: [如何验证完成]');
  lines.push('');
  lines.push('## 验证标准');
  lines.push('- [ ] 编译通过');
  lines.push('- [ ] 代码格式检查通过');
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

  const changeId = formatChangeIdNow();

  requireGit();
  const projectRoot = getProjectRoot();
  const changeDirPath = path.join(projectRoot, '.bytecoding', 'changes', changeId);
  const planspecPath = path.join(changeDirPath, 'planspec.yaml');
  const tasksPath = path.join(changeDirPath, 'tasks.md');

  // Create change directory
  fs.mkdirSync(changeDirPath, { recursive: true });

  // Check if planspec already exists
  if (fs.existsSync(planspecPath)) {
    console.error(`error: planspec already exists: ${planspecPath}`);
    process.exit(1);
  }

  // Get git identity for lark_email
  const gitIdentity = getGitIdentity(projectRoot);

  // Create planspec.yaml
  createPlanspec(changeId, description, planspecPath, { gitIdentity });

  // Create tasks.md template
  createTasksTemplate(description, tasksPath);

  // Output results
  console.log(`change-id: ${changeId}`);
  console.log(`change-dir: ${changeDirPath}`);
  console.log(`planspec: ${planspecPath}`);
  console.log(`tasks: ${tasksPath}`);
  console.log(`lark_email: ${gitIdentity.email || ''}`);
}

main();
