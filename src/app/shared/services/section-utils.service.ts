import { Injectable } from '@angular/core';

/**
 * Status values that can be used in sections
 */
export type StatusValue =
  | 'active'
  | 'completed'
  | 'success'
  | 'pending'
  | 'warning'
  | 'in-progress'
  | 'inactive'
  | 'error'
  | 'cancelled'
  | 'blocked'
  | 'delayed'
  | string;

/**
 * Priority values that can be used in sections
 */
export type PriorityValue = 'high' | 'medium' | 'low' | string;

/**
 * Trend values for analytics
 */
export type TrendValue = 'up' | 'down' | 'stable' | 'neutral';

/**
 * Utility service for section components
 *
 * Provides consistent status, trend, and icon handling across all section components.
 * This service ensures uniform styling and behavior for common section UI patterns.
 *
 * @example
 * ```typescript
 * const utils = inject(SectionUtilsService);
 *
 * // Get status classes
 * const statusClass = utils.getStatusClasses('active');
 *
 * // Get trend icon
 * const icon = utils.getTrendIcon('up');
 *
 * // Format change percentage
 * const formatted = utils.formatChange(15); // "+15%"
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class SectionUtilsService {
  /**
   * Get CSS classes for status badges/tags
   *
   * Returns consistent status classes across all section types.
   * Maps various status values to standardized CSS classes.
   *
   * @param status - The status value to get classes for
   * @returns CSS class string for the status
   *
   * @example
   * ```typescript
   * const class = utils.getStatusClasses('completed'); // "status--completed"
   * const class = utils.getStatusClasses('in-progress'); // "status--active"
   * ```
   */
  getStatusClasses(status?: StatusValue): string {
    const normalizedStatus = (status ?? '').toLowerCase().trim();

    switch (normalizedStatus) {
      case 'completed':
      case 'success':
        return 'status--completed';
      case 'active':
      case 'in-progress':
        return 'status--active';
      case 'pending':
      case 'warning':
        return 'status--pending';
      case 'cancelled':
      case 'blocked':
      case 'delayed':
      case 'inactive':
      case 'error':
        return 'status--blocked';
      default:
        return 'status--default';
    }
  }

  /**
   * Get CSS classes for priority badges/tags
   *
   * Returns consistent priority classes for priority indicators.
   *
   * @param priority - The priority value ('high', 'medium', 'low')
   * @returns CSS class string for the priority
   *
   * @example
   * ```typescript
   * const class = utils.getPriorityClasses('high'); // "priority--high"
   * ```
   */
  getPriorityClasses(priority?: PriorityValue): string {
    const normalizedPriority = (priority ?? '').toLowerCase().trim();

    switch (normalizedPriority) {
      case 'high':
        return 'priority--high';
      case 'medium':
        return 'priority--medium';
      case 'low':
        return 'priority--low';
      default:
        return 'priority--default';
    }
  }

  /**
   * Get icon name for trend indicators
   *
   * Maps trend values to appropriate Lucide icon names.
   *
   * @param trend - The trend value ('up', 'down', 'stable', 'neutral')
   * @returns Lucide icon name for the trend
   *
   * @example
   * ```typescript
   * const icon = utils.getTrendIcon('up'); // "trending-up"
   * const icon = utils.getTrendIcon('down'); // "trending-down"
   * ```
   */
  getTrendIcon(trend?: TrendValue | string): string {
    const normalizedTrend = (trend ?? '').toLowerCase().trim();

    switch (normalizedTrend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
      case 'neutral':
        return 'minus';
      default:
        return 'bar-chart-3';
    }
  }

  /**
   * Get CSS classes for trend indicators
   *
   * Returns CSS classes for trend indicators. Can handle both string trend values
   * and numeric change values (positive = up, negative = down, zero = stable).
   *
   * @param trend - The trend value or numeric change percentage
   * @returns CSS class string for the trend
   *
   * @example
   * ```typescript
   * const class = utils.getTrendClass('up'); // "trend--up"
   * const class = utils.getTrendClass(15); // "trend--up" (positive number)
   * const class = utils.getTrendClass(-5); // "trend--down" (negative number)
   * ```
   */
  getTrendClass(trend?: TrendValue | string | number): string {
    // Handle numeric values (change percentages)
    if (typeof trend === 'number') {
      if (trend > 0) {
        return 'trend--up';
      }
      if (trend < 0) {
        return 'trend--down';
      }
      return 'trend--stable';
    }

    const normalizedTrend = (trend ?? '').toLowerCase().trim();

    switch (normalizedTrend) {
      case 'up':
        return 'trend--up';
      case 'down':
        return 'trend--down';
      case 'stable':
        return 'trend--stable';
      default:
        return 'trend--neutral';
    }
  }

  /**
   * Calculate trend from change value
   *
   * Converts a numeric change percentage to a trend value.
   *
   * @param change - The change percentage (positive, negative, or zero)
   * @returns Trend value ('up', 'down', 'stable', or 'neutral')
   *
   * @example
   * ```typescript
   * const trend = utils.calculateTrend(10); // "up"
   * const trend = utils.calculateTrend(-5); // "down"
   * const trend = utils.calculateTrend(0); // "stable"
   * const trend = utils.calculateTrend(undefined); // "neutral"
   * ```
   */
  calculateTrend(change?: number): TrendValue {
    if (change === undefined || change === null) {
      return 'neutral';
    }
    if (change > 0) {
      return 'up';
    }
    if (change < 0) {
      return 'down';
    }
    return 'stable';
  }

  /**
   * Format change value with sign
   *
   * Formats a numeric change percentage with a '+' prefix for positive values.
   * Returns empty string for undefined/null values.
   *
   * @param change - The change percentage to format
   * @returns Formatted string (e.g., "+15%", "-5%", "0%", or "")
   *
   * @example
   * ```typescript
   * const formatted = utils.formatChange(15); // "+15%"
   * const formatted = utils.formatChange(-5); // "-5%"
   * const formatted = utils.formatChange(0); // "0%"
   * const formatted = utils.formatChange(undefined); // ""
   * ```
   */
  formatChange(change?: number): string {
    if (change === undefined || change === null) {
      return '';
    }
    return `${change > 0 ? '+' : ''}${change}%`;
  }
}
