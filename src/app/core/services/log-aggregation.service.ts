/**
 * Log Aggregation Service
 *
 * Collects and aggregates logs from multiple sources.
 * Sends to external log management systems (DataDog, Splunk, etc.)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private logAggregation = inject(LogAggregationService);
 *
 *   ngOnInit() {
 *     this.logAggregation.startAggregation();
 *   }
 * }
 * ```
 */

import { Injectable } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { buffer, filter } from 'rxjs/operators';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  source?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface AggregatedLogs {
  entries: LogEntry[];
  count: number;
  startTime: number;
  endTime: number;
  summary: {
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LogAggregationService {
  private logStream = new Subject<LogEntry>();
  private aggregationInterval = 60000; // 1 minute
  private maxBatchSize = 100;

  constructor() {
    this.setupAggregation();
  }

  /**
   * Add log entry to aggregation
   */
  addLog(entry: LogEntry): void {
    // Add session ID if available
    if (!entry.sessionId) {
      entry.sessionId = this.getSessionId();
    }

    this.logStream.next(entry);
  }

  /**
   * Log with convenience methods
   */
  debug(message: string, context?: Record<string, any>, source?: string): void {
    this.addLog({ level: 'debug', message, timestamp: Date.now(), context, source });
  }

  info(message: string, context?: Record<string, any>, source?: string): void {
    this.addLog({ level: 'info', message, timestamp: Date.now(), context, source });
  }

  warn(message: string, context?: Record<string, any>, source?: string): void {
    this.addLog({ level: 'warn', message, timestamp: Date.now(), context, source });
  }

  error(message: string, context?: Record<string, any>, source?: string): void {
    this.addLog({ level: 'error', message, timestamp: Date.now(), context, source });
  }

  /**
   * Setup log aggregation
   */
  private setupAggregation(): void {
    // Buffer logs and send in batches
    let logBuffer: LogEntry[] = [];

    this.logStream.subscribe((log) => {
      logBuffer.push(log);

      if (logBuffer.length >= this.maxBatchSize) {
        this.sendBatch(logBuffer);
        logBuffer = [];
      }
    });

    // Also send periodically
    setInterval(() => {
      if (logBuffer.length > 0) {
        this.sendBatch(logBuffer);
        logBuffer = [];
      }
    }, this.aggregationInterval);
  }

  /**
   * Send batch of logs to external system
   */
  private async sendBatch(logs: LogEntry[]): Promise<void> {
    if (logs.length === 0) {
      return;
    }

    const aggregated: AggregatedLogs = this.aggregateLogs(logs);

    // Send to external systems
    await this.sendToDataDog(aggregated);
    await this.sendToSplunk(aggregated);

    // Log locally in development
    if (this.isDevelopment()) {
      console.log('[LogAggregation] Batch sent:', aggregated.summary);
    }
  }

  /**
   * Aggregate logs into summary
   */
  private aggregateLogs(logs: LogEntry[]): AggregatedLogs {
    const timestamps = logs.map((l) => l.timestamp);
    const startTime = Math.min(...timestamps);
    const endTime = Math.max(...timestamps);

    const byLevel: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    logs.forEach((log) => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      if (log.source) {
        bySource[log.source] = (bySource[log.source] || 0) + 1;
      }
    });

    return {
      entries: logs,
      count: logs.length,
      startTime,
      endTime,
      summary: { byLevel, bySource },
    };
  }

  /**
   * Send to DataDog
   */
  private async sendToDataDog(aggregated: AggregatedLogs): Promise<void> {
    // TODO: Implement DataDog integration
    // POST to https://http-intake.logs.datadoghq.com/v1/input/{API_KEY}
    if (this.isDevelopment()) {
      console.log('[DataDog] Would send:', aggregated.count, 'logs');
    }
  }

  /**
   * Send to Splunk
   */
  private async sendToSplunk(aggregated: AggregatedLogs): Promise<void> {
    // TODO: Implement Splunk integration
    // POST to Splunk HEC endpoint
    if (this.isDevelopment()) {
      console.log('[Splunk] Would send:', aggregated.count, 'logs');
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (typeof sessionStorage === 'undefined') {
      return 'server-session';
    }

    let sessionId = sessionStorage.getItem('osi-session-id');

    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('osi-session-id', sessionId);
    }

    return sessionId;
  }

  /**
   * Check if in development
   */
  private isDevelopment(): boolean {
    return typeof window !== 'undefined' && window.location.hostname === 'localhost';
  }
}
