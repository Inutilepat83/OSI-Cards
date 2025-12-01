import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggingService } from './logging.service';
import { AppConfigService } from './app-config.service';
import { WebVitalsService } from './web-vitals.service';

export interface RUMEvent {
  type: 'pageview' | 'interaction' | 'error' | 'performance' | 'custom';
  name: string;
  timestamp: Date;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId: string;
}

export interface RUMPerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'score';
  timestamp: Date;
}

/**
 * Real User Monitoring (RUM) Service
 *
 * Collects and reports real user monitoring data including:
 * - Page views and navigation
 * - User interactions
 * - Performance metrics (Web Vitals)
 * - Error tracking
 *
 * Can be integrated with analytics services (Google Analytics, Plausible, etc.)
 *
 * @example
 * ```typescript
 * const rum = inject(RUMService);
 * rum.trackPageView('/home');
 * rum.trackInteraction('button_click', { buttonId: 'submit' });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class RUMService {
  private readonly logger = inject(LoggingService);
  private readonly config = inject(AppConfigService);
  private readonly webVitals = inject(WebVitalsService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly eventsSubject = new BehaviorSubject<RUMEvent[]>([]);
  public readonly events$ = this.eventsSubject.asObservable();

  private readonly sessionId = this.generateSessionId();
  private userId?: string;
  private readonly maxEvents = 1000;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeRUM();
    }
  }

  /**
   * Initialize RUM tracking
   */
  private initializeRUM(): void {
    // Track page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.trackPageView(window.location.pathname);
      });

      // Track navigation
      window.addEventListener('popstate', () => {
        this.trackPageView(window.location.pathname);
      });
    }

    // Subscribe to Web Vitals (polling approach since WebVitalsService doesn't expose an observable)
    // Web Vitals are automatically collected by WebVitalsService
    // We can periodically check metrics or rely on the service's internal tracking
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, properties?: Record<string, unknown>): void {
    this.addEvent({
      type: 'pageview',
      name: 'page_view',
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: {
        path,
        ...properties,
      },
    });
  }

  /**
   * Track a user interaction
   */
  trackInteraction(name: string, properties?: Record<string, unknown>): void {
    this.addEvent({
      type: 'interaction',
      name,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties,
    });
  }

  /**
   * Track an error
   */
  trackError(error: Error | string, properties?: Record<string, unknown>): void {
    this.addEvent({
      type: 'error',
      name: 'error',
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        ...properties,
      },
    });
  }

  /**
   * Track a performance metric
   */
  trackPerformanceMetric(metric: RUMPerformanceMetric): void {
    this.addEvent({
      type: 'performance',
      name: metric.name,
      timestamp: metric.timestamp,
      sessionId: this.sessionId,
      properties: {
        value: metric.value,
        unit: metric.unit,
      },
    });
  }

  /**
   * Track a custom event
   */
  trackCustomEvent(name: string, properties?: Record<string, unknown>): void {
    this.addEvent({
      type: 'custom',
      name,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties,
    });
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get all events
   */
  getEvents(): RUMEvent[] {
    return [...this.eventsSubject.value];
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.eventsSubject.next([]);
  }

  /**
   * Add event to collection
   */
  private addEvent(event: RUMEvent): void {
    const eventWithContext: RUMEvent = {
      ...event,
      sessionId: this.sessionId,
      userId: this.userId,
    };

    const currentEvents = this.eventsSubject.value;
    const newEvents = [...currentEvents, eventWithContext].slice(-this.maxEvents);
    this.eventsSubject.next(newEvents);

    // Log event
    this.logger.debug('RUM event tracked', 'RUMService', {
      type: event.type,
      name: event.name,
    });

    // Send to analytics service if configured
    this.sendToAnalytics(eventWithContext);
  }

  /**
   * Send event to analytics service
   */
  private sendToAnalytics(event: RUMEvent): void {
    // Integration point for analytics services
    // Example: Google Analytics, Plausible, etc.

    if (typeof window !== 'undefined' && (window as any).gtag) {
      // Google Analytics integration
      (window as any).gtag('event', event.name, {
        event_category: event.type,
        event_label: event.properties?.['path'] || '',
        value: event.properties?.['value'],
        ...event.properties,
      });
    }

    // Plausible integration
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(event.name, {
        props: event.properties,
      });
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Get RUM statistics
   */
  getStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    sessionDuration: number;
    pageViews: number;
  } {
    const events = this.eventsSubject.value;
    const eventsByType: Record<string, number> = {};

    events.forEach((event) => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    const pageViews = events.filter((e) => e.type === 'pageview').length;
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const sessionDuration =
      events.length > 0 && firstEvent && lastEvent
        ? lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()
        : 0;

    return {
      totalEvents: events.length,
      eventsByType,
      sessionDuration,
      pageViews,
    };
  }
}
