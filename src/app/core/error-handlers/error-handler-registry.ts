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
  context?: any
) => void | Promise<void>;

export interface ErrorHandlerConfig {
  handler: ErrorHandlerFn;
  priority?: number; // Higher priority handlers run first
  async?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerRegistry {
  private handlers = new Map<string, ErrorHandlerConfig[]>();
  private globalHandlers: ErrorHandlerConfig[] = [];

  /**
   * Register domain-specific error handler
   */
  register(domain: string, handler: ErrorHandlerFn, config?: Partial<ErrorHandlerConfig>): void {
    const handlerConfig: ErrorHandlerConfig = {
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
  registerGlobal(handler: ErrorHandlerFn, config?: Partial<ErrorHandlerConfig>): void {
    const handlerConfig: ErrorHandlerConfig = {
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
  async handle(domain: string, error: Error | ApplicationError, context?: any): Promise<void> {
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
    handlers: ErrorHandlerConfig[],
    error: Error | ApplicationError,
    context?: any
  ): Promise<void> {
    for (const config of handlers) {
      try {
        if (config.async) {
          await config.handler(error, context);
        } else {
          config.handler(error, context);
        }
      } catch (handlerError) {
        console.error('[ErrorHandlerRegistry] Handler failed:', handlerError);
      }
    }
  }

  /**
   * Unregister handler
   */
  unregister(domain: string, handler: ErrorHandlerFn): void {
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
  clear(domain: string): void {
    this.handlers.delete(domain);
  }

  /**
   * Clear all handlers
   */
  clearAll(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }

  /**
   * Get registered domains
   */
  getDomains(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * Common error handler implementations
 */
export const ErrorHandlers = {
  /**
   * Log error to console
   */
  logToConsole: (error: Error, context?: any) => {
    console.error('[Error]', error.message, context);
  },

  /**
   * Show user-friendly toast notification
   */
  showToast: (error: Error, context?: any) => {
    // Would inject ToastService here
    console.warn('[Toast]', error.message);
  },

  /**
   * Track error with analytics
   */
  trackWithAnalytics: (error: Error, context?: any) => {
    // Would inject AnalyticsService here
    console.info('[Analytics] Error tracked:', error.message);
  },

  /**
   * Retry failed operation
   */
  retry: async (error: Error, context?: any) => {
    if (context?.retryFn) {
      try {
        await context.retryFn();
      } catch (retryError) {
        console.error('[Retry] Failed:', retryError);
      }
    }
  },
};



