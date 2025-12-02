import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Progress bar variant types
 */
export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Shared Progress Bar Component
 *
 * Displays progress bars with smooth animations and color variants.
 * Used in analytics, loading states, and progress tracking.
 *
 * @example
 * ```html
 * <lib-progress-bar [value]="75" variant="success"></lib-progress-bar>
 * <lib-progress-bar [value]="50" variant="warning" [striped]="true"></lib-progress-bar>
 * ```
 */
@Component({
  selector: 'lib-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarComponent {
  /**
   * Progress value (0-100)
   * @default 0
   */
  @Input() value = 0;

  /**
   * Maximum value
   * @default 100
   */
  @Input() max = 100;

  /**
   * Color variant
   * @default 'default'
   */
  @Input() variant: ProgressBarVariant = 'default';

  /**
   * Size variant
   * @default 'medium'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Whether to animate the progress
   * @default true
   */
  @Input() animated = true;

  /**
   * Whether to show striped pattern
   * @default false
   */
  @Input() striped = false;

  /**
   * Whether to show shimmer effect
   * @default false
   */
  @Input() shimmer = false;

  /**
   * Whether to show percentage label
   * @default false
   */
  @Input() showLabel = false;

  /**
   * Custom label text (overrides percentage)
   */
  @Input() label?: string;

  /**
   * Additional CSS classes
   */
  @Input() progressClass?: string;

  /**
   * Get percentage value (0-100)
   */
  get percentage(): number {
    const percent = (this.value / this.max) * 100;
    return Math.min(100, Math.max(0, percent));
  }

  /**
   * Get formatted label
   */
  get formattedLabel(): string {
    if (this.label) return this.label;
    return `${Math.round(this.percentage)}%`;
  }

  /**
   * Get ARIA attributes
   */
  get ariaValueNow(): number {
    return this.value;
  }

  get ariaValueMin(): number {
    return 0;
  }

  get ariaValueMax(): number {
    return this.max;
  }
}

