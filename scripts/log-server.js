#!/usr/bin/env node

/**
 * Log Server
 *
 * Simple HTTP server that receives logs from the browser and saves them to /log folder
 * Run this alongside the dev server: node scripts/log-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001; // Different port from Angular dev server
const LOG_DIR = path.join(__dirname, '..', 'log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/api/logs/save' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { logs, timestamp, source } = data;

        if (!logs || !Array.isArray(logs)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid logs data' }));
          return;
        }

        // Create log file
        const logTimestamp = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
        const logFile = path.join(LOG_DIR, `masonry-grid-${logTimestamp}.log`);

        // Append each log entry as JSON line
        const stream = fs.createWriteStream(logFile, { flags: 'a' });
        logs.forEach(log => {
          const logEntry = {
            timestamp: log.time || log.timestamp || Date.now(),
            level: log.level || 'info',
            message: log.message || '',
            data: log.data,
            source: source || 'unknown',
          };
          stream.write(JSON.stringify(logEntry) + '\n');
        });
        stream.end();

        console.log(`✅ Saved ${logs.length} logs to ${logFile}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, file: logFile, count: logs.length }));
      } catch (error) {
        console.error('Error saving logs:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (parsedUrl.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`📝 Log server running on http://localhost:${PORT}`);
  console.log(`📁 Logs will be saved to: ${LOG_DIR}`);
  console.log(`\nTo use: Make sure this server is running when the app is in debug mode.`);
  console.log(`Logs will be automatically saved when generated.\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📝 Log server shutting down...');
  server.close(() => {
    console.log('✅ Log server stopped');
    process.exit(0);
  });
});








