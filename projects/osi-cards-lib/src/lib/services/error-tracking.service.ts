import { Injectable, ErrorHandler, inject, signal, computed, OnDestroy } from '@angular/core';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Tracked error entry
 */
export interface TrackedError {
  /** Unique error ID */
  id: string;
  /** Error message */
  message: string;
  /** Error name/type */
  name: string;
  /** Stack trace */
  stack?: string;
  /** Severity level */
  severity: ErrorSeverity;
  /** Component where error occurred */
  component?: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Timestamp */
  timestamp: number;
  /** Number of occurrences */
  count: number;
  /** Whether error was reported */
  reported: boolean;
}

/**
 * Error tracking configuration
 */
export interface ErrorTrackingConfig {
  /** Maximum errors to store */
  maxErrors?: number;
  /** Enable console logging */
  logToConsole?: boolean;
  /** Custom error reporter */
  reporter?: (error: TrackedError) => Promise<void>;
  /** Ignored error patterns */
  ignorePatterns?: RegExp[];
  /** Sample rate (0-1) */
  sampleRate?: number;
}

/**
 * Error Tracking Service
 *
 * Tracks and reports errors in OSI Cards components.
 * Provides error aggregation, reporting, and analysis.
 *
 * @example
 * ```typescript
 * const errors = inject(ErrorTrackingService);
 *
 * // Track an error
 * errors.track(new Error('Something went wrong'), {
 *   component: 'CardRenderer',
 *   severity: 'medium'
 * });
 *
 * // Get error summary
 * const summary = errors.getSummary();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ErrorTrackingService implements OnDestroy {
  /** All tracked errors */
  private readonly errors = signal<Map<string, TrackedError>>(new Map());

  /** Configuration */
  private config: Required<ErrorTrackingConfig> = {
    maxErrors: 100,
    logToConsole: true,
    reporter: async () => {},
    ignorePatterns: [],
    sampleRate: 1.0
  };

  /** Get all errors as array */
  readonly allErrors = computed(() => Array.from(this.errors().values()));

  /** Get critical errors */
  readonly criticalErrors = computed(() =>
    this.allErrors().filter(e => e.severity === 'critical')
  );

  /** Get unreported errors */
  readonly unreportedErrors = computed(() =>
    this.allErrors().filter(e => !e.reported)
  );

  /** Get error count */
  readonly errorCount = computed(() => this.errors().size);

  ngOnDestroy(): void {
    this.clear();
  }

  /**
   * Configure the service
   */
  configure(config: Partial<ErrorTrackingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Track an error
   */
  track(
    error: Error | string,
    options?: {
      component?: string;
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
    }
  ): string {
    const err = error instanceof Error ? error : new Error(error);

    // Check if should ignore
    if (this.shouldIgnore(err)) {
      return '';
    }

    // Check sample rate
    if (Math.random() > this.config.sampleRate) {
      return '';
    }

    const errorId = this.generateErrorId(err);
    const existing = this.errors().get(errorId);

    if (existing) {
      // Increment count for existing error
      this.errors.update(map => {
        const newMap = new Map(map);
        newMap.set(errorId, {
          ...existing,
          count: existing.count + 1,
          timestamp: Date.now()
        });
        return newMap;
      });
    } else {
      // Add new error
      const trackedError: TrackedError = {
        id: errorId,
        message: err.message,
        name: err.name,
        stack: err.stack,
        severity: options?.severity ?? this.inferSeverity(err),
        component: options?.component,
        context: options?.context,
        timestamp: Date.now(),
        count: 1,
        reported: false
      };

      this.errors.update(map => {
        const newMap = new Map(map);

        // Remove oldest if at max
        if (newMap.size >= this.config.maxErrors) {
          const oldest = Array.from(newMap.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
          if (oldest) {
            newMap.delete(oldest[0]);
          }
        }

        newMap.set(errorId, trackedError);
        return newMap;
      });

      // Log to console if enabled
      if (this.config.logToConsole) {
        console.error(`[OSI Cards Error] ${err.message}`, {
          component: options?.component,
          context: options?.context
        });
      }
    }

    return errorId;
  }

  /**
   * Track an error with automatic component detection
   */
  trackInComponent(error: Error, component: string): string {
    return this.track(error, { component });
  }

  /**
   * Get error by ID
   */
  getError(id: string): TrackedError | undefined {
    return this.errors().get(id);
  }

  /**
   * Get errors by component
   */
  getErrorsByComponent(component: string): TrackedError[] {
    return this.allErrors().filter(e => e.component === component);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): TrackedError[] {
    return this.allErrors().filter(e => e.severity === severity);
  }

  /**
   * Report all unreported errors
   */
  async reportAll(): Promise<void> {
    const unreported = this.unreportedErrors();

    for (const error of unreported) {
      try {
        await this.config.reporter(error);
        this.markAsReported(error.id);
      } catch (e) {
        console.error('Failed to report error:', e);
      }
    }
  }

  /**
   * Mark an error as reported
   */
  markAsReported(id: string): void {
    this.errors.update(map => {
      const error = map.get(id);
      if (error) {
        const newMap = new Map(map);
        newMap.set(id, { ...error, reported: true });
        return newMap;
      }
      return map;
    });
  }

  /**
   * Get error summary
   */
  getSummary(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    unreported: number;
    topErrors: TrackedError[];
  } {
    const all = this.allErrors();

    const bySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    all.forEach(e => bySeverity[e.severity]++);

    const topErrors = [...all]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: all.length,
      bySeverity,
      unreported: this.unreportedErrors().length,
      topErrors
    };
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors.set(new Map());
  }

  /**
   * Remove a specific error
   */
  remove(id: string): void {
    this.errors.update(map => {
      const newMap = new Map(map);
      newMap.delete(id);
      return newMap;
    });
  }

  /**
   * Export errors as JSON
   */
  export(): string {
    return JSON.stringify({
      errors: this.allErrors(),
      summary: this.getSummary(),
      timestamp: Date.now()
    }, null, 2);
  }

  /**
   * Generate unique error ID based on message and stack
   */
  private generateErrorId(error: Error): string {
    const str = `${error.name}:${error.message}:${error.stack?.slice(0, 200) || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `err_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Check if error should be ignored
   */
  private shouldIgnore(error: Error): boolean {
    return this.config.ignorePatterns.some(pattern =>
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  /**
   * Infer severity from error
   */
  private inferSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical';
    }
    if (message.includes('failed') || message.includes('error')) {
      return 'high';
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'low';
    }

    return 'medium';
  }
}

/**
 * Custom error handler that integrates with ErrorTrackingService
 */
@Injectable()
export class OSICardsErrorHandler implements ErrorHandler {
  private readonly errorTracking = inject(ErrorTrackingService);

  handleError(error: Error): void {
    this.errorTracking.track(error, {
      severity: 'high',
      context: {
        source: 'ErrorHandler'
      }
    });

    // Re-throw in development
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw error;
    }
  }
}



