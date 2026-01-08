/**
 * Error Handler Registry
 *
 * Centralized registry for domain-specific error handlers.
 * Allows different parts of the application to register custom error handling logic.
 *
 * @example
 * ```typescript
 * // Register handler
 * errorHandlerRegistry.register('api', (error) => {
 *   console.log('API Error:', error);
 * });
 *
 * // Handle error
 * errorHandlerRegistry.handle('api', error);
 * ```
 */

import { Injectable } from '@angular/core';
import { ApplicationError } from '../constants/error-codes';

export type ErrorHandlerFn = (
  error: Error | ApplicationError,
  context?: unknown
) => void | Promise<void>;

export interface IErrorHandlerConfig {
  handler: ErrorHandlerFn;
  priority?: number; // Higher priority handlers run first
  async?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerRegistry {
  private handlers = new Map<string, IErrorHandlerConfig[]>();
  private globalHandlers: IErrorHandlerConfig[] = [];

  /**
   * Register domain-specific error handler
   */
  public register(
    domain: string,
    handler: ErrorHandlerFn,
    config?: Partial<IErrorHandlerConfig>
  ): void {
    const handlerConfig: IErrorHandlerConfig = {
      handler,
      priority: config?.priority ?? 0,
      async: config?.async ?? false,
    };

    if (!this.handlers.has(domain)) {
      this.handlers.set(domain, []);
    }

    const domainHandlers = this.handlers.get(domain)!;
    domainHandlers.push(handlerConfig);

    // Sort by priority (highest first)
    domainHandlers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Register global error handler (runs for all errors)
   */
  public registerGlobal(handler: ErrorHandlerFn, config?: Partial<IErrorHandlerConfig>): void {
    const handlerConfig: IErrorHandlerConfig = {
      handler,
      priority: config?.priority ?? 0,
      async: config?.async ?? false,
    };

    this.globalHandlers.push(handlerConfig);
    this.globalHandlers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Handle error with registered handlers
   */
  public async handle(
    domain: string,
    error: Error | ApplicationError,
    context?: unknown
  ): Promise<void> {
    // Run domain-specific handlers
    const domainHandlers = this.handlers.get(domain) || [];
    await this.runHandlers(domainHandlers, error, context);

    // Run global handlers
    await this.runHandlers(this.globalHandlers, error, context);
  }

  /**
   * Run handlers sequentially
   */
  private async runHandlers(
    handlers: IErrorHandlerConfig[],
    error: Error | ApplicationError,
    context?: unknown
  ): Promise<void> {
    for (const config of handlers) {
      try {
        if (config.async) {
          await config.handler(error, context);
        } else {
          const result = config.handler(error, context);
          // Handle case where handler returns a promise even if not marked as async
          if (result instanceof Promise) {
            void result.catch((handlerError: unknown) => {
              console.error('[ErrorHandlerRegistry] Handler failed:', handlerError);
            });
          }
        }
      } catch (handlerError: unknown) {
        console.error('[ErrorHandlerRegistry] Handler failed:', handlerError);
      }
    }
  }

  /**
   * Unregister handler
   */
  public unregister(domain: string, handler: ErrorHandlerFn): void {
    const domainHandlers = this.handlers.get(domain);
    if (domainHandlers) {
      const index = domainHandlers.findIndex((h) => h.handler === handler);
      if (index !== -1) {
        domainHandlers.splice(index, 1);
      }
    }
  }

  /**
   * Clear all handlers for domain
   */
  public clear(domain: string): void {
    this.handlers.delete(domain);
  }

  /**
   * Clear all handlers
   */
  public clearAll(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }

  /**
   * Get registered domains
   */
  public getDomains(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * Common error handler implementations
 */
export const errorHandlers = {
  /**
   * Log error to console
   */
  logToConsole: (error: Error, context?: unknown) => {
    console.error('[Error]', error.message, context);
  },

  /**
   * Show user-friendly toast notification
   */
  showToast: (error: Error, _context?: unknown) => {
    // Would inject ToastService here
    console.warn('[Toast]', error.message);
  },

  /**
   * Track error with analytics
   */
  trackWithAnalytics: (error: Error, _context?: unknown) => {
    // Would inject AnalyticsService here
    console.warn('[Analytics] Error tracked:', error.message);
  },

  /**
   * Retry failed operation
   */
  retry: async (error: Error, context?: unknown) => {
    interface RetryContext {
      retryFn: () => Promise<void>;
    }
    if (context && typeof context === 'object' && 'retryFn' in context) {
      const retryContext = context as RetryContext;
      try {
        await retryContext.retryFn();
      } catch (retryError: unknown) {
        console.error('[Retry] Failed:', retryError);
      }
    }
  },
};
