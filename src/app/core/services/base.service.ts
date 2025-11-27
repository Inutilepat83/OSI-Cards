import { Injectable, inject, OnDestroy } from '@angular/core';
import { LoggingService } from './logging.service';
import { AppConfigService } from './app-config.service';

/**
 * Base service class for all application services
 * 
 * Provides common functionality and ensures consistency across all services:
 * - Logging integration
 * - Configuration access
 * - Lifecycle management
 * - Error handling patterns
 * 
 * All services should extend this class to inherit common patterns and ensure
 * consistent behavior across the application.
 * 
 * @example
 * ```typescript
 * @Injectable({
 *   providedIn: 'root'
 * })
 * export class MyService extends BaseService {
 *   constructor() {
 *     super();
 *     // Service-specific initialization
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class BaseService implements OnDestroy {
  protected readonly logger = inject(LoggingService);
  protected readonly config = inject(AppConfigService);

  /**
   * Service initialization hook
   * Override this method to perform service-specific initialization
   */
  protected initialize(): void {
    // Override in derived classes if needed
  }

  /**
   * Service cleanup hook
   * Override this method to perform service-specific cleanup
   */
  protected cleanup(): void {
    // Override in derived classes if needed
  }

  /**
   * Check if service is in development mode
   */
  protected get isDevelopmentMode(): boolean {
    return !this.config.isProduction && this.config.LOGGING.ENABLE_DEBUG;
  }

  /**
   * Log debug message (only in development mode)
   */
  protected debug(message: string, context?: string, data?: unknown): void {
    if (this.isDevelopmentMode) {
      this.logger.debug(message, context || this.constructor.name, data);
    }
  }

  /**
   * Log info message
   */
  protected info(message: string, context?: string, data?: unknown): void {
    this.logger.info(message, context || this.constructor.name, data);
  }

  /**
   * Log warning message
   */
  protected warn(message: string, context?: string, data?: unknown): void {
    this.logger.warn(message, context || this.constructor.name, data);
  }

  /**
   * Log error message
   */
  protected error(message: string, context?: string, data?: unknown): void {
    this.logger.error(message, context || this.constructor.name, data);
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.cleanup();
  }
}


