#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { parseArgs, isTruthyFlag } = require('./lib/cli');
const { die } = require('./lib/errors');
const { requireGit, getProjectRoot, execGit, getGitIdentity } = require('./lib/git');
const { changeDir } = require('./lib/paths');
const { upsertField } = require('./lib/planspec');
const { createRunLogger, registerRunLogger } = require('./lib/runlog');

function printUsage() {
  console.log(
    [
      'usage: repo-apply-git.js --change-id <id> --message <subject> --item <text> [--item <text>...]',
      '',
      'options:',
      '  --worktree-dir <path>       Worktree directory (default: .bytecoding/changes/<id>/worktree.path)',
      '  --cwd <path>                Run git commands in this directory',
      '  --add <path>                Stage a specific path (repeatable)',
      '  --no-push                   Skip git push',
      '  --remote <name>             Remote name (default: origin)',
      '  --branch <name>             Push branch name (default: current branch)',
      '  --co-author-name <name>     Override co-author name',
      '  --co-author-email <email>   Override co-author email',
      '  --no-verify                 Pass --no-verify to git commit',
      '  --dry-run                   Print actions without running git',
    ].join('\n')
  );
}

function readWorktreePath(changeDirPath) {
  const worktreePathFile = path.join(changeDirPath, 'worktree.path');
  if (!fs.existsSync(worktreePathFile)) {
    return '';
  }
  return fs.readFileSync(worktreePathFile, 'utf8').trim();
}

function resolveRepoCwd(flags, changeDirPath, projectRoot) {
  if (flags.cwd) {
    return path.resolve(flags.cwd);
  }
  if (flags['worktree-dir']) {
    return path.resolve(flags['worktree-dir']);
  }
  const worktreePath = readWorktreePath(changeDirPath);
  if (worktreePath) {
    return worktreePath;
  }
  return projectRoot;
}

function ensureDirExists(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    die(`${label} not found: ${dirPath}`);
  }
}

function normalizeItem(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('- ')) {
    return trimmed;
  }
  return `- ${trimmed}`;
}

function buildCommitMessage(subject, items, coAuthorLine) {
  const bodyItems = items.map(normalizeItem).filter(Boolean);
  if (!bodyItems.length) {
    die('commit items are required; use --item to provide list entries');
  }

  const lines = [subject.trim(), '', ...bodyItems];

  if (coAuthorLine) {
    lines.push('', coAuthorLine);
  }

  return lines.join('\n') + '\n';
}

function writeTempMessage(message) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bytecoding-commit-'));
  const filePath = path.join(tmpDir, 'message.txt');
  fs.writeFileSync(filePath, message);
  return filePath;
}

function runGit(args, cwd, dryRun) {
  if (dryRun) {
    console.log(`dry-run: git ${args.join(' ')}`);
    return '';
  }
  return execGit(args, { cwd, stdio: 'inherit' });
}

function runGitCapture(args, cwd, dryRun) {
  if (dryRun) {
    console.log(`dry-run: git ${args.join(' ')}`);
    return '';
  }
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
  });
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  if (result.status !== 0) {
    if (stdout) {
      process.stderr.write(stdout);
    }
    if (stderr) {
      process.stderr.write(stderr);
    }
    die(`git ${args[0]} failed`);
  }
  return `${stdout}${stderr ? `\n${stderr}` : ''}`;
}

function extractMrUrl(output) {
  const urls = output.match(/https?:\/\/\S+/g) || [];
  const mrUrl =
    urls.find((url) => /merge_requests|merge-request|merge_request/.test(url)) ||
    urls.find((url) => /pull\/\d+|pull\/new|pullrequest/.test(url)) ||
    urls[0];
  return mrUrl || '';
}

function getCurrentBranch(cwd) {
  const branch = execGit(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  if (!branch || branch === 'HEAD') {
    die('unable to resolve current branch; provide --branch');
  }
  return branch;
}

function formatCoAuthorLine(name, email) {
  if (!email) {
    die('missing co-author email; set git user.email or pass --co-author-email');
  }
  const safeName = name || email.split('@')[0] || email;
  return `Co-Authored-By: ${safeName} <${email}>`;
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

  const subject = flags.message;
  if (!subject) {
    die('missing --message for commit subject');
  }

  const items = [];
  if (flags.item) {
    if (Array.isArray(flags.item)) {
      items.push(...flags.item);
    } else {
      items.push(flags.item);
    }
  }

  if (!items.length) {
    die('missing --item; commit body must be list-style');
  }

  requireGit();
  const projectRoot = getProjectRoot();
  const changeDirPath = changeDir(projectRoot, changeId);
  const planspecPath = path.join(changeDirPath, 'planspec.yaml');

  ensureDirExists(changeDirPath, 'change dir');
  ensureDirExists(planspecPath, 'planspec');

  const logger = createRunLogger({
    changeId,
    changeDir: changeDirPath,
    script: path.basename(__filename),
    argv: process.argv.slice(2),
  });
  registerRunLogger(logger);

  const repoCwd = resolveRepoCwd(flags, changeDirPath, projectRoot);
  ensureDirExists(repoCwd, 'repo cwd');

  const gitIdentity = getGitIdentity(projectRoot);
  const coAuthorName = flags['co-author-name'] || gitIdentity.name || '';
  const coAuthorEmail = flags['co-author-email'] || gitIdentity.email || '';
  const coAuthorLine = formatCoAuthorLine(coAuthorName, coAuthorEmail);

  const commitMessage = buildCommitMessage(subject, items, coAuthorLine);
  const messagePath = writeTempMessage(commitMessage);

  const addPaths = [];
  if (flags.add) {
    if (Array.isArray(flags.add)) {
      addPaths.push(...flags.add);
    } else {
      addPaths.push(flags.add);
    }
  }

  const dryRun = isTruthyFlag(flags['dry-run']);

  if (addPaths.length) {
    runGit(['add', '--', ...addPaths], repoCwd, dryRun);
  } else {
    runGit(['add', '-A'], repoCwd, dryRun);
  }

  const commitArgs = ['commit', '-F', messagePath];
  if (isTruthyFlag(flags['no-verify'])) {
    commitArgs.push('--no-verify');
  }
  runGit(commitArgs, repoCwd, dryRun);

  const commitSha = dryRun
    ? ''
    : execGit(['rev-parse', 'HEAD'], { cwd: repoCwd, allowFailure: true });

  if (isTruthyFlag(flags['no-push'])) {
    console.log('push: skipped');
    logger.finishOk({
      change_id: changeId,
      action: 'commit-only',
      commit: commitSha,
    });
    return;
  }

  const remote = flags.remote || 'origin';
  const branch = flags.branch || getCurrentBranch(repoCwd);
  const pushOutput = runGitCapture(['push', '--set-upstream', remote, branch], repoCwd, dryRun);

  if (dryRun) {
    logger.finishOk({
      change_id: changeId,
      action: 'dry-run',
      commit: commitSha,
      remote,
      branch,
    });
    return;
  }

  const mrUrl = extractMrUrl(pushOutput);
  if (mrUrl) {
    upsertField(planspecPath, 'mr_url', mrUrl);
    console.log(`mr_url: ${mrUrl}`);
    logger.finishOk({
      change_id: changeId,
      action: 'commit-push',
      commit: commitSha,
      remote,
      branch,
      mr_url: mrUrl,
    });
  } else {
    console.log('mr_url: not found in push output');
    logger.finishOk({
      change_id: changeId,
      action: 'commit-push',
      commit: commitSha,
      remote,
      branch,
      mr_url: '',
    });
  }
}

main();
