#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.my-plugins');
const CONFIG_FILE = path.join(CONFIG_DIR, 'lark-doc-to-obsidian.json');

function checkConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('\n📋 Lark Doc to Obsidian 配置');
    console.log('=====================================');
    console.log('检测到尚未配置火山 LLM API，画板转 Mermaid 功能将不可用。');
    console.log('');
    console.log('如需启用画板转 Mermaid 功能，请运行：');
    console.log(`  node ${path.join(__dirname, 'config.js')} set volcano.model_id <your-model-id>`);
    console.log(`  node ${path.join(__dirname, 'config.js')} set volcano.api_key <your-api-key>`);
    console.log('');
    console.log(`配置文件位置: ${CONFIG_FILE}`);
    console.log('=====================================\n');
    return;
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const volcano = config.volcano || {};

    if (!volcano.model_id || !volcano.api_key) {
      console.log('\n⚠️  Lark Doc to Obsidian 配置不完整');
      console.log('=====================================');
      console.log('火山 LLM API 配置不完整，画板转 Mermaid 功能可能不可用。');
      console.log('');
      if (!volcano.model_id) {
        console.log('❌ 缺少 model_id');
      }
      if (!volcano.api_key) {
        console.log('❌ 缺少 api_key');
      }
      console.log('');
      console.log('请运行以下命令补全配置：');
      console.log(`  node ${path.join(__dirname, 'config.js')} set volcano.model_id <your-model-id>`);
      console.log(`  node ${path.join(__dirname, 'config.js')} set volcano.api_key <your-api-key>`);
      console.log('=====================================\n');
    } else {
      console.log('\n✅ Lark Doc to Obsidian 配置正常');
      console.log('=====================================');
      console.log('画板转 Mermaid 功能已启用。');
      console.log(`Model ID: ${volcano.model_id}`);
      console.log('=====================================\n');
    }
  } catch (error) {
    console.error(`[Error] Failed to read config: ${error.message}`);
  }
}

checkConfig();
