/**
 * Debug Log File Utility
 *
 * Writes debug logs to localStorage and provides export functionality.
 * This allows logs to be read even when the debug server is unavailable.
 */

interface LogEntry {
  location: string;
  message: string;
  data?: any;
  timestamp: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}

const STORAGE_KEY = 'osi-cards-debug-logs';
const MAX_LOG_ENTRIES = 250; // Reduced to prevent localStorage from getting too large
const MAX_ENTRY_SIZE_BYTES = 100 * 1024; // 100KB max per entry
const MAX_TOTAL_SIZE_BYTES = 1 * 1024 * 1024; // 1MB max total (conservative estimate)
const MIN_LOG_ENTRIES_ON_EMERGENCY = 50; // Keep at least 50 entries in emergency cleanup
const WRITE_DEBOUNCE_MS = 100; // Debounce rapid writes
const DISABLE_KEY = '__DISABLE_DEBUG_LOG_FILE';

/**
 * Check if logging is disabled (circuit breaker)
 */
function isLoggingDisabled(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    return (
      localStorage.getItem(DISABLE_KEY) === 'true' ||
      (window as any).__DISABLE_DEBUG_LOG_FILE === true
    );
  } catch {
    return false;
  }
}

/**
 * Disable logging permanently (circuit breaker)
 */
function disableLogging(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(DISABLE_KEY, 'true');
    (window as any).__DISABLE_DEBUG_LOG_FILE = true;
  } catch {
    // Ignore errors when disabling
  }
}

/**
 * Estimate the size of a log entry in bytes using TextEncoder for accurate UTF-8 encoding
 */
function estimateEntrySize(entry: LogEntry): number {
  try {
    const jsonString = JSON.stringify(entry);
    // Use TextEncoder for accurate UTF-8 byte size
    return new TextEncoder().encode(jsonString).length;
  } catch {
    // Fallback: rough estimate (UTF-8, not UTF-16)
    try {
      return JSON.stringify(entry).length;
    } catch {
      return 1024; // Conservative fallback
    }
  }
}

/**
 * Estimate the size of a JSON string in bytes
 */
function estimateStringSize(str: string): number {
  try {
    return new TextEncoder().encode(str).length;
  } catch {
    return str.length; // Fallback
  }
}

/**
 * Trim large data objects to prevent quota exceeded
 */
function trimLogEntry(entry: LogEntry): LogEntry {
  const trimmed = { ...entry };

  // If data is too large, replace with summary
  if (trimmed.data !== undefined) {
    const dataSize = estimateEntrySize({ ...trimmed, data: trimmed.data });
    if (dataSize > MAX_ENTRY_SIZE_BYTES) {
      // Replace large data with summary
      const dataType = typeof trimmed.data;
      const isObject = trimmed.data !== null && typeof trimmed.data === 'object';
      const isArray = Array.isArray(trimmed.data);

      if (isArray) {
        trimmed.data = {
          _truncated: true,
          _originalType: 'array',
          _length: trimmed.data.length,
          _preview: trimmed.data.slice(0, 3),
          _message: `Array with ${trimmed.data.length} items (truncated to prevent quota exceeded)`,
        };
      } else if (isObject) {
        const keys = Object.keys(trimmed.data);
        trimmed.data = {
          _truncated: true,
          _originalType: 'object',
          _keyCount: keys.length,
          _keys: keys.slice(0, 10),
          _message: `Object with ${keys.length} keys (truncated to prevent quota exceeded)`,
        };
      } else {
        const dataStr = String(trimmed.data);
        if (dataStr.length > 1000) {
          trimmed.data = {
            _truncated: true,
            _originalType: dataType,
            _preview: dataStr.substring(0, 100),
            _length: dataStr.length,
            _message: `${dataType} value truncated (${dataStr.length} chars)`,
          };
        }
      }
    }
  }

  return trimmed;
}

/**
 * Trim logs to fit within size limits (proactive cleanup)
 */
function trimLogsToFit(logs: LogEntry[], newEntry: LogEntry): LogEntry[] {
  let trimmed = [...logs, newEntry];

  // First, trim by count
  if (trimmed.length > MAX_LOG_ENTRIES) {
    trimmed = trimmed.slice(-MAX_LOG_ENTRIES);
  }

  // Then, estimate total size and trim if needed
  let totalSize = 0;
  for (const entry of trimmed) {
    totalSize += estimateEntrySize(entry);
  }

  // If still too large, remove oldest entries
  while (totalSize > MAX_TOTAL_SIZE_BYTES && trimmed.length > MIN_LOG_ENTRIES_ON_EMERGENCY) {
    const removed = trimmed.shift();
    if (removed) {
      totalSize -= estimateEntrySize(removed);
    }
  }

  // If still too large, reduce to minimal set (keep only most recent entries)
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    trimmed = trimmed.slice(-MIN_LOG_ENTRIES_ON_EMERGENCY);
  }

  return trimmed;
}

/**
 * Check if there's enough space in localStorage and clean up proactively if needed
 */
function ensureSpaceAvailable(requiredBytes: number): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Try to estimate current localStorage usage
    let currentSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          currentSize += estimateStringSize(key + value);
        }
      }
    }

    // Estimate available space (most browsers have 5-10MB limit, use 4MB as conservative estimate)
    const ESTIMATED_QUOTA = 4 * 1024 * 1024; // 4MB
    const availableSpace = ESTIMATED_QUOTA - currentSize;

    // If we need more space than available, proactively clean up our logs
    if (requiredBytes > availableSpace) {
      const existingLogsJson = localStorage.getItem(STORAGE_KEY);
      if (existingLogsJson) {
        try {
          const logs: LogEntry[] = JSON.parse(existingLogsJson);
          // Keep only most recent entries
          const reducedLogs = logs.slice(-MIN_LOG_ENTRIES_ON_EMERGENCY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedLogs));
          return true;
        } catch {
          // If parsing fails, clear the key
          localStorage.removeItem(STORAGE_KEY);
          return true;
        }
      }
    }

    return true;
  } catch {
    // If we can't check, assume it's okay and let the write attempt handle errors
    return true;
  }
}

// Pending log entries queue for debouncing
let pendingLogEntries: LogEntry[] = [];
let writeDebounceTimer: number | null = null;

/**
 * Actually write logs to localStorage (called after debounce)
 */
function writeLogsToStorage(): void {
  if (typeof window === 'undefined' || isLoggingDisabled() || pendingLogEntries.length === 0) {
    return;
  }

  // Process all pending entries
  const entriesToAdd = [...pendingLogEntries];
  pendingLogEntries = [];
  writeDebounceTimer = null;

  try {
    // Get existing logs
    const existingLogsJson = localStorage.getItem(STORAGE_KEY);
    let logs: LogEntry[] = existingLogsJson ? JSON.parse(existingLogsJson) : [];

    // Process each entry
    for (const entry of entriesToAdd) {
      // Trim the entry if it's too large
      const trimmedEntry = trimLogEntry(entry);

      // Estimate size of new logs array with this entry
      const testLogs = [...logs, trimmedEntry];
      const estimatedSize = estimateStringSize(JSON.stringify(testLogs));

      // Proactively check and clean up if needed
      if (estimatedSize > MAX_TOTAL_SIZE_BYTES) {
        ensureSpaceAvailable(estimatedSize);
        // Re-read logs after cleanup
        const cleanedLogsJson = localStorage.getItem(STORAGE_KEY);
        logs = cleanedLogsJson ? JSON.parse(cleanedLogsJson) : [];
      }

      // Trim logs to fit within limits
      logs = trimLogsToFit(logs, trimmedEntry);
    }

    // Final size check before write
    const finalSize = estimateStringSize(JSON.stringify(logs));
    if (finalSize > MAX_TOTAL_SIZE_BYTES) {
      // Emergency cleanup - keep only most recent entries
      logs = logs.slice(-MIN_LOG_ENTRIES_ON_EMERGENCY);
    }

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error: any) {
    // Handle QuotaExceededError specifically
    if (error?.name === 'QuotaExceededError') {
      try {
        // Clear old logs and retry with minimal set
        console.warn(
          '[DebugLogFile] localStorage quota exceeded, clearing old logs and retrying...'
        );
        localStorage.removeItem(STORAGE_KEY);

        // Retry with just the most recent entries (trimmed)
        const minimalLogs = entriesToAdd
          .map((e) => trimLogEntry(e))
          .slice(-MIN_LOG_ENTRIES_ON_EMERGENCY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalLogs));

        console.warn(
          '[DebugLogFile] Stored minimal log set. Consider exporting and clearing logs.'
        );
      } catch (retryError) {
        // If retry also fails, disable logging to prevent continuous failures
        console.error(
          '[DebugLogFile] Failed to store logs even after cleanup. Disabling logging to prevent quota errors.'
        );
        disableLogging();
      }
    } else {
      // For other errors, just log a warning
      console.warn('[DebugLogFile] Failed to store log entry:', error);
    }
  }
}

/**
 * Add a log entry to the queue (debounced write)
 */
function addLogEntry(entry: LogEntry): void {
  if (typeof window === 'undefined' || isLoggingDisabled()) {
    return;
  }

  // Add to pending queue
  pendingLogEntries.push(entry);

  // Clear existing timer
  if (writeDebounceTimer !== null) {
    clearTimeout(writeDebounceTimer);
  }

  // Set new debounced write
  writeDebounceTimer = window.setTimeout(() => {
    writeLogsToStorage();
  }, WRITE_DEBOUNCE_MS);
}

/**
 * Send a debug log entry (writes to localStorage)
 */
export function sendDebugLogToFile(logData: {
  location: string;
  message: string;
  data?: any;
  timestamp?: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}): void {
  if (typeof window === 'undefined') {
    return;
  }

  const entry: LogEntry = {
    ...logData,
    timestamp: logData.timestamp || Date.now(),
  };

  addLogEntry(entry);
}

/**
 * Get all stored logs
 */
export function getStoredLogs(): LogEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const logsJson = localStorage.getItem(STORAGE_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    console.warn('[DebugLogFile] Failed to read logs:', error);
    return [];
  }
}

/**
 * Clear all stored logs
 */
export function clearStoredLogs(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    // Reset circuit breaker when logs are manually cleared
    localStorage.removeItem(DISABLE_KEY);
    if (typeof window !== 'undefined') {
      (window as any).__DISABLE_DEBUG_LOG_FILE = false;
    }
    console.log('[DebugLogFile] Logs cleared and logging re-enabled');
  } catch (error) {
    console.warn('[DebugLogFile] Failed to clear logs:', error);
  }
}

/**
 * Export logs as NDJSON file (download)
 */
export function exportLogsAsFile(filename: string = 'osi-cards-debug-logs.ndjson'): void {
  if (typeof window === 'undefined') {
    return;
  }

  const logs = getStoredLogs();

  if (logs.length === 0) {
    console.warn('[DebugLogFile] No logs to export');
    return;
  }

  try {
    // Convert to NDJSON format (one JSON object per line)
    const ndjson = logs.map((log) => JSON.stringify(log)).join('\n');

    // Create blob and download
    const blob = new Blob([ndjson], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[DebugLogFile] Exported ${logs.length} log entries to ${filename}`);
  } catch (error) {
    console.error('[DebugLogFile] Failed to export logs:', error);
  }
}

/**
 * Export logs as JSON file (download)
 */
export function exportLogsAsJSON(filename: string = 'osi-cards-debug-logs.json'): void {
  if (typeof window === 'undefined') {
    return;
  }

  const logs = getStoredLogs();

  if (logs.length === 0) {
    console.warn('[DebugLogFile] No logs to export');
    return;
  }

  try {
    // Convert to JSON array
    const json = JSON.stringify(logs, null, 2);

    // Create blob and download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[DebugLogFile] Exported ${logs.length} log entries to ${filename}`);
  } catch (error) {
    console.error('[DebugLogFile] Failed to export logs:', error);
  }
}

/**
 * Get log statistics
 */
export function getLogStats(): {
  totalEntries: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
  entriesByLocation: Record<string, number>;
  entriesByHypothesis: Record<string, number>;
} {
  const logs = getStoredLogs();

  if (logs.length === 0) {
    return {
      totalEntries: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
      entriesByLocation: {},
      entriesByHypothesis: {},
    };
  }

  const timestamps = logs.map((log) => log.timestamp).filter((ts) => ts != null) as number[];
  const entriesByLocation: Record<string, number> = {};
  const entriesByHypothesis: Record<string, number> = {};

  logs.forEach((log) => {
    entriesByLocation[log.location] = (entriesByLocation[log.location] || 0) + 1;
    if (log.hypothesisId) {
      entriesByHypothesis[log.hypothesisId] = (entriesByHypothesis[log.hypothesisId] || 0) + 1;
    }
  });

  return {
    totalEntries: logs.length,
    oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null,
    newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : null,
    entriesByLocation,
    entriesByHypothesis,
  };
}

/**
 * Export logs as text that can be copied to .cursor/debug.log
 * Returns the NDJSON string directly for easy copying
 */
export function exportLogsAsText(): string {
  const logs = getStoredLogs();
  return logs.map((log) => JSON.stringify(log)).join('\n');
}

/**
 * Re-enable logging (if it was disabled due to quota exceeded)
 */
export function enableLogging(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(DISABLE_KEY);
    (window as any).__DISABLE_DEBUG_LOG_FILE = false;
    console.log('[DebugLogFile] Logging re-enabled');
  } catch (error) {
    console.warn('[DebugLogFile] Failed to re-enable logging:', error);
  }
}

/**
 * Perform startup cleanup - check and clean old logs on application start
 */
function performStartupCleanup(): void {
  if (typeof window === 'undefined' || isLoggingDisabled()) {
    return;
  }

  try {
    const existingLogsJson = localStorage.getItem(STORAGE_KEY);
    if (!existingLogsJson) {
      return;
    }

    const logs: LogEntry[] = JSON.parse(existingLogsJson);

    // Check total size
    const totalSize = estimateStringSize(existingLogsJson);

    // If over limit, clean up proactively
    if (totalSize > MAX_TOTAL_SIZE_BYTES || logs.length > MAX_LOG_ENTRIES) {
      // Keep only most recent entries
      const cleanedLogs = logs.slice(-MAX_LOG_ENTRIES);
      const cleanedSize = estimateStringSize(JSON.stringify(cleanedLogs));

      // If still too large, reduce further
      if (cleanedSize > MAX_TOTAL_SIZE_BYTES) {
        const finalLogs = cleanedLogs.slice(-MIN_LOG_ENTRIES_ON_EMERGENCY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalLogs));
        console.log(
          `[DebugLogFile] Startup cleanup: Reduced logs from ${logs.length} to ${finalLogs.length} entries`
        );
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedLogs));
        console.log(
          `[DebugLogFile] Startup cleanup: Reduced logs from ${logs.length} to ${cleanedLogs.length} entries`
        );
      }
    }
  } catch (error) {
    // If cleanup fails, clear the logs to prevent future issues
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.warn('[DebugLogFile] Startup cleanup failed, cleared logs:', error);
    } catch {
      // Ignore errors during cleanup
    }
  }
}

/**
 * Make export functions available globally for easy access from browser console
 */
if (typeof window !== 'undefined') {
  // Perform startup cleanup
  performStartupCleanup();
  (window as any).__osiCardsDebugLogs = {
    export: exportLogsAsFile,
    exportJSON: exportLogsAsJSON,
    exportText: exportLogsAsText,
    clear: clearStoredLogs,
    enable: enableLogging,
    getStats: getLogStats,
    getLogs: getStoredLogs,
    // Quick export to console for easy copying
    copyToClipboard: () => {
      const text = exportLogsAsText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            console.log('✅ Logs copied to clipboard! Paste into .cursor/debug.log');
          })
          .catch((err) => {
            console.error('Failed to copy to clipboard:', err);
            console.log('📋 Logs (copy manually):\n', text);
          });
      } else {
        console.log('📋 Logs (copy manually):\n', text);
      }
    },
  };

  console.log(
    '%c[DebugLogFile] Log export utilities available:',
    'color: #ff7900; font-weight: bold;',
    '\n  window.__osiCardsDebugLogs.export() - Export as NDJSON file\n  window.__osiCardsDebugLogs.exportJSON() - Export as JSON file\n  window.__osiCardsDebugLogs.copyToClipboard() - Copy logs to clipboard\n  window.__osiCardsDebugLogs.clear() - Clear logs and re-enable logging\n  window.__osiCardsDebugLogs.enable() - Re-enable logging if disabled\n  window.__osiCardsDebugLogs.getStats() - Get statistics\n  window.__osiCardsDebugLogs.getLogs() - Get all logs'
  );
}
