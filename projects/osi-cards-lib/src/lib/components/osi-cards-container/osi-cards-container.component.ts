import { Component, ChangeDetectionStrategy, Input, inject, Optional } from '@angular/core';
import { CSS_ISOLATION_MODE, DEFAULT_THEME, CSSIsolationMode } from '../../providers/osi-cards.providers';

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
    <div [class]="containerClass" 
         [attr.data-theme]="effectiveTheme"
         [style.contain]="strictIsolation ? 'content' : null"
         [style.isolation]="strictIsolation ? 'isolate' : null">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: transparent !important;
      background-color: transparent !important;
    }
    
    .osi-cards-container {
      /* 
       * Fully transparent container - allows host app background to show through.
       * 8px padding for subtle shadow/glow effects around the card.
       */
      padding: 8px;
      background: transparent !important;
      background-color: transparent !important;
      
      /* Preserve 3D transforms for child elements */
      perspective: 1200px;
      transform-style: preserve-3d;
      
      /* Ensure card is centered */
      display: flex;
      justify-content: center;
      align-items: flex-start;
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
        padding: 4px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OsiCardsContainerComponent {
  // Inject configuration from providers (optional - may not be provided)
  private readonly cssIsolationMode = inject(CSS_ISOLATION_MODE, { optional: true });
  private readonly defaultThemeConfig = inject(DEFAULT_THEME, { optional: true });

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
    
    if (this.strictIsolation ?? (this.cssIsolationMode === 'strict')) {
      classes.push('osi-cards-container--strict');
    }
    
    return classes.join(' ');
  }

  /**
   * Computed effective theme.
   * Uses component input if provided, otherwise falls back to config default.
   */
  get effectiveTheme(): 'day' | 'night' {
    return this.theme ?? this.defaultThemeConfig ?? 'day';
  }
}
