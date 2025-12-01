/**
 * Developer Diagnostics Utility (Points 52, 90)
 * 
 * Creates a developer panel showing card state, streaming progress,
 * render metrics, and runtime diagnostics.
 * 
 * @example
 * ```typescript
 * import { DevDiagnostics, enableDevMode } from 'osi-cards-lib';
 * 
 * // Enable in development
 * if (isDev) {
 *   enableDevMode();
 *   DevDiagnostics.showPanel();
 * }
 * 
 * // Log diagnostics
 * DevDiagnostics.logState('card-1', cardConfig);
 * DevDiagnostics.logRender('card-1', { duration: 150 });
 * ```
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { getLogger, LogLevel, setGlobalLogLevel } from './structured-logging.util';

const logger = getLogger('osi-cards:diagnostics');

/**
 * Diagnostic entry types
 */
export type DiagnosticType = 'state' | 'render' | 'streaming' | 'error' | 'warning' | 'info';

/**
 * Diagnostic entry
 */
export interface DiagnosticEntry {
  id: string;
  type: DiagnosticType;
  timestamp: Date;
  source: string;
  message: string;
  data?: unknown;
  duration?: number;
}

/**
 * Dev mode state
 */
interface DevModeState {
  enabled: boolean;
  showPanel: boolean;
  logLevel: LogLevel;
  maxEntries: number;
  entries: DiagnosticEntry[];
}

/**
 * Dev diagnostics manager
 */
class DevDiagnosticsManager {
  private readonly state$ = new BehaviorSubject<DevModeState>({
    enabled: false,
    showPanel: false,
    logLevel: LogLevel.WARN,
    maxEntries: 1000,
    entries: [],
  });

  /**
   * Enable dev mode
   */
  public enable(): void {
    this.updateState({ enabled: true });
    setGlobalLogLevel(LogLevel.DEBUG);
    logger.info('Dev mode enabled');
  }

  /**
   * Disable dev mode
   */
  public disable(): void {
    this.updateState({ enabled: false, showPanel: false });
    setGlobalLogLevel(LogLevel.WARN);
    logger.info('Dev mode disabled');
  }

  /**
   * Check if dev mode is enabled
   */
  public isEnabled(): boolean {
    return this.state$.value.enabled;
  }

  /**
   * Show diagnostics panel
   */
  public showPanel(): void {
    if (!this.state$.value.enabled) {
      logger.warn('Enable dev mode first');
      return;
    }
    this.updateState({ showPanel: true });
  }

  /**
   * Hide diagnostics panel
   */
  public hidePanel(): void {
    this.updateState({ showPanel: false });
  }

  /**
   * Get state observable
   */
  public getState$(): Observable<DevModeState> {
    return this.state$.asObservable();
  }

  /**
   * Log state change
   */
  public logState(source: string, state: unknown): void {
    this.addEntry({
      type: 'state',
      source,
      message: 'State updated',
      data: state,
    });
  }

  /**
   * Log render event
   */
  public logRender(
    source: string,
    metrics: { duration: number; sections?: number; fields?: number }
  ): void {
    this.addEntry({
      type: 'render',
      source,
      message: `Rendered in ${metrics.duration}ms`,
      data: metrics,
      duration: metrics.duration,
    });
  }

  /**
   * Log streaming event
   */
  public logStreaming(
    source: string,
    event: { stage: string; progress?: number; error?: Error }
  ): void {
    this.addEntry({
      type: 'streaming',
      source,
      message: `Streaming: ${event.stage}`,
      data: event,
    });
  }

  /**
   * Log error
   */
  public logError(source: string, error: Error, context?: unknown): void {
    this.addEntry({
      type: 'error',
      source,
      message: error.message,
      data: { error: { name: error.name, stack: error.stack }, context },
    });
  }

  /**
   * Log warning
   */
  public logWarning(source: string, message: string, data?: unknown): void {
    this.addEntry({
      type: 'warning',
      source,
      message,
      data,
    });
  }

  /**
   * Log info
   */
  public logInfo(source: string, message: string, data?: unknown): void {
    this.addEntry({
      type: 'info',
      source,
      message,
      data,
    });
  }

  /**
   * Get all entries
   */
  public getEntries(): DiagnosticEntry[] {
    return [...this.state$.value.entries];
  }

  /**
   * Get entries by type
   */
  public getEntriesByType(type: DiagnosticType): DiagnosticEntry[] {
    return this.state$.value.entries.filter(e => e.type === type);
  }

  /**
   * Clear entries
   */
  public clearEntries(): void {
    this.updateState({ entries: [] });
  }

  /**
   * Get summary statistics
   */
  public getSummary(): {
    totalEntries: number;
    byType: Record<DiagnosticType, number>;
    avgRenderTime: number;
    errorCount: number;
  } {
    const entries = this.state$.value.entries;
    const byType = entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<DiagnosticType, number>);

    const renderEntries = entries.filter(e => e.type === 'render' && e.duration);
    const avgRenderTime = renderEntries.length > 0
      ? renderEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / renderEntries.length
      : 0;

    return {
      totalEntries: entries.length,
      byType,
      avgRenderTime,
      errorCount: byType.error || 0,
    };
  }

  /**
   * Export diagnostics to JSON
   */
  public exportToJSON(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: this.getSummary(),
      entries: this.state$.value.entries,
    }, null, 2);
  }

  /**
   * Add diagnostic entry
   */
  private addEntry(entry: Omit<DiagnosticEntry, 'id' | 'timestamp'>): void {
    if (!this.state$.value.enabled) return;

    const fullEntry: DiagnosticEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    };

    const entries = [fullEntry, ...this.state$.value.entries]
      .slice(0, this.state$.value.maxEntries);

    this.updateState({ entries });

    // Also log to console in dev mode
    logger.debug(`[${entry.type}] ${entry.source}: ${entry.message}`, entry.data as Record<string, unknown>);
  }

  /**
   * Update state
   */
  private updateState(partial: Partial<DevModeState>): void {
    this.state$.next({
      ...this.state$.value,
      ...partial,
    });
  }
}

/**
 * Global diagnostics instance
 */
export const DevDiagnostics = new DevDiagnosticsManager();

/**
 * Enable dev mode
 */
export function enableDevMode(): void {
  DevDiagnostics.enable();
}

/**
 * Disable dev mode
 */
export function disableDevMode(): void {
  DevDiagnostics.disable();
}

/**
 * Check if dev mode is enabled
 */
export function isDevMode(): boolean {
  return DevDiagnostics.isEnabled();
}

/**
 * Performance timing decorator for dev mode
 */
export function timed(name?: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = name ?? `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: unknown[]) {
      if (!DevDiagnostics.isEnabled()) {
        return originalMethod.apply(this, args);
      }

      const start = performance.now();
      const result = originalMethod.apply(this, args);

      // Handle promises
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          DevDiagnostics.logRender(methodName, { duration });
        });
      }

      const duration = performance.now() - start;
      DevDiagnostics.logRender(methodName, { duration });
      return result;
    };

    return descriptor;
  };
}

