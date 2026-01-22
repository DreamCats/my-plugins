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
      'usage: repo-apply-lark.js --change-id <id> [options]',
      '',
      'options:',
      '  --receive-id <id>          Receiver id (email/open_id/etc)',
      '  --receive-id-type <type>   email|open_id|user_id|union_id|chat_id (default: email)',
      '  --msg-type <type>          text|post (default: post)',
      '  --title <text>             Post title (default: Repo Apply Summary: <change-id>)',
      '  --verify <text>            Verification line (repeatable)',
      '  --verify-file <path>       File with verification lines',
      '  --dry-run                  Print command without sending',
    ].join('\n')
  );
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    die(`required file not found: ${filePath}`);
  }
}

function readVerifyLines(flags) {
  const lines = [];
  const verifyFlag = flags.verify;
  if (verifyFlag) {
    if (Array.isArray(verifyFlag)) {
      lines.push(...verifyFlag);
    } else {
      lines.push(verifyFlag);
    }
  }

  const verifyFile = flags['verify-file'];
  if (verifyFile) {
    const content = fs.readFileSync(verifyFile, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      if (line.trim()) {
        lines.push(line.trim());
      }
    });
  }

  return lines.map((line) => line.trim()).filter(Boolean);
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
  lines.push('');
  lines.push('**Artifacts**:');
  lines.push(formatDocLine('proposal', summary.larkDocs.proposal));
  lines.push(formatDocLine('design', summary.larkDocs.design));
  lines.push(formatDocLine('tasks', summary.larkDocs.tasks));
  lines.push('');
  lines.push('**MR**:');
  if (summary.mrUrl) {
    lines.push(`- [${summary.mrUrl}](${summary.mrUrl})`);
  } else {
    lines.push('- not found');
  }
  lines.push('');
  lines.push('**Verification**:');
  if (summary.verifications.length) {
    summary.verifications.forEach((line) => {
      lines.push(`- ${line}`);
    });
  } else {
    lines.push('- not provided');
  }
  return lines.join('\n');
}

function buildText(summary) {
  const lines = [];
  lines.push(`Change ID: ${summary.changeId}`);
  lines.push('Artifacts:');
  lines.push(formatDocLine('proposal', summary.larkDocs.proposal));
  lines.push(formatDocLine('design', summary.larkDocs.design));
  lines.push(formatDocLine('tasks', summary.larkDocs.tasks));
  lines.push('MR:');
  lines.push(summary.mrUrl || 'not found');
  lines.push('Verification:');
  if (summary.verifications.length) {
    summary.verifications.forEach((line) => {
      lines.push(`- ${line}`);
    });
  } else {
    lines.push('- not provided');
  }
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

  const verifications = readVerifyLines(flags);
  const summary = {
    changeId,
    larkDocs: planspec.lark_docs || {},
    mrUrl: planspec.mr_url || '',
    verifications,
  };

  const msgType = flags['msg-type'] || 'post';
  if (!['post', 'text'].includes(msgType)) {
    die(`unsupported msg-type: ${msgType}`);
  }
  const title = flags.title || `Repo Apply Summary: ${changeId}`;
  const markdown = msgType === 'post' ? buildMarkdown(summary) : buildText(summary);
  const dryRun = isTruthyFlag(flags['dry-run']);

  sendMessage({
    receiveId,
    receiveIdType,
    msgType,
    title,
    text: markdown,
    dryRun,
  });

  logger.finishOk({
    change_id: changeId,
    receive_id_type: receiveIdType,
    receive_id: receiveId,
    msg_type: msgType,
    verifications: verifications.length,
    mr_url: summary.mrUrl || '',
  });
}

main();
