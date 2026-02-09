#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const { isLarkDocUrl, larkDocToMarkdown } = require('../lib/lark-doc');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    url: null,
    projectRoot: process.cwd(),
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      result.url = args[i + 1];
      i++;
    } else if (args[i] === '--project-root' && args[i + 1]) {
      result.projectRoot = args[i + 1];
      i++;
    }
  }

  return result;
}

/**
 * Sanitize filename from title
 * @param {string} title - Document title
 * @returns {string}
 */
function sanitizeFilename(title) {
  if (!title) return 'untitled';
  // Remove/replace invalid characters
  return title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) || 'untitled';
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
function getDatePrefix() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Main function
 */
function main() {
  const args = parseArgs();

  if (!args.url) {
    console.error('Usage: lark-import.js --url <lark-doc-url> [--project-root <path>]');
    process.exit(1);
  }

  // Check if URL is a Lark document
  if (!isLarkDocUrl(args.url)) {
    console.log(JSON.stringify({
      success: false,
      error: 'Not a Lark/Feishu document URL',
      url: args.url,
    }));
    process.exit(0);
  }

  // Create imports directory
  const importsDir = path.join(args.projectRoot, '.livecoding', 'imports');
  fs.mkdirSync(importsDir, { recursive: true });

  // Create assets directory
  const assetsDir = path.join(importsDir, 'assets');

  try {
    // First pass: get title by converting without saving
    const tempResult = larkDocToMarkdown({
      docUrl: args.url,
      outPath: path.join(importsDir, 'temp.md'),
      assetsDir,
      downloadAssets: false,
    });

    // Generate final filename with date prefix and title
    const datePrefix = getDatePrefix();
    const sanitizedTitle = sanitizeFilename(tempResult.title);
    const filename = `${datePrefix}-${sanitizedTitle}.md`;
    const outPath = path.join(importsDir, filename);

    // Remove temp file
    if (fs.existsSync(path.join(importsDir, 'temp.md'))) {
      fs.unlinkSync(path.join(importsDir, 'temp.md'));
    }

    // Second pass: full conversion with assets
    const result = larkDocToMarkdown({
      docUrl: args.url,
      outPath,
      assetsDir,
      downloadAssets: true,
    });

    // Get relative path from project root
    const relativePath = path.relative(args.projectRoot, result.outPath);

    // Output result
    console.log(JSON.stringify({
      success: true,
      docId: result.docId,
      title: result.title || 'Untitled',
      path: relativePath,
      absolutePath: result.outPath,
      preview: result.markdown.substring(0, 500),
    }));

  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      error: err.message,
      url: args.url,
    }));
    process.exit(1);
  }
}

main();
