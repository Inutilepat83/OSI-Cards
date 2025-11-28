import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { SectionRenderEvent } from '../components/section-renderer/section-renderer.component';
import { EventMiddleware, EventHandler, EventTransformer, EventFilter } from '../interfaces/event-middleware.interface';

/**
 * Event Middleware Service
 * 
 * Manages event middleware chains for processing card events before they reach handlers.
 * Supports logging, transformation, filtering, and analytics integration.
 * 
 * @example
 * ```typescript
 * const eventService = inject(EventMiddlewareService);
 * 
 * // Add logging middleware
 * eventService.addMiddleware({
 *   handle: (event, next) => {
 *     console.log('Event:', event);
 *     return next(event);
 *   }
 * });
 * 
 * // Subscribe to processed events
 * eventService.processedEvents$.subscribe(event => {
 *   // Handle event
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class EventMiddlewareService {
  private middleware: EventMiddleware[] = [];
  private processedEventsSubject = new Subject<SectionRenderEvent>();
  private rawEventsSubject = new Subject<SectionRenderEvent>();

  /** Observable of processed events (after middleware chain) */
  processedEvents$: Observable<SectionRenderEvent> = this.processedEventsSubject.asObservable();
  
  /** Observable of raw events (before middleware) */
  rawEvents$: Observable<SectionRenderEvent> = this.rawEventsSubject.asObservable();

  /**
   * Add middleware to the chain
   * 
   * @param middleware - Middleware to add
   * @returns Function to remove the middleware
   */
  addMiddleware(middleware: EventMiddleware): () => void {
    this.middleware.push(middleware);
    this.sortMiddleware();

    // Return remove function
    return () => {
      const index = this.middleware.indexOf(middleware);
      if (index > -1) {
        this.middleware.splice(index, 1);
      }
    };
  }

  /**
   * Remove middleware from the chain
   * 
   * @param middleware - Middleware to remove
   */
  removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middleware.indexOf(middleware);
    if (index > -1) {
      this.middleware.splice(index, 1);
    }
  }

  /**
   * Clear all middleware
   */
  clearMiddleware(): void {
    this.middleware = [];
  }

  /**
   * Process an event through the middleware chain
   * 
   * @param event - Event to process
   * @returns Processed event
   */
  processEvent(event: SectionRenderEvent): SectionRenderEvent {
    // Emit raw event
    this.rawEventsSubject.next(event);

    if (this.middleware.length === 0) {
      this.processedEventsSubject.next(event);
      return event;
    }

    // Build middleware chain
    const processed = this.middleware.reduceRight(
      (next, middleware) => {
        return (e: SectionRenderEvent) => middleware.handle(e, next);
      },
      (e: SectionRenderEvent) => e // Final handler returns event as-is
    )(event);

    // Emit processed event
    this.processedEventsSubject.next(processed);
    return processed;
  }

  /**
   * Create a logging middleware
   * 
   * @param logger - Optional logger function (defaults to console.log)
   * @returns Logging middleware
   */
  createLoggingMiddleware(logger?: (message: string, event: SectionRenderEvent) => void): EventMiddleware {
    const log = logger || ((msg, evt) => console.log(msg, evt));
    return {
      priority: 100, // High priority - log first
      handle: (event, next) => {
        log(`[Card Event] ${event.type}`, event);
        return next(event);
      }
    };
  }

  /**
   * Create a filtering middleware
   * 
   * @param filter - Filter function
   * @returns Filtering middleware
   */
  createFilterMiddleware(filter: EventFilter): EventMiddleware {
    return {
      handle: (event, next) => {
        if (filter(event)) {
          return next(event);
        }
        // Return event unchanged if filtered out
        return event;
      }
    };
  }

  /**
   * Create a transformation middleware
   * 
   * @param transformer - Transformation function
   * @returns Transformation middleware
   */
  createTransformMiddleware(transformer: EventTransformer): EventMiddleware {
    return {
      handle: (event, next) => {
        const transformed = transformer(event);
        return next(transformed);
      }
    };
  }

  /**
   * Create an analytics middleware
   * 
   * @param trackEvent - Analytics tracking function
   * @returns Analytics middleware
   */
  createAnalyticsMiddleware(
    trackEvent: (eventName: string, properties: Record<string, unknown>) => void
  ): EventMiddleware {
    return {
      priority: 50,
      handle: (event, next) => {
        trackEvent(`card_${event.type}`, {
          sectionId: event.section.id,
          sectionType: event.section.type,
          fieldId: event.field?.id,
          itemId: event.item?.id,
          actionId: event.action?.id,
          metadata: event.metadata
        });
        return next(event);
      }
    };
  }

  /**
   * Sort middleware by priority (higher priority first)
   */
  private sortMiddleware(): void {
    this.middleware.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      return priorityB - priorityA;
    });
  }
}


