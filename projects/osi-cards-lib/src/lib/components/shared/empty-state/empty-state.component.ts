import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared Empty State Component
 *
 * Provides consistent empty state display across all section types.
 * Supports icon, message, and optional action button.
 *
 * @example
 * ```html
 * <lib-empty-state
 *   message="No data available"
 *   icon="📭"
 *   actionLabel="Add Item"
 *   (action)="onAddItem()">
 * </lib-empty-state>
 * ```
 */
@Component({
  selector: 'lib-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  /**
   * Empty state message
   * @default 'No data available'
   */
  @Input() message = 'No data available';

  /**
   * Optional icon/emoji to display above message
   */
  @Input() icon?: string;

  /**
   * Optional action button label
   */
  @Input() actionLabel?: string;

  /**
   * Visual variant
   * @default 'default'
   */
  @Input() variant: 'default' | 'minimal' | 'centered' | 'compact' = 'default';

  /**
   * Size variant
   * @default 'medium'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Additional CSS classes for the container
   */
  @Input() containerClass?: string;

  /**
   * Emitted when action button is clicked
   */
  @Output() action = new EventEmitter<void>();

  /**
   * Handle action button click
   */
  onActionClick(): void {
    this.action.emit();
  }

  /**
   * Get array of CSS classes, filtering out undefined values
   * NgClass requires all values to be strings, not undefined
   */
  getClassArray(): string[] {
    return [this.variant, this.size, this.containerClass].filter(
      (cls): cls is string => cls !== undefined && cls !== null
    );
  }
}
