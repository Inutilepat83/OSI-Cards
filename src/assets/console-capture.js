(function () {
  // Connect back to the console server WebSocket and forward console.* calls
  const port = (new URLSearchParams(location.search)).get('port') || 9229;
  const url = `ws://localhost:${port}`;
  let ws;

  // allow runtime enable/disable via window.__consoleCaptureEnabled
  if (typeof window.__consoleCaptureEnabled === 'undefined') window.__consoleCaptureEnabled = true;

  function connect() {
    ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      // Forward console messages
      ['log', 'info', 'warn', 'error', 'debug'].forEach(level => {
        const orig = console[level];
        console[level] = function (...args) {
          try {
            if (!window.__consoleCaptureEnabled) return orig && typeof orig === 'function' ? orig.apply(console, args) : undefined;
            const payload = JSON.stringify({ level, message: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '), meta: null });
            if (ws && ws.readyState === WebSocket.OPEN) ws.send(payload);
          } catch (e) {
            // ignore
          }
          if (orig && typeof orig === 'function') orig.apply(console, args);
        };
      });
    });

    ws.addEventListener('close', () => {
      setTimeout(connect, 1000);
    });

    ws.addEventListener('error', () => {
      // ignore
    });
  }

  // Only attach in development when served from localhost
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    connect();
  }
})();
