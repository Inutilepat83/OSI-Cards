#!/usr/bin/env node

/**
 * Read Logs Script
 *
 * Reads and displays logs from the /log folder
 * Can filter by date, level, or search terms
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'log');

function readLogs(options = {}) {
  const {
    level,
    search,
    since,
    limit = 100,
    file,
  } = options;

  // If specific file requested
  if (file) {
    const filePath = path.join(LOG_DIR, file);
    if (fs.existsSync(filePath)) {
      return readLogFile(filePath, { level, search, since, limit });
    } else {
      console.error(`Log file not found: ${file}`);
      return [];
    }
  }

  // Read all log files
  if (!fs.existsSync(LOG_DIR)) {
    console.log('No log directory found. Creating it...');
    fs.mkdirSync(LOG_DIR, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(LOG_DIR)
    .filter(f => f.endsWith('.log') || f.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first

  if (files.length === 0) {
    console.log('No log files found in /log directory');
    return [];
  }

  const allLogs = [];
  for (const file of files) {
    const filePath = path.join(LOG_DIR, file);
    const logs = readLogFile(filePath, { level, search, since, limit: null });
    allLogs.push(...logs);
  }

  // Sort by timestamp
  allLogs.sort((a, b) => {
    const timeA = new Date(a.timestamp || a.time).getTime();
    const timeB = new Date(b.timestamp || b.time).getTime();
    return timeB - timeA; // Most recent first
  });

  return allLogs.slice(0, limit);
}

function readLogFile(filePath, options = {}) {
  const { level, search, since } = options;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const logs = [];
  for (const line of lines) {
    try {
      const log = JSON.parse(line);

      // Filter by level
      if (level && log.level !== level) {
        continue;
      }

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        const messageMatch = log.message?.toLowerCase().includes(searchLower);
        const dataMatch = JSON.stringify(log.data || {}).toLowerCase().includes(searchLower);
        if (!messageMatch && !dataMatch) {
          continue;
        }
      }

      // Filter by date
      if (since) {
        const logTime = new Date(log.timestamp || log.time).getTime();
        const sinceTime = new Date(since).getTime();
        if (logTime < sinceTime) {
          continue;
        }
      }

      logs.push(log);
    } catch {
      // Skip invalid JSON lines
    }
  }

  return logs;
}

function displayLogs(logs) {
  if (logs.length === 0) {
    console.log('No logs found matching criteria');
    return;
  }

  console.log(`\nFound ${logs.length} log entries:\n`);
  console.log('='.repeat(80));

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
}

function getLogSummary() {
  if (!fs.existsSync(LOG_DIR)) {
    return { files: 0, totalLogs: 0 };
  }

  const files = fs.readdirSync(LOG_DIR)
    .filter(f => f.endsWith('.log') || f.endsWith('.json'));

  let totalLogs = 0;
  files.forEach(file => {
    const filePath = path.join(LOG_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    totalLogs += lines.length;
  });

  return {
    files: files.length,
    totalLogs,
    filesList: files,
  };
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--level':
      case '-l':
        options.level = args[++i];
        break;
      case '--search':
      case '-s':
        options.search = args[++i];
        break;
      case '--since':
        options.since = args[++i];
        break;
      case '--limit':
      case '-n':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--file':
      case '-f':
        options.file = args[++i];
        break;
      case '--summary':
        const summary = getLogSummary();
        console.log('\nLog Summary:');
        console.log(`  Files: ${summary.files}`);
        console.log(`  Total Log Entries: ${summary.totalLogs}`);
        if (summary.filesList.length > 0) {
          console.log('\n  Files:');
          summary.filesList.forEach(file => {
            const filePath = path.join(LOG_DIR, file);
            const stats = fs.statSync(filePath);
            console.log(`    - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
          });
        }
        process.exit(0);
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node scripts/read-logs.js [options]

Options:
  --level, -l <level>     Filter by log level (info, warn, error, debug)
  --search, -s <term>     Search in log messages and data
  --since <date>          Only show logs since this date (ISO format)
  --limit, -n <number>    Limit number of results (default: 100)
  --file, -f <filename>   Read specific log file
  --summary               Show log summary
  --help, -h              Show this help message

Examples:
  node scripts/read-logs.js --level error
  node scripts/read-logs.js --search "MasonryGrid"
  node scripts/read-logs.js --since "2024-01-01T00:00:00Z" --limit 50
  node scripts/read-logs.js --summary
        `);
        process.exit(0);
        break;
    }
  }

  const logs = readLogs(options);
  displayLogs(logs);
}

module.exports = { readLogs, readLogFile, getLogSummary };












