'use strict';

// Minimal argument parser with support for --flag value and --flag=value.
function storeFlag(flags, key, value) {
  if (flags[key] === undefined) {
    flags[key] = value;
    return;
  }
  if (Array.isArray(flags[key])) {
    flags[key].push(value);
    return;
  }
  flags[key] = [flags[key], value];
}

function parseArgs(argv) {
  const flags = {};
  const positionals = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }

    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex !== -1) {
        const key = arg.slice(2, eqIndex);
        const value = arg.slice(eqIndex + 1);
        storeFlag(flags, key, value);
        continue;
      }

      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        storeFlag(flags, key, next);
        i += 1;
      } else {
        storeFlag(flags, key, true);
      }
      continue;
    }

    if (arg.startsWith('-') && arg.length > 1) {
      const key = arg.slice(1);
      storeFlag(flags, key, true);
      continue;
    }

    positionals.push(arg);
  }

  return { flags, positionals };
}

module.exports = {
  parseArgs,
};
