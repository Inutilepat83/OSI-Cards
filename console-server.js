#!/usr/bin/env node
// Lightweight console capture WebSocket server
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.CONSOLE_SERVER_PORT || 9229;
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'console.log');
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_BACKUPS = 3;
const PID_FILE = path.join(LOG_DIR, 'console-server.pid');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// If PID file exists and process is alive, assume server is already running
if (fs.existsSync(PID_FILE)) {
  try {
    const existingPid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'), 10);
    if (!Number.isNaN(existingPid)) {
      try {
        process.kill(existingPid, 0); // check if process exists
        console.warn(`Console capture server: PID file ${PID_FILE} exists and process ${existingPid} is running. Exiting.`);
        process.exit(0);
      } catch (e) {
        // process not running, remove stale pid file
        try { fs.unlinkSync(PID_FILE); } catch (_) {}
      }
    }
  } catch (e) {
    // ignore and continue
  }
}

function rotateIfNeeded() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const stat = fs.statSync(LOG_FILE);
    if (stat.size < MAX_BYTES) return;
    // rotate
    for (let i = MAX_BACKUPS - 1; i >= 0; i--) {
      const src = i === 0 ? LOG_FILE : `${LOG_FILE}.${i}`;
      const dest = `${LOG_FILE}.${i + 1}`;
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
      }
    }
  } catch (e) {
    console.error('Rotation error', e);
  }
}

function appendLog(msg) {
  try {
    rotateIfNeeded();
    fs.appendFileSync(LOG_FILE, msg + '\n');
  } catch (e) {
    console.error('Failed to write log', e);
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      let out = '';
      try {
        const msg = JSON.parse(body);
        out = `[BROWSER] ${new Date().toISOString()} ${msg.level.toUpperCase()} ` + (msg.args ? msg.args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') : body);
      } catch (e) {
        out = `[BROWSER] ${new Date().toISOString()} RAW ${body}`;
      }
      console.log(out);
      appendLog(out);
      // broadcast to ws clients
      if (wss && wss.clients) {
        wss.clients.forEach(ws => {
          try { ws.send(JSON.stringify({ type: 'log', payload: out })); } catch (e) {}
        });
      }
      res.writeHead(204);
      res.end();
    });
    return;
  }
  // Serve simple status for convenience
  if (req.method === 'GET' && req.url === '/logs') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    try {
      const content = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf-8') : '';
      res.end(content);
    } catch (e) { res.end(''); }
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('Console server running');
});

const wss = new WebSocket.Server({ server });
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');
  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      const out = `[BROWSER] ${new Date().toISOString()} ${msg.level ? msg.level.toUpperCase() : 'LOG'} ${msg.message || (msg.args ? msg.args.join(' ') : '')}`;
      console.log(out);
      appendLog(out);
      // broadcast to others
      wss.clients.forEach(client => { if (client !== ws && client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: 'log', payload: out })); });
    } catch (e) {
      console.log('[BROWSER] RAW', raw.toString());
    }
  });
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

// handle listen errors (port already in use) gracefully
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn(`Console capture server: port ${PORT} already in use — assuming another instance is running; exiting gracefully.`);
    process.exit(0);
  }
  console.error('Console server error', err);
  process.exit(1);
});

server.listen(PORT, () => console.log(`Console capture server listening on http://localhost:${PORT}`));

// write pid file
try {
  fs.writeFileSync(PID_FILE, String(process.pid), { encoding: 'utf-8' });
} catch (e) {
  console.warn('Failed to write pid file', e);
}

function removePidFile() {
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch (e) {
    console.warn('Failed to remove pid file', e);
  }
}

function gracefulShutdown() {
  console.log('\nConsole capture server shutting down...');
  removePidFile();
  // Unregister signal handlers to prevent multiple triggers
  process.removeListener('SIGINT', gracefulShutdown);
  process.removeListener('SIGTERM', gracefulShutdown);

  server.close(() => {
    process.exit(0);
  });

  // Force exit after a timeout if server doesn't close gracefully
  setTimeout(() => {
    process.exit(1);
  }, 2000);
}

process.on('exit', removePidFile); // Final fallback
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in console-server:', err);
  removePidFile();
  process.exit(1);
});
