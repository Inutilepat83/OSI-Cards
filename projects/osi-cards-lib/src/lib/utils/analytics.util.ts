/**
 * Analytics Utilities
 *
 * Utilities for tracking user interactions and analytics.
 *
 * @example
 * ```typescript
 * import { trackEvent, trackPageView } from '@osi-cards/utils';
 *
 * trackEvent('button_click', { button: 'submit' });
 * trackPageView('/home');
 * ```
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  provider?: string;
}

class AnalyticsManager {
  private config: AnalyticsConfig = { enabled: true, debug: false };
  private events: AnalyticsEvent[] = [];
  private maxEvents = 100;

  configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  trackEvent(name: string, properties?: Record<string, any>): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: new Date(),
    };

    this.events.push(event);

    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    if (this.config.debug) {
      console.log('[Analytics]', event);
    }

    this.sendToProvider(event);
  }

  trackPageView(path: string, title?: string): void {
    this.trackEvent('page_view', { path, title });
  }

  trackClick(element: string, properties?: Record<string, any>): void {
    this.trackEvent('click', { element, ...properties });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }

  private sendToProvider(event: AnalyticsEvent): void {
    // Integrate with analytics provider (GA, Mixpanel, etc.)
    if (this.config.provider && (window as any)[this.config.provider]) {
      (window as any)[this.config.provider]('send', 'event', event);
    }
  }
}

const analytics = new AnalyticsManager();

export function configureAnalytics(config: Partial<AnalyticsConfig>): void {
  analytics.configure(config);
}

export function trackEvent(name: string, properties?: Record<string, any>): void {
  analytics.trackEvent(name, properties);
}

export function trackPageView(path: string, title?: string): void {
  analytics.trackPageView(path, title);
}

export function trackClick(element: string, properties?: Record<string, any>): void {
  analytics.trackClick(element, properties);
}

export function trackError(error: Error, context?: Record<string, any>): void {
  analytics.trackError(error, context);
}

export function getAnalyticsEvents(): AnalyticsEvent[] {
  return analytics.getEvents();
}

export function clearAnalyticsEvents(): void {
  analytics.clearEvents();
}

export function trackTiming(name: string, duration: number, category?: string): void {
  trackEvent('timing', { name, duration, category });
}

export function trackUserAction(action: string, data?: Record<string, any>): void {
  trackEvent('user_action', { action, ...data });
}
