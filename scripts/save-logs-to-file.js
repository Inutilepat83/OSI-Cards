#!/usr/bin/env node

/**
 * Save Logs to File Script
 *
 * Takes JSON logs from stdin or a file and saves them to /log folder
 * Can be used to save browser console logs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const LOG_DIR = path.join(__dirname, '..', 'log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function saveLogs(logs, filename) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(LOG_DIR, filename || `masonry-grid-${timestamp}.log`);

  // If logs is a string, try to parse it
  let logArray;
  if (typeof logs === 'string') {
    try {
      logArray = JSON.parse(logs);
    } catch {
      // If not JSON, treat as single log entry
      logArray = [{ timestamp: Date.now(), level: 'info', message: logs }];
    }
  } else if (Array.isArray(logs)) {
    logArray = logs;
  } else {
    logArray = [logs];
  }

  // Write each log entry as a JSON line
  const stream = fs.createWriteStream(logFile, { flags: 'a' });
  logArray.forEach(log => {
    const logEntry = {
      timestamp: log.timestamp || Date.now(),
      level: log.level || 'info',
      message: log.message || String(log),
      data: log.data,
    };
    stream.write(JSON.stringify(logEntry) + '\n');
  });
  stream.end();

  console.log(`Logs saved to: ${logFile}`);
  return logFile;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage: node scripts/save-logs-to-file.js [options] [data]

Options:
  --file, -f <filename>   Specify output filename
  --stdin                  Read logs from stdin (JSON)
  --help, -h              Show this help message

Examples:
  # Save logs from JSON string
  echo '[{"level":"info","message":"test"}]' | node scripts/save-logs-to-file.js --stdin

  # Save logs from file
  cat logs.json | node scripts/save-logs-to-file.js --stdin --file custom.log
    `);
    process.exit(0);
  }

  let filename = null;
  let useStdin = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--file' || arg === '-f') {
      filename = args[++i];
    } else if (arg === '--stdin') {
      useStdin = true;
    }
  }

  if (useStdin) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    let input = '';
    rl.on('line', line => {
      input += line + '\n';
    });

    rl.on('close', () => {
      saveLogs(input.trim(), filename);
    });
  } else {
    // Save the provided argument as log
    const logs = args[args.length - 1];
    saveLogs(logs, filename);
  }
}

module.exports = { saveLogs };












