'use strict';

// Format an ISO timestamp without milliseconds to match legacy output.
function nowUtcIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// Format change id using local time to mirror the previous shell script.
function formatChangeIdNow() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `change-${yyyy}${mm}${dd}-${hh}${min}`;
}

module.exports = {
  nowUtcIso,
  formatChangeIdNow,
};
