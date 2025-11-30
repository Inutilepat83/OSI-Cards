import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LoggingService } from './logging.service';
import { AppConfigService } from './app-config.service';
import { RUMService } from './rum.service';

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
}

/**
 * Analytics Service
 * 
 * Provides analytics tracking for user interactions, card interactions, and section interactions.
 * Can be integrated with various analytics providers (Google Analytics, Plausible, etc.)
 * 
 * @example
 * ```typescript
 * const analytics = inject(AnalyticsService);
 * analytics.trackCardInteraction('card_view', { cardId: 'card-123' });
 * analytics.trackSectionInteraction('section_click', { sectionType: 'info' });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly logger = inject(LoggingService);
  private readonly config = inject(AppConfigService);
  private readonly rum = inject(RUMService);
  private readonly platformId = inject(PLATFORM_ID);
  
  private enabled = true;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAnalytics();
    }
  }

  /**
   * Initialize analytics
   */
  private initializeAnalytics(): void {
    // Check if analytics should be enabled
    this.enabled = this.config.FEATURES.ADVANCED_ANALYTICS || false;
    
    if (this.enabled) {
      this.logger.debug('Analytics initialized', 'AnalyticsService');
    }
  }

  /**
   * Track a card interaction
   */
  trackCardInteraction(action: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.trackEvent({
      category: 'card',
      action,
      properties
    });

    // Also track in RUM
    this.rum.trackInteraction(`card_${action}`, properties);
  }

  /**
   * Track a section interaction
   */
  trackSectionInteraction(action: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.trackEvent({
      category: 'section',
      action,
      properties
    });

    // Also track in RUM
    this.rum.trackInteraction(`section_${action}`, properties);
  }

  /**
   * Track a field interaction
   */
  trackFieldInteraction(action: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.trackEvent({
      category: 'field',
      action,
      properties
    });
  }

  /**
   * Track an action click
   */
  trackActionClick(actionLabel: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.trackEvent({
      category: 'action',
      action: 'click',
      label: actionLabel,
      properties
    });
  }

  /**
   * Track card export
   */
  trackCardExport(format: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.trackEvent({
      category: 'export',
      action: 'export',
      label: format,
      properties
    });
  }

  /**
   * Track template usage
   */
  trackTemplateUsage(templateId: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.trackEvent({
      category: 'template',
      action: 'use',
      label: templateId,
      properties
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultCount: number, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.trackEvent({
      category: 'search',
      action: 'search',
      label: query,
      value: resultCount,
      properties
    });
  }

  /**
   * Track provider switch
   */
  trackProviderSwitch(providerType: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.trackEvent({
      category: 'provider',
      action: 'switch',
      label: providerType,
      properties
    });
  }

  /**
   * Track generic event
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled) return;

    this.logger.debug('Analytics event', 'AnalyticsService', event);

    // Send to analytics providers
    this.sendToGoogleAnalytics(event);
    this.sendToPlausible(event);
    this.sendToCustomAnalytics(event);
  }

  /**
   * Send to Google Analytics
   */
  private sendToGoogleAnalytics(event: AnalyticsEvent): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.properties
      });
    }
  }

  /**
   * Send to Plausible
   */
  private sendToPlausible(event: AnalyticsEvent): void {
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(event.action, {
        props: {
          category: event.category,
          label: event.label,
          ...event.properties
        }
      });
    }
  }

  /**
   * Send to custom analytics endpoint
   */
  private sendToCustomAnalytics(event: AnalyticsEvent): void {
    // Integration point for custom analytics
    // Could send to internal API endpoint
    const apiUrl = this.config.ENV.API_URL;
    if (apiUrl && apiUrl !== '/api') {
      // Example: this.http.post(`${apiUrl}/analytics`, event).subscribe();
    }
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logger.info(`Analytics ${enabled ? 'enabled' : 'disabled'}`, 'AnalyticsService');
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}







