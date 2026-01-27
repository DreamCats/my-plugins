'use strict';

const fs = require('fs');
const path = require('path');
const { findGitRoot } = require('./paths');

const GUIDELINES_START_MARKER = '<< ------- coding guidelines start ------->>';
const GUIDELINES_END_MARKER = '<< ------- coding guidelines end ------->>';

/**
 * Get Coding Guidelines content
 * @returns {string} Coding guidelines in markdown format
 */
function getCodingGuidelines() {
  return `

${GUIDELINES_START_MARKER}

# Coding Guidelines

- Preserve existing behavior and configuration
- Prefer explicit if/else over nested ternaries
- Avoid one-liners that reduce readability
- Keep functions small and focused
- Do not refactor architecture-level code

${GUIDELINES_END_MARKER}
`;
}

/**
 * Get default CLAUDE.md template
 * @returns {string} CLAUDE.md template
 */
function getClaudeMdTemplate() {
  return `# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Repository Overview

[在此添加仓库概述]

`;
}

/**
 * Check and ensure coding guidelines in CLAUDE.md
 * @returns {Object} { updated: boolean, reason: string }
 */
function checkAndEnsureCodingGuidelines() {
  const gitRoot = findGitRoot(process.cwd());
  if (!gitRoot) {
    return { updated: false, reason: 'no-git' };
  }

  const claudeMdPath = path.join(gitRoot, 'CLAUDE.md');

  // Check if CLAUDE.md exists
  if (!fs.existsSync(claudeMdPath)) {
    // Create CLAUDE.md with template and guidelines
    try {
      const content = getClaudeMdTemplate() + getCodingGuidelines();
      fs.writeFileSync(claudeMdPath, content);
      return { updated: true, reason: 'created' };
    } catch (error) {
      return { updated: false, reason: 'create-failed' };
    }
  }

  // Read existing content
  let content;
  try {
    content = fs.readFileSync(claudeMdPath, 'utf-8');
  } catch (error) {
    return { updated: false, reason: 'read-failed' };
  }

  // Check if guidelines already exist
  if (content.includes(GUIDELINES_START_MARKER) && content.includes(GUIDELINES_END_MARKER)) {
    return { updated: false, reason: 'already-exists' };
  }

  // Append guidelines
  let newContent = content;
  if (!newContent.endsWith('\n')) {
    newContent += '\n';
  }
  newContent += getCodingGuidelines();

  try {
    fs.writeFileSync(claudeMdPath, newContent);
    return { updated: true, reason: 'added' };
  } catch (error) {
    return { updated: false, reason: 'write-failed' };
  }
}

module.exports = {
  getCodingGuidelines,
  checkAndEnsureCodingGuidelines,
};
