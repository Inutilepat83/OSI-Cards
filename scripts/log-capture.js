#!/usr/bin/env node

/**
 * Log Capture Script
 *
 * Captures console logs from the browser and writes them to /log folder
 * Can be run as a background process or called programmatically
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'log');
const LOG_FILE = path.join(LOG_DIR, `masonry-grid-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create write stream
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function writeLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  logStream.write(logLine);
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

// Export for use in other scripts
module.exports = {
  writeLog,
  LOG_DIR,
  LOG_FILE,
  logStream,
};

// If run directly, set up console interception
if (require.main === module) {
  // This would be used if we're running in Node.js context
  // For browser logs, we'll use a different approach
  console.log('Log capture script initialized');
  console.log(`Logs will be written to: ${LOG_FILE}`);
}












