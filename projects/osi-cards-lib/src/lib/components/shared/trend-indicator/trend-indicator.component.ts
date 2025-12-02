import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Trend direction types
 */
export type TrendDirection = 'up' | 'down' | 'stable' | 'neutral';

/**
 * Shared Trend Indicator Component
 *
 * Displays trend indicators with arrows and percentage changes.
 * Used in analytics, info, and financial sections.
 *
 * @example
 * ```html
 * <lib-trend-indicator trend="up" [value]="23.5"></lib-trend-indicator>
 * <lib-trend-indicator trend="down" [value]="-12.3" [showSign]="false"></lib-trend-indicator>
 * ```
 */
@Component({
  selector: 'lib-trend-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trend-indicator.component.html',
  styleUrl: './trend-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendIndicatorComponent {
  /**
   * Trend direction
   * @default 'neutral'
   */
  @Input() trend: TrendDirection = 'neutral';

  /**
   * Numeric value to display (percentage or absolute)
   */
  @Input() value?: number;

  /**
   * Whether to show +/- sign
   * @default true
   */
  @Input() showSign = true;

  /**
   * Whether to show percentage symbol
   * @default true
   */
  @Input() showPercent = true;

  /**
   * Size variant
   * @default 'medium'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Whether to animate the arrow
   * @default true
   */
  @Input() animated = true;

  /**
   * Custom icon instead of arrow
   */
  @Input() icon?: string;

  /**
   * Additional CSS classes
   */
  @Input() trendClass?: string;

  /**
   * ARIA label for accessibility
   */
  @Input() ariaLabel?: string;

  /**
   * Format the value for display
   */
  get formattedValue(): string {
    if (this.value === undefined || this.value === null) return '';

    const sign = this.showSign && this.value > 0 ? '+' : '';
    const percent = this.showPercent ? '%' : '';

    // Format to 1 decimal place
    const formatted = Math.abs(this.value).toFixed(1);

    return `${sign}${this.value < 0 ? '-' : ''}${formatted}${percent}`;
  }

  /**
   * Get arrow icon based on trend
   */
  get arrowIcon(): string {
    if (this.icon) return this.icon;

    switch (this.trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
      default: return '•';
    }
  }

  /**
   * Get computed ARIA label
   */
  get computedAriaLabel(): string {
    if (this.ariaLabel) return this.ariaLabel;

    const trendText = this.trend === 'up' ? 'increasing' :
                      this.trend === 'down' ? 'decreasing' :
                      this.trend === 'stable' ? 'stable' : 'neutral';

    return `Trend ${trendText}${this.value !== undefined ? ` by ${this.formattedValue}` : ''}`;
  }
}

