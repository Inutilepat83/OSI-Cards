import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter, share } from 'rxjs/operators';

export interface AppEvent<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  source?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  callback: (event: AppEvent) => void;
  once?: boolean;
  priority?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private eventStream$ = new Subject<AppEvent>();
  private subscriptions = new Map<string, EventSubscription[]>();
  private eventHistory: AppEvent[] = [];
  private maxHistorySize = 1000;
  
  // Event statistics
  private eventStats$ = new BehaviorSubject({
    totalEvents: 0,
    eventsByType: {} as Record<string, number>,
    averageProcessingTime: 0,
    activeSubscriptions: 0
  });

  constructor() {
    // Subscribe to all events for history and statistics
    this.eventStream$.subscribe(event => {
      this.addToHistory(event);
      this.updateStats(event);
    });
  }

  // Emit events
  emit(event: Omit<AppEvent, 'id' | 'timestamp'>): void {
    const fullEvent: AppEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...event
    };

    this.eventStream$.next(fullEvent);
  }

  // Quick emit methods for common events
  emitCardEvent(type: string, cardId: string, payload?: any): void {
    this.emit({
      type: `card.${type}`,
      payload: { cardId, ...payload },
      source: 'card-system',
      priority: 'medium'
    });
  }

  emitUIEvent(type: string, payload?: any): void {
    this.emit({
      type: `ui.${type}`,
      payload,
      source: 'ui-system',
      priority: 'low'
    });
  }

  emitPerformanceEvent(type: string, metrics: any): void {
    this.emit({
      type: `performance.${type}`,
      payload: metrics,
      source: 'performance-system',
      priority: 'high'
    });
  }

  emitSecurityEvent(type: string, payload: any): void {
    this.emit({
      type: `security.${type}`,
      payload,
      source: 'security-system',
      priority: 'critical'
    });
  }

  emitErrorEvent(error: Error, context?: any): void {
    this.emit({
      type: 'error.occurred',
      payload: {
        message: error.message,
        stack: error.stack,
        context
      },
      source: 'error-system',
      priority: 'critical'
    });
  }

  // Subscribe to events
  on<T = any>(eventType: string): Observable<AppEvent<T>> {
    return this.eventStream$.pipe(
      filter(event => this.matchesEventType(event.type, eventType)),
      share()
    );
  }

  // Subscribe with callback (for legacy support)
  subscribe(eventType: string, callback: (event: AppEvent) => void, options?: { once?: boolean; priority?: number }): string {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      callback,
      once: options?.once,
      priority: options?.priority || 0
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subs = this.subscriptions.get(eventType)!;
    subs.push(subscription);
    
    // Sort by priority (higher priority first)
    subs.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    this.updateSubscriptionStats();
    return subscriptionId;
  }

  // Unsubscribe
  unsubscribe(subscriptionId: string): void {
    for (const [eventType, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        if (subs.length === 0) {
          this.subscriptions.delete(eventType);
        }
        this.updateSubscriptionStats();
        break;
      }
    }
  }

  // Subscribe once
  once<T = any>(eventType: string): Promise<AppEvent<T>> {
    return new Promise(resolve => {
      const subscription = this.on<T>(eventType).subscribe(event => {
        subscription.unsubscribe();
        resolve(event);
      });
    });
  }

  // Event patterns and wildcards
  onPattern<T = any>(pattern: string): Observable<AppEvent<T>> {
    return this.eventStream$.pipe(
      filter(event => this.matchesPattern(event.type, pattern)),
      share()
    );
  }

  // Wait for multiple events
  waitForAll(eventTypes: string[], timeout = 30000): Promise<AppEvent[]> {
    return new Promise((resolve, reject) => {
      const events: AppEvent[] = [];
      const subscriptions: any[] = [];
      
      const timeoutId = setTimeout(() => {
        subscriptions.forEach(sub => sub.unsubscribe());
        reject(new Error('Timeout waiting for events'));
      }, timeout);

      eventTypes.forEach(eventType => {
        const subscription = this.on(eventType).subscribe(event => {
          events.push(event);
          
          if (events.length === eventTypes.length) {
            clearTimeout(timeoutId);
            subscriptions.forEach(sub => sub.unsubscribe());
            resolve(events);
          }
        });
        
        subscriptions.push(subscription);
      });
    });
  }

  // Event replay
  replay(eventTypes?: string[]): Observable<AppEvent> {
    return new Observable(observer => {
      const eventsToReplay = eventTypes 
        ? this.eventHistory.filter(event => eventTypes.includes(event.type))
        : this.eventHistory;

      eventsToReplay.forEach(event => observer.next(event));
      observer.complete();
    });
  }

  // Get event history
  getEventHistory(filter?: { 
    eventType?: string; 
    source?: string; 
    since?: number; 
    limit?: number 
  }): AppEvent[] {
    let filtered = this.eventHistory;

    if (filter?.eventType) {
      filtered = filtered.filter(event => event.type === filter.eventType);
    }

    if (filter?.source) {
      filtered = filtered.filter(event => event.source === filter.source);
    }

    if (filter?.since) {
      filtered = filtered.filter(event => event.timestamp >= (filter.since!));
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  // Event statistics
  getEventStats(): Observable<any> {
    return this.eventStats$.asObservable();
  }

  // Clear history
  clearHistory(): void {
    this.eventHistory = [];
  }

  // Middleware support
  private middlewares: ((event: AppEvent) => AppEvent | null)[] = [];

  addMiddleware(middleware: (event: AppEvent) => AppEvent | null): void {
    this.middlewares.push(middleware);
  }

  removeMiddleware(middleware: (event: AppEvent) => AppEvent | null): void {
    const index = this.middlewares.indexOf(middleware);
    if (index !== -1) {
      this.middlewares.splice(index, 1);
    }
  }

  // Event validation
  validateEvent(event: AppEvent): boolean {
    return !!(event.type && event.payload !== undefined && event.timestamp);
  }

  // Private methods
  private processEvent(event: AppEvent): AppEvent | null {
    // Apply middlewares
    let processedEvent: AppEvent | null = event;
    
    for (const middleware of this.middlewares) {
      processedEvent = middleware(processedEvent);
      if (!processedEvent) break;
    }

    return processedEvent;
  }

  private matchesEventType(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(eventType);
    }
    return eventType === pattern;
  }

  private matchesPattern(eventType: string, pattern: string): boolean {
    // Support wildcards: user.* matches user.login, user.logout, etc.
    const regexPattern = pattern.replace(/\*/g, '[^.]*').replace(/\*\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(eventType);
  }

  private addToHistory(event: AppEvent): void {
    this.eventHistory.push(event);
    
    // Maintain history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  private updateStats(event: AppEvent): void {
    const stats = this.eventStats$.value;
    stats.totalEvents++;
    stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
    
    this.eventStats$.next({ ...stats });
  }

  private updateSubscriptionStats(): void {
    const stats = this.eventStats$.value;
    stats.activeSubscriptions = Array.from(this.subscriptions.values())
      .reduce((total, subs) => total + subs.length, 0);
    
    this.eventStats$.next({ ...stats });
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Event types constants
export const EventTypes = {
  // Card events
  CARD_CREATED: 'card.created',
  CARD_UPDATED: 'card.updated',
  CARD_DELETED: 'card.deleted',
  CARD_SELECTED: 'card.selected',
  CARD_RENDERED: 'card.rendered',
  
  // UI events
  UI_THEME_CHANGED: 'ui.theme.changed',
  UI_LAYOUT_CHANGED: 'ui.layout.changed',
  UI_MODAL_OPENED: 'ui.modal.opened',
  UI_MODAL_CLOSED: 'ui.modal.closed',
  
  // Performance events
  PERFORMANCE_METRIC: 'performance.metric',
  PERFORMANCE_THRESHOLD_EXCEEDED: 'performance.threshold.exceeded',
  MEMORY_LEAK_DETECTED: 'performance.memory.leak',
  
  // Security events
  SECURITY_VIOLATION: 'security.violation',
  SECURITY_LOGIN: 'security.login',
  SECURITY_LOGOUT: 'security.logout',
  
  // System events
  SYSTEM_READY: 'system.ready',
  SYSTEM_ERROR: 'system.error',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  
  // Feature events
  FEATURE_FLAG_CHANGED: 'feature.flag.changed',
  PLUGIN_LOADED: 'plugin.loaded',
  PLUGIN_UNLOADED: 'plugin.unloaded'
} as const;
