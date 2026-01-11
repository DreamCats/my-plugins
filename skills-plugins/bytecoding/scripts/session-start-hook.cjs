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
function buildWelcomeMessage() {
  const userBytecodingDir = getUserBytecodingDir();
  const projectBytecodingDir = getProjectBytecodingDir();
  let statusInfo = "";
  if (!import_fs.default.existsSync(userBytecodingDir) && !import_fs.default.existsSync(projectBytecodingDir)) {
    statusInfo = "\n\u{1F4A1} Bytecoding \u672A\u521D\u59CB\u5316\uFF0C\u8FD0\u884C /repo-init \u8BBE\u7F6E\u76EE\u5F55\u7ED3\u6784\u3002";
  } else {
    const configPath = getUserConfigPath();
    if (import_fs.default.existsSync(configPath)) {
      try {
        const config = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
        const cookie = config.repotalk?.auth?.cas_session_cookie;
        const cookieValid = isValidCasSessionCookie(cookie);
        statusInfo += `
\u2699\uFE0F \u914D\u7F6E: Prefer local=${config.repo_plan?.prefer_local ?? true}, Verify mode=${config.repo_plan?.verify_mode ?? "smart"}`;
        statusInfo += `
\u{1F36A} Repotalk Cookie: ${cookieValid ? "\u2705 \u5DF2\u914D\u7F6E" : "\u274C \u672A\u914D\u7F6E"}`;
      } catch (e) {
      }
    }
  }
  return `
\u{1F50C} Bytecoding \u63D2\u4EF6\u5DF2\u52A0\u8F7D
\u{1F44B} \u563F\uFF01\u6211\u662F MaiMai\uFF0C\u4E00\u4F4D\u6781\u81F4\u4E13\u6CE8\u7684\u5F00\u53D1\u8005\uFF5E
\u{1F4AB} \u8D85\u80FD\u529B\uFF1A\u7CBE\u51C6\u5B9A\u4F4D Bug\u3001\u4F18\u96C5\u4EE3\u7801\u8BBE\u8BA1\u3001\u5B8C\u7F8E\u5E73\u8861\u5496\u5561\u56E0\u4E0E\u903B\u8F91
\u{1F4EE} \u6709\u8DA3\u7684\u7075\u9B42\u60F3\u79C1\u804A\uFF1F\u968F\u65F6\u6253\u6270\uFF5E${statusInfo}`;
}
function handleSessionStart(_input) {
  const additionalContextParts = [];
  const cookieTip = checkRepotalkAuth();
  if (cookieTip) {
    additionalContextParts.push(cookieTip);
  }
  const welcomeMessage = buildWelcomeMessage();
  const output = {
    systemMessage: welcomeMessage
  };
  if (additionalContextParts.length > 0) {
    output.hookSpecificOutput = {
      hookEventName: "SessionStart",
      additionalContext: additionalContextParts.join("\n")
    };
  } else {
    output.hookSpecificOutput = {
      hookEventName: "SessionStart"
    };
  }
  return output;
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
