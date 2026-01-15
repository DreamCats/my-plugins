'use strict';

function tokenizeInfoLine(infoLine) {
  const tokens = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = pattern.exec(infoLine)) !== null) {
    tokens.push(match[1] || match[2] || match[3]);
  }
  return tokens;
}

function parseCalloutInfo(infoLine) {
  const opts = {};
  const tokens = tokenizeInfoLine(infoLine);
  if (!tokens.length) {
    return opts;
  }

  const head = tokens[0];
  if (head.includes(':')) {
    const parts = head.split(':');
    if (parts[1]) {
      opts.type = parts.slice(1).join(':');
    }
  }

  for (const token of tokens.slice(1)) {
    if (token.includes('=')) {
      const [rawKey, rawValue] = token.split('=');
      const key = rawKey.toLowerCase();
      if (key === 'type' || key === 'callout-type') {
        opts[key] = rawValue;
      }
    }
  }

  if (opts['callout-type'] && !opts.type) {
    opts.type = opts['callout-type'];
  }

  return opts;
}

function parseSegments(markdownText) {
  const lines = markdownText.split(/\r?\n/);
  const segments = [];
  let buf = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const info = line.trim().slice(3).trim();
      const infoLower = info.toLowerCase();
      const isCallout = infoLower.startsWith('callout');
      const isPlantuml = infoLower.startsWith('plantuml');
      const isMermaid = infoLower.startsWith('mermaid');

      if (isCallout || isPlantuml || isMermaid) {
        if (buf.length) {
          segments.push(['markdown', buf.join('\n')]);
          buf = [];
        }
        i += 1;
        const blockLines = [];
        while (i < lines.length && !lines[i].startsWith('```')) {
          blockLines.push(lines[i]);
          i += 1;
        }
        const blockText = blockLines.join('\n');
        if (isCallout) {
          segments.push(['callout', info, blockText]);
        } else {
          const syntax = isPlantuml ? 'plantuml' : 'mermaid';
          segments.push(['diagram', syntax, blockText]);
        }
      } else {
        buf.push(line);
        i += 1;
        while (i < lines.length) {
          buf.push(lines[i]);
          if (lines[i].startsWith('```')) {
            break;
          }
          i += 1;
        }
      }
    } else {
      buf.push(line);
    }
    i += 1;
  }

  if (buf.length) {
    segments.push(['markdown', buf.join('\n')]);
  }

  return segments;
}

module.exports = {
  parseCalloutInfo,
  parseSegments,
};
