/**
 * LSP Guidelines Module
 *
 * Manages CLAUDE.md LSP guidelines injection.
 */

const fs = require('fs');
const path = require('path');
const gitUtils = require('./git-utils');

/**
 * Get default CLAUDE.md template content
 * @returns {string} CLAUDE.md template
 */
function getClaudeMdTemplate() {
  return `# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Repository Overview

在此处添加您的仓库概述信息...

`;
}

/**
 * LSP Guidelines content to be injected into CLAUDE.md
 * @returns {string} LSP guidelines in markdown format
 */
function getLspGuidelines() {
  return `

<< ------- lsp intro start ------->>

## LSP 定位与查询准则

请务必使用 LSP (Language Server Protocol) 进行代码定位与查询，优先于传统的文本搜索和正则表达式匹配。

### 核心原则

1. **优先使用 LSP**: 当需要查找定义、引用、类型信息时，优先使用 LSP 相关工具而非 Grep/Glob
2. **语义理解**: LSP 能够理解代码语义，提供更准确的代码定位结果
3. **跨语言支持**: 利用各语言的 LSP 服务实现智能代码查询

### LSP 工具使用场景

| 场景 |   说明 |
|------|------|
| 查找定义 | 跳转到符号定义位置 |
| 查找引用 | 查找符号的所有引用 |
| 查找类型 | 跳转到类型定义 |
| 查找实现 | 查找接口实现 |
| 符号搜索 | 在工作区中搜索符号 |
| 代码补全 | 获取代码补全建议 |
| 悬停信息 | 获取符号的文档信息 |
| 重命名 | 重命名符号并更新所有引用 |

### 与传统工具的对比

- **Grep/Grep**: 基于文本匹配，无法理解代码语义，容易产生误报
- **LSP**: 基于语义理解，精确定位符号，减少误报

### 注意事项

- 确保项目已配置相应的 LSP 服务器
- 对于大型项目，LSP 索引可能需要时间初始化
- 当 LSP 不可用时，可以降级使用传统搜索工具

<< ------- lsp intro end ------->>
`;
}

/**
 * Check and ensure LSP guidelines in CLAUDE.md
 * Creates CLAUDE.md if it doesn't exist
 * @returns {Object} { updated: boolean, path: string|null, reason: string }
 */
function checkAndEnsureLspGuidelines() {
  const gitRoot = gitUtils.findGitRoot(process.cwd());
  if (!gitRoot) {
    return { updated: false, path: null, reason: 'no-git' };
  }

  const claudeMdPath = path.join(gitRoot, 'CLAUDE.md');
  const lspStartMarker = '<< ------- lsp intro start ------->>';
  const lspEndMarker = '<< ------- lsp intro end ------->>';

  let content = '';

  // Check if CLAUDE.md exists
  if (!fs.existsSync(claudeMdPath)) {
    // Create CLAUDE.md with template and LSP guidelines
    const template = getClaudeMdTemplate();
    const lspGuidelines = getLspGuidelines();

    try {
      fs.writeFileSync(claudeMdPath, template + lspGuidelines);
      return { updated: true, path: claudeMdPath, reason: 'created' };
    } catch (error) {
      return { updated: false, path: claudeMdPath, reason: 'create-failed' };
    }
  }

  // Read existing content
  try {
    content = fs.readFileSync(claudeMdPath, 'utf-8');
  } catch (error) {
    return { updated: false, path: claudeMdPath, reason: 'read-failed' };
  }

  // Check if LSP guidelines already exist
  if (content.includes(lspStartMarker) && content.includes(lspEndMarker)) {
    return { updated: false, path: claudeMdPath, reason: 'already-exists' };
  }

  // Append LSP guidelines
  const lspGuidelines = getLspGuidelines();
  let newContent = content;

  // Ensure there's a newline before adding the new section
  if (newContent && !newContent.endsWith('\n')) {
    newContent += '\n';
  }

  newContent += lspGuidelines;

  // Write updated content
  try {
    fs.writeFileSync(claudeMdPath, newContent);
    return { updated: true, path: claudeMdPath, reason: 'added' };
  } catch (error) {
    return { updated: false, path: claudeMdPath, reason: 'write-failed' };
  }
}

module.exports = {
  getClaudeMdTemplate,
  getLspGuidelines,
  checkAndEnsureLspGuidelines,
};
