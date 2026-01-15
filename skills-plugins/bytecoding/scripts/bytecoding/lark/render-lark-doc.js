#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { parseArgs, isTruthyFlag } = require('../lib/cli');
const { parseCalloutInfo, parseSegments } = require('../lib/lark/md-segments');
const {
  addBoard,
  addCallout,
  addMarkdown,
  createDocument,
  importDiagram,
} = require('../lib/lark/doc-ops');

function printUsage() {
  console.log(
    [
      'usage: render-lark-doc.js --md <path> (--doc-id <id> | --title <title>) [options]',
      '',
      'options:',
      '  --folder-token <token>  Lark folder token for new docs',
      '  --dry-run               Print steps without calling lark-cli',
      '  --verbose               Verbose lark-cli output',
    ].join('\n')
  );
}

function exitWithError(message, code = 1) {
  if (message) {
    console.error(message);
  }
  process.exit(code);
}

function formatPreview(text) {
  const trimmed = text.trim();
  if (trimmed.length <= 80) {
    return trimmed;
  }
  return `${trimmed.slice(0, 80)}...`;
}

function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  if (flags.h || flags.help) {
    printUsage();
    return;
  }

  const mdPath = flags.md;
  if (!mdPath) {
    exitWithError('missing --md');
  }
  if (!fs.existsSync(mdPath)) {
    exitWithError(`markdown file not found: ${mdPath}`);
  }

  const docIdFlag = flags['doc-id'] || '';
  const title = flags.title || '';
  if (!docIdFlag && !title) {
    exitWithError('either --doc-id or --title is required');
  }

  const markdownText = fs.readFileSync(mdPath, 'utf8');
  const dryRun = isTruthyFlag(flags['dry-run']);
  const verbose = isTruthyFlag(flags.verbose);
  const folderToken = flags['folder-token'] || '';

  let docId = docIdFlag;
  if (!docId) {
    if (dryRun) {
      docId = 'DOC_ID';
    } else {
      const created = createDocument(title, folderToken, { verbose });
      docId = created.docId;
      console.log(`doc_id: ${docId}`);
      if (created.docUrl) {
        console.log(`url: ${created.docUrl}`);
      }
    }
  }

  const segments = parseSegments(markdownText);
  for (const segment of segments) {
    const kind = segment[0];
    if (kind === 'markdown') {
      if (dryRun) {
        console.log(`[markdown] ${formatPreview(segment[1])}`);
      } else {
        addMarkdown(docId, segment[1], { verbose });
      }
      continue;
    }
    if (kind === 'callout') {
      const infoLine = segment[1];
      const text = segment[2];
      const opts = parseCalloutInfo(infoLine);
      if (dryRun) {
        console.log(`[callout] ${JSON.stringify(opts)} ${formatPreview(text)}`);
      } else {
        addCallout(docId, text.trim(), opts.type || null, { verbose });
      }
      continue;
    }
    if (kind === 'diagram') {
      const syntax = segment[1];
      const text = segment[2];
      if (dryRun) {
        console.log(`[diagram:${syntax}] ${formatPreview(text)}`);
      } else {
        const boardId = addBoard(docId, { verbose });
        importDiagram(boardId, text.trim(), syntax, { verbose });
      }
      continue;
    }
    exitWithError(`unknown segment type: ${kind}`);
  }
}

try {
  main();
} catch (error) {
  if (!error.silent && error.message) {
    console.error(error.message);
  }
  process.exit(error.exitCode || 1);
}
