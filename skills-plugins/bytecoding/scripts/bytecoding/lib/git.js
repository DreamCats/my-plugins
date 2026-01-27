'use strict';

const { execFileSync } = require('child_process');

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
    console.error('error: not inside a git repository');
    process.exit(1);
  }
}

function getProjectRoot() {
  try {
    return execGit(['rev-parse', '--show-toplevel']);
  } catch (error) {
    console.error('error: unable to resolve git project root');
    process.exit(1);
  }
}

function readGitConfig(args, cwd) {
  const output = execGit(['config', ...args], { cwd, allowFailure: true });
  const trimmed = output.trim();
  return trimmed ? trimmed : null;
}

function getGitIdentity(projectRoot) {
  if (!projectRoot) {
    return { name: null, email: null };
  }

  const localEmail = readGitConfig(['user.email'], projectRoot);
  const localName = readGitConfig(['user.name'], projectRoot);
  if (localEmail || localName) {
    return { name: localName, email: localEmail };
  }

  const globalEmail = readGitConfig(['--global', 'user.email'], projectRoot);
  const globalName = readGitConfig(['--global', 'user.name'], projectRoot);
  if (globalEmail || globalName) {
    return { name: globalName, email: globalEmail };
  }

  return { name: null, email: null };
}

module.exports = {
  execGit,
  requireGit,
  getProjectRoot,
  getGitIdentity,
};
