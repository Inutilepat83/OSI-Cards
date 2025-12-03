/**
 * Type-Safe Event Emitter Utilities
 *
 * Provides type-safe event emitter patterns with better type inference
 * and developer experience than standard EventEmitter.
 *
 * Features:
 * - Strong typing for events
 * - Type-safe payloads
 * - Subscription management
 * - Event history
 * - Event filtering
 *
 * @example
 * ```typescript
 * import { TypedEventEmitter } from '@osi-cards/utils';
 *
 * interface MyEvents {
 *   userClicked: { userId: string; timestamp: number };
 *   dataLoaded: { count: number };
 *   error: { message: string };
 * }
 *
 * class MyComponent {
 *   events = new TypedEventEmitter<MyEvents>();
 *
 *   onClick(userId: string) {
 *     this.events.emit('userClicked', {
 *       userId,
 *       timestamp: Date.now()
 *     });
 *   }
 * }
 *
 * // Subscribe with full type safety
 * component.events.on('userClicked', (event) => {
 *   console.log(event.userId); // ✓ Type-safe
 * });
 * ```
 */

import { Subject, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/**
 * Event with payload
 */
export interface TypedEvent<K extends string, P> {
  type: K;
  payload: P;
  timestamp: number;
}

/**
 * Type-safe event emitter
 */
export class TypedEventEmitter<TEvents extends Record<string, any>> {
  private eventSubject = new Subject<TypedEvent<keyof TEvents & string, any>>();
  private eventHistory: Array<TypedEvent<keyof TEvents & string, any>> = [];
  private maxHistorySize = 100;

  /**
   * All events as observable
   */
  readonly events$: Observable<TypedEvent<keyof TEvents & string, any>> =
    this.eventSubject.asObservable();

  /**
   * Emit an event
   *
   * @param type - Event type
   * @param payload - Event payload
   *
   * @example
   * ```typescript
   * emitter.emit('userClicked', { userId: '123' });
   * ```
   */
  emit<K extends keyof TEvents & string>(type: K, payload: TEvents[K]): void {
    const event: TypedEvent<K, TEvents[K]> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    this.eventSubject.next(event as any);

    // Store in history
    this.eventHistory.push(event as any);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Subscribe to specific event type
   *
   * @param type - Event type to listen for
   * @param handler - Event handler
   * @returns Subscription
   *
   * @example
   * ```typescript
   * const sub = emitter.on('dataLoaded', (event) => {
   *   console.log('Items loaded:', event.count);
   * });
   * ```
   */
  on<K extends keyof TEvents & string>(
    type: K,
    handler: (payload: TEvents[K]) => void
  ): Subscription {
    return this.events$
      .pipe(
        filter(event => event.type === type),
        map(event => event.payload as TEvents[K])
      )
      .subscribe(handler);
  }

  /**
   * Subscribe to event once
   *
   * @param type - Event type
   * @param handler - Event handler
   * @returns Subscription
   */
  once<K extends keyof TEvents & string>(
    type: K,
    handler: (payload: TEvents[K]) => void
  ): Subscription {
    const sub = this.on(type, (payload) => {
      handler(payload);
      sub.unsubscribe();
    });
    return sub;
  }

  /**
   * Get observable for specific event type
   *
   * @param type - Event type
   * @returns Observable of event payloads
   *
   * @example
   * ```typescript
   * const clicks$ = emitter.observe('userClicked');
   * clicks$.subscribe(event => console.log(event.userId));
   * ```
   */
  observe<K extends keyof TEvents & string>(type: K): Observable<TEvents[K]> {
    return this.events$.pipe(
      filter(event => event.type === type),
      map(event => event.payload as TEvents[K])
    );
  }

  /**
   * Wait for specific event
   *
   * @param type - Event type
   * @returns Promise that resolves with payload
   *
   * @example
   * ```typescript
   * const data = await emitter.waitFor('dataLoaded');
   * console.log('Loaded:', data.count);
   * ```
   */
  async waitFor<K extends keyof TEvents & string>(type: K): Promise<TEvents[K]> {
    return new Promise((resolve) => {
      this.once(type, resolve);
    });
  }

  /**
   * Get event history
   *
   * @param type - Optional event type filter
   * @returns Array of past events
   */
  getHistory<K extends keyof TEvents & string>(
    type?: K
  ): Array<TypedEvent<K, TEvents[K]>> {
    if (type) {
      return this.eventHistory.filter(e => e.type === type) as Array<TypedEvent<K, TEvents[K]>>;
    }
    return this.eventHistory as Array<TypedEvent<K, TEvents[K]>>;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Complete the event emitter (no more events)
   */
  complete(): void {
    this.eventSubject.complete();
  }

  /**
   * Check if event emitter has completed
   */
  get closed(): boolean {
    return this.eventSubject.closed;
  }
}

/**
 * Create typed event emitter
 *
 * @returns New TypedEventEmitter instance
 *
 * @example
 * ```typescript
 * interface Events {
 *   save: { id: string };
 *   cancel: void;
 * }
 *
 * const emitter = createEventEmitter<Events>();
 * ```
 */
export function createEventEmitter<TEvents extends Record<string, any>>(): TypedEventEmitter<TEvents> {
  return new TypedEventEmitter<TEvents>();
}

/**
 * Event emitter decorator
 *
 * Creates a typed event emitter as a class property.
 *
 * @returns Property decorator
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   @TypedEmitter<{ save: { id: string } }>()
 *   events!: TypedEventEmitter<{ save: { id: string } }>;
 *
 *   onSave(id: string) {
 *     this.events.emit('save', { id });
 *   }
 * }
 * ```
 */
export function TypedEmitter<TEvents extends Record<string, any>>(): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    let emitter: TypedEventEmitter<TEvents>;

    Object.defineProperty(target, propertyKey, {
      get() {
        if (!emitter) {
          emitter = new TypedEventEmitter<TEvents>();
        }
        return emitter;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Simple event emitter (non-typed)
 *
 * Basic event emitter for simple use cases.
 */
export class SimpleEventEmitter<T = any> {
  private subject = new Subject<T>();

  /**
   * Observable of events
   */
  readonly events$ = this.subject.asObservable();

  /**
   * Emit event
   */
  emit(value: T): void {
    this.subject.next(value);
  }

  /**
   * Subscribe to events
   */
  subscribe(handler: (value: T) => void): Subscription {
    return this.events$.subscribe(handler);
  }

  /**
   * Complete emitter
   */
  complete(): void {
    this.subject.complete();
  }
}

/**
 * Create simple event emitter
 */
export function createSimpleEmitter<T = any>(): SimpleEventEmitter<T> {
  return new SimpleEventEmitter<T>();
}

