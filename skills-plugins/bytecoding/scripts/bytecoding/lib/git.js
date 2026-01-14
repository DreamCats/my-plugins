'use strict';

const { execFileSync } = require('child_process');
const { die } = require('./errors');

function execGit(args, options = {}) {
  const execOptions = {
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    cwd: options.cwd,
  };

  try {
    const output = execFileSync('git', args, execOptions);
    if (typeof output === 'string') {
      return output.trimEnd();
    }
    return '';
  } catch (error) {
    if (options.allowFailure) {
      return '';
    }
    throw error;
  }
}

function requireGit() {
  try {
    execGit(['rev-parse', '--is-inside-work-tree'], { stdio: ['ignore', 'ignore', 'ignore'] });
  } catch (error) {
    die('not inside a git repository');
  }
}

function getProjectRoot() {
  try {
    return execGit(['rev-parse', '--show-toplevel']);
  } catch (error) {
    die('unable to resolve git project root');
  }
}

function hasBranch(branchName) {
  try {
    execGit(['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch (error) {
    return false;
  }
}

function listWorktreesPorcelain() {
  return execGit(['worktree', 'list', '--porcelain']);
}

module.exports = {
  execGit,
  requireGit,
  getProjectRoot,
  hasBranch,
  listWorktreesPorcelain,
};
