import { inject, Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';

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
}

/**
 * Structured logging service with log levels
 * Replaces console.log statements throughout the application
 */
@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private readonly config = inject(AppConfigService);
  private readonly logHistory: LogEntry[] = [];
  private readonly maxHistorySize = 1000;
  private correlationId: string | null = null;
  private sessionId: string = this.generateSessionId();

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

  /**
   * Internal log method with enhanced structured logging
   */
  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
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

    // Generate correlation ID if not set (for request tracing)
    if (!this.correlationId && level === 'error') {
      this.correlationId = `corr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date(),
      correlationId: this.correlationId || undefined,
      sessionId: this.sessionId,
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
      structuredLog['context'] = context;
    }

    if (this.correlationId) {
      structuredLog['correlationId'] = this.correlationId;
    }

    if (data) {
      structuredLog['data'] = data;
    }

    // Output to console based on level with structured format
    const logMessage = context ? `[${context}] ${message}` : message;
    const logData = data ? [logMessage, data] : [logMessage];

    // Also log structured format for better debugging
    const structuredMessage = `[${level.toUpperCase()}] ${JSON.stringify(structuredLog, null, 2)}`;

    switch (level) {
      case 'debug':
        if (this.config.LOGGING.ENABLE_SECTION_STATE_LOGGING) {
          console.debug(...logData);
          if (this.config.LOGGING.ENABLE_DEBUG) {
            console.debug(structuredMessage);
          }
        }
        break;
      case 'info':
        console.info(...logData);
        if (this.config.LOGGING.ENABLE_DEBUG) {
          console.info(structuredMessage);
        }
        break;
      case 'warn':
        console.warn(...logData);
        console.warn(structuredMessage);
        break;
      case 'error':
        console.error(...logData);
        console.error(structuredMessage);
        break;
    }
  }

  /**
   * Get log history
   */
  getHistory(level?: LogLevel, limit?: number): LogEntry[] {
    let entries = this.logHistory;
    if (level) {
      entries = entries.filter((entry) => entry.level === level);
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
