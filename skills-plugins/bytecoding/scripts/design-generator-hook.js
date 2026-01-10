#!/usr/bin/env node
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/hooks/design-generator-hook.ts
import fs from "fs";
import path from "path";
function handleSubagentStop(input) {
  const { tool_name, tool_input, result, cwd } = input;
  if (tool_name !== "Task") {
    return { decision: "allow" };
  }
  const agentName = tool_input?.agentName || "";
  const prompt = tool_input?.prompt || "";
  if (!isDesignGeneratorTask(agentName, prompt)) {
    return { decision: "allow" };
  }
  console.log("\n\u{1F3A8} \u8BBE\u8BA1\u751F\u6210\u4EFB\u52A1\u5B8C\u6210!\n");
  const { designPath, tasksPath, outputDir } = findGeneratedFiles(cwd);
  if (!designPath || !tasksPath) {
    console.log("\u26A0\uFE0F  \u672A\u627E\u5230\u751F\u6210\u7684\u8BBE\u8BA1\u6587\u4EF6\n");
    console.log("\u{1F4A1} \u63D0\u793A: \u8BF7\u786E\u8BA4\u5B50\u4EE3\u7406\u662F\u5426\u6210\u529F\u5B8C\u6210\u4E86\u4EFB\u52A1\n");
    return { decision: "allow" };
  }
  const validation = validateGeneratedFiles(designPath, tasksPath);
  displaySummary(designPath, tasksPath, validation);
  showNextSteps(designPath, tasksPath, outputDir);
  return {
    decision: "allow",
    message: "\u8BBE\u8BA1\u751F\u6210\u4EFB\u52A1\u5DF2\u5B8C\u6210"
  };
}
function isDesignGeneratorTask(agentName, prompt) {
  if (agentName === "design-generator") {
    return true;
  }
  const designKeywords = [
    "design-generator",
    "\u751F\u6210\u8BBE\u8BA1",
    "design.md",
    "tasks.md",
    "\u6280\u672F\u8BBE\u8BA1",
    "\u4EFB\u52A1\u62C6\u89E3"
  ];
  return designKeywords.some(
    (keyword) => prompt.toLowerCase().includes(keyword.toLowerCase())
  );
}
function findGeneratedFiles(cwd) {
  const searchDirs = [
    path.join(cwd, ".bytecoding", "changes"),
    path.join(cwd, ".bytecoding", "plans"),
    cwd
  ];
  for (const baseDir of searchDirs) {
    if (!fs.existsSync(baseDir)) continue;
    const planDirs = fs.readdirSync(baseDir).filter((name) => name.startsWith("plan-") || name.startsWith("PLAN-")).sort().reverse();
    for (const planDir of planDirs) {
      const fullPath = path.join(baseDir, planDir);
      const designPath2 = path.join(fullPath, "design.md");
      const tasksPath2 = path.join(fullPath, "tasks.md");
      if (fs.existsSync(designPath2) && fs.existsSync(tasksPath2)) {
        return { designPath: designPath2, tasksPath: tasksPath2, outputDir: fullPath };
      }
    }
  }
  const designPath = path.join(cwd, "design.md");
  const tasksPath = path.join(cwd, "tasks.md");
  if (fs.existsSync(designPath) && fs.existsSync(tasksPath)) {
    return { designPath, tasksPath, outputDir: cwd };
  }
  return {};
}
function validateGeneratedFiles(designPath, tasksPath) {
  const result = {
    designValid: false,
    tasksValid: false,
    designSections: [],
    taskCount: 0
  };
  try {
    const designContent = fs.readFileSync(designPath, "utf-8");
    const requiredSections = [
      "\u67B6\u6784\u8BBE\u8BA1",
      "\u6570\u636E\u6A21\u578B",
      "\u63A5\u53E3\u8BBE\u8BA1",
      "\u5B9E\u73B0\u65B9\u6848",
      "\u6D4B\u8BD5\u7B56\u7565"
    ];
    result.designSections = requiredSections.filter(
      (section) => designContent.includes(section)
    );
    result.designValid = result.designSections.length >= 3;
  } catch (error) {
  }
  try {
    const tasksContent = fs.readFileSync(tasksPath, "utf-8");
    const taskMatches = tasksContent.match(/### Task \d+\.\d+/g);
    result.taskCount = taskMatches ? taskMatches.length : 0;
    result.tasksValid = result.taskCount > 0;
  } catch (error) {
  }
  return result;
}
function displaySummary(designPath, tasksPath, validation) {
  console.log("\u{1F4CA} \u751F\u6210\u7ED3\u679C\u6458\u8981:\n");
  console.log("\u2705 design.md:");
  console.log(`   \u8DEF\u5F84: ${designPath}`);
  console.log(`   \u72B6\u6001: ${validation.designValid ? "\u2713 \u6709\u6548" : "\u26A0 \u53EF\u80FD\u4E0D\u5B8C\u6574"}`);
  if (validation.designSections.length > 0) {
    console.log(`   \u5305\u542B\u7AE0\u8282: ${validation.designSections.join(", ")}`);
  }
  console.log("");
  console.log("\u2705 tasks.md:");
  console.log(`   \u8DEF\u5F84: ${tasksPath}`);
  console.log(`   \u72B6\u6001: ${validation.tasksValid ? "\u2713 \u6709\u6548" : "\u26A0 \u53EF\u80FD\u4E0D\u5B8C\u6574"}`);
  console.log(`   \u4EFB\u52A1\u6570\u91CF: ${validation.taskCount}`);
  console.log("");
}
function showNextSteps(designPath, tasksPath, outputDir) {
  console.log("\u{1F4CB} \u4E0B\u4E00\u6B65\u64CD\u4F5C:\n");
  console.log("1. \u67E5\u770B\u8BBE\u8BA1\u6587\u6863");
  console.log(`   cat ${designPath}
`);
  console.log("2. \u67E5\u770B\u4EFB\u52A1\u6E05\u5355");
  console.log(`   cat ${tasksPath}
`);
  if (outputDir) {
    console.log("3. \u67E5\u770B\u6240\u6709\u751F\u6210\u7684\u6587\u4EF6");
    console.log(`   ls -la ${outputDir}
`);
  }
  console.log("4. \u5F00\u59CB\u5B9E\u65BD\u4EFB\u52A1");
  console.log("   \u4F7F\u7528 /repo-apply \u547D\u4EE4\u5F00\u59CB\u6267\u884C\u4EFB\u52A1\u6E05\u5355\n");
  console.log("5. \u6216\u8005\u7EE7\u7EED\u5B8C\u5584\u8BBE\u8BA1");
  console.log("   \u4F7F\u7528 /repo-plan --detail-level=detailed \u91CD\u65B0\u751F\u6210\u66F4\u8BE6\u7EC6\u7684\u8BBE\u8BA1\n");
}
function main() {
  try {
    let inputData = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      inputData += chunk;
    });
    process.stdin.on("end", () => {
      const input = JSON.parse(inputData);
      const output = handleSubagentStop(input);
      if (output.message) {
        console.log(output.message);
      }
      process.exit(output.decision === "block" ? 2 : 0);
    });
  } catch (error) {
    console.error("Hook \u6267\u884C\u5931\u8D25:", error);
    process.exit(1);
  }
}
if (__require.main === module) {
  main();
}
export {
  handleSubagentStop,
  main
};
