import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { safeDebugFetch } from '../../../utils';

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
export class EmptyStateComponent implements OnInit, OnChanges, AfterViewInit {
  // #region agent log
  constructor(private cdr: ChangeDetectorRef) {
    if (typeof window !== 'undefined') {
      safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
        location: 'empty-state.component.ts:constructor',
        message: 'EmptyStateComponent constructor called',
        data: { timestamp: Date.now() },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      });
    }
  }
  // #endregion

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

  // #region agent log
  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
        location: 'empty-state.component.ts:ngOnInit',
        message: 'EmptyStateComponent ngOnInit',
        data: {
          message: this.message,
          icon: this.icon,
          variant: this.variant,
          size: this.size,
          hasActionLabel: !!this.actionLabel,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      });
    }
  }
  // #endregion

  // #region agent log
  ngOnChanges(changes: SimpleChanges): void {
    if (typeof window !== 'undefined') {
      safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
        location: 'empty-state.component.ts:ngOnChanges',
        message: 'EmptyStateComponent input changes detected',
        data: {
          changes: Object.keys(changes),
          currentValues: {
            message: this.message,
            icon: this.icon,
            variant: this.variant,
            size: this.size,
          },
          previousValues: Object.keys(changes).reduce(
            (acc: Record<string, any>, key) => {
              acc[key] = changes[key]?.previousValue;
              return acc;
            },
            {} as Record<string, any>
          ),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B',
      });
    }
    this.cdr.markForCheck();
  }
  // #endregion

  // #region agent log
  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
        location: 'empty-state.component.ts:ngAfterViewInit',
        message: 'EmptyStateComponent view initialized',
        data: {
          message: this.message,
          icon: this.icon,
          variant: this.variant,
          classes: this.getClassArray(),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      });
    }
  }
  // #endregion

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
  // #region agent log
  getClassArray(): string[] {
    const classes = [this.variant, this.size, this.containerClass].filter(
      (cls): cls is string => cls !== undefined && cls !== null
    );
    if (typeof window !== 'undefined') {
      safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
        location: 'empty-state.component.ts:getClassArray',
        message: 'getClassArray called',
        data: {
          variant: this.variant,
          size: this.size,
          containerClass: this.containerClass,
          resultClasses: classes,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      });
    }
    return classes;
  }
  // #endregion
}
