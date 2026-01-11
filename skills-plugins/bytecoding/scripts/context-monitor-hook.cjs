#!/usr/bin/env node
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/hooks/context-monitor-hook.ts
var context_monitor_hook_exports = {};
__export(context_monitor_hook_exports, {
  handlePostToolUse: () => handlePostToolUse
});
module.exports = __toCommonJS(context_monitor_hook_exports);
var CONFIG = {
  // 警告阈值（tokens）
  WARNING_THRESHOLD: 8e4,
  // 紧急阈值（tokens）
  URGENT_THRESHOLD: 1e5,
  // 估算系数：1 字符约等于 0.5 tokens（中文环境）
  CHARS_TO_TOKEN_RATIO: 0.5,
  // 最小检查间隔（避免频繁提示）
  MIN_CHECK_INTERVAL: 3e5
  // 5 分钟
};
var lastWarningTime = 0;
function estimateFileTokens(filePath) {
  try {
    const fs = require("fs");
    const content = fs.readFileSync(filePath, "utf-8");
    return Math.ceil(content.length * CONFIG.CHARS_TO_TOKEN_RATIO);
  } catch {
    return 0;
  }
}
function estimateContextTokens(transcriptPath) {
  const fs = require("fs");
  let totalTokens = 0;
  try {
    if (fs.existsSync(transcriptPath)) {
      totalTokens += estimateFileTokens(transcriptPath);
    }
    const summaryPath = transcriptPath.replace(".jsonl", "-summary.md");
    if (fs.existsSync(summaryPath)) {
      totalTokens += estimateFileTokens(summaryPath);
    }
    const stats = fs.statSync(transcriptPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    if (fileSizeInMB > 10) {
      totalTokens = Math.max(totalTokens, Math.ceil(stats.size * 0.7));
    }
  } catch (error) {
  }
  return totalTokens;
}
function generateWarningMessage(tokenCount) {
  const percentage = Math.min(100, Math.round(tokenCount / CONFIG.URGENT_THRESHOLD * 100));
  if (tokenCount >= CONFIG.URGENT_THRESHOLD) {
    return `
---
\u26A0\uFE0F **\u4E0A\u4E0B\u6587\u7D27\u6025\u8B66\u544A** \u26A0\uFE0F

\u5F53\u524D\u4E0A\u4E0B\u6587\u5DF2\u8D85\u8FC7 ${CONFIG.URGENT_THRESHOLD.toLocaleString()} tokens\uFF01

\u{1F4CA} **\u4F30\u7B97\u5927\u5C0F**: ${tokenCount.toLocaleString()} tokens (${percentage}%)
\u{1F4BE} **\u5EFA\u8BAE\u64CD\u4F5C**: \u8BF7\u7ACB\u5373\u6267\u884C /compact \u538B\u7F29\u4E0A\u4E0B\u6587

\u5982\u679C\u4E0D\u538B\u7F29\uFF0C\u53EF\u80FD\u4F1A\uFF1A
- \u5F71\u54CD\u54CD\u5E94\u901F\u5EA6
- \u5BFC\u81F4\u65E9\u671F\u5BF9\u8BDD\u5185\u5BB9\u88AB\u9057\u5FD8
- \u589E\u52A0\u9519\u8BEF\u7684\u98CE\u9669

**\u73B0\u5728\u5C31\u6267\u884C /compact \u5427\uFF01**
---
`;
  } else if (tokenCount >= CONFIG.WARNING_THRESHOLD) {
    return `
---
\u{1F4A1} **\u4E0A\u4E0B\u6587\u63D0\u793A**

\u5F53\u524D\u4E0A\u4E0B\u6587\u63A5\u8FD1 ${CONFIG.WARNING_THRESHOLD.toLocaleString()} tokens

\u{1F4CA} **\u4F30\u7B97\u5927\u5C0F**: ${tokenCount.toLocaleString()} tokens (${percentage}%)
\u{1F4A1} **\u5EFA\u8BAE**: \u8003\u8651\u6267\u884C /compact \u538B\u7F29\u4E0A\u4E0B\u6587\uFF0C\u4FDD\u6301\u6700\u4F73\u6027\u80FD

/compact \u4F1A\u4FDD\u7559\u5173\u952E\u4FE1\u606F\uFF0C\u538B\u7F29\u5197\u4F59\u5185\u5BB9
---
`;
  }
  return "";
}
function handlePostToolUse(input) {
  const { transcript_path, tool_name } = input;
  const skipTools = ["Ping", "Echo", "Read", "Glob", "Grep"];
  if (tool_name && skipTools.includes(tool_name)) {
    return { hookSpecificOutput: { hookEventName: "PostToolUse" } };
  }
  const now = Date.now();
  if (now - lastWarningTime < CONFIG.MIN_CHECK_INTERVAL) {
    return { hookSpecificOutput: { hookEventName: "PostToolUse" } };
  }
  const tokenCount = estimateContextTokens(transcript_path);
  if (tokenCount >= CONFIG.WARNING_THRESHOLD) {
    lastWarningTime = now;
    const warningMessage = generateWarningMessage(tokenCount);
    return {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: warningMessage
      }
    };
  }
  return { hookSpecificOutput: { hookEventName: "PostToolUse" } };
}
if (true) {
  (async () => {
    let inputData = {};
    try {
      const stdinBuffer = [];
      process.stdin.setEncoding("utf-8");
      await new Promise((resolve) => {
        process.stdin.on("data", (chunk) => {
          stdinBuffer.push(chunk);
        });
        process.stdin.on("end", () => {
          resolve();
        });
      });
      const stdinText = stdinBuffer.join("");
      if (stdinText.trim()) {
        try {
          inputData = JSON.parse(stdinText);
        } catch (e) {
        }
      }
    } catch (error) {
    }
    const output = handlePostToolUse(inputData);
    console.log(JSON.stringify(output));
  })();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handlePostToolUse
});
