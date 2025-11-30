/**
 * Grid Logger Utility
 * 
 * Provides consistent, configurable logging across the OSI Cards library.
 * Supports log levels, categories, and conditional logging based on
 * debug mode and environment.
 * 
 * @example
 * ```typescript
 * import { GridLogger, LogCategory, LogLevel } from 'osi-cards-lib';
 * 
 * // Create a logger for a specific category
 * const logger = GridLogger.create('MasonryGrid');
 * 
 * logger.debug('Layout calculated', { columns: 4 });
 * logger.info('Section added', { id: 'section-1' });
 * logger.warn('Performance warning', { renderTime: 100 });
 * logger.error('Layout failed', new Error('Invalid section'));
 * 
 * // Configure logging
 * GridLogger.setLevel(LogLevel.WARN);
 * GridLogger.enableCategory('Streaming');
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Log level enum
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

/**
 * Pre-defined log categories for different parts of the library
 */
export enum LogCategory {
  CORE = 'Core',
  MASONRY_GRID = 'MasonryGrid',
  STREAMING = 'Streaming',
  LAYOUT = 'Layout',
  ANIMATION = 'Animation',
  ACCESSIBILITY = 'Accessibility',
  THEME = 'Theme',
  PLUGIN = 'Plugin',
  WORKER = 'Worker',
  VALIDATION = 'Validation',
  PERFORMANCE = 'Performance',
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  error?: Error;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether to include timestamps */
  timestamps: boolean;
  /** Whether to include category prefix */
  showCategory: boolean;
  /** Custom log handler */
  handler?: (entry: LogEntry) => void;
  /** Categories to enable (empty = all) */
  enabledCategories: Set<string>;
  /** Whether to store logs in memory */
  bufferLogs: boolean;
  /** Maximum buffer size */
  maxBufferSize: number;
}

/** Default configuration */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.WARN,
  timestamps: false,
  showCategory: true,
  enabledCategories: new Set(),
  bufferLogs: false,
  maxBufferSize: 1000,
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

let globalConfig: LoggerConfig = { ...DEFAULT_CONFIG };
const logBuffer: LogEntry[] = [];

// ============================================================================
// LOGGER CLASS
// ============================================================================

/**
 * Logger instance for a specific category
 */
export class GridLogger {
  private readonly category: string;

  private constructor(category: string) {
    this.category = category;
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Create a logger for a specific category
   */
  static create(category: string | LogCategory): GridLogger {
    return new GridLogger(category);
  }

  /**
   * Create a logger for a component class
   */
  static forComponent<T extends new (...args: unknown[]) => unknown>(
    component: T
  ): GridLogger {
    return new GridLogger(component.name);
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Set the global log level
   */
  static setLevel(level: LogLevel): void {
    globalConfig.level = level;
  }

  /**
   * Get the current log level
   */
  static getLevel(): LogLevel {
    return globalConfig.level;
  }

  /**
   * Enable debug mode (sets level to DEBUG)
   */
  static enableDebug(): void {
    globalConfig.level = LogLevel.DEBUG;
  }

  /**
   * Disable all logging
   */
  static silence(): void {
    globalConfig.level = LogLevel.SILENT;
  }

  /**
   * Enable a specific category
   */
  static enableCategory(category: string | LogCategory): void {
    globalConfig.enabledCategories.add(category);
  }

  /**
   * Disable a specific category
   */
  static disableCategory(category: string | LogCategory): void {
    globalConfig.enabledCategories.delete(category);
  }

  /**
   * Enable all categories
   */
  static enableAllCategories(): void {
    globalConfig.enabledCategories.clear();
  }

  /**
   * Configure the logger
   */
  static configure(config: Partial<LoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config };
  }

  /**
   * Reset to default configuration
   */
  static reset(): void {
    globalConfig = { ...DEFAULT_CONFIG };
    logBuffer.length = 0;
  }

  /**
   * Get buffered logs
   */
  static getBuffer(): LogEntry[] {
    return [...logBuffer];
  }

  /**
   * Clear the log buffer
   */
  static clearBuffer(): void {
    logBuffer.length = 0;
  }

  // ============================================================================
  // LOGGING METHODS
  // ============================================================================

  /**
   * Log at TRACE level
   */
  trace(message: string, data?: unknown): void {
    this.log(LogLevel.TRACE, message, data);
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log at INFO level
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log at WARN level
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log at ERROR level
   */
  error(message: string, error?: Error | unknown, data?: unknown): void {
    const errorObj = error instanceof Error ? error : undefined;
    this.log(LogLevel.ERROR, message, data, errorObj);
  }

  /**
   * Log a performance measurement
   */
  perf(label: string, duration: number, threshold?: number): void {
    const isWarning = threshold !== undefined && duration > threshold;
    const level = isWarning ? LogLevel.WARN : LogLevel.DEBUG;
    
    this.log(level, `[PERF] ${label}: ${duration.toFixed(2)}ms`, {
      duration,
      threshold,
      exceededThreshold: isWarning,
    });
  }

  /**
   * Create a timer for measuring operations
   */
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.perf(label, duration);
    };
  }

  /**
   * Log with automatic timing
   */
  async timed<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.perf(label, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * Group related log entries
   */
  group(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.group(this.formatPrefix(LogLevel.DEBUG) + label);
    }
  }

  /**
   * End a log group
   */
  groupEnd(): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.groupEnd();
    }
  }

  /**
   * Create a child logger with a sub-category
   */
  child(subCategory: string): GridLogger {
    return new GridLogger(`${this.category}:${subCategory}`);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private log(level: LogLevel, message: string, data?: unknown, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category: this.category,
      message,
      data,
      error,
    };

    // Buffer if enabled
    if (globalConfig.bufferLogs) {
      logBuffer.push(entry);
      if (logBuffer.length > globalConfig.maxBufferSize) {
        logBuffer.shift();
      }
    }

    // Custom handler
    if (globalConfig.handler) {
      globalConfig.handler(entry);
      return;
    }

    // Default console output
    this.outputToConsole(entry);
  }

  private shouldLog(level: LogLevel): boolean {
    // Check level
    if (level < globalConfig.level) {
      return false;
    }

    // Check category filter
    if (globalConfig.enabledCategories.size > 0) {
      if (!globalConfig.enabledCategories.has(this.category)) {
        // Check if parent category is enabled
        const parentCategory = this.category.split(':')[0];
        if (parentCategory && !globalConfig.enabledCategories.has(parentCategory)) {
          return false;
        }
      }
    }

    return true;
  }

  private formatPrefix(level: LogLevel): string {
    const parts: string[] = [];

    if (globalConfig.timestamps) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${LogLevel[level]}]`);

    if (globalConfig.showCategory) {
      parts.push(`[${this.category}]`);
    }

    return parts.join(' ') + ' ';
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = this.formatPrefix(entry.level);
    const args: unknown[] = [prefix + entry.message];

    if (entry.data !== undefined) {
      args.push(entry.data);
    }

    if (entry.error) {
      args.push(entry.error);
    }

    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(...args);
        break;
      case LogLevel.INFO:
        console.info(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
        console.error(...args);
        break;
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a default logger
 */
export function createLogger(category: string | LogCategory): GridLogger {
  return GridLogger.create(category);
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return globalConfig.level <= LogLevel.DEBUG;
}

/**
 * Conditionally execute code in debug mode
 */
export function debug(fn: () => void): void {
  if (isDebugEnabled()) {
    fn();
  }
}

// ============================================================================
// BROWSER INTEGRATION
// ============================================================================

// Expose to window for debugging in browser
if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__OSI_CARDS_LOGGER__', {
    value: {
      setLevel: GridLogger.setLevel,
      enableDebug: GridLogger.enableDebug,
      silence: GridLogger.silence,
      enableCategory: GridLogger.enableCategory,
      getBuffer: GridLogger.getBuffer,
      LogLevel,
      LogCategory,
    },
    writable: false,
    enumerable: false,
  });
}

