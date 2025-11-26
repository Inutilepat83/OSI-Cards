import { Injectable } from '@angular/core';

/**
 * Status values that can be used in sections
 */
export type StatusValue = 
  | 'active' | 'completed' | 'success'
  | 'pending' | 'warning' | 'in-progress'
  | 'inactive' | 'error' | 'cancelled' | 'blocked' | 'delayed'
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
 * Provides consistent status, trend, and icon handling across all sections
 */
@Injectable({
  providedIn: 'root'
})
export class SectionUtilsService {
  /**
   * Get CSS classes for status badges/tags
   * Returns consistent classes across all section types
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
   */
  getTrendClass(trend?: TrendValue | string | number): string {
    // Handle numeric values (change percentages)
    if (typeof trend === 'number') {
      if (trend > 0) return 'trend--up';
      if (trend < 0) return 'trend--down';
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
   */
  calculateTrend(change?: number): TrendValue {
    if (change === undefined || change === null) {
      return 'neutral';
    }
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'stable';
  }

  /**
   * Format change value with sign
   */
  formatChange(change?: number): string {
    if (change === undefined || change === null) {
      return '';
    }
    return `${change > 0 ? '+' : ''}${change}%`;
  }
}







