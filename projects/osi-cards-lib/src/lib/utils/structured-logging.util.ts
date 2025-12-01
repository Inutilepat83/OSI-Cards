/**
 * Structured Logging Utility (Point 81)
 * 
 * Provides JSON-formatted logging with correlation IDs for distributed tracing.
 * 
 * @example
 * ```typescript
 * import { createLogger, LogLevel } from 'osi-cards-lib';
 * 
 * const logger = createLogger('CardRenderer', { level: LogLevel.DEBUG });
 * 
 * logger.info('Card rendered', { cardId: 'card-1', renderTime: 150 });
 * logger.error('Render failed', { cardId: 'card-1', error });
 * 
 * // With correlation ID
 * logger.withCorrelationId('req-123').info('Processing request');
 * ```
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  correlationId?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level?: LogLevel;
  /** Include stack traces in errors */
  includeStackTrace?: boolean;
  /** Additional context to include in all logs */
  context?: Record<string, unknown>;
  /** Custom output function */
  output?: (entry: LogEntry) => void;
  /** Format as JSON */
  json?: boolean;
}

/**
 * Logger instance
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>, error?: Error): void;
  withCorrelationId(id: string): Logger;
  withContext(context: Record<string, unknown>): Logger;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

/**
 * Default output functions
 */
const consoleOutput = (entry: LogEntry): void => {
  const method = entry.level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error';
  const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.logger}]`;
  
  if (entry.correlationId) {
    console[method](`${prefix} [${entry.correlationId}]`, entry.message, entry.data || '');
  } else {
    console[method](prefix, entry.message, entry.data || '');
  }
  
  if (entry.error) {
    console[method]('Error:', entry.error);
  }
};

const jsonOutput = (entry: LogEntry): void => {
  console.log(JSON.stringify(entry));
};

/**
 * Create a logger instance
 */
export function createLogger(name: string, config: LoggerConfig = {}): Logger {
  let level = config.level ?? LogLevel.INFO;
  let context = config.context ?? {};
  let correlationId: string | undefined;
  const output = config.output ?? (config.json ? jsonOutput : consoleOutput);
  const includeStackTrace = config.includeStackTrace ?? true;

  const log = (
    logLevel: LogLevel,
    levelName: string,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void => {
    if (logLevel < level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      logger: name,
      message,
      correlationId,
      data,
      context: Object.keys(context).length > 0 ? context : undefined,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: includeStackTrace ? error.stack : undefined,
      };
    }

    output(entry);
  };

  const logger: Logger = {
    debug(message: string, data?: Record<string, unknown>): void {
      log(LogLevel.DEBUG, 'DEBUG', message, data);
    },

    info(message: string, data?: Record<string, unknown>): void {
      log(LogLevel.INFO, 'INFO', message, data);
    },

    warn(message: string, data?: Record<string, unknown>): void {
      log(LogLevel.WARN, 'WARN', message, data);
    },

    error(message: string, data?: Record<string, unknown>, error?: Error): void {
      log(LogLevel.ERROR, 'ERROR', message, data, error);
    },

    withCorrelationId(id: string): Logger {
      return createLogger(name, {
        ...config,
        level,
        context: { ...context, correlationId: id },
      });
    },

    withContext(newContext: Record<string, unknown>): Logger {
      return createLogger(name, {
        ...config,
        level,
        context: { ...context, ...newContext },
      });
    },

    setLevel(newLevel: LogLevel): void {
      level = newLevel;
    },

    getLevel(): LogLevel {
      return level;
    },
  };

  return logger;
}

/**
 * Global logger registry
 */
class LoggerRegistry {
  private static instance: LoggerRegistry;
  private readonly loggers = new Map<string, Logger>();
  private globalLevel = LogLevel.INFO;
  private globalConfig: LoggerConfig = {};

  public static getInstance(): LoggerRegistry {
    if (!LoggerRegistry.instance) {
      LoggerRegistry.instance = new LoggerRegistry();
    }
    return LoggerRegistry.instance;
  }

  public getLogger(name: string): Logger {
    if (!this.loggers.has(name)) {
      this.loggers.set(name, createLogger(name, {
        ...this.globalConfig,
        level: this.globalLevel,
      }));
    }
    return this.loggers.get(name)!;
  }

  public setGlobalLevel(level: LogLevel): void {
    this.globalLevel = level;
    this.loggers.forEach(logger => logger.setLevel(level));
  }

  public setGlobalConfig(config: LoggerConfig): void {
    this.globalConfig = config;
  }

  public getLoggerNames(): string[] {
    return Array.from(this.loggers.keys());
  }
}

/**
 * Get or create a logger from the registry
 */
export function getLogger(name: string): Logger {
  return LoggerRegistry.getInstance().getLogger(name);
}

/**
 * Set global log level
 */
export function setGlobalLogLevel(level: LogLevel): void {
  LoggerRegistry.getInstance().setGlobalLevel(level);
}

/**
 * Generate a correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Pre-defined loggers for OSI Cards subsystems
 */
export const OSICardsLoggers = {
  card: () => getLogger('osi-cards:card'),
  section: () => getLogger('osi-cards:section'),
  streaming: () => getLogger('osi-cards:streaming'),
  theme: () => getLogger('osi-cards:theme'),
  layout: () => getLogger('osi-cards:layout'),
  registry: () => getLogger('osi-cards:registry'),
  performance: () => getLogger('osi-cards:performance'),
};

