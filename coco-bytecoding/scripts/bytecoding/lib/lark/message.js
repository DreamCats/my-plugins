'use strict';

const { execFileSync } = require('child_process');

function buildMessagePayload(msgType, text, title) {
  if (msgType === 'post') {
    return JSON.stringify({
      zh_cn: {
        title: title || 'Notification',
        content: [[{ tag: 'md', text }]],
      },
    });
  }
  return JSON.stringify({ text });
}

function sendMessage(options) {
  const payload = buildMessagePayload(options.msgType, options.text, options.title);
  const args = [
    'send-message',
    '--receive-id-type',
    options.receiveIdType,
    '--msg-type',
    options.msgType,
    options.receiveId,
    payload,
  ];

  if (options.dryRun) {
    console.log(`dry-run: lark-cli ${args.join(' ')}`);
    return;
  }

  const cliArgs = options.verbose ? ['-v', ...args] : args;
  execFileSync('lark-cli', cliArgs, { stdio: 'inherit' });
}

module.exports = {
  buildMessagePayload,
  sendMessage,
};
