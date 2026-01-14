'use strict';

const { listWorktreesPorcelain } = require('./git');

// Find an existing worktree path by branch name.
function findWorktreeByBranch(branchName) {
  const target = `refs/heads/${branchName}`;
  const lines = listWorktreesPorcelain().split(/\r?\n/);
  let currentPath = '';

  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      currentPath = line.slice('worktree '.length).trim();
      continue;
    }
    if (line.startsWith('branch ')) {
      const branchRef = line.slice('branch '.length).trim();
      if (branchRef === target) {
        return currentPath;
      }
    }
  }

  return '';
}

module.exports = {
  findWorktreeByBranch,
};
