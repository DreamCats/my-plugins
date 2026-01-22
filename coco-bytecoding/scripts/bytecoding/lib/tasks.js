'use strict';

const fs = require('fs');
const { nowUtcIso } = require('./time');

const TASK_HEADING_RE = /^#{3,4}\s+(?:\[(\d+(?:\.\d+)*)\]|(\d+(?:\.\d+)*))\s+(.+)$/;

function normalizeTitle(title) {
  const trimmed = title.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

// Parse tasks from markdown headings, matching the writing-plans output style.
function parseTasksFromMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tasks = [];
  const seenIds = new Set();

  lines.forEach((line, index) => {
    const match = line.match(TASK_HEADING_RE);
    if (!match) {
      return;
    }

    const id = match[1] || match[2];
    const title = normalizeTitle(match[3]);

    if (!id || seenIds.has(id)) {
      return;
    }

    seenIds.add(id);
    tasks.push({
      id,
      title,
      source_line: index + 1,
    });
  });

  return tasks;
}

function computeStats(tasks) {
  const stats = {
    total: tasks.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
  };

  tasks.forEach((task) => {
    if (task.status === 'completed') {
      stats.completed += 1;
    } else if (task.status === 'in_progress') {
      stats.in_progress += 1;
    } else {
      stats.pending += 1;
    }
  });

  return stats;
}

function loadTaskState(statePath) {
  if (!fs.existsSync(statePath)) {
    return null;
  }
  const raw = fs.readFileSync(statePath, 'utf8');
  return JSON.parse(raw);
}

function mergeTaskState(changeId, tasks, previousState) {
  const prevById = new Map();
  if (previousState && Array.isArray(previousState.tasks)) {
    previousState.tasks.forEach((task) => {
      prevById.set(task.id, task);
    });
  }

  const nextTasks = tasks.map((task) => {
    const prev = prevById.get(task.id);
    return {
      id: task.id,
      title: task.title,
      source_line: task.source_line,
      status: prev?.status || 'pending',
      started_at: prev?.started_at || null,
      completed_at: prev?.completed_at || null,
    };
  });

  const removedTasks = [];
  if (previousState && Array.isArray(previousState.tasks)) {
    previousState.tasks.forEach((task) => {
      if (!tasks.find((current) => current.id === task.id)) {
        removedTasks.push({
          id: task.id,
          title: task.title,
          status: task.status,
          removed_at: nowUtcIso(),
        });
      }
    });
  }

  return {
    change_id: changeId,
    updated_at: nowUtcIso(),
    tasks: nextTasks,
    removed_tasks: removedTasks,
    stats: computeStats(nextTasks),
  };
}

function updateTaskStatus(state, taskId, status) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return null;
  }

  const now = nowUtcIso();
  task.status = status;
  if (status === 'pending') {
    task.started_at = null;
    task.completed_at = null;
  } else if (status === 'in_progress') {
    if (!task.started_at) {
      task.started_at = now;
    }
    task.completed_at = null;
  } else if (status === 'completed') {
    if (!task.started_at) {
      task.started_at = now;
    }
    task.completed_at = now;
  }

  state.updated_at = now;
  state.stats = computeStats(state.tasks);
  return task;
}

function writeTaskState(statePath, state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

module.exports = {
  parseTasksFromMarkdown,
  loadTaskState,
  mergeTaskState,
  updateTaskStatus,
  writeTaskState,
  computeStats,
};
