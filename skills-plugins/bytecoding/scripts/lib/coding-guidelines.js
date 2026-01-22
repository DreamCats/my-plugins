/**
 * Coding Guidelines Module
 *
 * Manages CLAUDE.md coding guidelines injection.
 */

const fs = require('fs');
const path = require('path');
const gitUtils = require('./git-utils');

/**
 * Coding Guidelines content to be injected into CLAUDE.md
 * @returns {string} Coding guidelines in markdown format
 */
function getCodingGuidelines() {
  return `

<< ------- coding guidelines start ------->>

## Coding Guidelines

在编写和修改代码时，请遵循以下开发准则：

- **保留现有行为和配置**: 不要随意改变现有代码的行为和配置，除非有明确需求
- **优先使用显式 if/else**: 避免嵌套的三元运算符，使用显式的 if/else 提高可读性
- **避免降低可读性的单行代码**: 不要为了简洁而牺牲代码的可读性
- **保持函数小而专注**: 每个函数应该只做一件事，保持简短和专注
- **不要重构架构级代码**: 除非有明确需求，否则不要重构架构层面的代码

<< ------- coding guidelines end ------->>
`;
}

/**
 * Check and ensure coding guidelines in CLAUDE.md
 * Creates CLAUDE.md if it doesn't exist
 * @returns {Object} { updated: boolean, path: string|null, reason: string }
 */
function checkAndEnsureCodingGuidelines() {
  const gitRoot = gitUtils.findGitRoot(process.cwd());
  if (!gitRoot) {
    return { updated: false, path: null, reason: 'no-git' };
  }

  const claudeMdPath = path.join(gitRoot, 'CLAUDE.md');
  const guidelinesStartMarker = '<< ------- coding guidelines start ------->>';
  const guidelinesEndMarker = '<< ------- coding guidelines end ------->>';

  let content = '';

  // Check if CLAUDE.md exists
  if (!fs.existsSync(claudeMdPath)) {
    // CLAUDE.md doesn't exist, will be created by lsp-guidelines module
    return { updated: false, path: claudeMdPath, reason: 'claude-md-not-exists' };
  }

  // Read existing content
  try {
    content = fs.readFileSync(claudeMdPath, 'utf-8');
  } catch (error) {
    return { updated: false, path: claudeMdPath, reason: 'read-failed' };
  }

  // Check if coding guidelines already exist
  if (content.includes(guidelinesStartMarker) && content.includes(guidelinesEndMarker)) {
    return { updated: false, path: claudeMdPath, reason: 'already-exists' };
  }

  // Append coding guidelines
  const codingGuidelines = getCodingGuidelines();
  let newContent = content;

  // Ensure there's a newline before adding the new section
  if (newContent && !newContent.endsWith('\n')) {
    newContent += '\n';
  }

  newContent += codingGuidelines;

  // Write updated content
  try {
    fs.writeFileSync(claudeMdPath, newContent);
    return { updated: true, path: claudeMdPath, reason: 'added' };
  } catch (error) {
    return { updated: false, path: claudeMdPath, reason: 'write-failed' };
  }
}

module.exports = {
  getCodingGuidelines,
  checkAndEnsureCodingGuidelines,
};
