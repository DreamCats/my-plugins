#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./lib/cli');
const { die } = require('./lib/errors');
const { requireGit, getProjectRoot } = require('./lib/git');
const { changeDir } = require('./lib/paths');
const { initPlanspec } = require('./lib/planspec');
const { formatChangeIdNow } = require('./lib/time');

function printUsage() {
  console.log('usage: repo-plan.js [--change-id <id>] [--desc <description>]');
}

function main() {
  const { flags, positionals } = parseArgs(process.argv.slice(2));
  if (flags.h || flags.help) {
    printUsage();
    return;
  }

  let changeId = flags['change-id'] || process.env.CHANGE_ID || '';
  let description = flags.desc || process.env.DESCRIPTION || '';

  if (!description && positionals.length > 0) {
    description = positionals[0];
  }

  if (!changeId) {
    changeId = formatChangeIdNow();
  }

  requireGit();
  const projectRoot = getProjectRoot();
  const changeDirPath = changeDir(projectRoot, changeId);
  const planspecPath = path.join(changeDirPath, 'planspec.yaml');

  fs.mkdirSync(changeDirPath, { recursive: true });

  if (fs.existsSync(planspecPath)) {
    die(`planspec already exists: ${planspecPath}`);
  }

  initPlanspec(changeId, description, planspecPath);

  console.log(`change-id: ${changeId}`);
  console.log(`change-dir: ${changeDirPath}`);
  console.log(`planspec: ${planspecPath}`);
  console.log('status: pending');
}

main();
