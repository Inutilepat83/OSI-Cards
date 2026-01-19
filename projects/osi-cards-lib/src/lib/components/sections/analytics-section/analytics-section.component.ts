import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { EmptyStateComponent, SectionHeaderComponent, type ProgressBarVariant } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { sendDebugLog } from '@osi-cards/lib/utils/debug-log.util';

/**
 * Analytics Section Component - Compact & Minimalist with Progressive Disclosure
 *
 * Ultra-compact display of performance metrics and KPIs.
 * Default view shows dense KPI matrix; hover/expand reveals goals and details.
 * Minimal padding, clean typography, maximum information density.
 */
@Component({
  selector: 'lib-analytics-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './analytics-section.component.html',
  styleUrl: './analytics-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  /**
   * Density mode for the analytics section
   * - 'compact': Dense KPI matrix (default)
   * - 'comfortable': More spacing and always-visible details
   */
  @Input() density: 'compact' | 'comfortable' = 'compact';

  /**
   * Currently expanded metric ID (for progressive disclosure)
   */
  expandedMetricId: string | null = null;

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('analytics', (section: CardSection, availableColumns: number) => {
      return this.calculateAnalyticsLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for analytics section based on content.
   */
  private calculateAnalyticsLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;

    // Analytics sections: 2 cols default, can shrink to 1, expands to 3 with many metrics
    let preferredColumns: 1 | 2 | 3 | 4 = 2;
    if (fieldCount >= 8) {
      preferredColumns = 3;
    } else if (fieldCount <= 2) {
      preferredColumns = 1;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 3) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 18, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        fieldCount: 8, // Expand to 3 columns at 8+ metrics
      },
    };
  }

  /**
   * Get layout preferences for analytics section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateAnalyticsLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Map performance rating to progress bar variant
   */
  getVariant(performance?: string): ProgressBarVariant {
    if (!performance) return 'default';
    const p = performance.toLowerCase();
    if (p.includes('excell') || p.includes('great')) return 'success';
    if (p.includes('good')) return 'info';
    if (p.includes('aver') || p.includes('fair')) return 'warning';
    if (p.includes('poor') || p.includes('bad')) return 'error';
    return 'default';
  }

  /**
   * Map performance to badge variant
   */
  getBadgeVariant(performance?: string): 'success' | 'primary' | 'warning' | 'error' | 'default' {
    if (!performance) return 'default';
    const p = performance.toLowerCase();
    if (p.includes('excell') || p.includes('great')) return 'success';
    if (p.includes('good')) return 'primary';
    if (p.includes('aver') || p.includes('fair')) return 'warning';
    if (p.includes('poor') || p.includes('bad')) return 'error';
    return 'default';
  }

  /**
   * Format metric value for display
   */
  formatMetricValue(metric: any): string {
    // #region agent log
    sendDebugLog({
      location: 'analytics-section.component.ts:125',
      message: 'formatMetricValue entry',
      data: {
        metricValue: metric?.value,
        metricFormat: metric?.format,
        metricLabel: metric?.label,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
    });
    // #endregion
    if (metric.value === null || metric.value === undefined) return '—';

    // If value is already a formatted string, return it
    if (
      typeof metric.value === 'string' &&
      (metric.value.includes('%') ||
        metric.value.includes('$') ||
        metric.value.includes('M') ||
        metric.value.includes('K'))
    ) {
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:136',
        message: 'formatMetricValue returning formatted string',
        data: { value: metric.value },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      });
      // #endregion
      return metric.value;
    }

    // Format based on format type
    if (metric.format === 'currency') {
      const numValue = Number(metric.value);
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:141',
        message: 'formatMetricValue currency conversion',
        data: { originalValue: metric.value, numValue, isNaN: isNaN(numValue) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      });
      // #endregion
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue);
    }

    if (metric.format === 'percentage') {
      const numValue = Number(metric.value);
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:150',
        message: 'formatMetricValue percentage conversion',
        data: { originalValue: metric.value, numValue, isNaN: isNaN(numValue) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      });
      // #endregion
      if (isNaN(numValue)) {
        return '—';
      }
      return `${numValue.toFixed(1)}%`;
    }

    if (metric.format === 'number') {
      const numValue = Number(metric.value);
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:154',
        message: 'formatMetricValue number conversion',
        data: { originalValue: metric.value, numValue, isNaN: isNaN(numValue) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      });
      // #endregion
      if (isNaN(numValue)) {
        return '—';
      }
      // Format large numbers with K/M suffixes
      if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(1)}M`;
      }
      if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(1)}K`;
      }
      return new Intl.NumberFormat('en-US').format(numValue);
    }

    const result = metric.value.toString();
    // #region agent log
    sendDebugLog({
      location: 'analytics-section.component.ts:165',
      message: 'formatMetricValue toString result',
      data: { originalValue: metric.value, result },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
    });
    // #endregion
    return result;
  }

  /**
   * Format a value using a metric's format settings
   */
  formatValueWithMetricFormat(metric: any, value: any): string {
    if (value === null || value === undefined) return '—';

    // Create a temporary metric object with the provided value
    const tempMetric = {
      ...metric,
      value,
    };

    return this.formatMetricValue(tempMetric);
  }

  /**
   * Get progress percentage (0-100)
   */
  getProgressPercentage(metric: any): number {
    // #region agent log
    sendDebugLog({
      location: 'analytics-section.component.ts:186',
      message: 'getProgressPercentage entry',
      data: {
        metricPercentage: metric?.percentage,
        metricValue: metric?.value,
        metricGoal: (metric as any)?.goal,
        metricLabel: metric?.label,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B',
    });
    // #endregion
    if (metric.percentage !== undefined) {
      const result = Math.min(100, Math.max(0, metric.percentage));
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:188',
        message: 'getProgressPercentage using percentage',
        data: { percentage: metric.percentage, result },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B',
      });
      // #endregion
      return result;
    }
    const goal = (metric as any).goal;
    if (goal !== undefined && metric.value !== undefined) {
      const value = Number(metric.value);
      const goalValue = Number(goal);
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:193',
        message: 'getProgressPercentage calculation',
        data: { value, goalValue, valueIsNaN: isNaN(value), goalIsNaN: isNaN(goalValue) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B',
      });
      // #endregion
      if (goalValue === 0) return 0;
      const result = Math.min(100, Math.max(0, (value / goalValue) * 100));
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:195',
        message: 'getProgressPercentage result',
        data: { result, isNaN: isNaN(result) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B',
      });
      // #endregion
      return result;
    }
    // #region agent log
    sendDebugLog({
      location: 'analytics-section.component.ts:197',
      message: 'getProgressPercentage returning 0',
      data: {},
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B',
    });
    // #endregion
    return 0;
  }

  /**
   * Get target percentage for goal marker (0-100)
   */
  getTargetPercentage(metric: any): number {
    const goal = (metric as any).goal;
    if (!goal) return 100;
    // If targetPercentage is provided, use it as target
    const targetPercentage = (metric as any).targetPercentage;
    if (targetPercentage !== undefined) {
      return Math.min(100, Math.max(0, targetPercentage));
    }
    // Default to 100% if no specific target
    return 100;
  }

  /**
   * Get progress class based on value vs goal
   */
  getProgressClass(metric: any): string {
    // #region agent log
    sendDebugLog({
      location: 'analytics-section.component.ts:218',
      message: 'getProgressClass entry',
      data: { metricLabel: metric?.label, metricPerformance: metric?.performance },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C',
    });
    // #endregion
    const percentage = this.getProgressPercentage(metric);
    const target = this.getTargetPercentage(metric);
    const variant = this.getVariant(metric.performance);
    const goal = (metric as any).goal;
    // #region agent log
    sendDebugLog({
      location: 'analytics-section.component.ts:222',
      message: 'getProgressClass calculated values',
      data: {
        percentage,
        target,
        variant,
        goal,
        percentageIsNaN: isNaN(percentage),
        targetIsNaN: isNaN(target),
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C',
    });
    // #endregion

    // If we have a goal and current value is below target
    if (goal !== undefined && percentage < target - 5) {
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:226',
        message: 'getProgressClass returning warning',
        data: {},
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
      });
      // #endregion
      return 'metric-progress-fill--warning';
    }

    // If we have a goal and current value meets/exceeds target
    if (goal !== undefined && percentage >= target - 5) {
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:231',
        message: 'getProgressClass returning success',
        data: {},
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
      });
      // #endregion
      return 'metric-progress-fill--success';
    }

    // Use semantic mapping based on variant
    if (variant === 'success') return 'metric-progress-fill--success';
    if (variant === 'warning') return 'metric-progress-fill--warning';
    if (variant === 'error') return 'metric-progress-fill--error';
    const result = 'metric-progress-fill--default';
    // #region agent log
    sendDebugLog({
      location: 'analytics-section.component.ts:238',
      message: 'getProgressClass returning default',
      data: { result },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C',
    });
    // #endregion
    return result;
  }

  /**
   * Get progress label (X of Y format or percentage)
   */
  getProgressLabel(metric: any): string {
    // #region agent log
    sendDebugLog({
      location: 'analytics-section.component.ts:244',
      message: 'getProgressLabel entry',
      data: {
        metricValue: metric?.value,
        metricGoal: (metric as any)?.goal,
        metricLabel: metric?.label,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'D',
    });
    // #endregion
    // If goal exists (via any field), show "X of Y" format
    // Try goal field, or use percentage as goal reference
    const goal = (metric as any).goal;
    if (goal !== undefined && metric.value !== undefined) {
      const value = Number(metric.value);
      const goalValue = Number(goal);
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:249',
        message: 'getProgressLabel calculation',
        data: { value, goalValue, valueIsNaN: isNaN(value), goalIsNaN: isNaN(goalValue) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      });
      // #endregion
      const result = `${this.formatValueWithMetricFormat(metric, value)} / ${this.formatValueWithMetricFormat(metric, goalValue)}`;
      // #region agent log
      sendDebugLog({
        location: 'analytics-section.component.ts:251',
        message: 'getProgressLabel result',
        data: { result },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      });
      // #endregion
      return result;
    }
    // Otherwise show percentage
    const percentage = this.getProgressPercentage(metric);
    const result = `${Math.round(percentage)}%`;
    // #region agent log
    sendDebugLog({
      location: 'analytics-section.component.ts:255',
      message: 'getProgressLabel percentage result',
      data: { percentage, result, percentageIsNaN: isNaN(percentage) },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'D',
    });
    // #endregion
    return result;
  }

  /**
   * Get period text from metric (if available)
   */
  getPeriod(metric: any): string | undefined {
    return (metric as any).period;
  }

  /**
   * Check if metric has goal
   */
  hasGoal(metric: any): boolean {
    return (metric as any).goal !== undefined;
  }

  /**
   * Get goal value from metric
   */
  getGoalValue(metric: any): any {
    return (metric as any).goal;
  }

  /**
   * Format goal value for display
   */
  formatGoalValue(metric: any): string {
    const goal = (metric as any).goal;
    if (goal === undefined || goal === null) return '—';
    return this.formatValueWithMetricFormat(metric, goal);
  }

  /**
   * Get unique identifier for a metric (for expansion tracking)
   */
  getMetricId(metric: any, index: number): string {
    return metric.id || metric.label || `metric-${index}`;
  }

  /**
   * Check if a metric is currently expanded
   */
  isMetricExpanded(metric: any, index: number): boolean {
    return this.expandedMetricId === this.getMetricId(metric, index);
  }

  /**
   * Toggle expanded state for a metric
   */
  toggleMetric(metric: any, index: number): void {
    const metricId = this.getMetricId(metric, index);
    if (this.expandedMetricId === metricId) {
      this.expandedMetricId = null;
    } else {
      this.expandedMetricId = metricId;
    }
  }

  /**
   * Handle keyboard events for metric cards
   */
  onMetricKeyDown(event: KeyboardEvent, metric: any, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleMetric(metric, index);
    } else if (event.key === 'Escape' && this.expandedMetricId) {
      this.expandedMetricId = null;
    }
  }

  /**
   * Check if progress bar should be shown (collapsed mode: only if has goal/percentage)
   * In expanded mode, always show if available
   * Note: Hover reveals are handled by CSS
   */
  shouldShowProgress(metric: any, index: number): boolean {
    const hasProgress = metric.percentage !== undefined || this.hasGoal(metric);
    if (!hasProgress) return false;

    // In comfortable mode, always show
    if (this.density === 'comfortable') return true;

    // In compact mode: show minimal bar if has goal/percentage
    // Always show if expanded (hover is handled by CSS)
    return this.isMetricExpanded(metric, index) || hasProgress;
  }

  /**
   * Check if progress label should be shown
   * Only show when expanded (hover is handled by CSS)
   */
  shouldShowProgressLabel(metric: any, index: number): boolean {
    if (this.density === 'comfortable') return true;
    return this.isMetricExpanded(metric, index);
  }

  /**
   * Check if target/objective should be shown
   * Only show when expanded (hover is handled by CSS)
   */
  shouldShowObjective(metric: any, index: number): boolean {
    if (!this.hasGoal(metric)) return false;
    if (this.density === 'comfortable') return true;
    return this.isMetricExpanded(metric, index);
  }

  /**
   * Check if description should be shown
   * Only show when expanded
   */
  shouldShowDescription(metric: any, index: number): boolean {
    return this.isMetricExpanded(metric, index) && !!(metric as any).description;
  }

  /**
   * Get description from metric
   */
  getDescription(metric: any): string | undefined {
    return (metric as any).description;
  }
}
