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

// src/hooks/repotalk-service-hook.ts
var repotalk_service_hook_exports = {};
__export(repotalk_service_hook_exports, {
  handleSessionStart: () => handleSessionStart,
  handleUserPromptSubmit: () => handleUserPromptSubmit
});
module.exports = __toCommonJS(repotalk_service_hook_exports);
var CONFIG = {
  // 服务端口
  PORT: 3005,
  // 健康检查超时（毫秒）
  HEALTH_CHECK_TIMEOUT: 1e4,
  // 健康检查间隔（毫秒）
  HEALTH_CHECK_INTERVAL: 500,
  // 服务脚本路径（相对于 plugin root）
  SERVICE_SCRIPT: "scripts/repotalk-server/repotalk-index.js",
  // PID 文件路径
  PID_FILE: "scripts/repotalk-server/repotalk-server.pid"
};
function getServicePid(pidFilePath) {
  try {
    const fs = require("fs");
    if (fs.existsSync(pidFilePath)) {
      const pid = parseInt(fs.readFileSync(pidFilePath, "utf-8").trim(), 10);
      if (!isNaN(pid)) {
        return pid;
      }
    }
  } catch {
  }
  return null;
}
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
async function isServiceHealthy(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list"
      }),
      signal: AbortSignal.timeout(2e3)
    });
    return response.ok || response.status === 400;
  } catch {
    return false;
  }
}
async function startService(serviceScriptPath, pidFilePath) {
  try {
    const { spawn } = require("child_process");
    const fs = require("fs");
    const path = require("path");
    const logFilePath = path.join(path.dirname(serviceScriptPath), "repotalk-server.log");
    const serviceDir = path.dirname(serviceScriptPath);
    if (!fs.existsSync(serviceScriptPath)) {
      return { success: false, error: `Script not found: ${serviceScriptPath}` };
    }
    const child = spawn(process.execPath, [serviceScriptPath], {
      cwd: serviceDir,
      // 设置工作目录
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      // 使用 pipe 而不是 append
      windowsHide: true,
      env: {
        ...process.env,
        PORT: String(CONFIG.PORT),
        NODE_ENV: "production"
      }
    });
    let errorMsg = "";
    if (child.stderr) {
      child.stderr.on("data", (data) => {
        errorMsg += data.toString();
      });
    }
    const logStream = fs.createWriteStream(logFilePath, { flags: "a" });
    if (child.stdout) {
      child.stdout.pipe(logStream);
    }
    if (child.stderr) {
      child.stderr.pipe(logStream);
    }
    child.unref();
    fs.writeFileSync(pidFilePath, String(child.pid), "utf-8");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (!isProcessRunning(child.pid)) {
      logStream.end();
      return { success: false, error: `Process exited. Error: ${errorMsg || "Unknown error"}` };
    }
    setTimeout(() => {
      logStream.end();
    }, 3e3);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
async function waitForServiceHealthy(port, timeout, interval) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await isServiceHealthy(port)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
}
async function isPortInUse(port) {
  const net = require("net");
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      resolve(true);
    });
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port, "127.0.0.1");
  });
}
async function ensureServiceRunning(input) {
  const fs = require("fs");
  const path = require("path");
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
  const serviceScriptPath = path.join(pluginRoot, CONFIG.SERVICE_SCRIPT);
  const pidFilePath = path.join(pluginRoot, CONFIG.PID_FILE);
  if (!fs.existsSync(serviceScriptPath)) {
    return {
      success: false,
      message: `[RepoTalk] Service script not found: ${serviceScriptPath}`
    };
  }
  let message = "";
  const portInUse = await isPortInUse(CONFIG.PORT);
  if (portInUse) {
    if (await isServiceHealthy(CONFIG.PORT)) {
      message = `[RepoTalk] Service already running on port ${CONFIG.PORT} \u2713`;
      message += "\n[RepoTalk] Reusing existing service (no need to start)";
      return {
        success: true,
        message,
        systemMessage: `\u{1F50C} [RepoTalk] \u670D\u52A1\u5DF2\u5728\u8FD0\u884C (\u7AEF\u53E3 ${CONFIG.PORT})`
      };
    } else {
      message = `[RepoTalk] Port ${CONFIG.PORT} is in use but service not responding`;
      message += "\n[RepoTalk] Please check if another service is using this port";
      return {
        success: false,
        message,
        systemMessage: `\u26A0\uFE0F [RepoTalk] \u7AEF\u53E3 ${CONFIG.PORT} \u88AB\u5360\u7528\u4F46\u670D\u52A1\u672A\u54CD\u5E94`
      };
    }
  }
  message = `[RepoTalk] Port ${CONFIG.PORT} is available, starting service...`;
  const startResult = await startService(serviceScriptPath, pidFilePath);
  if (!startResult.success) {
    message += `
[RepoTalk] Failed to start service \u2717`;
    if (startResult.error) {
      message += `
[RepoTalk] Error: ${startResult.error}`;
    }
    message += `
[RepoTalk] Check logs at: ${path.join(pluginRoot, "scripts/repotalk-server/repotalk-server.log")}`;
    return {
      success: false,
      message,
      systemMessage: `\u274C [RepoTalk] \u670D\u52A1\u542F\u52A8\u5931\u8D25`
    };
  }
  const newPid = getServicePid(pidFilePath);
  message += `
[RepoTalk] Service started (PID: ${newPid})`;
  message += "\n[RepoTalk] Waiting for service to be ready...";
  if (await waitForServiceHealthy(CONFIG.PORT, CONFIG.HEALTH_CHECK_TIMEOUT, CONFIG.HEALTH_CHECK_INTERVAL)) {
    message += "\n[RepoTalk] Service is ready \u2713";
    message += `
[RepoTalk] Listening on http://localhost:${CONFIG.PORT}/mcp`;
    return {
      success: true,
      message,
      systemMessage: `\u2705 [RepoTalk] \u670D\u52A1\u5DF2\u542F\u52A8 (PID: ${newPid}, \u7AEF\u53E3 ${CONFIG.PORT})`
    };
  } else {
    message += "\n[RepoTalk] Warning: Service started but health check timed out";
    message += "\n[RepoTalk] The service may still be initializing...";
    return {
      success: true,
      message,
      systemMessage: `\u23F3 [RepoTalk] \u670D\u52A1\u542F\u52A8\u4E2D\uFF0C\u5065\u5EB7\u68C0\u67E5\u8D85\u65F6 (PID: ${newPid})`
    };
  }
}
async function handleSessionStart(input) {
  const result = await ensureServiceRunning(input);
  return {
    systemMessage: result.systemMessage,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: result.message
    }
  };
}
async function handleUserPromptSubmit(input) {
  const result = await ensureServiceRunning(input);
  if (!result.success) {
    return {
      systemMessage: result.systemMessage,
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: result.message
      }
    };
  }
  return {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit"
    }
  };
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
    const eventName = inputData.hook_event_name || "SessionStart";
    const output = eventName === "UserPromptSubmit" ? await handleUserPromptSubmit(inputData) : await handleSessionStart(inputData);
    console.log(JSON.stringify(output));
  })();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handleSessionStart,
  handleUserPromptSubmit
});
