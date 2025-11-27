import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

/**
 * Event types for the application
 */
export type EventType = string;
export type EventData = any;

/**
 * Application event interface
 */
export interface AppEvent {
  type: EventType;
  data: EventData;
  timestamp: number;
  source?: string;
}

/**
 * Centralized Event Bus Service
 * 
 * Provides decoupled cross-component communication using the event bus pattern.
 * Components can emit and subscribe to events without direct dependencies.
 * 
 * @example
 * ```typescript
 * // Emit an event
 * eventBus.emit('card:selected', { cardId: '123' });
 * 
 * // Subscribe to events
 * eventBus.on('card:selected').subscribe(event => {
 *   console.log('Card selected:', event.data);
 * });
 * 
 * // Subscribe to multiple event types
 * eventBus.onAny(['card:selected', 'card:updated']).subscribe(event => {
 *   console.log('Card event:', event);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class EventBusService implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventSubject = new Subject<AppEvent>();
  private readonly eventHistory: AppEvent[] = [];
  private readonly maxHistorySize = 100;

  /**
   * Emit an event
   * 
   * @param type - Event type identifier
   * @param data - Event data payload
   * @param source - Optional source identifier
   */
  emit(type: EventType, data?: EventData, source?: string): void {
    const event: AppEvent = {
      type,
      data,
      timestamp: Date.now(),
      source
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    this.eventSubject.next(event);
  }

  /**
   * Subscribe to a specific event type
   * 
   * @param type - Event type to subscribe to
   * @returns Observable that emits events of the specified type
   */
  on(type: EventType): Observable<AppEvent> {
    return this.eventSubject.asObservable().pipe(
      filter(event => event.type === type),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * Subscribe to multiple event types
   * 
   * @param types - Array of event types to subscribe to
   * @returns Observable that emits events matching any of the specified types
   */
  onAny(types: EventType[]): Observable<AppEvent> {
    return this.eventSubject.asObservable().pipe(
      filter(event => types.includes(event.type)),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * Subscribe to all events
   * 
   * @returns Observable that emits all events
   */
  onAll(): Observable<AppEvent> {
    return this.eventSubject.asObservable().pipe(
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * Get event history
   * 
   * @param type - Optional event type to filter by
   * @param limit - Optional limit on number of events to return
   * @returns Array of events
   */
  getHistory(type?: EventType, limit?: number): AppEvent[] {
    let events = this.eventHistory;
    
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    if (limit) {
      events = events.slice(-limit);
    }
    
    return [...events];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory.length = 0;
  }

  /**
   * Get count of events by type
   */
  getEventCount(type: EventType): number {
    return this.eventHistory.filter(event => event.type === type).length;
  }

  /**
   * Check if an event type has been emitted
   */
  hasEmitted(type: EventType): boolean {
    return this.eventHistory.some(event => event.type === type);
  }

  ngOnDestroy(): void {
    this.eventSubject.complete();
    this.clearHistory();
  }
}



