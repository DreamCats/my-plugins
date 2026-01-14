#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs, isTruthyFlag } = require('./lib/cli');
const { die } = require('./lib/errors');
const { execGit, requireGit, getProjectRoot, hasBranch } = require('./lib/git');
const { changeDir, archiveRoot } = require('./lib/paths');
const { appendField, readStatus, updateStatus } = require('./lib/planspec');
const { nowUtcIso } = require('./lib/time');
const { findWorktreeByBranch } = require('./lib/worktree');

function printUsage() {
  console.log('usage: repo-archive.js --change-id <id> [--force]');
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

  const status = readStatus(planspecPath) || 'unknown';
  if (status !== 'completed' && !forceArchive) {
    die(`status is '${status}', use --force to archive anyway`);
  }

  fs.mkdirSync(archiveRootPath, { recursive: true });

  if (fs.existsSync(archiveDirPath)) {
    die(`archive already exists: ${archiveDirPath}`);
  }

  fs.renameSync(changeDirPath, archiveDirPath);
  updateStatus(path.join(archiveDirPath, 'planspec.yaml'), 'archived');
  appendField(path.join(archiveDirPath, 'planspec.yaml'), 'archived_at', nowUtcIso());

  const worktreePath = findWorktreeByBranch(branchName);
  if (worktreePath) {
    execGit(['worktree', 'remove', worktreePath], { stdio: 'inherit', allowFailure: true });
  }

  if (hasBranch(branchName)) {
    execGit(['branch', '-d', branchName], { stdio: 'inherit', allowFailure: true });
  }

  console.log(`change-id: ${changeId}`);
  console.log(`archive-dir: ${archiveDirPath}`);
  console.log(`branch: ${branchName}`);
}

main();
