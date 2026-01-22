#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs, isTruthyFlag } = require('./lib/cli');
const { die } = require('./lib/errors');
const { requireGit, getProjectRoot } = require('./lib/git');
const { changeDir } = require('./lib/paths');
const { readPlanspec } = require('./lib/planspec');
const { sendMessage } = require('./lib/lark/message');
const { createRunLogger, registerRunLogger } = require('./lib/runlog');

function printUsage() {
  console.log(
    [
      'usage: repo-plan-send.js --change-id <id> [options]',
      '',
      'options:',
      '  --receive-id <id>          Receiver id (email/open_id/etc)',
      '  --receive-id-type <type>   email|open_id|user_id|union_id|chat_id (default: email)',
      '  --msg-type <type>          text|post (default: post)',
      '  --title <text>             Post title (default: Repo Plan Summary: <change-id>)',
      '  --next-step <text>         Override next step (default: /bytecoding:apply <change-id>)',
      '  --dry-run                  Print command without sending',
      '  --verbose                  Verbose lark-cli output',
    ].join('\n')
  );
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    die(`required file not found: ${filePath}`);
  }
}

function formatDocLine(label, doc) {
  if (doc && doc.url) {
    return `- ${label}: [${doc.url}](${doc.url})`;
  }
  if (doc && doc.doc_id) {
    return `- ${label}: ${doc.doc_id}`;
  }
  return `- ${label}: N/A`;
}

function buildMarkdown(summary) {
  const lines = [];
  lines.push(`**Change ID**: ${summary.changeId}`);
  if (summary.description) {
    lines.push('');
    lines.push('**Description**:');
    lines.push(summary.description.trim());
  }
  lines.push('');
  lines.push('**Artifacts**:');
  lines.push(formatDocLine('proposal', summary.larkDocs.proposal));
  lines.push(formatDocLine('design', summary.larkDocs.design));
  lines.push(formatDocLine('tasks', summary.larkDocs.tasks));
  lines.push('');
  lines.push('**Next Step**:');
  lines.push(`- ${summary.nextStep}`);
  return lines.join('\n');
}

function buildText(summary) {
  const lines = [];
  lines.push(`Change ID: ${summary.changeId}`);
  if (summary.description) {
    lines.push('Description:');
    lines.push(summary.description.trim());
  }
  lines.push('Artifacts:');
  lines.push(formatDocLine('proposal', summary.larkDocs.proposal));
  lines.push(formatDocLine('design', summary.larkDocs.design));
  lines.push(formatDocLine('tasks', summary.larkDocs.tasks));
  lines.push('Next Step:');
  lines.push(summary.nextStep);
  return lines.join('\n');
}

function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  if (flags.h || flags.help) {
    printUsage();
    return;
  }

  const changeId = flags['change-id'] || process.env.CHANGE_ID;
  if (!changeId) {
    die('missing --change-id');
  }

  requireGit();
  const projectRoot = getProjectRoot();
  const changeDirPath = changeDir(projectRoot, changeId);
  const planspecPath = path.join(changeDirPath, 'planspec.yaml');
  ensureFile(planspecPath);

  const logger = createRunLogger({
    changeId,
    changeDir: changeDirPath,
    script: path.basename(__filename),
    argv: process.argv.slice(2),
  });
  registerRunLogger(logger);

  const planspec = readPlanspec(planspecPath);
  const receiveIdType = flags['receive-id-type'] || 'email';
  const receiveId = flags['receive-id'] || planspec.lark_email || '';
  if (!receiveId) {
    die('missing receiver id; use --receive-id or set lark_email in planspec');
  }

  const msgType = flags['msg-type'] || 'post';
  if (!['post', 'text'].includes(msgType)) {
    die(`unsupported msg-type: ${msgType}`);
  }

  const nextStep = flags['next-step'] || `/bytecoding:apply ${changeId}`;
  const summary = {
    changeId,
    description: planspec.description || '',
    larkDocs: planspec.lark_docs || {},
    nextStep,
  };

  const title = flags.title || `Repo Plan Summary: ${changeId}`;
  const text = msgType === 'post' ? buildMarkdown(summary) : buildText(summary);

  sendMessage({
    receiveId,
    receiveIdType,
    msgType,
    title,
    text,
    dryRun: isTruthyFlag(flags['dry-run']),
    verbose: isTruthyFlag(flags.verbose),
  });

  logger.finishOk({
    change_id: changeId,
    receive_id_type: receiveIdType,
    receive_id: receiveId,
    msg_type: msgType,
  });
}

main();
