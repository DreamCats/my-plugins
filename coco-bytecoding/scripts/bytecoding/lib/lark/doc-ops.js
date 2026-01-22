'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { extractId, isBoardId, isDocId, runLarkCli } = require('./cli');

function makeExitError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

function writeTempFile(contents, suffix) {
  const fileName = `lark-md-${process.pid}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}${suffix}`;
  const filePath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(filePath, contents, 'utf8');
  return filePath;
}

function createDocument(title, folderToken, options = {}) {
  const args = ['create-document', '--title', title];
  if (folderToken) {
    args.push('--folder-token', folderToken);
  }
  const data = runLarkCli(args, { json: true, verbose: options.verbose });
  let docId = extractId(data, [
    'document_id',
    'doc_id',
    'docx_token',
    'docxToken',
    'documentId',
    'docId',
  ]);
  if (!docId) {
    docId = extractId(data, ['token', 'id'], isDocId);
  }
  if (!docId) {
    throw makeExitError('Failed to parse document id from create-document output.', 3);
  }
  let docUrl = '';
  if (data && typeof data === 'object' && typeof data.url === 'string') {
    docUrl = data.url.trim();
  }
  return { docId, docUrl };
}

function addMarkdown(docId, text, options = {}) {
  if (!text.trim()) {
    return;
  }
  const tmpPath = writeTempFile(text, '.md');
  try {
    runLarkCli(['add-content', docId, tmpPath], {
      json: false,
      verbose: options.verbose,
    });
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

function addCallout(docId, text, calloutType, options = {}) {
  if (!text.trim()) {
    return;
  }
  const args = ['add-callout', docId, text];
  if (calloutType) {
    args.push('--callout-type', calloutType);
  }
  runLarkCli(args, { json: false, verbose: options.verbose });
}

function addBoard(docId, options = {}) {
  const data = runLarkCli(['add-board', docId], {
    json: true,
    verbose: options.verbose,
  });
  let boardId = null;
  if (data && typeof data === 'object') {
    const children = data.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child && typeof child === 'object') {
          const board = child.board;
          if (board && typeof board === 'object') {
            const token = board.token;
            if (typeof token === 'string' && token.trim()) {
              boardId = token.trim();
              break;
            }
          }
        }
      }
    }
  }
  if (!boardId) {
    boardId = extractId(
      data,
      ['whiteboard_id', 'whiteboardId', 'board_id', 'boardId', 'token', 'id'],
      isBoardId
    );
  }
  if (!boardId) {
    throw makeExitError('Failed to parse whiteboard id from add-board output.', 4);
  }
  return boardId;
}

function importDiagram(boardId, content, syntax, options = {}) {
  if (!content.trim()) {
    return;
  }
  const tmpPath = writeTempFile(content, '.puml');
  try {
    runLarkCli(
      ['import-diagram', boardId, tmpPath, '--source-type', 'file', '--syntax', syntax],
      { json: false, verbose: options.verbose }
    );
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

module.exports = {
  createDocument,
  addMarkdown,
  addCallout,
  addBoard,
  importDiagram,
};
