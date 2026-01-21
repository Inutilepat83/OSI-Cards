/**
 * Layout Analytics Service
 *
 * Tracks layout quality metrics in production:
 * - Utilization percentage
 * - Gap count and distribution
 * - Reflow frequency
 * - Algorithm performance
 * - Error rates
 *
 * @dependencies
 * - None (uses internal data structures for metrics tracking)
 *
 * @example
 * ```typescript
 * import { LayoutAnalyticsService } from './';
 *
 * const analytics = LayoutAnalyticsService.getInstance();
 * analytics.trackLayout(layoutResult);
 *
 * // Get metrics summary
 * const summary = analytics.getSummary();
 * console.log(summary);
 * ```
 */

import { Injectable } from '@angular/core';
import { LayoutMetrics } from '../core';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Aggregated analytics data
 */
export interface LayoutAnalyticsSummary {
  /** Total number of layouts tracked */
  totalLayouts: number;
  /** Average utilization percentage */
  avgUtilization: number;
  /** Minimum utilization seen */
  minUtilization: number;
  /** Maximum utilization seen */
  maxUtilization: number;
  /** Average gap count per layout */
  avgGapCount: number;
  /** Total reflows across all layouts */
  totalReflows: number;
  /** Average reflows per layout */
  avgReflowsPerLayout: number;
  /** Average packing time in ms */
  avgPackingTimeMs: number;
  /** Algorithm usage breakdown */
  algorithmUsage: Record<string, number>;
  /** Distribution of utilization scores */
  utilizationDistribution: {
    excellent: number; // >= 95%
    good: number; // 85-95%
    fair: number; // 75-85%
    poor: number; // < 75%
  };
  /** Error count */
  errorCount: number;
  /** Timestamp of first tracked layout */
  firstTrackedAt: number;
  /** Timestamp of last tracked layout */
  lastTrackedAt: number;
}

/**
 * Individual layout event
 */
export interface LayoutEvent {
  timestamp: number;
  metrics: LayoutMetrics;
  eventType: 'initial' | 'reflow' | 'resize' | 'streaming';
  sessionId: string;
  error?: string;
}

/**
 * Analytics configuration
 */
export interface LayoutAnalyticsConfig {
  /** Whether analytics is enabled */
  enabled: boolean;
  /** Maximum events to store in memory */
  maxEventsInMemory: number;
  /** Whether to persist to localStorage */
  persistToStorage: boolean;
  /** Storage key for persistence */
  storageKey: string;
  /** Sample rate (0-1) for production */
  sampleRate: number;
  /** Callback for reporting to external service */
  reportCallback?: (summary: LayoutAnalyticsSummary) => void;
}

/**
 * Default analytics configuration
 */
const DEFAULT_CONFIG: LayoutAnalyticsConfig = {
  enabled: true,
  maxEventsInMemory: 100,
  persistToStorage: false,
  storageKey: 'osi-layout-analytics',
  sampleRate: 1.0, // Track all in development, lower in production
};

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Service for tracking and analyzing layout performance
 */
@Injectable({ providedIn: 'root' })
export class LayoutAnalyticsService {
  private static instance: LayoutAnalyticsService | null = null;

  private config: LayoutAnalyticsConfig = DEFAULT_CONFIG;
  private events: LayoutEvent[] = [];
  private sessionId: string;
  private errorCount = 0;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  /**
   * Get singleton instance (for non-Angular usage)
   */
  static getInstance(): LayoutAnalyticsService {
    if (!LayoutAnalyticsService.instance) {
      LayoutAnalyticsService.instance = new LayoutAnalyticsService();
    }
    return LayoutAnalyticsService.instance;
  }

  /**
   * Configure the analytics service
   */
  configure(config: Partial<LayoutAnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Track a layout event
   */
  trackLayout(metrics: LayoutMetrics, eventType: LayoutEvent['eventType'] = 'initial'): void {
    if (!this.config.enabled) return;

    // Sample rate check
    if (Math.random() > this.config.sampleRate) return;

    const event: LayoutEvent = {
      timestamp: Date.now(),
      metrics,
      eventType,
      sessionId: this.sessionId,
    };

    this.events.push(event);

    // Trim events if exceeding max
    if (this.events.length > this.config.maxEventsInMemory) {
      this.events = this.events.slice(-this.config.maxEventsInMemory);
    }

    // Persist if enabled
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }

    // Report if callback configured
    if (this.events.length % 10 === 0 && this.config.reportCallback) {
      this.config.reportCallback(this.getSummary());
    }
  }

  /**
   * Track a layout error
   */
  trackError(error: string, metrics?: Partial<LayoutMetrics>): void {
    if (!this.config.enabled) return;

    this.errorCount++;

    if (metrics) {
      const event: LayoutEvent = {
        timestamp: Date.now(),
        metrics: {
          algorithm: metrics.algorithm ?? 'unknown',
          sectionCount: metrics.sectionCount ?? 0,
          columns: metrics.columns ?? 0,
          containerWidth: metrics.containerWidth ?? 0,
          totalHeight: metrics.totalHeight ?? 0,
          utilizationPercent: metrics.utilizationPercent ?? 0,
          gapCount: metrics.gapCount ?? 0,
          balanceScore: metrics.balanceScore ?? 0,
          packingTimeMs: metrics.packingTimeMs ?? 0,
        },
        eventType: 'initial',
        sessionId: this.sessionId,
        error,
      };

      this.events.push(event);
    }
  }

  /**
   * Get analytics summary
   */
  getSummary(): LayoutAnalyticsSummary {
    const validEvents = this.events.filter((e) => !e.error);

    if (validEvents.length === 0) {
      return this.getEmptySummary();
    }

    // Calculate averages
    const utilizationSum = validEvents.reduce((sum, e) => sum + e.metrics.utilizationPercent, 0);
    const gapSum = validEvents.reduce((sum, e) => sum + e.metrics.gapCount, 0);
    const reflowSum = validEvents.filter((e) => e.eventType === 'reflow').length;
    const packingTimeSum = validEvents.reduce((sum, e) => sum + e.metrics.packingTimeMs, 0);

    // Calculate utilization distribution
    const distribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    };

    for (const event of validEvents) {
      const util = event.metrics.utilizationPercent;
      if (util >= 95) distribution.excellent++;
      else if (util >= 85) distribution.good++;
      else if (util >= 75) distribution.fair++;
      else distribution.poor++;
    }

    // Calculate algorithm usage
    const algorithmUsage: Record<string, number> = {};
    for (const event of validEvents) {
      algorithmUsage[event.metrics.algorithm] = (algorithmUsage[event.metrics.algorithm] ?? 0) + 1;
    }

    return {
      totalLayouts: validEvents.length,
      avgUtilization: utilizationSum / validEvents.length,
      minUtilization: Math.min(...validEvents.map((e) => e.metrics.utilizationPercent)),
      maxUtilization: Math.max(...validEvents.map((e) => e.metrics.utilizationPercent)),
      avgGapCount: gapSum / validEvents.length,
      totalReflows: reflowSum,
      avgReflowsPerLayout: reflowSum / validEvents.length,
      avgPackingTimeMs: packingTimeSum / validEvents.length,
      algorithmUsage,
      utilizationDistribution: distribution,
      errorCount: this.errorCount,
      firstTrackedAt: validEvents[0]?.timestamp ?? Date.now(),
      lastTrackedAt: validEvents[validEvents.length - 1]?.timestamp ?? Date.now(),
    };
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 10): LayoutEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get events for a specific session
   */
  getSessionEvents(sessionId?: string): LayoutEvent[] {
    const targetSession = sessionId ?? this.sessionId;
    return this.events.filter((e) => e.sessionId === targetSession);
  }

  /**
   * Clear all tracked events
   */
  clear(): void {
    this.events = [];
    this.errorCount = 0;

    if (this.config.persistToStorage && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.config.storageKey);
    }
  }

  /**
   * Start a new session
   */
  startNewSession(): void {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Export analytics data as JSON
   */
  exportData(): string {
    return JSON.stringify(
      {
        summary: this.getSummary(),
        events: this.events,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Get performance recommendations based on analytics
   */
  getRecommendations(): string[] {
    const summary = this.getSummary();
    const recommendations: string[] = [];

    // Low utilization
    if (summary.avgUtilization < 85) {
      recommendations.push(
        `Average utilization (${summary.avgUtilization.toFixed(1)}%) is below 85%. ` +
          `Consider enabling more aggressive gap filling or using the 'row-first' algorithm.`
      );
    }

    // High gap count
    if (summary.avgGapCount > 3) {
      recommendations.push(
        `Average gap count (${summary.avgGapCount.toFixed(1)}) is high. ` +
          `Review section preferred widths to ensure they fill rows completely.`
      );
    }

    // Excessive reflows
    if (summary.avgReflowsPerLayout > 2) {
      recommendations.push(
        `High reflow rate (${summary.avgReflowsPerLayout.toFixed(1)} per layout). ` +
          `Consider using fixed heights for sections with lazy-loaded content.`
      );
    }

    // Slow packing
    if (summary.avgPackingTimeMs > 50) {
      recommendations.push(
        `Average packing time (${summary.avgPackingTimeMs.toFixed(1)}ms) is high. ` +
          `Consider using the Web Worker for large layouts or reducing optimization passes.`
      );
    }

    // High error rate
    if (summary.errorCount > summary.totalLayouts * 0.05) {
      recommendations.push(
        `Error rate (${((summary.errorCount / Math.max(summary.totalLayouts, 1)) * 100).toFixed(1)}%) ` +
          `is concerning. Review error logs for common issues.`
      );
    }

    // Algorithm suggestions
    if (summary.utilizationDistribution.poor > summary.totalLayouts * 0.2) {
      recommendations.push(
        `${summary.utilizationDistribution.poor} layouts (${((summary.utilizationDistribution.poor / summary.totalLayouts) * 100).toFixed(1)}%) ` +
          `had poor utilization. Consider switching algorithms or adjusting section constraints.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Layout performance looks good! No immediate recommendations.');
    }

    return recommendations;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEmptySummary(): LayoutAnalyticsSummary {
    return {
      totalLayouts: 0,
      avgUtilization: 0,
      minUtilization: 0,
      maxUtilization: 0,
      avgGapCount: 0,
      totalReflows: 0,
      avgReflowsPerLayout: 0,
      avgPackingTimeMs: 0,
      algorithmUsage: {},
      utilizationDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      },
      errorCount: this.errorCount,
      firstTrackedAt: 0,
      lastTrackedAt: 0,
    };
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const data = {
        events: this.events.slice(-50), // Only persist last 50
        errorCount: this.errorCount,
        sessionId: this.sessionId,
      };

      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch {
      // Storage full or unavailable
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events ?? [];
        this.errorCount = data.errorCount ?? 0;
      }
    } catch {
      // Invalid data
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Track a layout event (convenience function)
 */
export function trackLayoutMetrics(
  metrics: LayoutMetrics,
  eventType?: LayoutEvent['eventType']
): void {
  LayoutAnalyticsService.getInstance().trackLayout(metrics, eventType);
}

/**
 * Get layout analytics summary (convenience function)
 */
export function getLayoutAnalyticsSummary(): LayoutAnalyticsSummary {
  return LayoutAnalyticsService.getInstance().getSummary();
}

/**
 * Get layout recommendations (convenience function)
 */
export function getLayoutRecommendations(): string[] {
  return LayoutAnalyticsService.getInstance().getRecommendations();
}
