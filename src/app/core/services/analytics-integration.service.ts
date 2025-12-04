/**
 * Analytics Integration Service
 *
 * Unified analytics service supporting multiple providers.
 * (Google Analytics, Mixpanel, Amplitude, etc.)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private analytics = inject(AnalyticsIntegrationService);
 *
 *   trackCardView(cardId: string) {
 *     this.analytics.trackEvent('card_view', { cardId });
 *   }
 * }
 * ```
 */

import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  googleAnalyticsId?: string;
  mixpanelToken?: string;
  amplitudeKey?: string;
  debug?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsIntegrationService {
  private router = inject(Router);
  private config: AnalyticsConfig = {
    enabled: false,
    debug: false,
  };
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPageTracking();
  }

  /**
   * Configure analytics
   */
  configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.enabled) {
      this.initializeProviders();
    }
  }

  /**
   * Track custom event
   */
  trackEvent(name: string, properties?: Record<string, any>): void {
    if (!this.config.enabled) {
      return;
    }

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    // Send to all configured providers
    this.sendToGoogleAnalytics(event);
    this.sendToMixpanel(event);
    this.sendToAmplitude(event);

    if (this.config.debug) {
      console.log('[Analytics] Event:', event);
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string): void {
    this.trackEvent('page_view', { path, title });
  }

  /**
   * Track user action
   */
  trackAction(action: string, category?: string, label?: string, value?: number): void {
    this.trackEvent('user_action', { action, category, label, value });
  }

  /**
   * Track timing (e.g., API calls, page loads)
   */
  trackTiming(category: string, variable: string, timeMs: number, label?: string): void {
    this.trackEvent('timing', { category, variable, timeMs, label });
  }

  /**
   * Track error
   */
  trackError(error: Error, fatal = false): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      fatal,
    });
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('set', { user_id: userId });
    }

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.identify(userId);
    }

    // Amplitude
    if (typeof amplitude !== 'undefined') {
      amplitude.getInstance().setUserId(userId);
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.config.enabled) {
      return;
    }

    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('set', 'user_properties', properties);
    }

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.people.set(properties);
    }

    // Amplitude
    if (typeof amplitude !== 'undefined') {
      const identify = new amplitude.Identify();
      Object.keys(properties).forEach((key) => {
        identify.set(key, properties[key]);
      });
      amplitude.getInstance().identify(identify);
    }
  }

  /**
   * Initialize analytics providers
   */
  private initializeProviders(): void {
    // Google Analytics
    if (this.config.googleAnalyticsId) {
      this.initializeGoogleAnalytics();
    }

    // Mixpanel
    if (this.config.mixpanelToken) {
      this.initializeMixpanel();
    }

    // Amplitude
    if (this.config.amplitudeKey) {
      this.initializeAmplitude();
    }
  }

  /**
   * Initialize Google Analytics
   */
  private initializeGoogleAnalytics(): void {
    if (typeof gtag === 'undefined') {
      // Load GA script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalyticsId}`;
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function () {
        (window as any).dataLayer.push(arguments);
      };
      const gtagFn = (window as any).gtag;
      gtagFn('js', new Date());
      gtagFn('config', this.config.googleAnalyticsId || '');
    }
  }

  /**
   * Initialize Mixpanel
   */
  private initializeMixpanel(): void {
    // TODO: Load Mixpanel SDK
    console.log('[Analytics] Mixpanel would be initialized');
  }

  /**
   * Initialize Amplitude
   */
  private initializeAmplitude(): void {
    // TODO: Load Amplitude SDK
    console.log('[Analytics] Amplitude would be initialized');
  }

  /**
   * Send event to Google Analytics
   */
  private sendToGoogleAnalytics(event: AnalyticsEvent): void {
    if (typeof gtag !== 'undefined' && gtag) {
      gtag('event', event.name, event.properties);
    }
  }

  /**
   * Send event to Mixpanel
   */
  private sendToMixpanel(event: AnalyticsEvent): void {
    if (typeof mixpanel !== 'undefined' && mixpanel) {
      mixpanel.track(event.name, event.properties);
    }
  }

  /**
   * Send event to Amplitude
   */
  private sendToAmplitude(event: AnalyticsEvent): void {
    if (typeof amplitude !== 'undefined' && amplitude) {
      amplitude.getInstance().logEvent(event.name, event.properties);
    }
  }

  /**
   * Setup automatic page tracking
   */
  private setupPageTracking(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    if (typeof sessionStorage !== 'undefined') {
      let id = sessionStorage.getItem('analytics-session-id');
      if (!id) {
        id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics-session-id', id);
      }
      return id;
    }
    return `session-${Date.now()}`;
  }
}

// Type declarations for external analytics libraries
declare const gtag: any;
declare const mixpanel: any;
declare const amplitude: any;
