/**
 * Base interface for all services
 * Provides common contract for service lifecycle and error handling
 */
export interface IBaseService {
  /**
   * Initialize the service
   * Called after dependency injection
   */
  initialize?(): void | Promise<void>;

  /**
   * Clean up resources
   * Called when service is destroyed
   */
  destroy?(): void;
}

/**
 * Service with caching capabilities
 */
export interface ICacheableService<T> {
  /**
   * Clear the cache
   */
  clearCache(): void;

  /**
   * Get cache size
   */
  getCacheSize(): number;

  /**
   * Check if item is cached
   */
  isCached(key: string): boolean;

  /**
   * Get cached item
   */
  getCached(key: string): T | null;
}

/**
 * Service with error handling
 */
export interface IErrorHandlingService {
  /**
   * Handle an error
   */
  handleError(error: Error, context?: string): void;

  /**
   * Get error history
   */
  getErrorHistory(): Error[];
}

/**
 * Service with logging
 */
export interface ILoggingService {
  /**
   * Log a debug message
   */
  debug(message: string, context?: string, data?: unknown): void;

  /**
   * Log an info message
   */
  info(message: string, context?: string, data?: unknown): void;

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, data?: unknown): void;

  /**
   * Log an error message
   */
  error(message: string, context?: string, data?: unknown): void;
}

