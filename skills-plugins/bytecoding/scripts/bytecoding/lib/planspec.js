'use strict';

const fs = require('fs');
const { die } = require('./errors');
const { nowUtcIso } = require('./time');

function ensureExists(planspecPath) {
  if (!fs.existsSync(planspecPath)) {
    die(`planspec not found: ${planspecPath}`);
  }
}

function formatYamlScalar(value) {
  if (value === null || value === undefined || value === '') {
    return '""';
  }
  return JSON.stringify(value);
}

function parseYamlScalar(value) {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed === '""') {
    return '';
  }
  if (trimmed.startsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return trimmed;
    }
  }
  return trimmed;
}

function formatLarkDocsBlock(docs) {
  const lines = ['lark_docs:'];
  const entries = [
    ['proposal', docs.proposal],
    ['design', docs.design],
    ['tasks', docs.tasks],
  ];

  entries.forEach(([label, doc]) => {
    const docId = doc?.doc_id || '';
    const url = doc?.url || '';
    lines.push(`  ${label}:`);
    lines.push(`    doc_id: ${formatYamlScalar(docId)}`);
    lines.push(`    url: ${formatYamlScalar(url)}`);
  });

  lines.push('');
  return lines;
}

function upsertLarkDocs(planspecPath, docs) {
  ensureExists(planspecPath);
  const content = fs.readFileSync(planspecPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const blockLines = formatLarkDocsBlock(docs);

  let startIndex = -1;
  let endIndex = lines.length;

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].startsWith('lark_docs:')) {
      startIndex = i;
      for (let j = i + 1; j < lines.length; j += 1) {
        const line = lines[j];
        if (!line.trim()) {
          continue;
        }
        if (line.startsWith(' ') || line.startsWith('\t')) {
          continue;
        }
        endIndex = j;
        break;
      }
      break;
    }
  }

  let nextLines;
  if (startIndex === -1) {
    nextLines = lines.slice();
    if (nextLines.length && nextLines[nextLines.length - 1].trim()) {
      nextLines.push('');
    }
    nextLines.push(...blockLines);
  } else {
    nextLines = [
      ...lines.slice(0, startIndex),
      ...blockLines,
      ...lines.slice(endIndex),
    ];
  }

  fs.writeFileSync(planspecPath, nextLines.join('\n'));
}

function initPlanspec(changeId, description, outPath, options = {}) {
  const identity = options.gitIdentity || {};
  const gitName = identity.name || '';
  const gitEmail = identity.email || '';
  const larkEmail = gitEmail || '';

  const lines = [];
  lines.push(`# PlanSpec for ${changeId}`);
  lines.push('');
  lines.push(`change_id: ${changeId}`);

  if (!description) {
    lines.push('description: ""');
  } else {
    lines.push('description: |-');
    description.split(/\r?\n/).forEach((line) => {
      lines.push(`  ${line}`);
    });
  }

  lines.push(`created_at: ${nowUtcIso()}`);
  lines.push('');
  lines.push('# user');
  lines.push(`git_user_name: ${formatYamlScalar(gitName)}`);
  lines.push(`git_user_email: ${formatYamlScalar(gitEmail)}`);
  lines.push(`lark_email: ${formatYamlScalar(larkEmail)}`);
  lines.push('');
  lines.push('status: pending');
  lines.push('');
  lines.push('# outputs');
  lines.push('proposal: proposal.md');
  lines.push('design: design.md');
  lines.push('tasks: tasks.md');
  lines.push('');

  fs.writeFileSync(outPath, lines.join('\n'));
}

function updateStatus(planspecPath, newStatus) {
  ensureExists(planspecPath);

  const content = fs.readFileSync(planspecPath, 'utf8');
  const lines = content.split(/\r?\n/);
  let updated = false;

  const nextLines = lines.map((line) => {
    if (!updated && /^status:/.test(line)) {
      updated = true;
      return `status: ${newStatus}`;
    }
    return line;
  });

  if (!updated) {
    nextLines.push(`status: ${newStatus}`);
  }

  fs.writeFileSync(planspecPath, nextLines.join('\n'));
}

function upsertField(planspecPath, field, value) {
  ensureExists(planspecPath);
  const content = fs.readFileSync(planspecPath, 'utf8');
  const lines = content.split(/\r?\n/);
  let updated = false;
  const nextLines = lines.map((line) => {
    if (!updated && line.startsWith(`${field}:`)) {
      updated = true;
      return `${field}: ${formatYamlScalar(value)}`;
    }
    return line;
  });

  if (!updated) {
    if (nextLines.length && nextLines[nextLines.length - 1].trim()) {
      nextLines.push('');
    }
    nextLines.push(`${field}: ${formatYamlScalar(value)}`);
  }

  fs.writeFileSync(planspecPath, nextLines.join('\n'));
}

function appendField(planspecPath, field, value) {
  ensureExists(planspecPath);
  fs.appendFileSync(planspecPath, `${field}: ${value}\n`);
}

function readStatus(planspecPath) {
  ensureExists(planspecPath);
  const content = fs.readFileSync(planspecPath, 'utf8');
  const match = content.match(/^status:\s*([^\s#]+)/m);
  return match ? match[1] : null;
}

function readPlanspec(planspecPath) {
  ensureExists(planspecPath);
  const content = fs.readFileSync(planspecPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const data = { lark_docs: {} };
  let currentSection = '';
  let currentDoc = '';

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const indent = line.match(/^\s*/)[0].length;

    if (indent === 0) {
      const [key, ...rest] = trimmed.split(':');
      const value = rest.join(':').trim();
      if (key === 'lark_docs') {
        currentSection = 'lark_docs';
        currentDoc = '';
        return;
      }
      currentSection = '';
      data[key] = parseYamlScalar(value);
      return;
    }

    if (currentSection === 'lark_docs') {
      if (indent === 2) {
        currentDoc = trimmed.replace(/:$/, '');
        data.lark_docs[currentDoc] = {};
        return;
      }
      if (indent >= 4 && currentDoc) {
        const [key, ...rest] = trimmed.split(':');
        const value = rest.join(':').trim();
        data.lark_docs[currentDoc][key] = parseYamlScalar(value);
      }
    }
  });

  return data;
}

module.exports = {
  initPlanspec,
  updateStatus,
  upsertField,
  appendField,
  readStatus,
  ensureExists,
  upsertLarkDocs,
  formatYamlScalar,
  readPlanspec,
};
