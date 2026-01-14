#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./lib/cli');
const { die } = require('./lib/errors');
const { requireGit, getProjectRoot, getGitIdentity } = require('./lib/git');
const { changeDir } = require('./lib/paths');
const { initPlanspec } = require('./lib/planspec');
const { formatChangeIdNow, formatLocalDate } = require('./lib/time');
const { createRunLogger, registerRunLogger } = require('./lib/runlog');
const {
  buildProposalTemplate,
  buildDesignTemplate,
  buildTasksTemplate,
} = require('./lib/templates');

function printUsage() {
  console.log('usage: repo-plan.js [--change-id <id>] [--desc <description>]');
}

function normalizeTitle(value, fallback) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.replace(/\s+/g, ' ');
}

function writeTemplateIfMissing(filePath, content) {
  if (fs.existsSync(filePath)) {
    return false;
  }
  fs.writeFileSync(filePath, content);
  return true;
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
  const proposalPath = path.join(changeDirPath, 'proposal.md');
  const designPath = path.join(changeDirPath, 'design.md');
  const tasksPath = path.join(changeDirPath, 'tasks.md');

  fs.mkdirSync(changeDirPath, { recursive: true });
  const logger = createRunLogger({
    changeId,
    changeDir: changeDirPath,
    script: path.basename(__filename),
    argv: process.argv.slice(2),
  });
  registerRunLogger(logger);

  if (fs.existsSync(planspecPath)) {
    die(`planspec already exists: ${planspecPath}`);
  }

  const gitIdentity = getGitIdentity(projectRoot);
  initPlanspec(changeId, description, planspecPath, { gitIdentity });

  const title = normalizeTitle(description, changeId);
  const createdDate = formatLocalDate();
  const templates = [
    {
      label: 'proposal',
      path: proposalPath,
      content: buildProposalTemplate(title),
    },
    {
      label: 'design',
      path: designPath,
      content: buildDesignTemplate(title),
    },
    {
      label: 'tasks',
      path: tasksPath,
      content: buildTasksTemplate(title, changeId, createdDate),
    },
  ];

  templates.forEach((template) => {
    const created = writeTemplateIfMissing(template.path, template.content);
    if (!created) {
      console.error(`note: ${template.label} already exists, leaving unchanged.`);
    }
  });

  console.log(`change-id: ${changeId}`);
  console.log(`change-dir: ${changeDirPath}`);
  console.log(`planspec: ${planspecPath}`);
  console.log(`proposal: ${proposalPath}`);
  console.log(`design: ${designPath}`);
  console.log(`tasks: ${tasksPath}`);
  console.log('status: pending');

  logger.finishOk({
    change_id: changeId,
    change_dir: changeDirPath,
    planspec: planspecPath,
    proposal: proposalPath,
    design: designPath,
    tasks: tasksPath,
  });
}

main();
