#!/usr/bin/env node
// Kill processes listening on common dev ports (4200, 9229)
const { execSync } = require('child_process');
const ports = [4200, 9229];
function findPids() {
  try {
    const out = execSync('ss -ltnp', { encoding: 'utf8' });
    const pids = new Set();
    const re = /pid=(\d+),/g;
    const lines = out.split('\n');
    for (const line of lines) {
      for (const port of ports) {
        if (line.includes(':' + port) || line.includes(':' + port + ' ')) {
          let m;
          while ((m = re.exec(line)) !== null) {
            pids.add(parseInt(m[1], 10));
          }
        }
      }
    }
    return Array.from(pids);
  } catch (e) {
    return [];
  }
}

function killPids(pids) {
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
      console.log('killed', pid);
    } catch (e) {
      try { process.kill(pid, 'SIGKILL'); console.log('killed (SIGKILL)', pid); } catch (err) { console.error('failed to kill', pid, err.message); }
    }
  }
}

const pids = findPids();
if (pids.length === 0) {
  console.log('no dev server pids found');
  process.exit(0);
}
killPids(pids);
// remove pid file if exists
const fs = require('fs');
const pidFile = 'logs/console-server.pid';
if (fs.existsSync(pidFile)) {
  try { fs.unlinkSync(pidFile); console.log('removed', pidFile); } catch (e) {}
}
