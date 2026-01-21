/**
 * Minimal Angular polyfills file for the workspace.
 * Kept small to satisfy the angular.json reference.
 */
import 'zone.js';

// Suppress console errors for debug log server requests (expected when server is not running)
// This runs early to catch errors before Angular bootstraps
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  const shouldSuppress = (args: any[]): boolean => {
    const fullMessage = args.map((arg) => String(arg || '')).join(' ');
    return (
      fullMessage.includes('127.0.0.1:7242') ||
      fullMessage.includes('localhost:7242') ||
      fullMessage.includes('127.0.0.1:7245') ||
      fullMessage.includes('localhost:7245') ||
      fullMessage.includes('/ingest/') ||
      fullMessage.includes('7242') ||
      fullMessage.includes('7245') ||
      fullMessage.includes('ERR_CONNECTION_REFUSED') ||
      (fullMessage.includes('400') && fullMessage.includes('Bad Request'))
    );
  };

  console.error = (...args: any[]) => {
    if (shouldSuppress(args)) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (shouldSuppress(args)) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
