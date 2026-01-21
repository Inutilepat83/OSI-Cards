import { inject, Injectable, isDevMode } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { FileLoggingService } from './file-logging.service';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: Date;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

const STORAGE_KEY = 'osi-cards-app-logs';

// Serialized log entry for localStorage (Date converted to ISO string)
interface SerializedLogEntry {
  timestamp: string; // ISO string
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

/**
 * Structured logging service with log levels
 * Replaces console.log statements throughout the application
 * Supports localStorage persistence for log analysis.
 *
 * For specialized debug logging (e.g., performance monitoring, hypothesis tracking),
 * use the debug-log utilities directly: `sendDebugLog()` and `sendDebugLogToFile()`
 * from `projects/osi-cards-lib/src/lib/utils/debug-log.util.ts`
 *
 * @example
 * ```typescript
 * const logger = inject(LoggingService);
 *
 * logger.info('User logged in', 'AuthService', { userId: '123' });
 * logger.error('API call failed', 'ApiService', { error, url });
 *
 * // Access logs from localStorage
 * const logs = LoggingService.getLogsFromLocalStorage();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private readonly config = inject(AppConfigService);
  private readonly fileLogging = inject(FileLoggingService);
  private readonly logHistory: LogEntry[] = [];
  private readonly maxHistorySize = 500; // Reduced from 1000 to reduce memory usage
  private readonly MAX_LOGGING_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB max total
  private readonly MIN_LOGGING_LOG_ENTRIES_ON_EMERGENCY = 50; // Keep at least 50 entries in emergency cleanup
  private correlationId: string | null = null;
  private sessionId: string = this.generateSessionId();
  private storageDebounceTimer: number | null = null;
  private readonly STORAGE_DEBOUNCE_MS = 100; // Debounce localStorage writes to prevent excessive console logs
  // Throttle console output to prevent 100k+ console logs
  private consoleThrottleMap = new Map<
    LogLevel,
    { count: number; lastReset: number; skipped: number }
  >();
  private readonly CONSOLE_THROTTLE_WINDOW_MS = 1000; // 1 second window
  private readonly CONSOLE_MAX_LOGS_PER_WINDOW = 50; // Max 50 logs per level per second

  /**
   * Estimate the size of a serialized log entry in bytes using TextEncoder
   */
  private estimateLogEntrySize(entry: SerializedLogEntry): number {
    try {
      const jsonString = JSON.stringify(entry);
      return new TextEncoder().encode(jsonString).length;
    } catch {
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
  private estimateLogStringSize(str: string): number {
    try {
      return new TextEncoder().encode(str).length;
    } catch {
      return str.length; // Fallback
    }
  }

  /**
   * Trim logs to fit within size limits
   */
  private trimLogsBySize(logs: SerializedLogEntry[]): SerializedLogEntry[] {
    let trimmed = [...logs];

    // Estimate total size
    let totalSize = 0;
    for (const entry of trimmed) {
      totalSize += this.estimateLogEntrySize(entry);
    }

    // If too large, remove oldest entries
    while (
      totalSize > this.MAX_LOGGING_LOG_SIZE_BYTES &&
      trimmed.length > this.MIN_LOGGING_LOG_ENTRIES_ON_EMERGENCY
    ) {
      const removed = trimmed.shift();
      if (removed) {
        totalSize -= this.estimateLogEntrySize(removed);
      }
    }

    // If still too large, reduce to minimal set
    if (totalSize > this.MAX_LOGGING_LOG_SIZE_BYTES) {
      trimmed = trimmed.slice(-this.MIN_LOGGING_LOG_ENTRIES_ON_EMERGENCY);
    }

    return trimmed;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, data?: unknown, tags?: string[]): void {
    this.log('debug', message, context, data, tags);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string, data?: unknown, tags?: string[]): void {
    this.log('info', message, context, data, tags);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, data?: unknown, tags?: string[]): void {
    this.log('warn', message, context, data, tags);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: string, data?: unknown, tags?: string[]): void {
    // Automatically add 'errors' tag for error-level logs
    const errorTags = tags ? [...tags, 'errors'] : ['errors'];
    this.log('error', message, context, data, errorTags);
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | null {
    return this.correlationId;
  }

  /**
   * Generate a new session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  // Message deduplication map
  private readonly messageDedupMap = new Map<string, { lastLogged: number; count: number }>();
  private readonly DEDUP_WINDOW_MS = 5000; // 5 seconds - same message only once per 5 seconds

  /**
   * Check if message should be logged (deduplication)
   * CRITICAL: Only use level and message for deduplication key, not context
   * This prevents same message from different sources from being logged multiple times
   */
  private shouldLogMessage(
    level: LogLevel,
    message: string,
    context?: string
  ): { shouldLog: boolean; suppressedCount: number } {
    // Use ONLY level and message for deduplication key - ignore context
    // This ensures same message from different contexts/component instances is deduplicated
    const key = `${level}|${message}`;
    const now = Date.now();
    const entry = this.messageDedupMap.get(key);

    if (!entry) {
      // First time seeing this message - allow it
      this.messageDedupMap.set(key, { lastLogged: now, count: 0 });
      return { shouldLog: true, suppressedCount: 0 };
    }

    const timeSinceLastLog = now - entry.lastLogged;
    if (timeSinceLastLog >= this.DEDUP_WINDOW_MS) {
      // Enough time has passed - allow logging again, show suppressed count if any
      const suppressedCount = entry.count;
      this.messageDedupMap.set(key, { lastLogged: now, count: 0 });
      return { shouldLog: true, suppressedCount };
    } else {
      // Within deduplication window - suppress this log
      entry.count++;
      entry.lastLogged = now; // Update last seen time
      return { shouldLog: false, suppressedCount: entry.count };
    }
  }

  /**
   * Internal log method with enhanced structured logging
   * CRITICAL FIX: Added message deduplication to prevent same message from logging multiple times
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown,
    tags?: string[]
  ): void {
    // #region agent log - Track excessive logging calls
    if (
      typeof window !== 'undefined' &&
      localStorage.getItem('__DISABLE_DEBUG_LOGGING') !== 'true' &&
      !(window as any).__DISABLE_DEBUG_LOGGING
    ) {
      const logCounter = (window as any).__loggingServiceCallCount || {
        count: 0,
        lastReset: Date.now(),
      };
      logCounter.count++;
      const timeSinceReset = Date.now() - logCounter.lastReset;
      if (timeSinceReset > 1000) {
        // Reset counter every second and log if excessive
        if (logCounter.count > 100) {
          // Only log on localhost - use safeDebugFetch to prevent production errors
          if (
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ) {
            fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'logging.service.ts:log',
                message: 'EXCESSIVE LOGGING DETECTED',
                data: { callsPerSecond: logCounter.count, level, message, context },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B',
              }),
            }).catch(() => {});
          }
        }
        logCounter.count = 0;
        logCounter.lastReset = Date.now();
      }
      (window as any).__loggingServiceCallCount = logCounter;
    }
    // #endregion

    const configLevel = this.config.LOGGING.LOG_LEVEL;
    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    // Only log if level is at or above configured level
    if (levelPriority[level] < levelPriority[configLevel]) {
      return;
    }

    // Check message deduplication - prevent same message from logging multiple times
    const dedupResult = this.shouldLogMessage(level, message, context);
    if (!dedupResult.shouldLog) {
      // Message was suppressed - don't log to console or localStorage
      return;
    }

    // If message was suppressed before, add suppressed count to the message
    const finalMessage =
      dedupResult.suppressedCount > 0
        ? `${message} (${dedupResult.suppressedCount} similar messages suppressed)`
        : message;

    // Generate correlation ID if not set (for request tracing)
    if (!this.correlationId && level === 'error') {
      this.correlationId = `corr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    const entry: LogEntry = {
      level,
      message: finalMessage, // Use final message with suppressed count
      context,
      data,
      timestamp: new Date(),
      correlationId: this.correlationId || undefined,
      sessionId: this.sessionId,
      tags: tags && tags.length > 0 ? tags : undefined,
    };

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Enhanced structured logging with correlation ID
    const structuredLog: Record<string, unknown> = {
      level,
      message,
      timestamp: entry.timestamp.toISOString(),
      sessionId: this.sessionId,
    };

    if (context) {
      structuredLog.context = context;
    }

    if (this.correlationId) {
      structuredLog.correlationId = this.correlationId;
    }

    if (data) {
      structuredLog.data = data;
    }

    // Persist to localStorage (always, even if console is throttled)
    this.persistLogsToLocalStorage();

    // Only send to file logging service if explicitly enabled
    // File logging is optional and can be disabled to reduce overhead
    if (this.config.LOGGING.ENABLE_LOG_SERVER) {
      this.fileLogging.log(level, message, data);
    }

    // Output to console based on level (with throttling to prevent 100k+ logs)
    // CRITICAL FIX: Throttle console output to prevent excessive logging
    const shouldLogToConsole = this.shouldLogToConsole(level);

    if (!shouldLogToConsole) {
      return; // Skip console output if throttled (but localStorage already persisted above)
    }

    // Only log structured format if ENABLE_DEBUG is true, otherwise use simple format
    const logMessage = context ? `[${context}] ${message}` : message;
    const logData = data ? [logMessage, data] : [logMessage];

    switch (level) {
      case 'debug':
        // Only log debug messages if section state logging is enabled
        if (this.config.LOGGING.ENABLE_SECTION_STATE_LOGGING) {
          if (this.config.LOGGING.ENABLE_DEBUG) {
            // Structured format when debug is enabled
            console.debug(`[${level.toUpperCase()}]`, structuredLog);
          } else {
            // Simple format otherwise
            console.debug(...logData);
          }
        }
        break;
      case 'info':
        if (this.config.LOGGING.ENABLE_DEBUG) {
          console.info(`[${level.toUpperCase()}]`, structuredLog);
        } else {
          console.info(...logData);
        }
        break;
      case 'warn':
        if (this.config.LOGGING.ENABLE_DEBUG) {
          console.warn(`[${level.toUpperCase()}]`, structuredLog);
        } else {
          console.warn(...logData);
        }
        break;
      case 'error':
        // Always log errors (not throttled), but use structured format only if debug is enabled
        if (this.config.LOGGING.ENABLE_DEBUG) {
          console.error(`[${level.toUpperCase()}]`, structuredLog);
        } else {
          console.error(...logData);
        }
        break;
    }
  }

  /**
   * Get log history
   */
  getHistory(level?: LogLevel, limit?: number, tags?: string[]): LogEntry[] {
    let entries = this.logHistory;
    if (level) {
      entries = entries.filter((entry) => entry.level === level);
    }
    if (tags && tags.length > 0) {
      entries = entries.filter((entry) => {
        if (!entry.tags || entry.tags.length === 0) {
          return false;
        }
        // Return true if entry has at least one matching tag
        return tags.some((tag) => entry.tags!.includes(tag));
      });
    }
    if (limit) {
      entries = entries.slice(-limit);
    }
    return entries;
  }

  /**
   * Get logs filtered by tags
   * @param tags Array of tags to filter by. Returns logs that have at least one matching tag.
   */
  getLogsByTags(tags: string[]): LogEntry[] {
    return this.getHistory(undefined, undefined, tags);
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory.length = 0;
    // Clear debounce timer when clearing history
    if (this.storageDebounceTimer !== null) {
      clearTimeout(this.storageDebounceTimer);
      this.storageDebounceTimer = null;
    }
    this.clearLocalStorageLogs();
  }

  /**
   * Check if console logging should be allowed (throttled to prevent 100k+ logs)
   * Errors are never throttled, other levels are limited to CONSOLE_MAX_LOGS_PER_WINDOW per second
   */
  private shouldLogToConsole(level: LogLevel): boolean {
    // Never throttle errors
    if (level === 'error') {
      return true;
    }

    const now = Date.now();
    const throttle = this.consoleThrottleMap.get(level) || { count: 0, lastReset: now, skipped: 0 };

    // Reset counter if window expired
    if (now - throttle.lastReset >= this.CONSOLE_THROTTLE_WINDOW_MS) {
      // Log warning if we skipped many logs
      if (throttle.skipped > 0 && isDevMode()) {
        console.warn(
          `[LoggingService] Throttled ${throttle.skipped} ${level} logs in the last ${this.CONSOLE_THROTTLE_WINDOW_MS}ms to prevent console flooding`
        );
      }
      throttle.count = 0;
      throttle.lastReset = now;
      throttle.skipped = 0;
    }

    // Check if we've exceeded the limit
    if (throttle.count >= this.CONSOLE_MAX_LOGS_PER_WINDOW) {
      throttle.skipped++;
      this.consoleThrottleMap.set(level, throttle);
      return false; // Throttled
    }

    // Allow logging and increment counter
    throttle.count++;
    this.consoleThrottleMap.set(level, throttle);
    return true;
  }

  /**
   * Persist logs to localStorage (debounced to prevent excessive writes)
   * CRITICAL FIX: Added debouncing to prevent 100k+ console logs from synchronous localStorage writes
   */
  private persistLogsToLocalStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // #region agent log - Track debounce calls
    // Only log on localhost - use safeDebugFetch to prevent production errors
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'logging.service.ts:persistLogsToLocalStorage',
          message: 'persistLogsToLocalStorage called (will be debounced)',
          data: {
            logHistoryLength: this.logHistory.length,
            hasDebounceTimer: this.storageDebounceTimer !== null,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
    }
    // #endregion

    // Debounce localStorage writes to prevent excessive console operations
    // This was causing 100k+ console logs from synchronous writes on every log call
    if (this.storageDebounceTimer !== null) {
      clearTimeout(this.storageDebounceTimer);
    }

    this.storageDebounceTimer = window.setTimeout(() => {
      try {
        const serialized: SerializedLogEntry[] = this.logHistory.map((log) => ({
          timestamp: log.timestamp.toISOString(),
          level: log.level,
          message: log.message,
          context: log.context,
          data: log.data,
          correlationId: log.correlationId,
          userId: log.userId,
          sessionId: log.sessionId,
          tags: log.tags,
        }));

        // Trim logs by size before writing (proactive cleanup)
        const trimmedSerialized = this.trimLogsBySize(serialized);

        // Check final size before write
        const finalJson = JSON.stringify(trimmedSerialized);
        const finalSize = this.estimateLogStringSize(finalJson);

        // If still too large, reduce further
        if (finalSize > this.MAX_LOGGING_LOG_SIZE_BYTES) {
          const emergencyLogs = trimmedSerialized.slice(-this.MIN_LOGGING_LOG_ENTRIES_ON_EMERGENCY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencyLogs));
        } else {
          localStorage.setItem(STORAGE_KEY, finalJson);
        }

        // #region agent log - Track successful write
        // Only log on localhost - use safeDebugFetch to prevent production errors
        if (
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ) {
          fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'logging.service.ts:persistLogsToLocalStorage',
              message: 'localStorage write completed (debounced)',
              data: { entriesWritten: trimmedSerialized.length, finalSize },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'A',
            }),
          }).catch(() => {});
        }
        // #endregion
      } catch (error: any) {
        // Handle QuotaExceededError specifically
        if (error?.name === 'QuotaExceededError') {
          try {
            // Clear old logs and retry with minimal set
            if (isDevMode()) {
              console.warn(
                '[LoggingService] localStorage quota exceeded, clearing old logs and retrying...'
              );
            }
            localStorage.removeItem(STORAGE_KEY);

            // Retry with just the most recent entries
            const serialized: SerializedLogEntry[] = this.logHistory
              .slice(-this.MIN_LOGGING_LOG_ENTRIES_ON_EMERGENCY)
              .map((log) => ({
                timestamp: log.timestamp.toISOString(),
                level: log.level,
                message: log.message,
                context: log.context,
                data: log.data,
                correlationId: log.correlationId,
                userId: log.userId,
                sessionId: log.sessionId,
                tags: log.tags,
              }));

            localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
            if (isDevMode()) {
              console.warn(
                '[LoggingService] Stored minimal log set. Consider exporting and clearing logs.'
              );
            }
          } catch (retryError) {
            // If retry also fails, just log a warning and continue
            if (isDevMode()) {
              console.warn('[LoggingService] Failed to store logs even after cleanup:', retryError);
            }
          }
        } else {
          // For other errors, just log a warning
          if (isDevMode()) {
            console.warn('[LoggingService] Failed to persist logs to localStorage:', error);
          }
        }
      }
      this.storageDebounceTimer = null;
    }, this.STORAGE_DEBOUNCE_MS);
  }

  /**
   * Get logs from localStorage (static method for external access)
   * @param tags Optional array of tags to filter by. If provided, returns only logs that have at least one matching tag.
   */
  static getLogsFromLocalStorage(tags?: string[]): LogEntry[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const serialized: SerializedLogEntry[] = JSON.parse(stored);
      let logs = serialized.map((log) => ({
        timestamp: new Date(log.timestamp),
        level: log.level,
        message: log.message,
        context: log.context,
        data: log.data,
        correlationId: log.correlationId,
        userId: log.userId,
        sessionId: log.sessionId,
        tags: log.tags,
      }));

      // Filter by tags if provided
      if (tags && tags.length > 0) {
        logs = logs.filter((log) => {
          if (!log.tags || log.tags.length === 0) {
            return false;
          }
          // Return true if log has at least one matching tag
          return tags.some((tag) => log.tags!.includes(tag));
        });
      }

      return logs;
    } catch (error) {
      if (isDevMode()) {
        console.warn('[LoggingService] Failed to read logs from localStorage:', error);
      }
      return [];
    }
  }

  /**
   * Clear logs from localStorage
   */
  clearLocalStorageLogs(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      if (isDevMode()) {
        console.warn('[LoggingService] Failed to clear logs from localStorage:', error);
      }
    }
  }

  /**
   * Export logs from localStorage as JSON string
   */
  exportLocalStorageLogs(): string {
    const logs = LoggingService.getLogsFromLocalStorage();
    return JSON.stringify(logs, null, 2);
  }
}
