/**
 * Logger Service
 *
 * Structured logging service with log levels, contexts, and formatters.
 *
 * @example
 * ```typescript
 * const logger = inject(LoggerService);
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('API call failed', { error, url });
 * logger.debug('Processing data', { count: items.length });
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

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private config = signal<LoggerConfig>({
    minLevel: 'info',
    enableConsole: true,
    enableStorage: false,
    maxStoredLogs: 1000,
  });

  private logs = signal<LogEntry[]>([]);

  /**
   * Configure logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config.update(current => ({ ...current, ...config }));
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, {
      ...context,
      stack: error?.stack,
    });
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const config = this.config();

    // Check if log level is enabled
    if (LOG_LEVELS[level] < LOG_LEVELS[config.minLevel || 'info']) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      stack: context?.stack,
    };

    // Console logging
    if (config.enableConsole) {
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
   * Store logs in memory
   */
  private storeLogs(entry: LogEntry): void {
    this.logs.update(logs => {
      const newLogs = [...logs, entry];
      const maxLogs = this.config().maxStoredLogs || 1000;

      // Keep only the most recent logs
      if (newLogs.length > maxLogs) {
        return newLogs.slice(-maxLogs);
      }

      return newLogs;
    });
  }

  /**
   * Get stored logs
   */
  getLogs(filter?: { level?: LogLevel; since?: Date }): LogEntry[] {
    const logs = this.logs();

    if (!filter) {
      return logs;
    }

    return logs.filter(log => {
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
      return this.logs().filter(log => log.level === level).length;
    }
    return this.logs().length;
  }

  /**
   * Group logs by time period
   */
  groupLogsByPeriod(period: 'hour' | 'day' | 'week'): Map<string, LogEntry[]> {
    const grouped = new Map<string, LogEntry[]>();
    const logs = this.logs();

    logs.forEach(log => {
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
        return weekStart.toISOString().split('T')[0];
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

