#!/usr/bin/env node

/**
 * Debug Log Server for Cursor Agent
 *
 * HTTP server that receives debug logs from browser instrumentation
 * and saves them to .cursor/debug.log in NDJSON format
 *
 * Run: node scripts/debug-log-server.js
 * Or: npm run debug:log:server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const PORT = 7242;
const LOG_FILE = path.join(__dirname, '..', '.cursor', 'debug.log');

// Import query engine
const { queryLogs } = require('./utils/debug-log-query-engine');

// Ensure .cursor directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create or truncate log file at startup
if (fs.existsSync(LOG_FILE)) {
  fs.truncateSync(LOG_FILE, 0);
  console.log(`📝 Cleared existing log file: ${LOG_FILE}`);
}

const server = http.createServer((req, res) => {
  // Get origin from request headers
  const origin = req.headers.origin;

  // Set CORS headers with specific origin and credentials support
  // Using specific origin instead of '*' is required when requests include credentials
  // Access-Control-Allow-Credentials: true is required when credentials mode is used
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle /health endpoint (for health checks)
  if (req.method === 'GET' && req.url === '/health') {
    const responseHeaders = { 'Content-Type': 'application/json' };
    if (origin) {
      responseHeaders['Access-Control-Allow-Origin'] = origin;
      responseHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
    res.writeHead(200, responseHeaders);
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'debug-log-server',
      logFile: LOG_FILE,
      logFileExists: fs.existsSync(LOG_FILE)
    }));
    return;
  }

  // Handle /query endpoint (for querying logs)
  if (req.method === 'GET' && req.url.startsWith('/query')) {
    const parsedUrl = url.parse(req.url, true);
    const queryParams = parsedUrl.query;

    try {
      // Parse filters from query params
      const filters = {};
      if (queryParams.hypothesisId) filters.hypothesisId = queryParams.hypothesisId;
      if (queryParams.sessionId) filters.sessionId = queryParams.sessionId;
      if (queryParams.runId) filters.runId = queryParams.runId;
      if (queryParams.location) filters.location = queryParams.location;
      if (queryParams.message) filters.message = queryParams.message;
      if (queryParams.timestampMin) filters.timestamp = { ...filters.timestamp, min: parseInt(queryParams.timestampMin) };
      if (queryParams.timestampMax) filters.timestamp = { ...filters.timestamp, max: parseInt(queryParams.timestampMax) };

      // Parse data field filters (format: data.sectionsCount=1 or data.sectionsCount.min=0&data.sectionsCount.max=10)
      const dataFilters = {};
      for (const [key, value] of Object.entries(queryParams)) {
        if (key.startsWith('data.')) {
          const fieldPath = key.substring(5); // Remove 'data.' prefix
          if (!dataFilters[fieldPath]) {
            dataFilters[fieldPath] = {};
          }
          if (key.endsWith('.min')) {
            dataFilters[fieldPath].min = parseInt(value);
          } else if (key.endsWith('.max')) {
            dataFilters[fieldPath].max = parseInt(value);
          } else {
            dataFilters[fieldPath].value = isNaN(value) ? value : parseFloat(value);
          }
        }
      }
      if (Object.keys(dataFilters).length > 0) {
        filters.data = dataFilters;
      }

      const options = {
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        search: queryParams.search || undefined,
        limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
        offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
      };

      // Parse aggregation
      if (queryParams.aggregate) {
        options.aggregate = {
          groupBy: queryParams.aggregate,
          count: true,
          sum: queryParams.aggregateSum === 'true',
          avg: queryParams.aggregateAvg === 'true',
          dataField: queryParams.aggregateDataField || undefined,
        };
      }

      const result = queryLogs(LOG_FILE, options);

      const responseHeaders = { 'Content-Type': 'application/json' };
      if (origin) {
        responseHeaders['Access-Control-Allow-Origin'] = origin;
        responseHeaders['Access-Control-Allow-Credentials'] = 'true';
      }
      res.writeHead(200, responseHeaders);
      res.end(JSON.stringify(result, null, 2));
      return;
    } catch (error) {
      console.error('Error querying logs:', error);
      const responseHeaders = { 'Content-Type': 'application/json' };
      if (origin) {
        responseHeaders['Access-Control-Allow-Origin'] = origin;
        responseHeaders['Access-Control-Allow-Credentials'] = 'true';
      }
      res.writeHead(500, responseHeaders);
      res.end(JSON.stringify({ error: error.message }));
      return;
    }
  }

  // Handle /logs endpoint (simpler interface - GET all logs with optional filters)
  if (req.method === 'GET' && req.url.startsWith('/logs')) {
    const parsedUrl = url.parse(req.url, true);
    const queryParams = parsedUrl.query;

    try {
      const filters = {};
      if (queryParams.hypothesisId) filters.hypothesisId = queryParams.hypothesisId;
      if (queryParams.sessionId) filters.sessionId = queryParams.sessionId;
      if (queryParams.runId) filters.runId = queryParams.runId;
      if (queryParams.location) filters.location = queryParams.location;
      if (queryParams.message) filters.message = queryParams.message;

      const options = {
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        search: queryParams.search || undefined,
        limit: queryParams.limit ? parseInt(queryParams.limit) : 100, // Default limit
        offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
      };

      const result = queryLogs(LOG_FILE, options);

      const responseHeaders = { 'Content-Type': 'application/json' };
      if (origin) {
        responseHeaders['Access-Control-Allow-Origin'] = origin;
        responseHeaders['Access-Control-Allow-Credentials'] = 'true';
      }
      res.writeHead(200, responseHeaders);
      res.end(JSON.stringify(result, null, 2));
      return;
    } catch (error) {
      console.error('Error querying logs:', error);
      const responseHeaders = { 'Content-Type': 'application/json' };
      if (origin) {
        responseHeaders['Access-Control-Allow-Origin'] = origin;
        responseHeaders['Access-Control-Allow-Credentials'] = 'true';
      }
      res.writeHead(500, responseHeaders);
      res.end(JSON.stringify({ error: error.message }));
      return;
    }
  }

  // Handle /ingest/{session-id} endpoint
  if (req.method === 'POST' && req.url.startsWith('/ingest/')) {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        // Handle both single JSON and NDJSON format
        const trimmedBody = body.trim();
        if (!trimmedBody) {
          throw new Error('Empty request body');
        }

        // Try to parse as single JSON first, then fall back to NDJSON
        let lines = [];
        try {
          // Try parsing as single JSON object
          JSON.parse(trimmedBody);
          lines = [trimmedBody]; // Single JSON object
        } catch {
          // Not single JSON, try NDJSON format (multiple JSON objects separated by newlines)
          lines = trimmedBody.split('\n').filter(line => line.trim());
        }

        let processedCount = 0;
        let lastLogEntry = null;

        for (const line of lines) {
          try {
            const logEntry = JSON.parse(line);

            // Append as NDJSON (one JSON object per line)
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(LOG_FILE, logLine, 'utf8');

            processedCount++;
            lastLogEntry = logEntry; // Keep last entry for console logging
          } catch (lineError) {
            // Silently skip invalid lines - don't log to avoid noise
            // Continue processing other lines even if one fails
          }
        }

        if (processedCount === 0) {
          throw new Error('No valid log entries found in request body');
        }

        // Set response headers including CORS headers
        const responseHeaders = { 'Content-Type': 'application/json' };
        if (origin) {
          responseHeaders['Access-Control-Allow-Origin'] = origin;
          responseHeaders['Access-Control-Allow-Credentials'] = 'true';
        }
        res.writeHead(200, responseHeaders);
        res.end(JSON.stringify({ success: true, processed: processedCount }));

        // Log to console for visibility - show timing data from last entry
        if (lastLogEntry) {
          const timestamp = new Date(lastLogEntry.timestamp || Date.now()).toISOString();
          const location = lastLogEntry.location || 'unknown';
          const message = lastLogEntry.message || '';
          const data = lastLogEntry.data || {};
          if (data.duration || data.totalDuration) {
            const duration = data.duration || data.totalDuration || 0;
            console.log(`[${timestamp}] ${location}: ${message} - ${duration.toFixed(2)}ms (${processedCount} entries)`);
          } else {
            console.log(`[${timestamp}] ${location}: ${message} (${processedCount} entries)`);
          }
        }
      } catch (error) {
        console.error('Error processing log:', error);
        const responseHeaders = { 'Content-Type': 'application/json' };
        if (origin) {
          responseHeaders['Access-Control-Allow-Origin'] = origin;
          responseHeaders['Access-Control-Allow-Credentials'] = 'true';
        }
        res.writeHead(400, responseHeaders);
        res.end(JSON.stringify({ error: error.message }));
      }
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request error' }));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`📝 Debug log server running on http://127.0.0.1:${PORT}`);
  console.log(`📁 Logs will be saved to: ${LOG_FILE}`);
  console.log(`🔍 Health check: http://127.0.0.1:${PORT}/health`);
  console.log(`🔍 Query endpoint: http://127.0.0.1:${PORT}/query`);
  console.log(`🔍 Logs endpoint: http://127.0.0.1:${PORT}/logs`);
  console.log(`\n✅ Server ready to receive debug logs from browser instrumentation.`);
  console.log(`   Cursor can read logs from: ${LOG_FILE}\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📝 Debug log server shutting down...');
  server.close(() => {
    console.log('✅ Debug log server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n📝 Debug log server shutting down...');
  server.close(() => {
    console.log('✅ Debug log server stopped');
    process.exit(0);
  });
});
