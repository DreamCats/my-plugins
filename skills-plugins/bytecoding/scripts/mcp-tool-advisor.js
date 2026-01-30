#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * MCP Tool Advisor Hook
 *
 * Phase 2: 规则配置化
 *
 * 在两个时机注入工具建议：
 * 1. UserPromptSubmit: 分析用户 prompt，建议使用合适的 MCP 工具
 * 2. PreToolUse: 当使用内置工具时，建议更精准的 MCP 替代
 *
 * 规则从 config/mcp-advisor-rules.yaml 读取
 */

// ============================================================================
// 配置和状态
// ============================================================================

// 缓存文件路径（与 session-start-hook.js 保持一致）
const BCINDEX_STATUS_CACHE = '/tmp/bytecoding-bcindex-status.json';

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, '..', 'config', 'mcp-advisor-rules.json');

// Metrics 文件路径
const METRICS_FILE = '/tmp/bytecoding-advisor-metrics.jsonl';

/**
 * 从缓存文件读取 bcindex 索引状态
 * @returns {boolean} 索引是否可用
 */
function readBcindexStatus() {
  try {
    const data = fs.readFileSync(BCINDEX_STATUS_CACHE, 'utf-8');
    const status = JSON.parse(data);
    return status.available === true;
  } catch {
    return false;
  }
}

// 读取缓存的 bcindex 状态
const BCINDEX_AVAILABLE = readBcindexStatus();

// ============================================================================
// 规则加载
// ============================================================================

/**
 * 加载规则配置
 * @returns {Object} 规则配置
 */
function loadRules() {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    // 配置文件不存在或解析失败，返回空规则
    return { user_prompt_rules: [], pre_tool_use_rules: [] };
  }
}

// 加载规则
const CONFIG = loadRules();
const USER_PROMPT_RULES = CONFIG.user_prompt_rules || [];
const PRE_TOOL_USE_RULES = CONFIG.pre_tool_use_rules || [];

// ============================================================================
// Metrics 记录
// ============================================================================

/**
 * 获取 session ID
 * @param {Object} input - Hook 输入
 * @returns {string} session ID
 */
function getSessionId(input) {
  return input?.session_id || process.env.CLAUDE_SESSION_ID || 'unknown';
}

/**
 * 写入 metrics 记录
 * @param {Object} record - 记录对象
 */
function writeMetrics(record) {
  try {
    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(METRICS_FILE, line);
  } catch {
    // 忽略写入错误
  }
}

/**
 * 记录建议
 * @param {string} sessionId - Session ID
 * @param {string} ruleName - 规则名称
 * @param {string} suggestedTool - 建议的工具
 */
function recordSuggestion(sessionId, ruleName, suggestedTool) {
  writeMetrics({
    type: 'suggest',
    ts: Date.now(),
    session: sessionId,
    rule: ruleName,
    tool: suggestedTool,
  });
}

/**
 * 记录实际使用的工具
 * @param {string} sessionId - Session ID
 * @param {string} toolUsed - 实际使用的工具
 */
function recordActualUse(sessionId, toolUsed) {
  writeMetrics({
    type: 'actual',
    ts: Date.now(),
    session: sessionId,
    tool: toolUsed,
  });
}

// ============================================================================
// 核心逻辑
// ============================================================================

/**
 * 检查规则是否可用
 * @param {Object} rule - 规则对象
 * @returns {boolean} 规则是否可用
 */
function isRuleAvailable(rule) {
  // 检查是否显式禁用
  if (rule.enabled === false) {
    return false;
  }

  // 检查是否需要 bcindex
  if (rule.requires_bcindex && !BCINDEX_AVAILABLE) {
    return false;
  }

  // 检查建议的工具是否需要 bcindex
  const tool = rule.tool || rule.suggest?.tool || '';
  if (tool.startsWith('bcindex:') && tool !== 'bcindex:bcindex_status' && !BCINDEX_AVAILABLE) {
    return false;
  }

  return true;
}

/**
 * 匹配用户 prompt
 * @param {string} prompt - 用户输入
 * @param {Object} rule - 规则
 * @returns {boolean} 是否匹配
 */
function matchUserPrompt(prompt, rule) {
  const normalizedPrompt = prompt.toLowerCase();

  // 关键词匹配
  if (rule.keywords && Array.isArray(rule.keywords)) {
    const matched = rule.keywords.some((kw) => normalizedPrompt.includes(kw.toLowerCase()));
    if (matched) return true;
  }

  // 正则匹配
  if (rule.pattern) {
    try {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(prompt)) return true;
    } catch {
      // 正则无效，跳过
    }
  }

  return false;
}

/**
 * 匹配工具调用
 * @param {string} toolName - 工具名称
 * @param {Object} toolInput - 工具输入
 * @param {Object} rule - 规则
 * @returns {boolean} 是否匹配
 */
function matchToolUse(toolName, toolInput, rule) {
  // 检查工具名称
  if (rule.tool !== toolName) {
    return false;
  }

  const inputStr = JSON.stringify(toolInput || {});

  // 正则匹配输入内容
  if (rule.pattern_in_input) {
    try {
      const regex = new RegExp(rule.pattern_in_input, 'i');
      if (regex.test(inputStr)) return true;
    } catch {
      // 正则无效，跳过
    }
  }

  // Task 特殊处理：检查 subagent_type 和 prompt
  if (rule.check_subagent && toolName === 'Task') {
    const subagentType = toolInput?.subagent_type || '';
    if (subagentType !== rule.check_subagent) {
      return false;
    }

    if (rule.pattern_in_prompt) {
      const prompt = toolInput?.prompt || '';
      try {
        const regex = new RegExp(rule.pattern_in_prompt, 'i');
        if (regex.test(prompt)) return true;
      } catch {
        // 正则无效，跳过
      }
    }
  }

  return false;
}

/**
 * 分析用户 prompt，返回工具建议
 * @param {string} prompt - 用户输入
 * @param {string} sessionId - Session ID
 * @returns {string|null} 建议信息或 null
 */
function analyzeUserPrompt(prompt, sessionId) {
  if (!prompt || typeof prompt !== 'string') {
    return null;
  }

  // 收集所有匹配的规则
  const matchedRules = [];

  for (const rule of USER_PROMPT_RULES) {
    // 跳过不可用的规则
    if (!isRuleAvailable(rule)) {
      continue;
    }

    if (matchUserPrompt(prompt, rule)) {
      matchedRules.push(rule);
    }
  }

  // 没有匹配的规则
  if (matchedRules.length === 0) {
    return null;
  }

  // 按 priority 降序排序，取最高优先级的规则
  matchedRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const bestRule = matchedRules[0];

  // 记录建议
  recordSuggestion(sessionId, bestRule.name, bestRule.tool);

  let suggestion = `💡 MCP 工具建议：使用 \`${bestRule.tool}\` - ${bestRule.reason}`;
  if (bestRule.params) {
    suggestion += `\n   参数提示：${JSON.stringify(bestRule.params)}`;
  }
  return suggestion;
}

/**
 * 分析工具调用，返回 MCP 替代建议
 * @param {string} toolName - 工具名称
 * @param {Object} toolInput - 工具输入参数
 * @param {string} sessionId - Session ID
 * @returns {string|null} 建议信息或 null
 */
function analyzeToolUse(toolName, toolInput, sessionId) {
  if (!toolName) {
    return null;
  }

  // 收集所有匹配的规则
  const matchedRules = [];

  for (const rule of PRE_TOOL_USE_RULES) {
    // 跳过不可用的规则
    if (!isRuleAvailable(rule)) {
      continue;
    }

    if (matchToolUse(toolName, toolInput, rule)) {
      matchedRules.push(rule);
    }
  }

  // 没有匹配的规则
  if (matchedRules.length === 0) {
    return null;
  }

  // 按 priority 降序排序，取最高优先级的规则
  matchedRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const bestRule = matchedRules[0];

  // 记录建议
  recordSuggestion(sessionId, bestRule.name, bestRule.suggest.tool);

  const suggest = bestRule.suggest;
  return `💡 提示：${suggest.reason}。可以考虑使用 \`${suggest.tool}\``;
}

/**
 * 处理 UserPromptSubmit 事件
 * @param {Object} input - Hook 输入
 * @returns {Object|null} Hook 输出或 null
 */
function handleUserPromptSubmit(input) {
  const prompt = input?.prompt || input?.user_prompt || '';
  const sessionId = getSessionId(input);
  const suggestion = analyzeUserPrompt(prompt, sessionId);

  if (suggestion) {
    return {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: suggestion,
      },
    };
  }

  return null;
}

/**
 * 处理 PreToolUse 事件
 * @param {Object} input - Hook 输入
 * @returns {Object|null} Hook 输出或 null
 */
function handlePreToolUse(input) {
  const toolName = input?.tool_name || input?.tool || '';
  const toolInput = input?.tool_input || input?.input || {};
  const sessionId = getSessionId(input);
  const suggestion = analyzeToolUse(toolName, toolInput, sessionId);

  if (suggestion) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        additionalContext: suggestion,
      },
    };
  }

  return null;
}

/**
 * 处理 PostToolUse 事件
 * @param {Object} input - Hook 输入
 * @returns {Object|null} Hook 输出或 null
 */
function handlePostToolUse(input) {
  const toolName = input?.tool_name || input?.tool || '';
  const sessionId = getSessionId(input);

  if (toolName) {
    recordActualUse(sessionId, toolName);
  }

  // PostToolUse 不需要返回任何内容
  return null;
}

// ============================================================================
// CLI 入口
// ============================================================================

(async () => {
  // 读取 stdin
  const stdinBuffer = [];
  process.stdin.setEncoding('utf-8');

  await new Promise((resolve) => {
    process.stdin.on('data', (chunk) => stdinBuffer.push(chunk));
    process.stdin.on('end', resolve);
  });

  const stdinContent = stdinBuffer.join('');
  let input = {};

  try {
    input = JSON.parse(stdinContent);
  } catch {
    // 忽略解析错误
  }

  // 根据环境变量确定事件类型
  const hookEvent = process.env.CLAUDE_HOOK_EVENT || '';

  let output = null;

  if (hookEvent === 'UserPromptSubmit') {
    output = handleUserPromptSubmit(input);
  } else if (hookEvent === 'PreToolUse') {
    output = handlePreToolUse(input);
  } else if (hookEvent === 'PostToolUse') {
    output = handlePostToolUse(input);
  }

  // 输出结果（只有在有建议时才输出）
  if (output) {
    console.log(JSON.stringify(output));
  } else {
    // 输出空对象表示不做任何操作
    console.log('{}');
  }
})();
