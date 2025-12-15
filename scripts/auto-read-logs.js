#!/usr/bin/env node

/**
 * Auto Read Logs Script
 *
 * Automatically reads and displays the most recent logs from /log folder
 * Can be run continuously to monitor logs in real-time
 */

const fs = require('fs');
const path = require('path');
const { readLogs, getLogSummary } = require('./read-logs');

const LOG_DIR = path.join(__dirname, '..', 'log');
const POLL_INTERVAL = 2000; // Check every 2 seconds

let lastFileCount = 0;
let lastLogCount = 0;

function watchLogs(options = {}) {
  const { watch = false, filter = null, limit = 50 } = options;

  if (watch) {
    console.log('👀 Watching for new logs... (Press Ctrl+C to stop)\n');

    setInterval(() => {
      const summary = getLogSummary();

      // Check if new logs appeared
      if (summary.totalLogs > lastLogCount || summary.files > lastFileCount) {
        console.clear();
        console.log(`📊 Log Summary: ${summary.files} files, ${summary.totalLogs} total entries\n`);

        const logs = readLogs({ limit, ...(filter ? { search: filter } : {}) });

        if (logs.length > 0) {
          console.log(`\n📋 Most Recent ${logs.length} Log Entries:\n`);
          console.log('='.repeat(80));

          logs.slice(0, 10).forEach((log, index) => {
            const time = new Date(log.timestamp || log.time).toISOString();
            const level = log.level?.toUpperCase() || 'INFO';
            const message = log.message || '';

            const levelColor = {
              ERROR: '\x1b[31m', // Red
              WARN: '\x1b[33m',  // Yellow
              INFO: '\x1b[36m',  // Cyan
              DEBUG: '\x1b[90m', // Gray
            }[level] || '';
            const reset = '\x1b[0m';

            console.log(`${levelColor}[${time}] [${level}]${reset} ${message}`);
            if (log.data && Object.keys(log.data).length > 0) {
              console.log(`  Data: ${JSON.stringify(log.data, null, 2).split('\n').join('\n  ')}`);
            }
          });

          if (logs.length > 10) {
            console.log(`\n... and ${logs.length - 10} more entries`);
          }
        }

        lastLogCount = summary.totalLogs;
        lastFileCount = summary.files;
      }
    }, POLL_INTERVAL);
  } else {
    // One-time read
    const logs = readLogs({ limit, ...(filter ? { search: filter } : {}) });
    const summary = getLogSummary();

    console.log(`\n📊 Log Summary: ${summary.files} files, ${summary.totalLogs} total entries\n`);

    if (logs.length > 0) {
      logs.forEach((log, index) => {
        const time = new Date(log.timestamp || log.time).toISOString();
        const level = log.level?.toUpperCase() || 'INFO';
        const message = log.message || '';
        const data = log.data ? JSON.stringify(log.data, null, 2) : '';

        console.log(`\n[${index + 1}] ${time} [${level}] ${message}`);
        if (data) {
          console.log('Data:', data);
        }
        console.log('-'.repeat(80));
      });
    } else {
      console.log('No logs found matching criteria');
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--filter':
      case '-f':
        options.filter = args[++i];
        break;
      case '--limit':
      case '-n':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node scripts/auto-read-logs.js [options]

Options:
  --watch, -w              Watch for new logs continuously
  --filter, -f <term>      Filter logs by search term
  --limit, -n <number>     Limit number of results (default: 50)
  --help, -h               Show this help message

Examples:
  node scripts/auto-read-logs.js --watch
  node scripts/auto-read-logs.js --filter "MasonryGrid" --limit 20
  node scripts/auto-read-logs.js --watch --filter "error"
        `);
        process.exit(0);
        break;
    }
  }

  watchLogs(options);
}

module.exports = { watchLogs };












