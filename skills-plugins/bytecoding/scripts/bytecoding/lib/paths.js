'use strict';

const path = require('path');

function changesRoot(projectRoot) {
  return path.join(projectRoot, '.bytecoding', 'changes');
}

function changeDir(projectRoot, changeId) {
  return path.join(changesRoot(projectRoot), changeId);
}

function archiveRoot(projectRoot) {
  return path.join(changesRoot(projectRoot), 'archive');
}

module.exports = {
  changesRoot,
  changeDir,
  archiveRoot,
};
