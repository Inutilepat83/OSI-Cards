import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge variant types
 */
export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

/**
 * Badge size types
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Shared Badge Component
 *
 * Provides consistent badge/tag/pill display across all section types.
 * Used for status indicators, priorities, categories, etc.
 *
 * @example
 * ```html
 * <lib-badge variant="success">Completed</lib-badge>
 * <lib-badge variant="error" size="sm">High Priority</lib-badge>
 * <lib-badge variant="warning">Pending</lib-badge>
 * ```
 */
@Component({
  selector: 'lib-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  /**
   * Badge visual variant
   * @default 'default'
   */
  @Input() variant: BadgeVariant = 'default';

  /**
   * Badge size
   * @default 'md'
   */
  @Input() size: BadgeSize = 'md';

  /**
   * Whether the badge should be outlined (border only)
   * @default false
   */
  @Input() outlined = false;

  /**
   * Whether the badge should be rounded/pill-shaped
   * @default false
   */
  @Input() pill = false;

  /**
   * Whether to show a dot indicator
   * @default false
   */
  @Input() dot = false;

  /**
   * Additional CSS classes
   */
  @Input() badgeClass?: string;

  /**
   * Optional icon to display before text
   */
  @Input() icon?: string;

  /**
   * Whether badge is clickable/interactive
   * @default false
   */
  @Input() interactive = false;

  /**
   * ARIA label for accessibility
   */
  @Input() ariaLabel?: string;
}

