'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Language map for code blocks
const LANGUAGE_MAP = {
  '1': 'text', '2': 'abap', '3': 'ada', '4': 'apache', '5': 'apex',
  '6': 'assembly', '7': 'bash', '8': 'csharp', '9': 'cpp', '10': 'c',
  '11': 'cobol', '12': 'css', '13': 'coffeescript', '14': 'd', '15': 'dart',
  '16': 'delphi', '17': 'django', '18': 'dockerfile', '19': 'erlang', '20': 'fortran',
  '21': 'foxpro', '22': 'go', '23': 'groovy', '24': 'html', '25': 'htmlbars',
  '26': 'http', '27': 'haskell', '28': 'json', '29': 'java', '30': 'javascript',
  '31': 'julia', '32': 'kotlin', '33': 'latex', '34': 'lisp', '35': 'logo',
  '36': 'lua', '37': 'matlab', '38': 'makefile', '39': 'markdown', '40': 'nginx',
  '41': 'objectivec', '42': 'openedgeabl', '43': 'php', '44': 'perl', '45': 'postscript',
  '46': 'powershell', '47': 'prolog', '48': 'protobuf', '49': 'python', '50': 'r',
  '51': 'rpg', '52': 'ruby', '53': 'rust', '54': 'sas', '55': 'scss',
  '56': 'sql', '57': 'scala', '58': 'scheme', '59': 'scratch', '60': 'shell',
  '61': 'swift', '62': 'thrift', '63': 'typescript', '64': 'vbscript', '65': 'visual',
  '66': 'xml', '67': 'yaml', '68': 'cmake', '69': 'diff', '70': 'gherkin',
  '71': 'graphql', '72': 'glsl', '73': 'properties', '74': 'solidity', '75': 'toml',
};

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
const TABLE_IMAGE_MAX_WIDTH = 160;

/**
 * Run lark-cli command
 * @param {string[]} args - Command arguments
 * @param {boolean} quiet - Suppress error output
 * @returns {string} Command output
 */
function runLarkCli(args, quiet = true) {
  try {
    const result = execSync(['lark-cli', ...args].join(' '), {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result;
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    if (quiet && output.includes('41050')) {
      return '';
    }
    if (!quiet) {
      process.stderr.write(err.stdout || '');
      process.stderr.write(err.stderr || '');
    }
    throw err;
  }
}

/**
 * Resolve wiki node token to doc_id
 * @param {string} nodeToken - Wiki node token
 * @returns {string} Doc ID
 */
function resolveWikiNode(nodeToken) {
  const raw = runLarkCli(['--format', 'json', 'get-node', nodeToken]);
  if (!raw) return '';
  const data = JSON.parse(raw);
  const objToken = data.obj_token;
  if (!objToken) {
    throw new Error(`get-node missing obj_token for wiki token: ${nodeToken}`);
  }
  return objToken;
}

/**
 * Get document blocks
 * @param {string} docId - Document ID
 * @returns {Object} Blocks data
 */
function getBlocks(docId) {
  const raw = runLarkCli(['--format', 'json', 'get-blocks', docId, '--all']);
  if (!raw) return { items: [] };
  return JSON.parse(raw);
}

/**
 * Get user info
 * @param {string} userId - User ID
 * @param {string} userIdType - User ID type
 * @returns {Object} User info
 */
function getUserInfo(userId, userIdType = 'user_id') {
  try {
    const raw = runLarkCli(['--format', 'json', 'get-user-info', userId, '--user-id-type', userIdType]);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Check if URL is a Lark/Feishu document URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isLarkDocUrl(url) {
  if (!url) return false;
  const larkPatterns = [
    /feishu\.cn/,
    /larksuite\.com/,
    /larkoffice\.com/,
    /feishu\.net/,
  ];
  return larkPatterns.some(pattern => pattern.test(url));
}

/**
 * Extract doc_id from URL
 * @param {string} docUrl - Document URL
 * @returns {string} Doc ID
 */
function extractDocId(docUrl) {
  if (!docUrl) {
    throw new Error('doc_url is required');
  }

  const url = new URL(docUrl);
  const query = url.searchParams;

  // Check query parameters
  for (const key of ['doc_id', 'docId', 'document_id']) {
    if (query.has(key)) {
      return query.get(key);
    }
  }

  const segments = url.pathname.split('/').filter(seg => seg);

  // Check for wiki path
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === 'wiki' && i + 1 < segments.length) {
      const resolved = resolveWikiNode(segments[i + 1]);
      if (resolved) return resolved;
    }
  }

  // Check for docx/docs/doc path
  for (let i = 0; i < segments.length; i++) {
    if (['docx', 'docs', 'doc', 'wiki'].includes(segments[i]) && i + 1 < segments.length) {
      return segments[i + 1];
    }
  }

  // Fallback: find long alphanumeric string
  const match = docUrl.match(/[A-Za-z0-9]{20,}/);
  if (match) {
    if (url.pathname.includes('/wiki/')) {
      const resolved = resolveWikiNode(match[0]);
      if (resolved) return resolved;
    }
    return match[0];
  }

  throw new Error(`Unable to extract doc_id from url: ${docUrl}`);
}

/**
 * Safe URL decode
 * @param {string} url - URL to decode
 * @returns {string}
 */
function safeUnquote(url) {
  if (!url) return '';
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

/**
 * Apply text style to content
 * @param {string} text - Text content
 * @param {Object} style - Style object
 * @returns {string}
 */
function applyTextStyle(text, style) {
  let styled = text;
  if (style.inline_code) styled = `\`${styled}\``;
  if (style.bold) styled = `**${styled}**`;
  if (style.italic) styled = `*${styled}*`;
  if (style.underline) styled = `<u>${styled}</u>`;
  if (style.strikethrough) styled = `~~${styled}~~`;
  const link = style.link || {};
  const url = safeUnquote(typeof link === 'object' ? link.url || '' : '');
  if (url) styled = `[${styled}](${url})`;
  return styled;
}

/**
 * Extract text from elements
 * @param {Array} elements - Block elements
 * @param {Function} mentionResolver - Function to resolve user mentions
 * @returns {string}
 */
function textFromElements(elements, mentionResolver) {
  const parts = [];
  for (const el of elements) {
    if (el.text_run) {
      const tr = el.text_run;
      const content = tr.content || '';
      const style = tr.text_element_style || {};
      parts.push(applyTextStyle(content, style));
    } else if (el.mention_user) {
      const userId = el.mention_user.user_id || '';
      if (mentionResolver && userId) {
        parts.push(mentionResolver(userId));
      } else {
        parts.push(userId ? `@${userId}` : '@user');
      }
    } else if (el.mention_doc) {
      const doc = el.mention_doc;
      const title = doc.title || 'doc';
      const url = safeUnquote(doc.url || '');
      parts.push(url ? `[${title}](${url})` : title);
    } else if (el.equation) {
      const eq = el.equation.content || '';
      parts.push(`$${eq}$`);
    } else if (el.file) {
      const token = el.file.file_token || '';
      parts.push(token ? `\`file:${token}\`` : '`file`');
    } else if (el.inline_block) {
      parts.push('`inline_block`');
    }
  }
  return parts.join('');
}

/**
 * Escape markdown table cell
 * @param {string} text - Cell text
 * @returns {string}
 */
function escapeMdTableCell(text) {
  if (text == null) return '';
  return text.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

/**
 * HTML escape
 * @param {string} text - Text to escape
 * @returns {string}
 */
function htmlEscape(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Detect image extension from file header
 * @param {string} filePath - File path
 * @returns {string}
 */
function detectImageExt(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const header = Buffer.alloc(32);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, header, 0, 32, 0);
  fs.closeSync(fd);

  if (header.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
  if (header.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return '.jpg';
  if (header.slice(0, 6).equals(Buffer.from('GIF87a')) || header.slice(0, 6).equals(Buffer.from('GIF89a'))) return '.gif';
  if (header.slice(0, 4).equals(Buffer.from('RIFF')) && header.slice(8, 12).includes(Buffer.from('WEBP'))) return '.webp';
  if (header.slice(0, 2).equals(Buffer.from('BM'))) return '.bmp';
  const headerStr = header.toString().trim();
  if (headerStr.startsWith('<?xml') || headerStr.startsWith('<svg')) return '.svg';
  return '';
}

/**
 * Lark Document Renderer
 */
class LarkDocRenderer {
  constructor(items, docId, assetsDir, assetsRel, downloadAssets = true) {
    this.items = items;
    this.docId = docId;
    this.assetsDir = assetsDir;
    this.assetsRel = assetsRel;
    this.downloadAssets = downloadAssets;
    this.index = {};
    for (const it of items) {
      this.index[it.block_id] = it;
    }
    this.userCache = {};
    this.userInfoCache = {};
  }

  findRoot() {
    for (const it of this.items) {
      if (it.block_type === 1 && !it.parent_id) {
        return it;
      }
    }
    return this.index[this.docId];
  }

  render() {
    const root = this.findRoot();
    if (!root) return '';
    const lines = [];
    const title = this.getPageTitle(root);
    if (title) {
      lines.push(`# ${title}`);
      lines.push('');
    }
    const children = root.children || [];
    lines.push(...this.renderChildren(children, 0));
    return lines.join('\n').trimEnd() + '\n';
  }

  getPageTitle(root) {
    const page = root.page || {};
    let title = textFromElements(page.elements || [], this.resolveMentionUser.bind(this));
    title = title.trim();
    if (!title) return '';
    if (root.children && root.children.length > 0) {
      const firstChild = this.index[root.children[0]];
      if (firstChild && firstChild.block_type >= 3 && firstChild.block_type <= 11) {
        const level = firstChild.block_type - 2;
        const key = `heading${level}`;
        const heading = firstChild[key] || {};
        const text = textFromElements(heading.elements || [], this.resolveMentionUser.bind(this));
        if (text.trim() === title) return '';
      }
    }
    return title;
  }

  resolveMentionUser(userId) {
    if (this.userCache[userId]) return this.userCache[userId];
    const info = this.getUserInfoCached(userId);
    if (!info) {
      const result = `@${userId}`;
      this.userCache[userId] = result;
      return result;
    }
    const name = info.name || info.en_name || userId;
    const result = `@${name}`;
    this.userCache[userId] = result;
    return result;
  }

  resolveMentionUserName(userId) {
    const info = this.getUserInfoCached(userId);
    if (!info) return `@${userId}`;
    const name = info.name || info.en_name || userId;
    return `@${name}`;
  }

  getUserInfoCached(userId) {
    if (this.userInfoCache[userId] !== undefined) return this.userInfoCache[userId];
    let userIdType = 'user_id';
    if (userId.startsWith('ou_')) userIdType = 'open_id';
    else if (userId.startsWith('on_')) userIdType = 'union_id';
    try {
      const info = getUserInfo(userId, userIdType);
      this.userInfoCache[userId] = info;
      return info;
    } catch {
      this.userInfoCache[userId] = null;
      return null;
    }
  }

  renderChildren(childIds, listLevel) {
    const lines = [];
    for (let idx = 0; idx < childIds.length; idx++) {
      const cid = childIds[idx];
      const block = this.index[cid];
      if (!block) continue;
      const { lines: blockLines, blockType } = this.renderBlock(block, listLevel);
      if (!blockLines || blockLines.length === 0) continue;
      lines.push(...blockLines);
      if (idx < childIds.length - 1) {
        const nextBlock = this.index[childIds[idx + 1]];
        const nextType = nextBlock ? nextBlock.block_type : null;
        if (this.shouldBlankAfter(blockType, listLevel)) {
          lines.push('');
        } else if (listLevel === 0 && [12, 13, 17].includes(blockType) && ![12, 13, 17].includes(nextType)) {
          lines.push('');
        }
      }
    }
    return lines;
  }

  shouldBlankAfter(blockType, listLevel) {
    if (listLevel > 0) return false;
    if ([12, 13, 17].includes(blockType)) return false;
    return true;
  }

  renderBlock(block, listLevel) {
    const blockType = block.block_type;

    // Text block
    if (blockType === 2) {
      const text = textFromElements((block.text || {}).elements || [], this.resolveMentionUser.bind(this));
      return { lines: [text], blockType };
    }

    // Heading blocks (3-11)
    if (blockType >= 3 && blockType <= 11) {
      const level = blockType - 2;
      const key = `heading${level}`;
      const heading = block[key] || {};
      const text = textFromElements(heading.elements || [], this.resolveMentionUser.bind(this));
      return { lines: [`${'#'.repeat(level)} ${text}`], blockType };
    }

    // Bullet list
    if (blockType === 12) {
      const text = textFromElements((block.bullet || {}).elements || [], this.resolveMentionUser.bind(this));
      const indent = '    '.repeat(listLevel);
      const lines = [`${indent}- ${text}`];
      const children = block.children || [];
      if (children.length > 0) {
        lines.push(...this.renderChildren(children, listLevel + 1));
      }
      return { lines, blockType };
    }

    // Ordered list
    if (blockType === 13) {
      const text = textFromElements((block.ordered || {}).elements || [], this.resolveMentionUser.bind(this));
      const seq = (block.ordered || {}).style?.sequence;
      const index = seq && /^\d+$/.test(String(seq)) ? seq : '1';
      const indent = '    '.repeat(listLevel);
      const lines = [`${indent}${index}. ${text}`];
      const children = block.children || [];
      if (children.length > 0) {
        lines.push(...this.renderChildren(children, listLevel + 1));
      }
      return { lines, blockType };
    }

    // Code block
    if (blockType === 14) {
      const code = block.code || {};
      const text = textFromElements(code.elements || [], this.resolveMentionUser.bind(this));
      const langId = (code.style || {}).language;
      const lang = LANGUAGE_MAP[String(langId)] || 'text';
      return { lines: [`\`\`\`${lang}`, text.trimEnd(), '```'], blockType };
    }

    // Quote block
    if (blockType === 15) {
      const text = textFromElements((block.quote || {}).elements || [], this.resolveMentionUser.bind(this));
      const qLines = text ? text.split('\n') : [''];
      return { lines: qLines.map(line => `> ${line}`), blockType };
    }

    // Todo block
    if (blockType === 17) {
      const todo = block.todo || {};
      const text = textFromElements(todo.elements || [], this.resolveMentionUser.bind(this));
      const done = (todo.style || {}).done || false;
      const check = done ? 'x' : ' ';
      const indent = '    '.repeat(listLevel);
      const lines = [`${indent}- [${check}] ${text}`];
      const children = block.children || [];
      if (children.length > 0) {
        lines.push(...this.renderChildren(children, listLevel + 1));
      }
      return { lines, blockType };
    }

    // Callout block
    if (blockType === 19) {
      const contentLines = this.renderChildren(block.children || [], 0);
      if (contentLines.length === 0) {
        return { lines: ['> **提示**'], blockType };
      }
      const first = contentLines[0];
      const lines = [first ? `> **提示** ${first}` : '> **提示**'];
      for (let i = 1; i < contentLines.length; i++) {
        lines.push(`> ${contentLines[i]}`);
      }
      return { lines, blockType };
    }

    // Divider
    if (blockType === 22) {
      return { lines: ['---'], blockType };
    }

    // Image
    if (blockType === 27) {
      const token = (block.image || {}).token;
      if (token) {
        const relPath = this.downloadMedia(token);
        if (relPath) {
          return { lines: [`![](${relPath})`], blockType };
        }
        return { lines: [`<!-- image download failed: ${token} -->`], blockType };
      }
      return { lines: [], blockType };
    }

    // Table
    if (blockType === 31) {
      return { lines: this.renderTable(block), blockType };
    }

    // Board (whiteboard)
    if (blockType === 43) {
      const token = (block.board || {}).token;
      if (token) {
        const relPath = this.downloadBoard(token);
        if (relPath) {
          return { lines: [`![](${relPath})`], blockType };
        }
        return { lines: [`<!-- image download failed: ${token} -->`], blockType };
      }
      return { lines: [], blockType };
    }

    // Diagram
    if (blockType === 21) {
      const token = (block.diagram || {}).token;
      if (token) {
        const relPath = this.downloadBoard(token);
        if (relPath) {
          return { lines: [`![](${relPath})`], blockType };
        }
        return { lines: [`<!-- image download failed: ${token} -->`], blockType };
      }
      return { lines: [], blockType };
    }

    // Container blocks (grid, column, etc.)
    if ([24, 25, 34].includes(blockType)) {
      const children = block.children || [];
      return { lines: this.renderChildren(children, listLevel), blockType };
    }

    return { lines: [], blockType };
  }

  downloadMedia(token) {
    // Check if already downloaded with extension
    for (const ext of IMAGE_EXTS) {
      const candidate = path.join(this.assetsDir, token + ext);
      if (fs.existsSync(candidate)) {
        return path.join(this.assetsRel, token + ext);
      }
    }

    const absPath = path.join(this.assetsDir, token);
    const attemptedDownload = this.downloadAssets && !fs.existsSync(absPath);

    if (attemptedDownload) {
      fs.mkdirSync(this.assetsDir, { recursive: true });
      try {
        runLarkCli([
          'download-media', token, absPath,
          '--extra', JSON.stringify({ drive_route_token: this.docId }),
        ]);
      } catch {
        return null;
      }
    }

    if (attemptedDownload && !fs.existsSync(absPath)) {
      return null;
    }

    const ext = detectImageExt(absPath);
    if (ext) {
      const finalPath = absPath + ext;
      if (!fs.existsSync(finalPath) && fs.existsSync(absPath)) {
        fs.renameSync(absPath, finalPath);
      } else if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
      }
      return path.join(this.assetsRel, token + ext);
    }
    return path.join(this.assetsRel, token);
  }

  downloadBoard(token) {
    const filename = `${token}.png`;
    const absPath = path.join(this.assetsDir, filename);
    const attemptedDownload = this.downloadAssets && !fs.existsSync(absPath);

    if (attemptedDownload) {
      fs.mkdirSync(this.assetsDir, { recursive: true });
      try {
        runLarkCli(['get-board-image', token, absPath]);
      } catch {
        return null;
      }
    }

    if (attemptedDownload && !fs.existsSync(absPath)) {
      return null;
    }

    return path.join(this.assetsRel, filename);
  }

  renderTable(block) {
    const table = block.table || {};
    const prop = table.property || {};
    const rows = prop.row_size || 0;
    const cols = prop.column_size || 0;
    const cells = table.cells || [];
    const mergeInfo = prop.merge_info || [];

    const complexTable = mergeInfo.some(info =>
      (info.row_span || 1) > 1 || (info.col_span || 1) > 1
    );

    const matrix = [];
    for (let idx = 0; idx < cells.length; idx++) {
      const r = cols ? Math.floor(idx / cols) : 0;
      const c = cols ? idx % cols : 0;
      while (matrix.length <= r) {
        matrix.push(new Array(cols).fill(null));
      }
      const span = mergeInfo[idx] || { row_span: 1, col_span: 1 };
      matrix[r][c] = { cellId: cells[idx], span };
    }

    if (complexTable) {
      return this.renderHtmlTable(matrix, rows, cols);
    }
    return this.renderMdTable(matrix, rows, cols);
  }

  renderMdTable(matrix, rows, cols) {
    const tableRows = [];
    for (let r = 0; r < rows; r++) {
      const rowCells = [];
      for (let c = 0; c < cols; c++) {
        const cell = r < matrix.length ? matrix[r][c] : null;
        const cellId = cell ? cell.cellId : null;
        const text = cellId ? this.getCellText(cellId) : '';
        rowCells.push(escapeMdTableCell(text));
      }
      tableRows.push(rowCells);
    }
    if (tableRows.length === 0) return [];
    const header = '| ' + tableRows[0].join(' | ') + ' |';
    const divider = '| ' + new Array(cols).fill('---').join(' | ') + ' |';
    const body = tableRows.slice(1).map(row => '| ' + row.join(' | ') + ' |');
    return [header, divider, ...body];
  }

  renderHtmlTable(matrix, rows, cols) {
    const skip = [];
    for (let r = 0; r < rows; r++) {
      skip.push(new Array(cols).fill(false));
    }

    const lines = ['<table>'];
    for (let r = 0; r < rows; r++) {
      lines.push('  <tr>');
      for (let c = 0; c < cols; c++) {
        if (skip[r][c]) continue;
        const cell = r < matrix.length ? matrix[r][c] : null;
        const cellId = cell ? cell.cellId : null;
        const span = cell ? cell.span : { row_span: 1, col_span: 1 };
        const rowSpan = Math.max(parseInt(span.row_span || 1), 1);
        const colSpan = Math.max(parseInt(span.col_span || 1), 1);

        for (let dr = 0; dr < rowSpan; dr++) {
          for (let dc = 0; dc < colSpan; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (r + dr < rows && c + dc < cols) {
              skip[r + dr][c + dc] = true;
            }
          }
        }

        const text = cellId ? this.getCellText(cellId, true) : '';
        const attrs = [];
        if (rowSpan > 1) attrs.push(`rowspan="${rowSpan}"`);
        if (colSpan > 1) attrs.push(`colspan="${colSpan}"`);
        const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
        lines.push(`    <td${attrStr}>${text}</td>`);
      }
      lines.push('  </tr>');
    }
    lines.push('</table>');
    return lines;
  }

  getCellText(cellId, asHtml = false) {
    if (!cellId) return '';
    const cell = this.index[cellId] || {};
    const parts = [];
    const resolver = asHtml
      ? this.resolveMentionUserName.bind(this)
      : this.resolveMentionUser.bind(this);

    for (const cid of (cell.children || [])) {
      const child = this.index[cid];
      if (!child) continue;
      const bt = child.block_type;
      let text = '';

      if (bt === 2) {
        text = textFromElements((child.text || {}).elements || [], resolver);
      } else if (bt >= 3 && bt <= 11) {
        const level = bt - 2;
        const key = `heading${level}`;
        text = textFromElements((child[key] || {}).elements || [], resolver);
      } else if (bt === 12) {
        text = textFromElements((child.bullet || {}).elements || [], resolver);
      } else if (bt === 13) {
        text = textFromElements((child.ordered || {}).elements || [], resolver);
      } else if (bt === 14) {
        text = textFromElements((child.code || {}).elements || [], resolver);
      } else if (bt === 15) {
        text = textFromElements((child.quote || {}).elements || [], resolver);
      } else if (bt === 17) {
        text = textFromElements((child.todo || {}).elements || [], resolver);
      } else if (bt === 27) {
        const token = (child.image || {}).token;
        if (token) {
          const relPath = this.downloadMedia(token);
          text = this.renderTableImage(relPath, asHtml);
        }
      } else if (bt === 43) {
        const token = (child.board || {}).token;
        if (token) {
          const relPath = this.downloadBoard(token);
          text = this.renderTableImage(relPath, asHtml);
        }
      } else if (bt === 21) {
        const token = (child.diagram || {}).token;
        if (token) {
          const relPath = this.downloadBoard(token);
          text = this.renderTableImage(relPath, asHtml);
        }
      }

      if (text) {
        parts.push(asHtml ? htmlEscape(text) : text);
      }
    }

    return asHtml ? parts.join('<br>') : parts.join('\n');
  }

  renderTableImage(relPath, asHtml) {
    if (!relPath) return '';
    const safeSrc = asHtml ? htmlEscape(relPath) : relPath;
    const style = `max-width:${TABLE_IMAGE_MAX_WIDTH}px;height:auto;`;
    return `<img src="${safeSrc}" alt="" style="${style}">`;
  }
}

/**
 * Convert Lark document to Markdown
 * @param {Object} options - Conversion options
 * @param {string} options.docUrl - Document URL
 * @param {string} options.outPath - Output markdown path
 * @param {string} [options.assetsDir] - Assets directory
 * @param {boolean} [options.downloadAssets=true] - Whether to download assets
 * @returns {Object} Result with markdown content and metadata
 */
function larkDocToMarkdown(options) {
  const { docUrl, outPath, assetsDir: customAssetsDir, downloadAssets = true } = options;

  const docId = extractDocId(docUrl);
  const absOutPath = path.resolve(outPath);
  const outDir = path.dirname(absOutPath) || process.cwd();
  const assetsDir = customAssetsDir || path.join(outDir, 'assets');
  const absAssetsDir = path.resolve(assetsDir);
  const assetsRel = path.relative(outDir, absAssetsDir);

  const data = getBlocks(docId);
  const items = data.items || [];

  const renderer = new LarkDocRenderer(items, docId, absAssetsDir, assetsRel, downloadAssets);
  const markdown = renderer.render();

  // Get document title from root
  const root = renderer.findRoot();
  let title = '';
  if (root) {
    const page = root.page || {};
    title = textFromElements(page.elements || [], () => '').trim();
  }

  // Write output file
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(absOutPath, markdown, 'utf-8');

  return {
    docId,
    title,
    outPath: absOutPath,
    markdown,
  };
}

module.exports = {
  isLarkDocUrl,
  extractDocId,
  larkDocToMarkdown,
  LarkDocRenderer,
  getBlocks,
};
