/**
 * Event Emitter - Type-safe event system for cards and sections.
 */

import { Subject, Observable, throttleTime, debounceTime } from 'rxjs';

export type EventHandler<T> = (data: T) => void;

export interface EventMiddleware<T = unknown> {
  name: string;
  before?: (eventName: string, data: T) => T | null;
  after?: (eventName: string, data: T) => void;
}

export interface EventLog {
  timestamp: number;
  eventName: string;
  data: unknown;
}

export class EventEmitter<Events extends Record<string, unknown>> {
  private readonly handlers = new Map<keyof Events, Set<EventHandler<unknown>>>();
  private readonly subjects = new Map<keyof Events, Subject<unknown>>();
  private readonly middleware: EventMiddleware[] = [];
  private readonly log: EventLog[] = [];
  private readonly logging: boolean;
  private readonly maxLogSize: number;

  constructor(config: { logging?: boolean; maxLogSize?: number } = {}) {
    this.logging = config.logging ?? false;
    this.maxLogSize = config.maxLogSize ?? 100;
  }

  on<K extends keyof Events>(eventName: K, handler: EventHandler<Events[K]>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler as EventHandler<unknown>);
    return () => this.off(eventName, handler);
  }

  once<K extends keyof Events>(eventName: K, handler: EventHandler<Events[K]>): () => void {
    const wrapper: EventHandler<Events[K]> = (data) => {
      this.off(eventName, wrapper);
      handler(data);
    };
    return this.on(eventName, wrapper);
  }

  off<K extends keyof Events>(eventName: K, handler: EventHandler<Events[K]>): void {
    this.handlers.get(eventName)?.delete(handler as EventHandler<unknown>);
  }

  observe<K extends keyof Events>(eventName: K): Observable<Events[K]> {
    if (!this.subjects.has(eventName)) {
      this.subjects.set(eventName, new Subject());
    }
    return this.subjects.get(eventName)!.asObservable() as Observable<Events[K]>;
  }

  observeThrottled<K extends keyof Events>(eventName: K, ms: number): Observable<Events[K]> {
    return this.observe(eventName).pipe(throttleTime(ms));
  }

  observeDebounced<K extends keyof Events>(eventName: K, ms: number): Observable<Events[K]> {
    return this.observe(eventName).pipe(debounceTime(ms));
  }

  emit<K extends keyof Events>(eventName: K, data: Events[K]): void {
    let processedData: Events[K] | null = data;

    for (const mw of this.middleware) {
      if (mw.before) {
        processedData = mw.before(eventName as string, processedData) as Events[K] | null;
        if (processedData === null) return;
      }
    }

    if (this.logging) {
      this.log.push({ timestamp: Date.now(), eventName: eventName as string, data: processedData });
      while (this.log.length > this.maxLogSize) this.log.shift();
    }

    this.handlers.get(eventName)?.forEach((handler) => {
      try {
        handler(processedData);
      } catch (e) {
        console.error(e);
      }
    });

    this.subjects.get(eventName)?.next(processedData);

    for (const mw of this.middleware) {
      mw.after?.(eventName as string, processedData);
    }
  }

  use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  getLog(): EventLog[] {
    return [...this.log];
  }

  destroy(): void {
    this.handlers.clear();
    this.subjects.forEach((s) => s.complete());
    this.subjects.clear();
  }
}

// Card Events
export interface CardEvents extends Record<string, unknown> {
  'card:created': { cardId: string };
  'card:updated': { cardId: string; changes: unknown };
  'card:deleted': { cardId: string };
  'section:click': { sectionId: string };
  'field:click': { sectionId: string; fieldIndex: number };
  'layout:changed': { columns: number };
}

export function createCardEventEmitter(): EventEmitter<CardEvents> {
  return new EventEmitter<CardEvents>();
}
