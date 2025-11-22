import { Subject, Observable } from 'rxjs';

/**
 * Event bus for centralized cross-component communication
 * Implements event bus pattern for decoupled component communication
 */

export type EventType = string;
export type EventData = any;

export interface AppEvent {
  type: EventType;
  data: EventData;
  timestamp: number;
}

/**
 * Event bus class
 */
export class EventBus {
  private readonly eventSubject = new Subject<AppEvent>();

  /**
   * Emit an event
   */
  emit(type: EventType, data?: EventData): void {
    this.eventSubject.next({
      type,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Subscribe to events
   */
  on(type: EventType): Observable<AppEvent> {
    return this.eventSubject.asObservable().pipe(
      // Filter by event type
      (source: Observable<AppEvent>) => {
        return new Observable(observer => {
          const subscription = source.subscribe(event => {
            if (event.type === type) {
              observer.next(event);
            }
          });
          return () => subscription.unsubscribe();
        });
      }
    );
  }

  /**
   * Subscribe to all events
   */
  onAll(): Observable<AppEvent> {
    return this.eventSubject.asObservable();
  }

  /**
   * Subscribe to multiple event types
   */
  onMultiple(types: EventType[]): Observable<AppEvent> {
    return this.eventSubject.asObservable().pipe(
      (source: Observable<AppEvent>) => {
        return new Observable(observer => {
          const subscription = source.subscribe(event => {
            if (types.includes(event.type)) {
              observer.next(event);
            }
          });
          return () => subscription.unsubscribe();
        });
      }
    );
  }
}

/**
 * Global event bus instance
 */
export const eventBus = new EventBus();


