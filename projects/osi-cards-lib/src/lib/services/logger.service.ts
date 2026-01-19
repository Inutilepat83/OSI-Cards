/**
 * Logger Service
 *
 * Structured logging service with log levels, contexts, and formatters.
 * Supports localStorage persistence for log analysis.
 *
 * For specialized debug logging (e.g., performance monitoring, hypothesis tracking),
 * use the debug-log utilities directly: `sendDebugLog()` and `sendDebugLogToFile()`
 * from `@osi-cards/utils/debug-log.util.ts`
 *
 * @dependencies
 * - None (uses browser localStorage API directly)
 *
 * @example
 * ```typescript
 * const logger = inject(LoggerService);
 *
 * // Configure with localStorage enabled
 * logger.configure({ enableStorage: true });
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('API call failed', { error, url });
 * logger.debug('Processing data', { count: items.length });
 *
 * // Access logs from localStorage
 * const logs = LoggerService.getLogsFromLocalStorage();
 * ```
 */

import { Injectable, signal } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
  tags?: string[];
}

export interface LoggerConfig {
  minLevel?: LogLevel;
  enableConsole?: boolean;
  enableStorage?: boolean;
  maxStoredLogs?: number;
  customLogger?: (entry: LogEntry) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const STORAGE_KEY = 'osi-cards-logs';
const MAX_LOGGER_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB max total
const MIN_LOGGER_LOG_ENTRIES_ON_EMERGENCY = 50; // Keep at least 50 entries in emergency cleanup

// Serialized log entry for localStorage (Date converted to ISO string)
interface SerializedLogEntry {
  timestamp: string; // ISO string
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private config = signal<LoggerConfig>({
    minLevel: 'warn', // Default to 'warn' to reduce console noise
    enableConsole: true,
    enableStorage: false,
    maxStoredLogs: 500, // Reduced from 1000 to reduce memory usage
  });

  private logs = signal<LogEntry[]>([]);
  private storageDebounceTimer: number | null = null;
  private readonly STORAGE_DEBOUNCE_MS = 100; // Debounce localStorage writes
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
      totalSize > MAX_LOGGER_LOG_SIZE_BYTES &&
      trimmed.length > MIN_LOGGER_LOG_ENTRIES_ON_EMERGENCY
    ) {
      const removed = trimmed.shift();
      if (removed) {
        totalSize -= this.estimateLogEntrySize(removed);
      }
    }

    // If still too large, reduce to minimal set
    if (totalSize > MAX_LOGGER_LOG_SIZE_BYTES) {
      trimmed = trimmed.slice(-MIN_LOGGER_LOG_ENTRIES_ON_EMERGENCY);
    }

    return trimmed;
  }

  constructor() {
    // Load logs from localStorage on initialization if storage is enabled
    if (typeof window !== 'undefined' && this.config().enableStorage) {
      this.loadLogsFromLocalStorage();
    }
  }

  /**
   * Configure logger
   */
  configure(config: Partial<LoggerConfig>): void {
    const wasStorageEnabled = this.config().enableStorage;
    this.config.update((current) => ({ ...current, ...config }));

    // If storage was just enabled, load logs from localStorage
    if (!wasStorageEnabled && this.config().enableStorage && typeof window !== 'undefined') {
      this.loadLogsFromLocalStorage();
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log('debug', message, context, tags);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log('info', message, context, tags);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log('warn', message, context, tags);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>, error?: Error, tags?: string[]): void {
    // Automatically add 'errors' tag for error-level logs
    const errorTags = tags ? [...tags, 'errors'] : ['errors'];
    this.log(
      'error',
      message,
      {
        ...context,
        stack: error?.stack,
      },
      errorTags
    );
  }

  // Message deduplication map
  private readonly messageDedupMap = new Map<string, { lastLogged: number; count: number }>();
  private readonly DEDUP_WINDOW_MS = 5000; // 5 seconds - same message only once per 5 seconds

  /**
   * Check if message should be logged (deduplication)
   * CRITICAL: Only use message text for deduplication key, not context/data
   * This prevents same message from different component instances from being logged multiple times
   */
  private shouldLogMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): { shouldLog: boolean; suppressedCount: number } {
    // Use ONLY level and message for deduplication key - ignore context/data
    // This ensures same message from different component instances is deduplicated
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
   * Core log method
   * CRITICAL FIX: Added message deduplication to prevent same message from logging multiple times
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    tags?: string[]
  ): void {
    const config = this.config();

    // Check if log level is enabled
    if (LOG_LEVELS[level] < LOG_LEVELS[config.minLevel || 'info']) {
      return;
    }

    // Check message deduplication - prevent same message from logging multiple times
    const dedupResult = this.shouldLogMessage(level, message, context);
    if (!dedupResult.shouldLog) {
      // Message was suppressed - don't log to console or storage
      return;
    }

    // If message was suppressed before, add suppressed count to the message
    const finalMessage =
      dedupResult.suppressedCount > 0
        ? `${message} (${dedupResult.suppressedCount} similar messages suppressed)`
        : message;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message: finalMessage, // Use final message with suppressed count
      context,
      stack: context?.stack,
      tags: tags && tags.length > 0 ? tags : undefined,
    };

    // Console logging (with throttling to prevent 100k+ logs)
    if (config.enableConsole && this.shouldLogToConsole(level)) {
      this.logToConsole(entry);
    }

    // Store logs
    if (config.enableStorage) {
      this.storeLogs(entry);
    }

    // Custom logger
    if (config.customLogger) {
      config.customLogger(entry);
    }
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
      if (throttle.skipped > 0) {
        console.warn(
          `[LoggerService] Throttled ${throttle.skipped} ${level} logs in the last ${this.CONSOLE_THROTTLE_WINDOW_MS}ms to prevent console flooding`
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
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, context, timestamp } = entry;
    const time = timestamp.toISOString();
    const prefix = `[${time}] [${level.toUpperCase()}]`;

    const styles = {
      debug: 'color: #6c757d',
      info: 'color: #0dcaf0',
      warn: 'color: #ffc107',
      error: 'color: #dc3545',
    };

    if (context) {
      console.log(`%c${prefix}`, styles[level], message, context);
    } else {
      console.log(`%c${prefix}`, styles[level], message);
    }

    if (entry.stack) {
      console.log(entry.stack);
    }
  }

  /**
   * Store logs in memory and localStorage (if enabled)
   */
  private storeLogs(entry: LogEntry): void {
    this.logs.update((logs) => {
      const newLogs = [...logs, entry];
      const maxLogs = this.config().maxStoredLogs || 1000;

      // Keep only the most recent logs
      const trimmedLogs = newLogs.length > maxLogs ? newLogs.slice(-maxLogs) : newLogs;

      // Persist to localStorage if enabled
      if (this.config().enableStorage && typeof window !== 'undefined') {
        this.persistLogsToLocalStorage(trimmedLogs);
      }

      return trimmedLogs;
    });
  }

  /**
   * Persist logs to localStorage (debounced)
   */
  private persistLogsToLocalStorage(logs: LogEntry[]): void {
    if (this.storageDebounceTimer !== null) {
      clearTimeout(this.storageDebounceTimer);
    }

    this.storageDebounceTimer = window.setTimeout(() => {
      try {
        const serialized: SerializedLogEntry[] = logs.map((log) => ({
          timestamp: log.timestamp.toISOString(),
          level: log.level,
          message: log.message,
          context: log.context,
          stack: log.stack,
          tags: log.tags,
        }));

        // Trim logs by size before writing (proactive cleanup)
        const trimmedSerialized = this.trimLogsBySize(serialized);

        // Check final size before write
        const finalJson = JSON.stringify(trimmedSerialized);
        const finalSize = this.estimateLogStringSize(finalJson);

        // If still too large, reduce further
        if (finalSize > MAX_LOGGER_LOG_SIZE_BYTES) {
          const emergencyLogs = trimmedSerialized.slice(-MIN_LOGGER_LOG_ENTRIES_ON_EMERGENCY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencyLogs));
        } else {
          localStorage.setItem(STORAGE_KEY, finalJson);
        }
      } catch (error: any) {
        // Handle QuotaExceededError specifically
        if (error?.name === 'QuotaExceededError') {
          try {
            // Clear old logs and retry with minimal set
            console.warn(
              '[LoggerService] localStorage quota exceeded, clearing old logs and retrying...'
            );
            localStorage.removeItem(STORAGE_KEY);

            // Retry with just the most recent entries
            const serialized: SerializedLogEntry[] = logs
              .slice(-MIN_LOGGER_LOG_ENTRIES_ON_EMERGENCY)
              .map((log) => ({
                timestamp: log.timestamp.toISOString(),
                level: log.level,
                message: log.message,
                context: log.context,
                stack: log.stack,
                tags: log.tags,
              }));

            localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
            console.warn(
              '[LoggerService] Stored minimal log set. Consider exporting and clearing logs.'
            );
          } catch (retryError) {
            // If retry also fails, just log a warning and continue
            console.warn('[LoggerService] Failed to store logs even after cleanup:', retryError);
          }
        } else {
          // For other errors, just log a warning
          console.warn('[LoggerService] Failed to persist logs to localStorage:', error);
        }
      }
      this.storageDebounceTimer = null;
    }, this.STORAGE_DEBOUNCE_MS);
  }

  /**
   * Load logs from localStorage
   */
  private loadLogsFromLocalStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const serialized: SerializedLogEntry[] = JSON.parse(stored);
      const logs: LogEntry[] = serialized.map((log) => ({
        timestamp: new Date(log.timestamp),
        level: log.level,
        message: log.message,
        context: log.context,
        stack: log.stack,
        tags: log.tags,
      }));

      this.logs.set(logs);
    } catch (error) {
      console.warn('[LoggerService] Failed to load logs from localStorage:', error);
    }
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
        stack: log.stack,
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
      console.warn('[LoggerService] Failed to read logs from localStorage:', error);
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
      console.warn('[LoggerService] Failed to clear logs from localStorage:', error);
    }
  }

  /**
   * Export logs from localStorage as JSON string
   */
  exportLocalStorageLogs(): string {
    const logs = LoggerService.getLogsFromLocalStorage();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Get stored logs
   */
  getLogs(filter?: { level?: LogLevel; since?: Date }): LogEntry[] {
    const logs = this.logs();

    if (!filter) {
      return logs;
    }

    return logs.filter((log) => {
      if (filter.level && log.level !== filter.level) {
        return false;
      }
      if (filter.since && log.timestamp < filter.since) {
        return false;
      }
      return true;
    });
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs.set([]);
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs(), null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs(filename = 'logs.json'): void {
    const json = this.exportLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get log count by level
   */
  getLogCount(level?: LogLevel): number {
    if (level) {
      return this.logs().filter((log) => log.level === level).length;
    }
    return this.logs().length;
  }

  /**
   * Group logs by time period
   */
  groupLogsByPeriod(period: 'hour' | 'day' | 'week'): Map<string, LogEntry[]> {
    const grouped = new Map<string, LogEntry[]>();
    const logs = this.logs();

    logs.forEach((log) => {
      const key = this.getPeriodKey(log.timestamp, period);
      const existing = grouped.get(key) || [];
      grouped.set(key, [...existing, log]);
    });

    return grouped;
  }

  /**
   * Get period key for grouping
   */
  private getPeriodKey(date: Date, period: 'hour' | 'day' | 'week'): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();

    switch (period) {
      case 'hour':
        return `${year}-${month}-${day} ${hour}:00`;
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0]!;
    }
  }
}

/**
 * Create child logger with context
 */
export function createLogger(service: LoggerService, defaultContext: Record<string, any>) {
  return {
    debug: (message: string, context?: Record<string, any>) =>
      service.debug(message, { ...defaultContext, ...context }),
    info: (message: string, context?: Record<string, any>) =>
      service.info(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: Record<string, any>) =>
      service.warn(message, { ...defaultContext, ...context }),
    error: (message: string, context?: Record<string, any>, error?: Error) =>
      service.error(message, { ...defaultContext, ...context }, error),
  };
}
