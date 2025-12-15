import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { CSS_ISOLATION_MODE, DEFAULT_THEME } from '../../providers/injection-tokens';

/**
 * OsiCardsContainerComponent
 *
 * A wrapper component that automatically applies the `.osi-cards-container` class
 * to encapsulate OSI Cards styles and prevent CSS leakage into the host application.
 *
 * Features:
 * - CSS Layer support for easy style overrides
 * - Optional strict CSS isolation with containment
 * - Theme support (day/night modes)
 * - Responsive padding adjustments
 *
 * @example
 * ```html
 * <osi-cards-container>
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </osi-cards-container>
 * ```
 *
 * @example
 * With theme support:
 * ```html
 * <osi-cards-container [theme]="'night'">
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </osi-cards-container>
 * ```
 *
 * @example
 * With strict isolation:
 * ```html
 * <osi-cards-container [strictIsolation]="true">
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </osi-cards-container>
 * ```
 */
@Component({
  selector: 'osi-cards-container',
  standalone: true,
  template: `
    <div
      [class]="containerClass"
      [attr.data-theme]="effectiveTheme"
      [style.contain]="strictIsolation ? 'content' : null"
      [style.isolation]="strictIsolation ? 'isolate' : null"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background: transparent !important;
        background-color: transparent !important;
      }

      .osi-cards-container {
        /*
       * Fully transparent container - allows host app background to show through.
       * Padding for subtle shadow/glow effects around the card.
       */
        padding: var(--osi-card-padding, 8px) !important;
        padding-top: var(--osi-card-padding, 8px) !important;
        padding-bottom: var(--osi-card-padding, 8px) !important;
        padding-left: var(--osi-card-padding, 8px) !important;
        padding-right: var(--osi-card-padding, 8px) !important;
        background: transparent !important;
        background-color: transparent !important;

        /* Preserve 3D transforms for child elements */
        perspective: 1200px;
        transform-style: preserve-3d;

        /* Ensure card is centered */
        display: flex !important;
        justify-content: center !important;
        align-items: flex-start !important;

        /* Prevent Bootstrap and other external styles from overriding */
        margin: 0 !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      /* Strict isolation mode - additional containment */
      .osi-cards-container--strict {
        /* CSS Containment for performance and isolation */
        contain: content;
        /* Create new stacking context */
        isolation: isolate;
        /* Ensure content doesn't overflow */
        overflow: hidden;
      }

      /* Responsive adjustments */
      @media (max-width: 480px) {
        .osi-cards-container {
          padding: var(--osi-card-padding-mobile, 4px) !important;
          padding-top: var(--osi-card-padding-mobile, 4px) !important;
          padding-bottom: var(--osi-card-padding-mobile, 4px) !important;
          padding-left: var(--osi-card-padding-mobile, 4px) !important;
          padding-right: var(--osi-card-padding-mobile, 4px) !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.Default, // Changed from OnPush to Default to ensure theme changes are detected
  encapsulation: ViewEncapsulation.None, // Allow scoped styles from _styles-scoped.scss to apply
})
export class OsiCardsContainerComponent implements OnChanges {
  // Inject configuration from providers (optional - may not be provided)
  private readonly cssIsolationMode = inject(CSS_ISOLATION_MODE, { optional: true });
  private readonly defaultThemeConfig = inject(DEFAULT_THEME, { optional: true });
  private readonly cdr = inject(ChangeDetectorRef);

  /**
   * Theme to apply to the container.
   * Can be 'day', 'night', or undefined (uses default from config or 'day').
   */
  @Input() theme?: 'day' | 'night';

  /**
   * Whether to use strict CSS isolation.
   * When true, applies CSS containment (contain: content) and isolation: isolate.
   * This creates stronger style boundaries but may affect some visual effects.
   *
   * Defaults to the value from provideOSICards({ cssIsolation: 'strict' }) if set,
   * otherwise false.
   */
  @Input() strictIsolation?: boolean;

  /**
   * Computed container class name.
   * Always includes 'osi-cards-container' base class.
   * Adds 'osi-cards-container--strict' when strict isolation is enabled.
   */
  get containerClass(): string {
    const classes = ['osi-cards-container'];

    const isStrictMode = this.strictIsolation ?? this.cssIsolationMode === ('strict' as string);
    if (isStrictMode) {
      classes.push('osi-cards-container--strict');
    }

    return classes.join(' ');
  }

  /**
   * Computed effective theme.
   * Uses component input if provided, otherwise falls back to config default.
   */
  get effectiveTheme(): 'day' | 'night' {
    // Get theme from input, config default, or 'day'
    const configTheme = this.defaultThemeConfig;
    const resolvedTheme =
      this.theme ?? (typeof configTheme === 'string' ? configTheme : null) ?? 'day';
    return resolvedTheme as 'day' | 'night';
  }

  /**
   * React to input changes, especially theme changes.
   * This ensures OnPush change detection works correctly when theme input changes.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // If theme input changed, manually trigger change detection for OnPush strategy
    // Handle both first change and subsequent changes to ensure theme updates work
    if (changes['theme']) {
      const oldTheme = changes['theme'].previousValue;
      const newTheme = changes['theme'].currentValue;
      console.log(`[OsiCardsContainer] Theme input changed from ${oldTheme} to ${newTheme}`);
      this.cdr.markForCheck();
      // Also trigger detectChanges to ensure immediate update
      this.cdr.detectChanges();
    }
  }
}
