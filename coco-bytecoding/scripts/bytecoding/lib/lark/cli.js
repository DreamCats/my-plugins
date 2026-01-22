'use strict';

const { execFileSync } = require('child_process');

function writeOutput(stream, data) {
  if (!data) {
    return;
  }
  if (typeof data === 'string') {
    stream.write(data);
    return;
  }
  stream.write(data.toString());
}

function runLarkCli(args, options = {}) {
  const cmd = ['lark-cli'];
  if (options.verbose && !options.json) {
    cmd.push('-v');
  }
  if (options.json) {
    cmd.push('--format', 'json');
  }
  cmd.push(...args);

  try {
    const stdout = execFileSync(cmd[0], cmd.slice(1), { encoding: 'utf8' });
    if (options.json) {
      try {
        return JSON.parse(stdout);
      } catch (error) {
        writeOutput(process.stderr, stdout);
        const parseError = new Error('Failed to parse lark-cli JSON output.');
        parseError.exitCode = 2;
        parseError.silent = true;
        throw parseError;
      }
    }
    return stdout;
  } catch (error) {
    writeOutput(process.stderr, error.stderr || error.stdout);
    if (error.exitCode === undefined) {
      error.exitCode = error.status || 1;
    }
    error.silent = true;
    throw error;
  }
}

function extractId(data, keys, valuePredicate) {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const key of keys) {
      if (typeof data[key] === 'string') {
        if (!valuePredicate || valuePredicate(data[key])) {
          return data[key];
        }
      }
    }
    for (const value of Object.values(data)) {
      const found = extractId(value, keys, valuePredicate);
      if (found) {
        return found;
      }
    }
  } else if (Array.isArray(data)) {
    for (const value of data) {
      const found = extractId(value, keys, valuePredicate);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function isDocId(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return value.trim().length >= 8;
}

function isBoardId(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return value.trim().length >= 8;
}

module.exports = {
  runLarkCli,
  extractId,
  isDocId,
  isBoardId,
};
