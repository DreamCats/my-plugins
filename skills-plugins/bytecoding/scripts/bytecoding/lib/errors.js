'use strict';

// Centralized error handler so all scripts share consistent messaging.
function die(message, code = 1) {
  console.error(`error: ${message}`);
  process.exit(code);
}

module.exports = {
  die,
};
