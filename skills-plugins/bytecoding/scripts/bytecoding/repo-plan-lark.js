#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseArgs, isTruthyFlag } = require('./lib/cli');
const { die } = require('./lib/errors');
const { requireGit, getProjectRoot } = require('./lib/git');
const { changeDir } = require('./lib/paths');
const { upsertLarkDocs } = require('./lib/planspec');
const { createRunLogger, registerRunLogger } = require('./lib/runlog');

function printUsage() {
  console.log(
    [
      'usage: repo-plan-lark.js --change-id <id> [options]',
      '',
      'options:',
      '  --folder-token <token>      Lark folder token for new docs',
      '  --title-prefix <prefix>     Title prefix (default: [repo-plan] <change-id>)',
      '  --proposal-doc-id <id>      Render proposal.md into existing doc',
      '  --design-doc-id <id>        Render design.md into existing doc',
      '  --tasks-doc-id <id>         Render tasks.md into existing doc',
      '  --share-email <email>       Add edit permission for this email',
      '  --share-member-type <type>  member-type for add-permission (default: email)',
      '  --share-member-id <id>      member-id for add-permission',
      '  --share-perm <perm>         view|edit|full_access (default: edit)',
      '  --share-perm-type <type>    perm-type for wiki (optional)',
      '  --share-collaborator-type <type> collaborator-type (optional)',
      '  --share-notify              notify collaborator',
      '  --dry-run                   Print actions without calling lark-cli',
      '  --verbose                   Verbose lark-cli output',
    ].join('\n')
  );
}

function resolvePluginRoot() {
  const envRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (!envRoot) {
    return path.resolve(__dirname, '..', '..');
  }
  const resolved = path.resolve(envRoot);
  if (
    path.basename(resolved) === 'bytecoding' &&
    path.basename(path.dirname(resolved)) === 'scripts'
  ) {
    return path.resolve(resolved, '..', '..');
  }
  return resolved;
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    die(`required file not found: ${filePath}`);
  }
}

function parseDocOutput(stdout, fallbackDocId) {
  const docMatch = stdout.match(/doc_id:\s*([^\s]+)/);
  const urlMatch = stdout.match(/url:\s*([^\s]+)/);
  return {
    doc_id: docMatch ? docMatch[1] : fallbackDocId || '',
    url: urlMatch ? urlMatch[1] : '',
  };
}

function runRender(scriptPath, options) {
  const args = [scriptPath, '--md', options.mdPath];
  if (options.docId) {
    args.push('--doc-id', options.docId);
  } else {
    args.push('--title', options.title);
  }
  if (options.folderToken && !options.docId) {
    args.push('--folder-token', options.folderToken);
  }
  if (options.dryRun) {
    args.push('--dry-run');
  }
  if (options.verbose) {
    args.push('--verbose');
  }

  try {
    const stdout = execFileSync('python3', args, { encoding: 'utf8' });
    return parseDocOutput(stdout, options.docId);
  } catch (error) {
    if (error.stdout) {
      process.stderr.write(error.stdout.toString());
    }
    if (error.stderr) {
      process.stderr.write(error.stderr.toString());
    }
    throw error;
  }
}

function inferDocType(docId) {
  if (!docId) {
    return 'docx';
  }
  const match = docId.match(/^([a-zA-Z]+)_/);
  if (match) {
    return match[1];
  }
  return 'docx';
}

function addPermission(docId, share) {
  if (!docId) {
    die('missing doc_id for permission update');
  }
  const args = [
    'add-permission',
    '--doc-type',
    share.docType || inferDocType(docId),
    '--member-type',
    share.memberType,
    '--member-id',
    share.memberId,
    '--perm',
    share.perm,
  ];
  if (share.permType) {
    args.push('--perm-type', share.permType);
  }
  if (share.collaboratorType) {
    args.push('--collaborator-type', share.collaboratorType);
  }
  if (share.notification) {
    args.push('--notification');
  }
  args.push(docId);
  execFileSync('lark-cli', args, { stdio: 'inherit' });
}

function buildShareConfig(flags) {
  const shareEmail = flags['share-email'];
  const shareMemberId = flags['share-member-id'];

  if (!shareEmail && !shareMemberId) {
    return null;
  }

  return {
    memberType: flags['share-member-type'] || 'email',
    memberId: shareMemberId || shareEmail,
    perm: flags['share-perm'] || 'edit',
    permType: flags['share-perm-type'] || null,
    collaboratorType: flags['share-collaborator-type'] || null,
    docType: null,
    notification: isTruthyFlag(flags['share-notify']),
  };
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

  requireGit();
  const projectRoot = getProjectRoot();
  const changeDirPath = changeDir(projectRoot, changeId);
  const planspecPath = path.join(changeDirPath, 'planspec.yaml');

  if (!fs.existsSync(changeDirPath)) {
    die(`change dir not found: ${changeDirPath}`);
  }

  const logger = createRunLogger({
    changeId,
    changeDir: changeDirPath,
    script: path.basename(__filename),
    argv: process.argv.slice(2),
  });
  registerRunLogger(logger);

  ensureFile(planspecPath);

  const proposalPath = path.join(changeDirPath, 'proposal.md');
  const designPath = path.join(changeDirPath, 'design.md');
  const tasksPath = path.join(changeDirPath, 'tasks.md');

  ensureFile(proposalPath);
  ensureFile(designPath);
  ensureFile(tasksPath);

  const pluginRoot = resolvePluginRoot();
  const renderScript = path.join(
    pluginRoot,
    'skills',
    'lark-md-to-doc',
    'scripts',
    'render_lark_doc.py'
  );

  ensureFile(renderScript);

  const folderToken = flags['folder-token'] || '';
  const dryRun = isTruthyFlag(flags['dry-run']);
  const verbose = isTruthyFlag(flags.verbose);
  const titlePrefix = flags['title-prefix'] || `[repo-plan] ${changeId}`;
  const shareConfig = buildShareConfig(flags);

  const proposalDoc = runRender(renderScript, {
    mdPath: proposalPath,
    docId: flags['proposal-doc-id'] || '',
    title: `${titlePrefix} proposal`,
    folderToken,
    dryRun,
    verbose,
  });

  const designDoc = runRender(renderScript, {
    mdPath: designPath,
    docId: flags['design-doc-id'] || '',
    title: `${titlePrefix} design`,
    folderToken,
    dryRun,
    verbose,
  });

  const tasksDoc = runRender(renderScript, {
    mdPath: tasksPath,
    docId: flags['tasks-doc-id'] || '',
    title: `${titlePrefix} tasks`,
    folderToken,
    dryRun,
    verbose,
  });

  if (!dryRun) {
    upsertLarkDocs(planspecPath, {
      proposal: proposalDoc,
      design: designDoc,
      tasks: tasksDoc,
    });
  }

  console.log(`proposal_doc_id: ${proposalDoc.doc_id || 'unknown'}`);
  if (proposalDoc.url) {
    console.log(`proposal_url: ${proposalDoc.url}`);
  }
  console.log(`design_doc_id: ${designDoc.doc_id || 'unknown'}`);
  if (designDoc.url) {
    console.log(`design_url: ${designDoc.url}`);
  }
  console.log(`tasks_doc_id: ${tasksDoc.doc_id || 'unknown'}`);
  if (tasksDoc.url) {
    console.log(`tasks_url: ${tasksDoc.url}`);
  }

  if (shareConfig && !dryRun) {
    addPermission(proposalDoc.doc_id, shareConfig);
    addPermission(designDoc.doc_id, shareConfig);
    addPermission(tasksDoc.doc_id, shareConfig);
  }

  logger.finishOk({
    change_id: changeId,
    proposal: proposalDoc,
    design: designDoc,
    tasks: tasksDoc,
    shared_to: shareConfig ? shareConfig.memberId : '',
  });
}

main();
