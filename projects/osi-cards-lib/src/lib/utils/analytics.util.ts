/**
 * Card Analytics Utilities (Improvement #100)
 * 
 * Track card views, interactions, and performance metrics.
 * Provides comprehensive analytics for understanding card usage patterns.
 * 
 * @example
 * ```typescript
 * import { CardAnalytics, AnalyticsEvent } from 'osi-cards-lib';
 * 
 * // Initialize analytics
 * const analytics = new CardAnalytics({
 *   enabled: true,
 *   endpoint: '/api/analytics',
 *   batchSize: 10
 * });
 * 
 * // Track card view
 * analytics.trackView(cardId, { source: 'dashboard' });
 * 
 * // Track section interaction
 * analytics.trackInteraction(cardId, sectionId, 'expand');
 * 
 * // Get analytics report
 * const report = analytics.getReport();
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Analytics event types
 */
export type AnalyticsEventType =
  | 'card_view'
  | 'card_stream_start'
  | 'card_stream_complete'
  | 'card_stream_error'
  | 'section_view'
  | 'section_expand'
  | 'section_collapse'
  | 'section_interact'
  | 'action_click'
  | 'field_copy'
  | 'card_export'
  | 'theme_change'
  | 'performance_metric';

/**
 * Base analytics event
 */
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  cardId?: string;
  sectionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Performance metric event
 */
export interface PerformanceEvent extends AnalyticsEvent {
  type: 'performance_metric';
  metric: PerformanceMetric;
}

/**
 * Performance metric types
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Enable/disable analytics */
  enabled: boolean;
  /** Endpoint for sending analytics data */
  endpoint?: string;
  /** Batch size before sending */
  batchSize: number;
  /** Flush interval in milliseconds */
  flushInterval: number;
  /** Include performance metrics */
  includePerformance: boolean;
  /** Sampling rate (0-1) */
  samplingRate: number;
  /** Custom event handler */
  onEvent?: (event: AnalyticsEvent) => void;
  /** Custom flush handler */
  onFlush?: (events: AnalyticsEvent[]) => Promise<void>;
}

/**
 * Card usage statistics
 */
export interface CardUsageStats {
  cardId: string;
  viewCount: number;
  avgViewDuration: number;
  interactionCount: number;
  sectionInteractions: Map<string, number>;
  lastViewed: number;
  firstViewed: number;
}

/**
 * Analytics report
 */
export interface AnalyticsReport {
  period: { start: number; end: number };
  totalEvents: number;
  eventsByType: Record<AnalyticsEventType, number>;
  uniqueCards: number;
  uniqueSessions: number;
  topCards: Array<{ cardId: string; interactions: number }>;
  performance: PerformanceSummary;
}

/**
 * Performance summary
 */
export interface PerformanceSummary {
  avgRenderTime: number;
  avgStreamingTime: number;
  avgLayoutTime: number;
  p50RenderTime: number;
  p95RenderTime: number;
  errorRate: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: false,
  batchSize: 20,
  flushInterval: 30000, // 30 seconds
  includePerformance: true,
  samplingRate: 1.0
};

// ============================================================================
// CARD ANALYTICS CLASS
// ============================================================================

/**
 * Card Analytics Service
 * Tracks and reports card usage analytics
 */
export class CardAnalytics {
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private cardStats: Map<string, CardUsageStats> = new Map();
  private performanceMetrics: PerformanceMetric[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private viewStartTimes: Map<string, number> = new Map();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  // ============================================
  // Event Tracking
  // ============================================

  /**
   * Track a card view
   */
  trackView(cardId: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldTrack()) return;
    
    this.viewStartTimes.set(cardId, Date.now());
    
    this.addEvent({
      type: 'card_view',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      cardId,
      metadata
    });
    
    this.updateCardStats(cardId, 'view');
  }

  /**
   * Track when user leaves a card view
   */
  trackViewEnd(cardId: string): void {
    const startTime = this.viewStartTimes.get(cardId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.viewStartTimes.delete(cardId);
      
      const stats = this.cardStats.get(cardId);
      if (stats) {
        const totalDuration = stats.avgViewDuration * (stats.viewCount - 1) + duration;
        stats.avgViewDuration = totalDuration / stats.viewCount;
      }
    }
  }

  /**
   * Track streaming start
   */
  trackStreamStart(cardId: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldTrack()) return;
    
    this.addEvent({
      type: 'card_stream_start',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      cardId,
      metadata
    });
  }

  /**
   * Track streaming completion
   */
  trackStreamComplete(
    cardId: string, 
    duration: number, 
    metadata?: Record<string, unknown>
  ): void {
    if (!this.shouldTrack()) return;
    
    this.addEvent({
      type: 'card_stream_complete',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      cardId,
      metadata: { ...metadata, durationMs: duration }
    });
    
    if (this.config.includePerformance) {
      this.trackPerformance({
        name: 'streaming_duration',
        value: duration,
        unit: 'ms',
        tags: { cardId }
      });
    }
  }

  /**
   * Track streaming error
   */
  trackStreamError(cardId: string, error: Error): void {
    if (!this.shouldTrack()) return;
    
    this.addEvent({
      type: 'card_stream_error',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      cardId,
      metadata: { 
        errorName: error.name,
        errorMessage: error.message
      }
    });
  }

  /**
   * Track section interaction
   */
  trackInteraction(
    cardId: string,
    sectionId: string,
    action: 'expand' | 'collapse' | 'click' | 'hover',
    metadata?: Record<string, unknown>
  ): void {
    if (!this.shouldTrack()) return;
    
    const eventType: AnalyticsEventType = 
      action === 'expand' ? 'section_expand' :
      action === 'collapse' ? 'section_collapse' :
      'section_interact';
    
    this.addEvent({
      type: eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      cardId,
      sectionId,
      metadata: { ...metadata, action }
    });
    
    this.updateCardStats(cardId, 'interaction', sectionId);
  }

  /**
   * Track action button click
   */
  trackActionClick(
    cardId: string,
    actionType: string,
    actionLabel: string
  ): void {
    if (!this.shouldTrack()) return;
    
    this.addEvent({
      type: 'action_click',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      cardId,
      metadata: { actionType, actionLabel }
    });
  }

  /**
   * Track field copy to clipboard
   */
  trackFieldCopy(cardId: string, fieldLabel: string): void {
    if (!this.shouldTrack()) return;
    
    this.addEvent({
      type: 'field_copy',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      cardId,
      metadata: { fieldLabel }
    });
  }

  /**
   * Track theme change
   */
  trackThemeChange(fromTheme: string, toTheme: string): void {
    if (!this.shouldTrack()) return;
    
    this.addEvent({
      type: 'theme_change',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: { fromTheme, toTheme }
    });
  }

  // ============================================
  // Performance Tracking
  // ============================================

  /**
   * Track a performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.shouldTrack() || !this.config.includePerformance) return;
    
    this.performanceMetrics.push(metric);
    
    this.addEvent({
      type: 'performance_metric',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metric
    } as PerformanceEvent);
  }

  /**
   * Create a performance timer
   */
  startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.trackPerformance({
        name,
        value: duration,
        unit: 'ms',
        tags
      });
    };
  }

  // ============================================
  // Reporting
  // ============================================

  /**
   * Get analytics report for a time period
   */
  getReport(startTime?: number, endTime?: number): AnalyticsReport {
    const now = Date.now();
    const start = startTime ?? now - 24 * 60 * 60 * 1000; // Last 24 hours
    const end = endTime ?? now;
    
    const filteredEvents = this.events.filter(
      e => e.timestamp >= start && e.timestamp <= end
    );
    
    // Count events by type
    const eventsByType = {} as Record<AnalyticsEventType, number>;
    for (const event of filteredEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    }
    
    // Get unique cards and sessions
    const uniqueCards = new Set(filteredEvents.map(e => e.cardId).filter(Boolean));
    const uniqueSessions = new Set(filteredEvents.map(e => e.sessionId));
    
    // Get top cards by interactions
    const cardInteractions = new Map<string, number>();
    for (const event of filteredEvents) {
      if (event.cardId && event.type !== 'card_view') {
        cardInteractions.set(
          event.cardId,
          (cardInteractions.get(event.cardId) || 0) + 1
        );
      }
    }
    
    const topCards = Array.from(cardInteractions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cardId, interactions]) => ({ cardId, interactions }));
    
    // Calculate performance summary
    const performance = this.calculatePerformanceSummary();
    
    return {
      period: { start, end },
      totalEvents: filteredEvents.length,
      eventsByType,
      uniqueCards: uniqueCards.size,
      uniqueSessions: uniqueSessions.size,
      topCards,
      performance
    };
  }

  /**
   * Get usage stats for a specific card
   */
  getCardStats(cardId: string): CardUsageStats | null {
    return this.cardStats.get(cardId) || null;
  }

  /**
   * Get all card stats
   */
  getAllCardStats(): CardUsageStats[] {
    return Array.from(this.cardStats.values());
  }

  // ============================================
  // Data Management
  // ============================================

  /**
   * Manually flush events
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) return;
    
    const eventsToSend = [...this.events];
    this.events = [];
    
    if (this.config.onFlush) {
      await this.config.onFlush(eventsToSend);
    } else if (this.config.endpoint) {
      await this.sendToEndpoint(eventsToSend);
    }
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.events = [];
    this.cardStats.clear();
    this.performanceMetrics = [];
    this.viewStartTimes.clear();
  }

  /**
   * Destroy the analytics instance
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush().catch(() => {});
    this.clear();
  }

  /**
   * Export analytics data
   */
  export(): {
    events: AnalyticsEvent[];
    cardStats: CardUsageStats[];
    performanceMetrics: PerformanceMetric[];
  } {
    return {
      events: [...this.events],
      cardStats: this.getAllCardStats(),
      performanceMetrics: [...this.performanceMetrics]
    };
  }

  // ============================================
  // Private Methods
  // ============================================

  private shouldTrack(): boolean {
    if (!this.config.enabled) return false;
    if (this.config.samplingRate < 1) {
      return Math.random() < this.config.samplingRate;
    }
    return true;
  }

  private addEvent(event: AnalyticsEvent): void {
    this.events.push(event);
    
    if (this.config.onEvent) {
      this.config.onEvent(event);
    }
    
    if (this.events.length >= this.config.batchSize) {
      this.flush().catch(console.error);
    }
  }

  private updateCardStats(
    cardId: string, 
    type: 'view' | 'interaction',
    sectionId?: string
  ): void {
    let stats = this.cardStats.get(cardId);
    
    if (!stats) {
      stats = {
        cardId,
        viewCount: 0,
        avgViewDuration: 0,
        interactionCount: 0,
        sectionInteractions: new Map(),
        lastViewed: Date.now(),
        firstViewed: Date.now()
      };
      this.cardStats.set(cardId, stats);
    }
    
    stats.lastViewed = Date.now();
    
    if (type === 'view') {
      stats.viewCount++;
    } else if (type === 'interaction') {
      stats.interactionCount++;
      if (sectionId) {
        stats.sectionInteractions.set(
          sectionId,
          (stats.sectionInteractions.get(sectionId) || 0) + 1
        );
      }
    }
  }

  private calculatePerformanceSummary(): PerformanceSummary {
    const renderTimes = this.performanceMetrics
      .filter(m => m.name.includes('render'))
      .map(m => m.value)
      .sort((a, b) => a - b);
    
    const streamingTimes = this.performanceMetrics
      .filter(m => m.name.includes('streaming'))
      .map(m => m.value);
    
    const layoutTimes = this.performanceMetrics
      .filter(m => m.name.includes('layout'))
      .map(m => m.value);
    
    const errorCount = this.events.filter(e => e.type === 'card_stream_error').length;
    const totalStreams = this.events.filter(
      e => e.type === 'card_stream_start' || e.type === 'card_stream_complete'
    ).length / 2;
    
    return {
      avgRenderTime: this.average(renderTimes),
      avgStreamingTime: this.average(streamingTimes),
      avgLayoutTime: this.average(layoutTimes),
      p50RenderTime: this.percentile(renderTimes, 50),
      p95RenderTime: this.percentile(renderTimes, 95),
      errorRate: totalStreams > 0 ? errorCount / totalStreams : 0
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)] ?? 0;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private async sendToEndpoint(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.endpoint) return;
    
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        keepalive: true
      });
    } catch (error) {
      console.warn('Failed to send analytics:', error);
      // Re-queue events for retry
      this.events.unshift(...events);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalAnalytics: CardAnalytics | null = null;

/**
 * Get or create the global analytics instance
 */
export function getAnalytics(config?: Partial<AnalyticsConfig>): CardAnalytics {
  if (!globalAnalytics) {
    globalAnalytics = new CardAnalytics(config);
  }
  return globalAnalytics;
}

/**
 * Initialize global analytics with configuration
 */
export function initAnalytics(config: Partial<AnalyticsConfig>): CardAnalytics {
  if (globalAnalytics) {
    globalAnalytics.destroy();
  }
  globalAnalytics = new CardAnalytics(config);
  return globalAnalytics;
}

