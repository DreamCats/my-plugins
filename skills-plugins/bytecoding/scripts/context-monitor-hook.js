#!/usr/bin/env node

/**
 * Context Monitor Hook - PostToolUse
 *
 * Monitors session context size and warns when approaching token limits.
 *
 * Trigger: PostToolUse (after every tool call)
 * Matcher: .* (monitors all tool calls)
 *
 * Features:
 *   1. Estimate current context token count
 *   2. Show warning when threshold exceeded (80k)
 *   3. Prompt user to run /compact to compress context
 */

const fs = require('fs');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Warning threshold (tokens)
  WARNING_THRESHOLD: 80000,
  // Urgent threshold (tokens)
  URGENT_THRESHOLD: 100000,
  // Estimation ratio: 1 character ≈ 0.5 tokens (Chinese environment)
  CHARS_TO_TOKEN_RATIO: 0.5,
  // Minimum check interval (avoid frequent warnings)
  MIN_CHECK_INTERVAL: 300000, // 5 minutes
};

// Last warning time
let lastWarningTime = 0;

// ============================================================================
// Token Estimation
// ============================================================================

/**
 * Estimate token count for a file
 * @param {string} filePath - Path to the file
 * @returns {number} Estimated token count
 */
function estimateFileTokens(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Chinese/English mixed environment, use character count estimation
    return Math.ceil(content.length * CONFIG.CHARS_TO_TOKEN_RATIO);
  } catch {
    return 0;
  }
}

/**
 * Estimate current context token count
 * @param {string} transcriptPath - Path to the transcript file
 * @returns {number} Estimated token count
 */
function estimateContextTokens(transcriptPath) {
  let totalTokens = 0;

  try {
    // Read transcript file
    if (fs.existsSync(transcriptPath)) {
      totalTokens += estimateFileTokens(transcriptPath);
    }

    // Check for summary file (generated after compaction)
    const summaryPath = transcriptPath.replace('.jsonl', '-summary.md');
    if (fs.existsSync(summaryPath)) {
      // Summary file tokens also count in context
      totalTokens += estimateFileTokens(summaryPath);
    }

    // Get file size for backup estimation
    const stats = fs.statSync(transcriptPath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    // For large files, use more conservative estimation
    if (fileSizeInMB > 10) {
      // Large files usually contain lots of tool output, higher token density
      totalTokens = Math.max(totalTokens, Math.ceil(stats.size * 0.7));
    }
  } catch (error) {
    // If estimation fails, return 0
  }

  return totalTokens;
}

// ============================================================================
// Warning Message Generator
// ============================================================================

/**
 * Generate warning message based on token count
 * @param {number} tokenCount - Current token count
 * @returns {string} Warning message or empty string
 */
function generateWarningMessage(tokenCount) {
  const percentage = Math.min(100, Math.round((tokenCount / CONFIG.URGENT_THRESHOLD) * 100));

  if (tokenCount >= CONFIG.URGENT_THRESHOLD) {
    return `
---
⚠️ **上下文紧急警告** ⚠️

当前上下文已超过 ${CONFIG.URGENT_THRESHOLD.toLocaleString()} tokens！

📊 **估算大小**: ${tokenCount.toLocaleString()} tokens (${percentage}%)
💾 **建议操作**: 请立即执行 /compact 压缩上下文

如果不压缩，可能会：
- 影响响应速度
- 导致早期对话内容被遗忘
- 增加错误的风险

**现在就执行 /compact 吧！**
---
`;
  } else if (tokenCount >= CONFIG.WARNING_THRESHOLD) {
    return `
---
💡 **上下文提示**

当前上下文接近 ${CONFIG.WARNING_THRESHOLD.toLocaleString()} tokens

📊 **估算大小**: ${tokenCount.toLocaleString()} tokens (${percentage}%)
💡 **建议**: 考虑执行 /compact 压缩上下文，保持最佳性能

/compact 会保留关键信息，压缩冗余内容
---
`;
  }

  return '';
}

// ============================================================================
// Main Hook Handler
// ============================================================================

/**
 * PostToolUse hook handler
 * @param {Object} input - Hook input data
 * @returns {Object} Hook output
 */
function handlePostToolUse(input) {
  const { transcript_path, tool_name } = input;

  // Skip certain tools that don't need monitoring
  const skipTools = ['Ping', 'Echo', 'Read', 'Glob', 'Grep'];
  if (tool_name && skipTools.includes(tool_name)) {
    return { hookSpecificOutput: { hookEventName: 'PostToolUse' } };
  }

  const now = Date.now();

  // Check if within minimum interval
  if (now - lastWarningTime < CONFIG.MIN_CHECK_INTERVAL) {
    return { hookSpecificOutput: { hookEventName: 'PostToolUse' } };
  }

  // Estimate context tokens
  const tokenCount = estimateContextTokens(transcript_path);

  // Check if warning needed
  if (tokenCount >= CONFIG.WARNING_THRESHOLD) {
    lastWarningTime = now;
    const warningMessage = generateWarningMessage(tokenCount);

    return {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: warningMessage
      }
    };
  }

  return { hookSpecificOutput: { hookEventName: 'PostToolUse' } };
}

// ============================================================================
// CLI Execution
// ============================================================================

(async () => {
  let inputData = {};

  try {
    const stdinBuffer = [];
    process.stdin.setEncoding('utf-8');

    await new Promise((resolve) => {
      process.stdin.on('data', (chunk) => {
        stdinBuffer.push(chunk);
      });

      process.stdin.on('end', () => {
        resolve();
      });
    });

    const stdinText = stdinBuffer.join('');
    if (stdinText.trim()) {
      try {
        inputData = JSON.parse(stdinText);
      } catch (e) {
        // Parse failed, use empty object
      }
    }
  } catch (error) {
    // No stdin input or parse failed, use empty object
  }

  const output = handlePostToolUse(inputData);
  console.log(JSON.stringify(output));
})();
