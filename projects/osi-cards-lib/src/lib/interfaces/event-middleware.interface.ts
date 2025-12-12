import { SectionRenderEvent } from '../components/section-renderer/section-renderer.component';

/**
 * Event middleware interface for intercepting and transforming card events
 *
 * Middleware functions can be used to:
 * - Log events for debugging
 * - Transform event data
 * - Add analytics tracking
 * - Implement custom event filtering
 * - Enrich events with additional metadata
 *
 * @example
 * ```typescript
 * const loggingMiddleware: EventMiddleware = {
 *   handle: (event, next) => {
 *     console.log('Event:', event);
 *     return next(event);
 *   }
 * };
 * ```
 */
export interface EventMiddleware {
  /**
   * Handle an event, optionally transforming it before passing to next middleware
   *
   * @param event - The event to handle
   * @param next - Function to call the next middleware in the chain
   * @returns The processed event (can be the original or transformed)
   */
  handle(
    event: SectionRenderEvent,
    next: (event: SectionRenderEvent) => SectionRenderEvent
  ): SectionRenderEvent;

  /**
   * Optional priority for middleware ordering (higher = earlier in chain)
   */
  priority?: number;
}

/**
 * Event handler function type
 */
export type EventHandler = (event: SectionRenderEvent) => void | SectionRenderEvent;

/**
 * Event transformation function type
 */
export type EventTransformer = (event: SectionRenderEvent) => SectionRenderEvent;

/**
 * Event filter function type
 */
export type EventFilter = (event: SectionRenderEvent) => boolean;
