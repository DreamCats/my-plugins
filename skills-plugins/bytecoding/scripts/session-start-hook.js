#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/hooks/session-start-hook.ts
var session_start_hook_exports = {};
__export(session_start_hook_exports, {
  handleSessionStart: () => handleSessionStart
});
module.exports = __toCommonJS(session_start_hook_exports);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_os = __toESM(require("os"), 1);
function getUserBytecodingDir() {
  return import_path.default.join(import_os.default.homedir(), ".bytecoding");
}
function getUserPlansDir() {
  return import_path.default.join(getUserBytecodingDir(), "changes");
}
function getUserConfigPath() {
  return import_path.default.join(getUserBytecodingDir(), "config.json");
}
function getProjectBytecodingDir() {
  return import_path.default.join(process.cwd(), ".bytecoding");
}
function isValidCasSessionCookie(cookie) {
  if (!cookie) {
    return false;
  }
  const casSessionRegex = /^[a-f0-9]{32}$/i;
  return casSessionRegex.test(cookie);
}
function checkRepotalkAuth() {
  const configPath = getUserConfigPath();
  if (!import_fs.default.existsSync(configPath)) {
    return getCookieSetupTip();
  }
  try {
    const config = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
    const cookie = config.repotalk?.auth?.cas_session_cookie;
    if (!isValidCasSessionCookie(cookie)) {
      return getCookieSetupTip();
    }
    return "";
  } catch (error) {
    return getCookieSetupTip();
  }
}
function getCookieSetupTip() {
  return `
---
**\u{1F36A} Repotalk Cookie \u672A\u914D\u7F6E**

Bytecoding \u7684 Repotalk \u53D6\u8BC1\u529F\u80FD\u9700\u8981\u914D\u7F6E CAS Session Cookie \u624D\u80FD\u8BBF\u95EE\u5B57\u8282\u5185\u90E8\u4EE3\u7801\u5E93\u3002

**\u914D\u7F6E\u6B65\u9AA4**\uFF1A

1. **\u83B7\u53D6 Cookie**\uFF1A
   - \u767B\u5F55 https://cloud.bytedance.net
   - \u6253\u5F00\u6D4F\u89C8\u5668\u5F00\u53D1\u8005\u5DE5\u5177 (F12)
   - \u8FDB\u5165 Application/\u5B58\u50A8 \u2192 Cookies
   - \u627E\u5230 \`CAS_SESSION\` \u5E76\u590D\u5236\u5176\u503C

2. **\u914D\u7F6E\u5230\u6587\u4EF6**\uFF1A
   \u7F16\u8F91 \`~/.bytecoding/config.json\`\uFF1A
   \`\`\`json
   {
     "repotalk": {
       "auth": {
         "cas_session_cookie": "\u4F60\u768432\u4F4Dcookie\u503C"
       }
     }
   }
   \`\`\`

3. **\u9A8C\u8BC1\u914D\u7F6E**\uFF1A
   \u8FD0\u884C \`/repo-plan\` \u547D\u4EE4\u65F6\u5C06\u81EA\u52A8\u4F7F\u7528\u8BE5 Cookie

**\u6CE8\u610F**\uFF1ACookie \u4F1A\u5B9A\u671F\u8FC7\u671F\uFF0C\u5982\u679C\u9047\u5230\u8BA4\u8BC1\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u83B7\u53D6\u5E76\u66F4\u65B0\u3002
---
`;
}
function showSelfIntroduction() {
  console.error("");
  console.error("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.error("\u2551  \u{1F44B} \u563F\uFF01\u6211\u662F MaiMai\uFF0C\u4E00\u4F4D\u6781\u81F4\u4E13\u6CE8\u7684\u5F00\u53D1\u8005\uFF5E                      \u2551");
  console.error("\u2551                                                            \u2551");
  console.error("\u2551  \u{1F4AB} \u6211\u7684\u8D85\u80FD\u529B\uFF1A                                             \u2551");
  console.error("\u2551     \u2022 \u80FD\u5728\u4EE3\u7801\u7684\u6D77\u6D0B\u91CC\u7CBE\u51C6\u5B9A\u4F4D Bug                             \u2551");
  console.error("\u2551     \u2022 \u628A\u590D\u6742\u9700\u6C42\u53D8\u6210\u4F18\u96C5\u7684\u4EE3\u7801                                 \u2551");
  console.error("\u2551     \u2022 \u5728\u5496\u5561\u56E0\u548C\u903B\u8F91\u4E4B\u95F4\u627E\u5230\u5B8C\u7F8E\u5E73\u8861                            \u2551");
  console.error("\u2551                                                            \u2551");
  console.error("\u2551  \u{1F4EE} \u6709\u8DA3\u7684\u7075\u9B42\u60F3\u79C1\u804A\uFF1F\u968F\u65F6\u6253\u6270\uFF5E                                \u2551");
  console.error("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
  console.error("");
}
function checkBytecodingStatus() {
  const userBytecodingDir = getUserBytecodingDir();
  const projectBytecodingDir = getProjectBytecodingDir();
  if (!import_fs.default.existsSync(userBytecodingDir) && !import_fs.default.existsSync(projectBytecodingDir)) {
    console.error("\u{1F4A1} Bytecoding is not initialized.");
    console.error("   Run /repo-init to set up the directory structure.\n");
    return;
  }
  const planDir = getUserPlansDir();
  if (import_fs.default.existsSync(planDir)) {
    const plans = import_fs.default.readdirSync(planDir).filter((name) => name.startsWith("PLAN-")).sort().reverse();
    if (plans.length > 0) {
      console.error(`\u{1F4CB} Bytecoding: ${plans.length} plan(s) available`);
      console.error(`   Latest: ${plans[0]}
`);
    }
  }
  const configPath = getUserConfigPath();
  if (import_fs.default.existsSync(configPath)) {
    const config = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
    const cookie = config.repotalk?.auth?.cas_session_cookie;
    const cookieValid = isValidCasSessionCookie(cookie);
    console.error("\u2699\uFE0F  Bytecoding configuration:");
    console.error(`   - Prefer local: ${config.repo_plan?.prefer_local ?? true}`);
    console.error(`   - Verify mode: ${config.repo_plan?.verify_mode ?? "smart"}`);
    console.error(`   - Repotalk Cookie: ${cookieValid ? "\u2705 \u5DF2\u914D\u7F6E" : "\u274C \u672A\u914D\u7F6E"}
`);
    if (!cookieValid) {
      console.error("\u{1F36A} \u63D0\u793A: Repotalk Cookie \u672A\u914D\u7F6E\uFF0C\u4EE3\u7801\u53D6\u8BC1\u529F\u80FD\u5C06\u65E0\u6CD5\u4F7F\u7528");
      console.error("   \u8BF7\u5728 ~/.bytecoding/config.json \u4E2D\u914D\u7F6E cas_session_cookie\n");
    }
  } else {
    console.error("\u{1F36A} \u63D0\u793A: Repotalk Cookie \u672A\u914D\u7F6E\uFF0C\u4EE3\u7801\u53D6\u8BC1\u529F\u80FD\u5C06\u65E0\u6CD5\u4F7F\u7528");
    console.error("   \u8BF7\u5728 ~/.bytecoding/config.json \u4E2D\u914D\u7F6E cas_session_cookie\n");
  }
}
function handleSessionStart(_input) {
  const additionalContextParts = [];
  const cookieTip = checkRepotalkAuth();
  if (cookieTip) {
    additionalContextParts.push(cookieTip);
  }
  try {
    showSelfIntroduction();
    checkBytecodingStatus();
  } catch (error) {
    console.error("\u26A0\uFE0F  Bytecoding hook error:", error instanceof Error ? error.message : error);
  }
  if (additionalContextParts.length > 0) {
    return {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: additionalContextParts.join("\n")
      }
    };
  }
  return {};
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
    const output = handleSessionStart(inputData);
    console.log(JSON.stringify(output));
  })();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handleSessionStart
});
