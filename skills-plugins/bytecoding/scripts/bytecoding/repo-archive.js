#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs, isTruthyFlag } = require('./lib/cli');
const { die } = require('./lib/errors');
const { execGit, requireGit, getProjectRoot, hasBranch } = require('./lib/git');
const { changeDir, archiveRoot } = require('./lib/paths');
const { appendField, readStatus, updateStatus, readPlanspec } = require('./lib/planspec');
const { nowUtcIso } = require('./lib/time');
const { findWorktreeByBranch } = require('./lib/worktree');
const { execFileSync } = require('child_process');
const { createRunLogger, registerRunLogger } = require('./lib/runlog');

function printUsage() {
  console.log(
    [
      'usage: repo-archive.js --change-id <id> [options]',
      '',
      'options:',
      '  --force                    Archive even if status is not completed',
      '  --verify <text>            Verification line (repeatable)',
      '  --verify-file <path>       File with verification lines',
      '  --receive-id <id>          Lark receiver id (default: planspec lark_email)',
      '  --receive-id-type <type>   email|open_id|user_id|union_id|chat_id (default: email)',
      '  --msg-type <type>          text|post (default: post)',
      '  --title <text>             Lark post title override',
      '  --no-lark                  Skip sending Lark message',
      '  --dry-run                  Print actions without sending',
    ].join('\n')
  );
}

function resolveDefaultBranch() {
  const remoteHead = execGit(['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'], {
    allowFailure: true,
  });
  if (remoteHead) {
    return remoteHead.replace('refs/remotes/', '').trim();
  }
  if (hasBranch('main')) {
    return 'main';
  }
  if (hasBranch('master')) {
    return 'master';
  }
  return '';
}

function collectCommits(branchName) {
  if (!hasBranch(branchName)) {
    return [];
  }
  const baseRef = resolveDefaultBranch();
  let range = branchName;
  if (baseRef) {
    const mergeBase = execGit(['merge-base', baseRef, branchName], { allowFailure: true });
    if (mergeBase) {
      range = `${mergeBase.trim()}..${branchName}`;
    }
  }
  const output = execGit(['log', '--pretty=format:%h %s', '--reverse', range], { allowFailure: true });
  if (!output) {
    return [];
  }
  return output.split(/\r?\n/).filter(Boolean);
}

function readVerificationLines(flags, changeDirPath) {
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

  if (!lines.length) {
    const fallbackFiles = ['verification.md', 'verification.txt', 'verification.log'];
    fallbackFiles.forEach((fileName) => {
      if (lines.length) {
        return;
      }
      const filePath = path.join(changeDirPath, fileName);
      if (!fs.existsSync(filePath)) {
        return;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return;
        }
        lines.push(trimmed);
      });
    });
  }

  return lines.map((line) => line.trim()).filter(Boolean);
}

function extractDescription(planspecPath, proposalPath) {
  const lines = fs.readFileSync(planspecPath, 'utf8').split(/\r?\n/);
  let description = '';
  let inBlock = false;

  lines.forEach((line) => {
    if (description) {
      return;
    }
    if (!inBlock) {
      if (line.startsWith('description:')) {
        const rest = line.slice('description:'.length).trim();
        if (rest === '|-' || rest === '|') {
          inBlock = true;
          return;
        }
        if (rest) {
          description = rest === '""' ? '' : rest.replace(/^"|"$/g, '');
        }
      }
      return;
    }

    if (inBlock) {
      if (line.startsWith('  ')) {
        const trimmed = line.trim();
        if (trimmed) {
          description = trimmed;
        }
        return;
      }
      inBlock = false;
    }
  });

  if (description) {
    return description;
  }

  if (fs.existsSync(proposalPath)) {
    const proposalLines = fs.readFileSync(proposalPath, 'utf8').split(/\r?\n/);
    for (let i = 0; i < proposalLines.length; i += 1) {
      const trimmed = proposalLines[i].trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      return trimmed;
    }
  }

  return '';
}

function formatList(lines) {
  if (!lines.length) {
    return ['- not recorded'];
  }
  return lines.map((line) => (line.startsWith('-') ? line : `- ${line}`));
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

function buildArchiveSummary(data) {
  const lines = [];
  lines.push(`# Archive Summary: ${data.changeId}`);
  lines.push('');
  lines.push('## Change Summary');
  lines.push(`- Description: ${data.description || data.changeId}`);
  lines.push(`- Archived At: ${data.archivedAt}`);
  lines.push(`- Status: archived`);
  lines.push(`- MR: ${data.mrUrl || 'not found'}`);
  lines.push('');
  lines.push('## Artifacts');
  lines.push(formatDocLine('proposal', data.larkDocs.proposal));
  lines.push(formatDocLine('design', data.larkDocs.design));
  lines.push(formatDocLine('tasks', data.larkDocs.tasks));
  lines.push('');
  lines.push('## Commits');
  if (data.commits.length) {
    data.commits.forEach((line) => lines.push(`- ${line}`));
  } else {
    lines.push('- not found');
  }
  lines.push('');
  lines.push('## Verification');
  formatList(data.verifications).forEach((line) => lines.push(line));
  lines.push('');
  return lines.join('\n');
}

function buildLarkMarkdown(data) {
  const lines = [];
  lines.push(`**Change ID**: ${data.changeId}`);
  lines.push('');
  lines.push(`**Archived At**: ${data.archivedAt}`);
  lines.push('');
  lines.push('**Summary**:');
  lines.push(`- ${data.description || data.changeId}`);
  lines.push('');
  lines.push('**Artifacts**:');
  lines.push(formatDocLine('proposal', data.larkDocs.proposal));
  lines.push(formatDocLine('design', data.larkDocs.design));
  lines.push(formatDocLine('tasks', data.larkDocs.tasks));
  lines.push('');
  lines.push('**MR**:');
  if (data.mrUrl) {
    lines.push(`- [${data.mrUrl}](${data.mrUrl})`);
  } else {
    lines.push('- not found');
  }
  lines.push('');
  lines.push('**Verification**:');
  formatList(data.verifications).forEach((line) => lines.push(line));
  lines.push('');
  lines.push('**Commits**:');
  if (data.commits.length) {
    data.commits.slice(0, 20).forEach((line) => lines.push(`- ${line}`));
  } else {
    lines.push('- not found');
  }
  return lines.join('\n');
}

function sendLarkMessage(receiveId, receiveIdType, msgType, title, markdown, dryRun) {
  const content =
    msgType === 'post'
      ? {
          zh_cn: {
            title,
            content: [[{ tag: 'md', text: markdown }]],
          },
        }
      : { text: markdown };

  const payload = JSON.stringify(content);
  const args = [
    'send-message',
    '--receive-id-type',
    receiveIdType,
    '--msg-type',
    msgType,
    receiveId,
    payload,
  ];

  if (dryRun) {
    console.log(`dry-run: lark-cli ${args.join(' ')}`);
    return;
  }

  execFileSync('lark-cli', args, { stdio: 'inherit' });
}

function main() {
  const { flags, positionals } = parseArgs(process.argv.slice(2));
  if (flags.h || flags.help) {
    printUsage();
    return;
  }

  const changeId = flags['change-id'] || process.env.CHANGE_ID || positionals[0];
  if (!changeId) {
    die('missing change-id');
  }

  const forceArchive = isTruthyFlag(flags.force);
  const noLark = isTruthyFlag(flags['no-lark']);
  const dryRun = isTruthyFlag(flags['dry-run']);

  requireGit();
  const projectRoot = getProjectRoot();
  const changeDirPath = changeDir(projectRoot, changeId);
  const planspecPath = path.join(changeDirPath, 'planspec.yaml');
  const archiveRootPath = archiveRoot(projectRoot);
  const archiveDirPath = path.join(archiveRootPath, changeId);
  const branchName = `feature-${changeId}`;

  if (!fs.existsSync(changeDirPath)) {
    die(`change dir not found: ${changeDirPath}`);
  }
  if (!fs.existsSync(planspecPath)) {
    die(`planspec not found: ${planspecPath}`);
  }

  const logger = createRunLogger({
    changeId,
    changeDir: changeDirPath,
    script: path.basename(__filename),
    argv: process.argv.slice(2),
  });
  registerRunLogger(logger);

  const status = readStatus(planspecPath) || 'unknown';
  if (status !== 'completed' && !forceArchive) {
    die(`status is '${status}', use --force to archive anyway`);
  }

  const planspec = readPlanspec(planspecPath);
  const proposalPath = path.join(changeDirPath, 'proposal.md');
  const description = extractDescription(planspecPath, proposalPath);
  const verifications = readVerificationLines(flags, changeDirPath);
  const commits = collectCommits(branchName);
  const archivedAt = nowUtcIso();

  fs.mkdirSync(archiveRootPath, { recursive: true });

  if (fs.existsSync(archiveDirPath)) {
    die(`archive already exists: ${archiveDirPath}`);
  }

  if (!dryRun) {
    fs.renameSync(changeDirPath, archiveDirPath);
    updateStatus(path.join(archiveDirPath, 'planspec.yaml'), 'archived');
    appendField(path.join(archiveDirPath, 'planspec.yaml'), 'archived_at', archivedAt);
    logger.setChangeDir(archiveDirPath);
  }

  const archiveSummaryPath = path.join(archiveDirPath, 'archive-summary.md');
  const summaryContent = buildArchiveSummary({
    changeId,
    description,
    archivedAt,
    mrUrl: planspec.mr_url || '',
    larkDocs: planspec.lark_docs || {},
    commits,
    verifications,
  });

  if (dryRun) {
    console.log(`dry-run: write ${archiveSummaryPath}`);
  } else {
    fs.writeFileSync(archiveSummaryPath, summaryContent);
  }

  if (!dryRun) {
    const worktreePath = findWorktreeByBranch(branchName);
    if (worktreePath) {
      execGit(['worktree', 'remove', worktreePath], { stdio: 'inherit', allowFailure: true });
    }

    if (hasBranch(branchName)) {
      execGit(['branch', '-d', branchName], { stdio: 'inherit', allowFailure: true });
    }
  }

  if (!noLark) {
    const receiveIdType = flags['receive-id-type'] || 'email';
    const receiveId = flags['receive-id'] || planspec.lark_email || '';
    if (!receiveId) {
      die('missing lark receiver id; use --receive-id or set lark_email in planspec');
    }
    const msgType = flags['msg-type'] || 'post';
    if (!['post', 'text'].includes(msgType)) {
      die(`unsupported msg-type: ${msgType}`);
    }
    const title = flags.title || `Repo Archive Summary: ${changeId}`;
    const markdown = buildLarkMarkdown({
      changeId,
      description,
      archivedAt,
      mrUrl: planspec.mr_url || '',
      larkDocs: planspec.lark_docs || {},
      commits,
      verifications,
    });
    sendLarkMessage(receiveId, receiveIdType, msgType, title, markdown, dryRun);
  }

  console.log(`change-id: ${changeId}`);
  console.log(`archive-dir: ${archiveDirPath}`);
  console.log(`archive-summary: ${archiveSummaryPath}`);
  console.log(`branch: ${branchName}`);

  logger.finishOk({
    change_id: changeId,
    archive_dir: archiveDirPath,
    archive_summary: archiveSummaryPath,
    commits: commits.length,
    verifications: verifications.length,
    mr_url: planspec.mr_url || '',
    lark_sent: !noLark && !dryRun,
  });
}

main();
