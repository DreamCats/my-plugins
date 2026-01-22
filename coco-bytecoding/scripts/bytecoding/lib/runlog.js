'use strict';

const fs = require('fs');
const path = require('path');

const RUN_LOGGER_SYMBOL = Symbol.for('bytecoding.runlogger');

function getRunLogger() {
  return global[RUN_LOGGER_SYMBOL] || null;
}

function registerRunLogger(logger) {
  global[RUN_LOGGER_SYMBOL] = logger;
}

function createRunLogger(options) {
  const changeId = options.changeId;
  const script = options.script;
  const argv = options.argv || [];
  const cwd = options.cwd || process.cwd();
  let logPath = path.join(options.changeDir, 'run.log');
  const startedAt = Date.now();
  let finished = false;

  function append(entry) {
    fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`);
  }

  function baseEntry() {
    return {
      ts: new Date().toISOString(),
      change_id: changeId,
      script,
      argv,
      cwd,
    };
  }

  function start() {
    append({ ...baseEntry(), event: 'start' });
  }

  function finish(status, result, error) {
    if (finished) {
      return;
    }
    finished = true;
    append({
      ...baseEntry(),
      event: 'finish',
      status,
      duration_ms: Date.now() - startedAt,
      result: result || null,
      error: error || null,
    });
  }

  function setChangeDir(nextDir) {
    logPath = path.join(nextDir, 'run.log');
  }

  start();

  return {
    finishOk(result) {
      finish('ok', result, null);
    },
    finishError(error) {
      const message = error?.message || String(error || 'unknown error');
      const code = error?.code || null;
      finish('error', null, { message, code });
    },
    setChangeDir,
  };
}

module.exports = {
  createRunLogger,
  registerRunLogger,
  getRunLogger,
};
