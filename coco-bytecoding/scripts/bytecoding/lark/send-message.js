#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { parseArgs, isTruthyFlag } = require('../lib/cli');
const { sendMessage } = require('../lib/lark/message');

function printUsage() {
  console.log(
    [
      'usage: send-message.js --receive-id <id> [options]',
      '',
      'options:',
      '  --receive-id-type <type>  email|open_id|user_id|union_id|chat_id (default: email)',
      '  --msg-type <type>         text|post (default: post)',
      '  --title <text>            Post title (default: Notification)',
      '  --text <text>             Message text/markdown',
      '  --text-file <path>        Read message text from file',
      '  --stdin                   Read message text from stdin',
      '  --dry-run                 Print command without sending',
      '  --verbose                 Verbose lark-cli output',
    ].join('\n')
  );
}

function exitWithError(message, code = 1) {
  if (message) {
    console.error(message);
  }
  process.exit(code);
}

function readText(flags) {
  if (flags['text-file']) {
    return fs.readFileSync(flags['text-file'], 'utf8');
  }
  if (typeof flags.text === 'string') {
    return flags.text;
  }
  if (isTruthyFlag(flags.stdin)) {
    return fs.readFileSync(0, 'utf8');
  }
  return '';
}

function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  if (flags.h || flags.help) {
    printUsage();
    return;
  }

  const receiveId = flags['receive-id'];
  if (!receiveId) {
    exitWithError('missing --receive-id');
  }

  const msgType = flags['msg-type'] || 'post';
  if (!['post', 'text'].includes(msgType)) {
    exitWithError(`unsupported msg-type: ${msgType}`);
  }

  const text = readText(flags);
  if (!text.trim()) {
    exitWithError('missing message text; use --text, --text-file, or --stdin');
  }

  sendMessage({
    receiveId,
    receiveIdType: flags['receive-id-type'] || 'email',
    msgType,
    title: flags.title || 'Notification',
    text,
    dryRun: isTruthyFlag(flags['dry-run']),
    verbose: isTruthyFlag(flags.verbose),
  });
}

try {
  main();
} catch (error) {
  exitWithError(error.message || 'send-message failed', error.exitCode || 1);
}
