import {
  Directive,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { OSICardsThemeConfig, ThemePreset, ThemeService } from '@osi-cards/themes';

/**
 * Scoped Theme Directive
 *
 * Applies theme to a specific DOM subtree, allowing cards or sections
 * to have independent themes from the global document theme.
 *
 * Features:
 * - Scoped CSS variable application
 * - Optional isolation from global theme changes
 * - Support for theme presets and custom themes
 * - Automatic cleanup on destroy
 *
 * @example
 * ```html
 * <!-- Apply dark theme to this card only -->
 * <div osiTheme="dark">
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </div>
 *
 * <!-- Use a custom theme -->
 * <div [osiTheme]="myCustomTheme" [osiThemeIsolated]="true">
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </div>
 *
 * <!-- Follow global theme (default behavior) -->
 * <div osiTheme="inherit">
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </div>
 * ```
 */
@Directive({
  selector: '[osiTheme]',
  standalone: true,
  exportAs: 'osiTheme',
})
export class OsiThemeDirective implements OnInit, OnDestroy, OnChanges {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  /**
   * Theme to apply - can be a preset name, 'inherit', or custom config
   */
  @Input('osiTheme') theme: ThemePreset | string | OSICardsThemeConfig | 'inherit' = 'inherit';

  /**
   * Whether this scoped theme should be isolated from global theme changes
   * When true, the scoped theme won't change when the global theme changes
   */
  @Input() osiThemeIsolated = false;

  /**
   * Whether to enable transitions when theme changes
   */
  @Input() osiThemeTransitions = true;

  /**
   * Custom CSS variables to apply in addition to the theme
   */
  @Input() osiThemeVariables?: Record<string, string>;

  private appliedVariables: string[] = [];
  private currentTheme: string | null = null;

  ngOnInit(): void {
    this.applyTheme();

    // Watch for global theme changes if not isolated
    if (!this.osiThemeIsolated && this.theme === 'inherit') {
      this.themeService.resolvedTheme$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.applyTheme();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['theme'] || changes['osiThemeVariables']) {
      this.applyTheme();
    }

    if (changes['osiThemeIsolated'] && !changes['osiThemeIsolated'].firstChange) {
      // Re-subscribe or unsubscribe based on isolation change
      if (!this.osiThemeIsolated && this.theme === 'inherit') {
        this.themeService.resolvedTheme$.pipe(takeUntil(this.destroy$)).subscribe(() => {
          this.applyTheme();
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupVariables();
  }

  /**
   * Get the element this directive is applied to
   */
  getElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  /**
   * Get the current effective theme
   */
  getCurrentTheme(): string | null {
    return this.currentTheme;
  }

  /**
   * Manually refresh the theme
   */
  refresh(): void {
    this.applyTheme();
  }

  /**
   * Apply custom variables programmatically
   */
  setVariables(variables: Record<string, string>): void {
    this.applyVariables(variables);
  }

  /**
   * Remove all scoped theme styling
   */
  clearTheme(): void {
    this.cleanupVariables();
    this.renderer.removeAttribute(this.elementRef.nativeElement, 'data-theme');
    this.renderer.removeClass(this.elementRef.nativeElement, 'osi-scoped-theme');
    this.currentTheme = null;
  }

  // ============================================
  // Private Methods
  // ============================================

  private applyTheme(): void {
    const element = this.elementRef.nativeElement;

    // Handle transitions
    if (this.osiThemeTransitions && this.currentTheme !== null) {
      this.renderer.addClass(element, 'theme-transitioning');
      setTimeout(() => {
        this.renderer.removeClass(element, 'theme-transitioning');
      }, 250);
    }

    // Clean up previous variables
    this.cleanupVariables();

    // Determine theme to apply
    let resolvedTheme: string;
    let customConfig: OSICardsThemeConfig | null = null;

    if (this.theme === 'inherit') {
      // Inherit from global theme
      resolvedTheme = this.themeService.getResolvedTheme();
    } else if (typeof this.theme === 'object') {
      // Custom theme config passed directly
      customConfig = this.theme;
      resolvedTheme = customConfig.name;
    } else {
      // Preset or custom theme name
      resolvedTheme = this.theme;
      customConfig = this.themeService.getCustomTheme(resolvedTheme);
    }

    // Apply data-theme attribute
    this.renderer.setAttribute(element, 'data-theme', resolvedTheme);
    this.renderer.addClass(element, 'osi-scoped-theme');

    // Apply custom config variables if available
    if (customConfig?.variables) {
      this.applyVariables(customConfig.variables);
    }

    // Apply additional custom variables
    if (this.osiThemeVariables) {
      this.applyVariables(this.osiThemeVariables);
    }

    this.currentTheme = resolvedTheme;
  }

  private applyVariables(variables: Record<string, string>): void {
    const element = this.elementRef.nativeElement;

    Object.entries(variables).forEach(([key, value]) => {
      const varName = key.startsWith('--') ? key : `--${key}`;
      this.renderer.setStyle(element, varName, value);
      this.appliedVariables.push(varName);
    });
  }

  private cleanupVariables(): void {
    const element = this.elementRef.nativeElement;

    this.appliedVariables.forEach((varName) => {
      this.renderer.removeStyle(element, varName);
    });

    this.appliedVariables = [];
  }
}

/**
 * Theme Container Directive
 *
 * Creates an isolated theme container with proper CSS containment.
 * Use this for fully isolated theme contexts.
 *
 * @example
 * ```html
 * <div osiThemeContainer="dark">
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </div>
 * ```
 */
@Directive({
  selector: '[osiThemeContainer]',
  standalone: true,
  hostDirectives: [
    {
      directive: OsiThemeDirective,
      inputs: [
        'osiTheme: osiThemeContainer',
        'osiThemeIsolated',
        'osiThemeTransitions',
        'osiThemeVariables',
      ],
    },
  ],
})
export class OsiThemeContainerDirective implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  ngOnInit(): void {
    // Apply container styles for proper isolation
    const element = this.elementRef.nativeElement;

    this.renderer.addClass(element, 'osi-theme-container');
    this.renderer.setStyle(element, 'contain', 'layout style');

    // Container queries are progressive enhancement (Safari 16+)
    // Check support before applying
    if (
      typeof CSS !== 'undefined' &&
      CSS.supports &&
      CSS.supports('container-type', 'inline-size')
    ) {
      this.renderer.setStyle(element, 'container-type', 'inline-size');
    }
  }
}
