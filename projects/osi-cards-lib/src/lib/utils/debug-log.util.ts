/**
 * Debug Log Utility
 *
 * Utility function to send debug logs to a local debug server.
 * Uses batching and rate limiting to prevent resource exhaustion.
 *
 * GLOBAL KILL SWITCH: Set window.__DISABLE_DEBUG_LOGGING = true to disable all debug logging
 */

const DEFAULT_DEBUG_LOG_ENDPOINT =
  'http://127.0.0.1:7242/ingest/ae037419-79db-44fb-9060-a10d5503303a';

/**
 * Check if code is running on localhost (development environment)
 * This prevents debug log requests from being made in production
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * Check if debug logging should be enabled
 * Returns true only if:
 * - Running on localhost
 * - Not disabled via kill switch
 */
export function shouldEnableDebugLogging(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Must be on localhost
  if (!isLocalhost()) {
    return false;
  }

  // Check kill switch
  return !isDebugLoggingDisabled();
}

// Global kill switch - check localStorage first, then window flag
function isDebugLoggingDisabled(): boolean {
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
const BATCH_SIZE = 20; // Reduced from 50 - smaller batches
const BATCH_INTERVAL_MS = 2000; // Increased from 1000 - longer intervals
const MAX_QUEUE_SIZE = 100; // Reduced from 500 - smaller queue

// Rate limiting - more aggressive
const MIN_REQUEST_INTERVAL_MS = 500; // Increased from 100 - longer between requests
let lastRequestTime = 0;
let pendingRequests = 0;
const MAX_PENDING_REQUESTS = 2; // Reduced from 5 - fewer concurrent requests

// Server availability tracking
let debugServerAvailable = true;
let lastServerCheck = 0;
const SERVER_CHECK_INTERVAL = 10000; // Increased from 5000 - check less frequently
let resourceExhaustionCount = 0;
const MAX_RESOURCE_EXHAUSTION = 3; // Disable permanently after 3 failures

// Console fallback throttling to prevent 100k+ console logs
let consoleFallbackThrottle = { count: 0, lastReset: Date.now(), skipped: 0 };
const CONSOLE_FALLBACK_THROTTLE_WINDOW_MS = 1000; // 1 second window
const CONSOLE_FALLBACK_MAX_LOGS_PER_WINDOW = 5; // Max 5 console.debug logs per second (reduced from 20 to prevent flooding)

// Throttling warning deduplication - prevent warning message from being logged every second
let lastThrottleWarning = Date.now();
let totalSuppressedSinceLastWarning = 0;
const THROTTLE_WARNING_INTERVAL_MS = 10000; // 10 seconds - show warning at most once per 10 seconds

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
function flushLogQueue(endpoint: string): void {
  // Check kill switch first
  if (isDebugLoggingDisabled()) {
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

  try {
    // Send batch as NDJSON (one JSON object per line)
    const payload = batch.map((log) => JSON.stringify(log)).join('\n');

    // Wrap fetch in try-catch to handle CSP errors synchronously
    let fetchPromise: Promise<Response>;
    try {
      fetchPromise = fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-ndjson' },
        body: payload,
        keepalive: true,
      });
    } catch (cspError) {
      // CSP blocked the fetch synchronously - log to console and exit
      pendingRequests--;
      debugServerAvailable = false;
      lastServerCheck = now;
      isFlushing = false;
      // Log batch to console as fallback
      batch.forEach((log) => {
        try {
          console.debug(`[DebugLog] ${log.location}: ${log.message}`, log.data || {});
        } catch (e) {
          // Ignore console errors
        }
      });
      return;
    }

    fetchPromise
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
          setTimeout(() => flushLogQueue(endpoint), MIN_REQUEST_INTERVAL_MS);
        }
      })
      .catch((error) => {
        pendingRequests--;
        // Handle ERR_INSUFFICIENT_RESOURCES and other errors
        if (
          error.message?.includes('ERR_INSUFFICIENT_RESOURCES') ||
          error.name === 'TypeError' ||
          error.message?.includes('Failed to fetch')
        ) {
          // Resource exhaustion - increment counter
          resourceExhaustionCount++;

          // Permanently disable if too many failures
          if (resourceExhaustionCount >= MAX_RESOURCE_EXHAUSTION) {
            disableDebugLoggingPermanently();
            console.warn(
              '[DebugLog] Permanently disabled due to resource exhaustion. Set window.__DISABLE_DEBUG_LOGGING = false to re-enable.'
            );
            return;
          }

          // Disable temporarily
          debugServerAvailable = false;
          lastServerCheck = now;
          // Clear queue to prevent further resource issues
          logQueue = [];
        } else {
          debugServerAvailable = false;
          lastServerCheck = now;
          // Put failed batch back (limit retries)
          if (batch.length < MAX_QUEUE_SIZE) {
            logQueue.unshift(...batch);
          }
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
function scheduleFlush(endpoint: string): void {
  if (batchTimer !== null) {
    return; // Already scheduled
  }

  if (logQueue.length >= BATCH_SIZE) {
    // Queue is full, flush immediately
    flushLogQueue(endpoint);
  } else {
    // Schedule flush after interval
    batchTimer = window.setTimeout(() => {
      batchTimer = null;
      flushLogQueue(endpoint);
    }, BATCH_INTERVAL_MS);
  }
}

/**
 * Message deduplication for console fallback
 */
interface DeduplicationEntry {
  lastLogged: number;
  count: number;
}
const consoleFallbackDedup = new Map<string, DeduplicationEntry>();
const CONSOLE_FALLBACK_DEDUP_WINDOW_MS = 5000; // 5 seconds - same message only once per 5 seconds

/**
 * Message deduplication for sendDebugLog calls (prevents same message from being queued multiple times)
 */
const sendDebugLogDedup = new Map<string, DeduplicationEntry>();
const SEND_DEBUG_LOG_DEDUP_WINDOW_MS = 5000; // 5 seconds - same message only once per 5 seconds

/**
 * Check if a sendDebugLog call should be processed (deduplicated)
 * This prevents the same message+location from being queued multiple times within the deduplication window
 */
function shouldSendDebugLog(
  location: string,
  message: string
): { shouldSend: boolean; suppressedCount: number } {
  const key = `${location}|${message}`;
  const now = Date.now();
  const entry = sendDebugLogDedup.get(key);

  if (!entry) {
    sendDebugLogDedup.set(key, { lastLogged: now, count: 0 });
    return { shouldSend: true, suppressedCount: 0 };
  }

  const timeSinceLastLog = now - entry.lastLogged;
  if (timeSinceLastLog >= SEND_DEBUG_LOG_DEDUP_WINDOW_MS) {
    const suppressedCount = entry.count;
    sendDebugLogDedup.set(key, { lastLogged: now, count: 0 });
    return { shouldSend: true, suppressedCount };
  } else {
    entry.count++;
    entry.lastLogged = now;
    return { shouldSend: false, suppressedCount: entry.count };
  }
}

/**
 * Check if a console fallback message should be logged (deduplicated)
 */
function shouldLogConsoleFallbackMessage(
  message: string,
  location: string
): { shouldLog: boolean; suppressedCount: number } {
  const key = `${location}|${message}`;
  const now = Date.now();
  const entry = consoleFallbackDedup.get(key);

  if (!entry) {
    consoleFallbackDedup.set(key, { lastLogged: now, count: 0 });
    return { shouldLog: true, suppressedCount: 0 };
  }

  const timeSinceLastLog = now - entry.lastLogged;
  if (timeSinceLastLog >= CONSOLE_FALLBACK_DEDUP_WINDOW_MS) {
    const suppressedCount = entry.count;
    consoleFallbackDedup.set(key, { lastLogged: now, count: 0 });
    return { shouldLog: true, suppressedCount };
  } else {
    entry.count++;
    entry.lastLogged = now;
    return { shouldLog: false, suppressedCount: entry.count };
  }
}

/**
 * Check if console fallback logging should be allowed (throttled to prevent 100k+ logs)
 */
function shouldLogToConsoleFallback(): boolean {
  const now = Date.now();

  // Reset counter if window expired
  if (now - consoleFallbackThrottle.lastReset >= CONSOLE_FALLBACK_THROTTLE_WINDOW_MS) {
    // Accumulate suppressed count for warning message
    if (consoleFallbackThrottle.skipped > 0) {
      totalSuppressedSinceLastWarning += consoleFallbackThrottle.skipped;
    }

    // Log warning only if enough time has passed since last warning (deduplication)
    if (
      totalSuppressedSinceLastWarning > 0 &&
      now - lastThrottleWarning >= THROTTLE_WARNING_INTERVAL_MS
    ) {
      try {
        const timeSinceLastWarning = Math.round((now - lastThrottleWarning) / 1000);
        console.warn(
          `[DebugLog] Throttled ${totalSuppressedSinceLastWarning} console.debug logs in the last ${timeSinceLastWarning}s to prevent console flooding`
        );
        lastThrottleWarning = now;
        totalSuppressedSinceLastWarning = 0; // Reset after showing warning
      } catch (e) {
        // Ignore console errors
      }
    }

    consoleFallbackThrottle.count = 0;
    consoleFallbackThrottle.lastReset = now;
    consoleFallbackThrottle.skipped = 0;
  }

  // Check if we've exceeded the limit
  if (consoleFallbackThrottle.count >= CONSOLE_FALLBACK_MAX_LOGS_PER_WINDOW) {
    consoleFallbackThrottle.skipped++;
    return false; // Throttled
  }

  // Allow logging and increment counter
  consoleFallbackThrottle.count++;
  return true;
}

/**
 * Safe debug fetch - only makes request if on localhost and debug logging is enabled
 * Fails silently if server is unavailable (no console errors)
 *
 * @param endpoint - The endpoint URL
 * @param body - The request body (will be JSON stringified)
 * @returns Promise that resolves/rejects silently
 */
export function safeDebugFetch(endpoint: string, body: any): void {
  // Only make request on localhost
  if (!shouldEnableDebugLogging()) {
    return;
  }

  // Make fetch call with silent error handling
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {
    // Silently ignore all errors - server may not be running
    // This prevents console errors in production or when server is unavailable
    // Empty catch is intentional for silent failure
  });
}

/**
 * Send a debug log entry to the debug server.
 * Logs are batched and sent periodically to prevent resource exhaustion.
 * This function handles errors silently and will not throw or log errors if the server is unavailable.
 * Also logs to console as fallback if CSP blocks the fetch request (THROTTLED to prevent 100k+ logs).
 *
 * @param logData - The log data to send
 * @param endpoint - Optional custom endpoint URL (defaults to standard debug log endpoint)
 */
export function sendDebugLog(
  logData: {
    location: string;
    message: string;
    data?: any;
    timestamp?: number;
    sessionId?: string;
    runId?: string;
    hypothesisId?: string;
  },
  endpoint?: string
): void {
  // CRITICAL: Deduplicate sendDebugLog calls - prevent same message+location from being queued multiple times
  const dedupResult = shouldSendDebugLog(logData.location, logData.message);
  if (!dedupResult.shouldSend) {
    // Suppress duplicate - don't queue this log
    return;
  }

  // Check kill switch first - this is the most important check
  if (isDebugLoggingDisabled()) {
    // Still log to console even if kill switch is on (for debugging) - BUT THROTTLED AND DEDUPLICATED
    if (shouldLogToConsoleFallback()) {
      const dedupResult = shouldLogConsoleFallbackMessage(logData.message, logData.location);
      if (dedupResult.shouldLog) {
        try {
          const message =
            dedupResult.suppressedCount > 0
              ? `[DebugLog] ${logData.location}: ${logData.message} (${dedupResult.suppressedCount} similar messages suppressed)`
              : `[DebugLog] ${logData.location}: ${logData.message}`;
          console.debug(message, logData.data || {});
        } catch (e) {
          // Ignore console errors
        }
      }
    }
    return;
  }

  // Only send logs in development mode
  if (typeof window === 'undefined') {
    return;
  }

  const targetEndpoint = endpoint || DEFAULT_DEBUG_LOG_ENDPOINT;

  // Skip if server was recently determined to be unavailable
  const now = Date.now();
  if (!debugServerAvailable && now - lastServerCheck < SERVER_CHECK_INTERVAL) {
    // Log to console as fallback when server is unavailable - BUT THROTTLED AND DEDUPLICATED
    if (shouldLogToConsoleFallback()) {
      const dedupResult = shouldLogConsoleFallbackMessage(logData.message, logData.location);
      if (dedupResult.shouldLog) {
        try {
          const message =
            dedupResult.suppressedCount > 0
              ? `[DebugLog] ${logData.location}: ${logData.message} (${dedupResult.suppressedCount} similar messages suppressed)`
              : `[DebugLog] ${logData.location}: ${logData.message}`;
          console.debug(message, logData.data || {});
        } catch (e) {
          // Ignore console errors
        }
      }
    }
    return;
  }

  // Add to queue
  const entry: LogEntry = {
    ...logData,
    timestamp: logData.timestamp || Date.now(),
  };

  logQueue.push(entry);

  // Limit queue size - drop oldest entries if queue is too large
  if (logQueue.length > MAX_QUEUE_SIZE) {
    logQueue = logQueue.slice(-MAX_QUEUE_SIZE);
  }

  // Schedule flush (this will handle CSP errors gracefully)
  try {
    scheduleFlush(targetEndpoint);
  } catch (error) {
    // If scheduling fails (e.g., CSP error), log to console as fallback - BUT THROTTLED AND DEDUPLICATED
    if (shouldLogToConsoleFallback()) {
      const dedupResult = shouldLogConsoleFallbackMessage(logData.message, logData.location);
      if (dedupResult.shouldLog) {
        try {
          const message =
            dedupResult.suppressedCount > 0
              ? `[DebugLog] ${logData.location}: ${logData.message} (${dedupResult.suppressedCount} similar messages suppressed)`
              : `[DebugLog] ${logData.location}: ${logData.message}`;
          console.debug(message, logData.data || {});
        } catch (e) {
          // Ignore console errors
        }
      }
    }
  }
}
