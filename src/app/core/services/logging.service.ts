import { Injectable, inject } from '@angular/core';
import { AppConfigService } from './app-config.service';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: Date;
}

/**
 * Structured logging service with log levels
 * Replaces console.log statements throughout the application
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private readonly config = inject(AppConfigService);
  private readonly logHistory: LogEntry[] = [];
  private readonly maxHistorySize = 1000;

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: string, data?: unknown): void {
    this.log('error', message, context, data);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const configLevel = this.config.LOGGING.LOG_LEVEL;
    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    // Only log if level is at or above configured level
    if (levelPriority[level] < levelPriority[configLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date()
    };

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Output to console based on level
    const logMessage = context ? `[${context}] ${message}` : message;
    const logData = data ? [logMessage, data] : [logMessage];

    switch (level) {
      case 'debug':
        if (this.config.LOGGING.ENABLE_SECTION_STATE_LOGGING) {
          console.debug(...logData);
        }
        break;
      case 'info':
        console.info(...logData);
        break;
      case 'warn':
        console.warn(...logData);
        break;
      case 'error':
        console.error(...logData);
        break;
    }
  }

  /**
   * Get log history
   */
  getHistory(level?: LogLevel, limit?: number): LogEntry[] {
    let entries = this.logHistory;
    if (level) {
      entries = entries.filter(entry => entry.level === level);
    }
    if (limit) {
      entries = entries.slice(-limit);
    }
    return entries;
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory.length = 0;
  }
}


