import { Injectable, inject, NgZone } from '@angular/core';
import { Subject, Observable, Subscription, filter, map } from 'rxjs';

/**
 * Event types supported by the event bus
 */
export type CardEventType = 
  | 'card:created'
  | 'card:updated'
  | 'card:deleted'
  | 'card:streamed'
  | 'card:streaming-started'
  | 'card:streaming-completed'
  | 'card:streaming-error'
  | 'section:added'
  | 'section:updated'
  | 'section:removed'
  | 'section:clicked'
  | 'field:clicked'
  | 'action:triggered'
  | 'theme:changed'
  | 'layout:changed'
  | 'error:occurred'
  | 'custom';

/**
 * Base event interface
 */
export interface CardBusEvent<T = unknown> {
  type: CardEventType;
  payload: T;
  timestamp: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Strongly typed event payloads
 */
export interface CardCreatedPayload {
  cardId: string;
  title?: string;
  sectionCount: number;
}

export interface CardUpdatedPayload {
  cardId: string;
  changedFields: string[];
}

export interface SectionEventPayload {
  cardId?: string;
  sectionId: string;
  sectionType: string;
  sectionTitle?: string;
}

export interface ActionTriggeredPayload {
  cardId?: string;
  actionId: string;
  actionType: string;
  actionLabel?: string;
}

export interface ThemeChangedPayload {
  previousTheme: string;
  newTheme: string;
}

export interface ErrorPayload {
  error: Error | string;
  context?: string;
  recoverable: boolean;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (event: CardBusEvent<T>) => void;

/**
 * EventBusService
 * 
 * A centralized event bus for decoupled communication between card components.
 * Supports typed events, filtering, and replay capabilities.
 */
@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private readonly ngZone = inject(NgZone);
  private readonly eventSubject = new Subject<CardBusEvent>();
  private readonly eventHistory: CardBusEvent[] = [];
  private readonly maxHistorySize = 100;
  
  /** All events as an observable stream */
  readonly events$: Observable<CardBusEvent> = this.eventSubject.asObservable();

  /**
   * Emits an event to the bus
   * @param type Event type
   * @param payload Event payload
   * @param options Additional event options
   */
  emit<T>(
    type: CardEventType, 
    payload: T, 
    options?: { source?: string; metadata?: Record<string, unknown> }
  ): void {
    const event: CardBusEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source: options?.source,
      metadata: options?.metadata
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Emit outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      this.eventSubject.next(event);
    });
  }

  /**
   * Subscribe to events of a specific type
   * @param type Event type to filter
   * @param handler Callback function
   * @returns Subscription
   */
  on<T = unknown>(type: CardEventType, handler: EventHandler<T>): Subscription {
    return this.events$.pipe(
      filter(event => event.type === type),
      map(event => event as CardBusEvent<T>)
    ).subscribe(handler);
  }

  /**
   * Subscribe to multiple event types
   * @param types Array of event types
   * @param handler Callback function
   * @returns Subscription
   */
  onAny<T = unknown>(types: CardEventType[], handler: EventHandler<T>): Subscription {
    return this.events$.pipe(
      filter(event => types.includes(event.type)),
      map(event => event as CardBusEvent<T>)
    ).subscribe(handler);
  }

  /**
   * Subscribe to events matching a predicate
   * @param predicate Filter function
   * @param handler Callback function
   * @returns Subscription
   */
  onWhere<T = unknown>(
    predicate: (event: CardBusEvent) => boolean, 
    handler: EventHandler<T>
  ): Subscription {
    return this.events$.pipe(
      filter(predicate),
      map(event => event as CardBusEvent<T>)
    ).subscribe(handler);
  }

  /**
   * Get events of a specific type as an Observable
   * @param type Event type
   * @returns Observable of typed events
   */
  select<T = unknown>(type: CardEventType): Observable<CardBusEvent<T>> {
    return this.events$.pipe(
      filter(event => event.type === type),
      map(event => event as CardBusEvent<T>)
    );
  }

  /**
   * Get all events matching multiple types
   * @param types Array of event types
   * @returns Observable of events
   */
  selectAny<T = unknown>(types: CardEventType[]): Observable<CardBusEvent<T>> {
    return this.events$.pipe(
      filter(event => types.includes(event.type)),
      map(event => event as CardBusEvent<T>)
    );
  }

  /**
   * Get event history
   * @param type Optional filter by event type
   * @param limit Max number of events to return
   * @returns Array of past events
   */
  getHistory(type?: CardEventType, limit?: number): CardBusEvent[] {
    let history = type 
      ? this.eventHistory.filter(e => e.type === type)
      : [...this.eventHistory];
    
    if (limit && limit > 0) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory.length = 0;
  }

  /**
   * Replay recent events to a new subscriber
   * @param handler Event handler
   * @param type Optional filter by type
   * @param limit Number of events to replay
   */
  replay<T = unknown>(
    handler: EventHandler<T>, 
    type?: CardEventType, 
    limit = 10
  ): void {
    const events = this.getHistory(type, limit);
    events.forEach(event => handler(event as CardBusEvent<T>));
  }

  // ============================================
  // Convenience Methods for Common Events
  // ============================================

  /**
   * Emit card created event
   */
  emitCardCreated(payload: CardCreatedPayload, source?: string): void {
    this.emit('card:created', payload, { source });
  }

  /**
   * Emit card updated event
   */
  emitCardUpdated(payload: CardUpdatedPayload, source?: string): void {
    this.emit('card:updated', payload, { source });
  }

  /**
   * Emit section clicked event
   */
  emitSectionClicked(payload: SectionEventPayload, source?: string): void {
    this.emit('section:clicked', payload, { source });
  }

  /**
   * Emit action triggered event
   */
  emitActionTriggered(payload: ActionTriggeredPayload, source?: string): void {
    this.emit('action:triggered', payload, { source });
  }

  /**
   * Emit theme changed event
   */
  emitThemeChanged(previousTheme: string, newTheme: string, source?: string): void {
    this.emit<ThemeChangedPayload>('theme:changed', { previousTheme, newTheme }, { source });
  }

  /**
   * Emit error event
   */
  emitError(error: Error | string, context?: string, recoverable = true): void {
    this.emit<ErrorPayload>('error:occurred', { 
      error, 
      context, 
      recoverable 
    });
  }

  /**
   * Subscribe to card lifecycle events
   */
  onCardLifecycle(handler: EventHandler<CardCreatedPayload | CardUpdatedPayload>): Subscription {
    return this.onAny(['card:created', 'card:updated', 'card:deleted'], handler);
  }

  /**
   * Subscribe to streaming events
   */
  onStreaming(handler: EventHandler): Subscription {
    return this.onAny([
      'card:streaming-started', 
      'card:streamed', 
      'card:streaming-completed', 
      'card:streaming-error'
    ], handler);
  }

  /**
   * Subscribe to all error events
   */
  onError(handler: EventHandler<ErrorPayload>): Subscription {
    return this.on('error:occurred', handler);
  }
}







