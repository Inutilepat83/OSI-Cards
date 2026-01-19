/**
 * Log Deduplication Utility
 *
 * Prevents the same log message from being logged multiple times within a time window.
 * This prevents console flooding from loops, change detection cycles, or repeated operations.
 */

interface DeduplicationEntry {
  lastLogged: number;
  count: number;
  firstLogged: number;
}

// Global deduplication map: messageKey -> entry
const deduplicationMap = new Map<string, DeduplicationEntry>();

// Configuration
const DEDUPLICATION_WINDOW_MS = 5000; // 5 seconds - same message can only log once per 5 seconds
const MAX_DEDUPLICATION_ENTRIES = 1000; // Limit map size to prevent memory leaks
const CLEANUP_INTERVAL_MS = 30000; // Clean up old entries every 30 seconds

let lastCleanup = Date.now();

/**
 * Create a unique key from log message and optional context
 */
function createMessageKey(message: string, context?: string, level?: string): string {
  // Include level and context in key to allow same message at different levels/contexts
  const parts = [level || '', context || '', message].filter(Boolean);
  return parts.join('|');
}

/**
 * Clean up old deduplication entries to prevent memory leaks
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }
  lastCleanup = now;

  // Remove entries older than the deduplication window
  for (const [key, entry] of deduplicationMap.entries()) {
    if (now - entry.lastLogged > DEDUPLICATION_WINDOW_MS * 2) {
      deduplicationMap.delete(key);
    }
  }

  // If map is still too large, remove oldest entries
  if (deduplicationMap.size > MAX_DEDUPLICATION_ENTRIES) {
    const entries = Array.from(deduplicationMap.entries()).sort(
      (a, b) => a[1].lastLogged - b[1].lastLogged
    );

    const toRemove = entries.slice(0, deduplicationMap.size - MAX_DEDUPLICATION_ENTRIES);
    for (const [key] of toRemove) {
      deduplicationMap.delete(key);
    }
  }
}

/**
 * Check if a log message should be logged (not a duplicate within the time window)
 *
 * @param message - The log message
 * @param context - Optional context (e.g., component name, service name)
 * @param level - Optional log level
 * @returns Object with shouldLog (boolean) and suppressedCount (number of times this message was suppressed)
 */
export function shouldLogMessage(
  message: string,
  context?: string,
  level?: string
): { shouldLog: boolean; suppressedCount: number } {
  cleanupOldEntries();

  const key = createMessageKey(message, context, level);
  const now = Date.now();
  const entry = deduplicationMap.get(key);

  if (!entry) {
    // First time seeing this message - allow it
    deduplicationMap.set(key, {
      lastLogged: now,
      count: 0,
      firstLogged: now,
    });
    return { shouldLog: true, suppressedCount: 0 };
  }

  const timeSinceLastLog = now - entry.lastLogged;

  if (timeSinceLastLog >= DEDUPLICATION_WINDOW_MS) {
    // Enough time has passed - allow logging again
    // Show suppressed count if there were duplicates
    const suppressedCount = entry.count;
    deduplicationMap.set(key, {
      lastLogged: now,
      count: 0,
      firstLogged: entry.firstLogged,
    });
    return { shouldLog: true, suppressedCount };
  } else {
    // Within deduplication window - suppress this log
    entry.count++;
    entry.lastLogged = now; // Update last seen time
    return { shouldLog: false, suppressedCount: entry.count };
  }
}

/**
 * Get deduplication statistics for debugging
 */
export function getDeduplicationStats(): {
  totalEntries: number;
  suppressedMessages: Array<{ key: string; count: number; lastLogged: number }>;
} {
  const suppressedMessages = Array.from(deduplicationMap.entries())
    .filter(([_, entry]) => entry.count > 0)
    .map(([key, entry]) => ({
      key,
      count: entry.count,
      lastLogged: entry.lastLogged,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 most suppressed

  return {
    totalEntries: deduplicationMap.size,
    suppressedMessages,
  };
}

/**
 * Clear all deduplication entries (useful for testing or reset)
 */
export function clearDeduplicationCache(): void {
  deduplicationMap.clear();
}
