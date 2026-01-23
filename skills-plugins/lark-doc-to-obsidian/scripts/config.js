#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.my-plugins');
const PLUGIN_NAME = 'lark-doc-to-obsidian';
const CONFIG_FILE = path.join(CONFIG_DIR, `${PLUGIN_NAME}.json`);

const DEFAULT_CONFIG = {
  volcano: {
    model_id: '',
    api_key: '',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
  }
};

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.error(`Failed to read config from ${CONFIG_FILE}:`, error.message);
    return DEFAULT_CONFIG;
  }
}

function setConfig(key, value) {
  ensureConfigDir();
  const config = getConfig();

  // 支持嵌套路径，如 'volcano.model_id'
  const keys = key.split('.');
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`Config updated: ${key} = ${value}`);
}

function printConfig() {
  const config = getConfig();
  console.log('Current configuration:');
  console.log(JSON.stringify(config, null, 2));
  console.log(`\nConfig file: ${CONFIG_FILE}`);
}

function printUsage() {
  console.log('Usage: node config.js [command] [options]');
  console.log('');
  console.log('Commands:');
  console.log('  get                          Print current configuration');
  console.log('  set <key> <value>            Set a configuration value');
  console.log('  set volcano.model_id <id>    Set Volcano model ID');
  console.log('  set volcano.api_key <key>    Set Volcano API key');
  console.log('');
  console.log('Examples:');
  console.log('  node config.js get');
  console.log('  node config.js set volcano.model_id ep-20250806170811-dd4nz');
  console.log('  node config.js set volcano.api_key your-api-key-here');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const command = args[0];

  switch (command) {
    case 'get':
      printConfig();
      break;

    case 'set':
      if (args.length !== 3) {
        console.error('Error: set command requires key and value');
        console.log('Usage: node config.js set <key> <value>');
        process.exit(1);
      }
      setConfig(args[1], args[2]);
      break;

    case 'help':
    case '-h':
    case '--help':
      printUsage();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getConfig, CONFIG_FILE };
