'use strict';

const { getRunLogger } = require('./runlog');

// Centralized error handler so all scripts share consistent messaging.
function die(message, code = 1) {
  console.error(`error: ${message}`);
  const logger = getRunLogger();
  if (logger && typeof logger.finishError === 'function') {
    logger.finishError({ message, code });
  }
  process.exit(code);
}

module.exports = {
  die,
};
