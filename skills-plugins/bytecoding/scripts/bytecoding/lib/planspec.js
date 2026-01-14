'use strict';

const fs = require('fs');
const { die } = require('./errors');
const { nowUtcIso } = require('./time');

function ensureExists(planspecPath) {
  if (!fs.existsSync(planspecPath)) {
    die(`planspec not found: ${planspecPath}`);
  }
}

function initPlanspec(changeId, description, outPath) {
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
  lines.push('status: pending');
  lines.push('');
  lines.push('# outputs');
  lines.push('proposal: proposal.md');
  lines.push('design: design.md');
  lines.push('tasks: tasks.md');
  lines.push('');
  lines.push('spec_deltas: []');
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

module.exports = {
  initPlanspec,
  updateStatus,
  appendField,
  readStatus,
  ensureExists,
};
