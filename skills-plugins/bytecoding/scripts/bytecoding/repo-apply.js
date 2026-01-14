#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs, isTruthyFlag } = require('./lib/cli');
const { die } = require('./lib/errors');
const { execGit, requireGit, getProjectRoot, hasBranch } = require('./lib/git');
const { changeDir } = require('./lib/paths');
const { appendField, updateStatus } = require('./lib/planspec');
const { nowUtcIso } = require('./lib/time');
const {
  parseTasksFromMarkdown,
  loadTaskState,
  mergeTaskState,
  updateTaskStatus,
  writeTaskState,
} = require('./lib/tasks');

function printUsage() {
  console.log('usage: repo-apply.js --change-id <id> [--worktree-dir <path>] [--mark-completed]');
  console.log('       repo-apply.js --change-id <id> [--task-start <id> | --task-done <id> | --task-reset <id> | --task-status]');
}

function syncTaskState(changeId, tasksPath, statePath) {
  const markdown = fs.readFileSync(tasksPath, 'utf8');
  const tasks = parseTasksFromMarkdown(markdown);
  const previous = loadTaskState(statePath);
  const nextState = mergeTaskState(changeId, tasks, previous);
  writeTaskState(statePath, nextState);

  return { state: nextState, tasksFound: tasks.length };
}

function printTaskSummary(state, statePath) {
  console.log(`tasks-state: ${statePath}`);
  console.log(`tasks-total: ${state.stats.total}`);
  console.log(`tasks-pending: ${state.stats.pending}`);
  console.log(`tasks-in-progress: ${state.stats.in_progress}`);
  console.log(`tasks-completed: ${state.stats.completed}`);
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

  const worktreeDirFlag = flags['worktree-dir'] || process.env.WORKTREE_DIR || '';
  const markCompleted = isTruthyFlag(flags['mark-completed']);

  const taskStartId = flags['task-start'];
  const taskDoneId = flags['task-done'];
  const taskResetId = flags['task-reset'];
  const taskStatusOnly = isTruthyFlag(flags['task-status']);

  requireGit();
  const projectRoot = getProjectRoot();
  const changeDirPath = changeDir(projectRoot, changeId);
  const planspecPath = path.join(changeDirPath, 'planspec.yaml');
  const tasksPath = path.join(changeDirPath, 'tasks.md');
  const taskStatePath = path.join(changeDirPath, 'tasks.state.json');

  if (!fs.existsSync(changeDirPath)) {
    die(`change dir not found: ${changeDirPath}`);
  }
  if (!fs.existsSync(planspecPath)) {
    die(`planspec not found: ${planspecPath}`);
  }

  const requiredFiles = ['proposal.md', 'design.md', 'tasks.md', 'planspec.yaml'];
  requiredFiles.forEach((file) => {
    const fullPath = path.join(changeDirPath, file);
    if (!fs.existsSync(fullPath)) {
      die(`missing required file: ${file}`);
    }
  });

  let taskStateResult;
  try {
    taskStateResult = syncTaskState(changeId, tasksPath, taskStatePath);
  } catch (error) {
    die(`failed to sync tasks state: ${error.message}`);
  }

  if (taskStateResult.tasksFound === 0) {
    console.error('warning: no tasks detected in tasks.md; task tracking expects numeric headings like "#### 1.1 ..."');
  }

  if (taskStartId || taskDoneId || taskResetId || taskStatusOnly) {
    const state = taskStateResult.state;
    let updatedTask = null;
    if (taskStartId) {
      updatedTask = updateTaskStatus(state, taskStartId, 'in_progress');
      if (!updatedTask) {
        die(`task not found: ${taskStartId}`);
      }
    }
    if (taskDoneId) {
      updatedTask = updateTaskStatus(state, taskDoneId, 'completed');
      if (!updatedTask) {
        die(`task not found: ${taskDoneId}`);
      }
    }
    if (taskResetId) {
      updatedTask = updateTaskStatus(state, taskResetId, 'pending');
      if (!updatedTask) {
        die(`task not found: ${taskResetId}`);
      }
    }

    writeTaskState(taskStatePath, state);
    if (updatedTask) {
      console.log(`task-id: ${updatedTask.id}`);
      console.log(`task-title: ${updatedTask.title}`);
      console.log(`task-status: ${updatedTask.status}`);
      if (updatedTask.started_at) {
        console.log(`task-started-at: ${updatedTask.started_at}`);
      }
      if (updatedTask.completed_at) {
        console.log(`task-completed-at: ${updatedTask.completed_at}`);
      }
    }

    printTaskSummary(state, taskStatePath);
    return;
  }

  if (markCompleted) {
    updateStatus(planspecPath, 'completed');
    appendField(planspecPath, 'completed_at', nowUtcIso());
    console.log(`change-id: ${changeId}`);
    console.log('status: completed');
    printTaskSummary(taskStateResult.state, taskStatePath);
    return;
  }

  const branchName = `feature-${changeId}`;
  const worktreeDir = worktreeDirFlag
    ? worktreeDirFlag
    : path.join(path.dirname(projectRoot), branchName);

  if (fs.existsSync(worktreeDir)) {
    console.log(`worktree-exists: ${worktreeDir}`);
  } else if (hasBranch(branchName)) {
    execGit(['worktree', 'add', worktreeDir, branchName], { stdio: 'inherit' });
  } else {
    execGit(['worktree', 'add', worktreeDir, '-b', branchName], { stdio: 'inherit' });
  }

  fs.writeFileSync(path.join(changeDirPath, 'worktree.path'), `${worktreeDir}\n`);
  fs.writeFileSync(path.join(changeDirPath, 'worktree.branch'), `${branchName}\n`);

  console.log(`change-id: ${changeId}`);
  console.log(`worktree: ${worktreeDir}`);
  console.log(`branch: ${branchName}`);
  printTaskSummary(taskStateResult.state, taskStatePath);
}

main();
