/**
 * Debug Log Utility
 *
 * Utility function to send debug logs to a local debug server.
 * Uses batching and rate limiting to prevent resource exhaustion.
 *
 * GLOBAL KILL SWITCH:
 * - Set window.__DISABLE_DEBUG_LOGGING = true to disable all debug logging
 * - Or use: localStorage.setItem('__DISABLE_DEBUG_LOGGING', 'true')
 * - Or use: window.__debugLogging.disable()
 *
 * For inline fetch calls, import and use: isDebugLoggingEnabled() from './debug-log-global'
 */

const DEBUG_LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc';

// Global kill switch - check localStorage first, then window flag
// This function is also exported below for use in components
function isDebugLoggingDisabledInternal(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  // Check localStorage first (persists across page reloads)
  try {
    const disabled = localStorage.getItem('__DISABLE_DEBUG_LOGGING');
    if (disabled === 'true') {
      return true;
    }
  } catch (e) {
    // localStorage might be unavailable
  }

  // Check window flag (runtime override)
  return !!(window as any).__DISABLE_DEBUG_LOGGING;
}

// Circuit breaker - permanently disable logging after resource exhaustion
function disableDebugLoggingPermanently(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('__DISABLE_DEBUG_LOGGING', 'true');
  } catch (e) {
    // localStorage might be unavailable
  }

  (window as any).__DISABLE_DEBUG_LOGGING = true;
  logQueue = []; // Clear queue immediately
  if (batchTimer !== null) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
}

// Batching configuration - more aggressive to prevent browser issues
const BATCH_SIZE = 10; // Further reduced - smaller batches to prevent resource exhaustion
const BATCH_INTERVAL_MS = 3000; // Increased - longer intervals between batches
const MAX_QUEUE_SIZE = 50; // Further reduced - smaller queue to prevent memory issues

// Rate limiting - more aggressive
const MIN_REQUEST_INTERVAL_MS = 1000; // Increased - longer between requests
let lastRequestTime = 0;
let pendingRequests = 0;
const MAX_PENDING_REQUESTS = 1; // Only 1 concurrent request to prevent resource exhaustion

// Server availability tracking
let debugServerAvailable = true;
let lastServerCheck = 0;
const SERVER_CHECK_INTERVAL = 30000; // Increased - check less frequently
let resourceExhaustionCount = 0;
const MAX_RESOURCE_EXHAUSTION = 1; // Disable permanently after first failure to prevent browser issues

// Log queue for batching
interface LogEntry {
  location: string;
  message: string;
  data?: any;
  timestamp: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}

let logQueue: LogEntry[] = [];
let batchTimer: number | null = null;
let isFlushing = false;

/**
 * Flush the log queue by sending batched logs
 */
function flushLogQueue(endpoint?: string): void {
  // Check kill switch first
  if (isDebugLoggingDisabledInternal()) {
    logQueue = [];
    return;
  }

  if (isFlushing || logQueue.length === 0) {
    return;
  }

  // Check rate limiting
  const now = Date.now();
  if (pendingRequests >= MAX_PENDING_REQUESTS) {
    // Too many pending requests, skip this flush
    return;
  }

  if (now - lastRequestTime < MIN_REQUEST_INTERVAL_MS) {
    // Rate limit: schedule for later
    if (batchTimer === null) {
      batchTimer = window.setTimeout(() => flushLogQueue(endpoint), MIN_REQUEST_INTERVAL_MS);
    }
    return;
  }

  // Skip if server was recently determined to be unavailable
  if (!debugServerAvailable && now - lastServerCheck < SERVER_CHECK_INTERVAL) {
    return;
  }

  // Take a batch from the queue
  const batch = logQueue.splice(0, BATCH_SIZE);
  if (batch.length === 0) {
    return;
  }

  isFlushing = true;
  pendingRequests++;
  lastRequestTime = now;

  const targetEndpoint = endpoint || DEBUG_LOG_ENDPOINT;

  try {
    // Send batch as NDJSON (one JSON object per line)
    const payload = batch.map((log) => JSON.stringify(log)).join('\n');

    fetch(targetEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-ndjson' },
      body: payload,
      keepalive: true,
    })
      .then((response) => {
        pendingRequests--;
        if (response.ok) {
          debugServerAvailable = true;
        } else {
          debugServerAvailable = false;
          lastServerCheck = now;
          // Put failed batch back at the front of the queue (limit retries)
          if (batch.length < MAX_QUEUE_SIZE) {
            logQueue.unshift(...batch);
          }
        }
        isFlushing = false;
        // Continue flushing if there are more logs
        if (logQueue.length > 0) {
          setTimeout(() => flushLogQueue(targetEndpoint), MIN_REQUEST_INTERVAL_MS);
        }
      })
      .catch((error) => {
        pendingRequests--;
        // Silently handle all errors - debug log server failures are non-critical
        // Don't log errors to console to avoid noise
        const errorMessage = error?.message || String(error);
        const errorName = error?.name || '';

        // Handle ERR_INSUFFICIENT_RESOURCES and other critical errors
        if (
          errorMessage.includes('ERR_INSUFFICIENT_RESOURCES') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('network') ||
          errorName === 'TypeError' ||
          errorName === 'NetworkError'
        ) {
          // Resource exhaustion detected - permanently disable immediately
          resourceExhaustionCount++;

          // Permanently disable on first failure to prevent browser issues
          if (resourceExhaustionCount >= MAX_RESOURCE_EXHAUSTION) {
            disableDebugLoggingPermanently();
            // Only warn in development mode
            if (
              typeof window !== 'undefined' &&
              (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ) {
              console.warn(
                '[DebugLog] Permanently disabled due to resource exhaustion.',
                'To re-enable: localStorage.removeItem("__DISABLE_DEBUG_LOGGING") or window.__DISABLE_DEBUG_LOGGING = false'
              );
            }
            return;
          }

          // Disable temporarily and clear queue
          debugServerAvailable = false;
          lastServerCheck = now;
          logQueue = []; // Clear queue immediately to prevent further resource issues
        } else {
          // Other errors (400, 500, etc.) - disable temporarily but don't clear queue
          debugServerAvailable = false;
          lastServerCheck = now;
          // Don't retry failed batches to prevent queue buildup
        }
        isFlushing = false;
      });
  } catch (error) {
    pendingRequests--;
    // Handle synchronous errors (like JSON.stringify failures)
    debugServerAvailable = false;
    lastServerCheck = now;
    isFlushing = false;
  }
}

/**
 * Schedule a flush of the log queue
 */
function scheduleFlush(): void {
  if (batchTimer !== null) {
    return; // Already scheduled
  }

  if (logQueue.length >= BATCH_SIZE) {
    // Queue is full, flush immediately
    flushLogQueue();
  } else {
    // Schedule flush after interval
    batchTimer = window.setTimeout(() => {
      batchTimer = null;
      flushLogQueue();
    }, BATCH_INTERVAL_MS);
  }
}

/**
 * Send a debug log entry to the debug server.
 * Logs are batched and sent periodically to prevent resource exhaustion.
 * Errors are silently ignored to avoid cluttering console.
 *
 * @param logData - The log data to send
 */
export function sendDebugLog(logData: {
  location: string;
  message: string;
  data?: any;
  timestamp?: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}): void {
  // Check kill switch first - this is the most important check
  if (isDebugLoggingDisabledInternal()) {
    return;
  }

  // Only send logs in development mode
  if (typeof window === 'undefined' || (window as any).__PRODUCTION__) {
    return;
  }

  // Skip if server was recently determined to be unavailable
  const now = Date.now();
  if (!debugServerAvailable && now - lastServerCheck < SERVER_CHECK_INTERVAL) {
    return;
  }

  // Prevent queue from growing too large - drop new entries if queue is full
  if (logQueue.length >= MAX_QUEUE_SIZE) {
    // Drop oldest entries to make room
    logQueue = logQueue.slice(-Math.floor(MAX_QUEUE_SIZE * 0.8));
  }

  // Add to queue
  const entry: LogEntry = {
    ...logData,
    timestamp: logData.timestamp || Date.now(),
  };

  logQueue.push(entry);

  // Schedule flush
  scheduleFlush();
}

/**
 * Check if debug logging is disabled
 * Exported for use in components that need to check before inline fetch calls
 * Use isDebugLoggingEnabled() from './debug-log-global' for consistency
 */
export function isDebugLoggingDisabled(): boolean {
  return isDebugLoggingDisabledInternal();
}
