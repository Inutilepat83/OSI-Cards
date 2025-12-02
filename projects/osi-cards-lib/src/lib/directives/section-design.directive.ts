/**
 * Section Design Directive
 *
 * Applies design parameters from section meta to the host element as CSS custom properties.
 * This directive enables dynamic styling without hardcoded values, making the system
 * easy to maintain and customize.
 *
 * @example
 * ```html
 * <div [libSectionDesign]="section.meta">
 *   <!-- Content will inherit custom CSS properties -->
 * </div>
 * ```
 */

import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import {
  SectionDesignParams,
  getSectionDesignParams
} from '../models/section-design-params.model';

/**
 * Mapping of design parameter keys to CSS custom property names
 * This centralized mapping makes it easy to maintain and update
 */
const DESIGN_PARAM_TO_CSS_VAR: Record<keyof SectionDesignParams, string> = {
  // Colors
  itemColor: '--section-item-color',
  itemBackground: '--section-item-background',
  itemBackgroundHover: '--section-item-background-hover',
  itemBorderColor: '--section-item-border-color',
  itemBorderHover: '--section-item-border-hover',
  accentColor: '--section-accent-color',
  labelColor: '--section-label-color',
  valueColor: '--section-value-color',
  mutedColor: '--section-muted-color',
  successColor: '--section-success-color',
  warningColor: '--section-warning-color',
  errorColor: '--section-error-color',

  // Borders
  itemBorderWidth: '--section-item-border-width',
  itemBorderStyle: '--section-item-border-style',
  borderRadius: '--section-border-radius',
  borderRadiusSmall: '--section-border-radius-small',

  // Spacing
  itemGap: '--section-item-gap',
  itemPadding: '--section-item-padding',
  itemPaddingSmall: '--section-item-padding-small',
  elementGap: '--section-element-gap',
  containerPadding: '--section-container-padding',
  gridGap: '--section-grid-gap',
  gridRowGap: '--section-grid-row-gap',
  gridColumnGap: '--section-grid-column-gap',
  sectionMargin: '--section-margin',
  verticalSpacing: '--section-vertical-spacing',
  horizontalSpacing: '--section-horizontal-spacing',

  // Animation
  animationDuration: '--section-animation-duration',
  animationEasing: '--section-animation-easing',
  disableAnimations: '--section-disable-animations',
  staggerDelay: '--section-stagger-delay',

  // Shadow
  itemBoxShadow: '--section-item-box-shadow',
  itemBoxShadowHover: '--section-item-box-shadow-hover',
  itemBoxShadowFocus: '--section-item-box-shadow-focus',

  // Typography
  labelFontSize: '--section-label-font-size',
  valueFontSize: '--section-value-font-size',
  titleFontSize: '--section-title-font-size',
  labelFontWeight: '--section-label-font-weight',
  valueFontWeight: '--section-value-font-weight',
  fontFamily: '--section-font-family',
  letterSpacing: '--section-letter-spacing',
  lineHeight: '--section-line-height',

  // Custom (handled separately)
  customVars: '', // Not directly mapped
};

@Directive({
  selector: '[libSectionDesign]',
  standalone: true,
})
export class SectionDesignDirective implements OnChanges {
  /**
   * Section meta object containing design parameters
   */
  @Input() libSectionDesign?: Record<string, unknown>;

  /**
   * Optional direct design parameters (bypasses meta extraction)
   */
  @Input() sectionDesignParams?: SectionDesignParams;

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private appliedVars = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['libSectionDesign'] || changes['sectionDesignParams']) {
      this.applyDesignParameters();
    }
  }

  /**
   * Extract and apply design parameters to the host element
   */
  private applyDesignParameters(): void {
    // Clear previously applied custom properties
    this.clearAppliedVars();

    // Get design parameters from meta or direct input
    const designParams = this.sectionDesignParams ||
                        getSectionDesignParams(this.libSectionDesign);

    if (!designParams) {
      return;
    }

    const element = this.elementRef.nativeElement;

    // Apply standard design parameters
    Object.entries(designParams).forEach(([key, value]) => {
      if (key === 'customVars') {
        // Handle custom variables separately
        return;
      }

      if (value !== undefined && value !== null) {
        const cssVar = DESIGN_PARAM_TO_CSS_VAR[key as keyof SectionDesignParams];
        if (cssVar) {
          this.setCssVar(element, cssVar, this.formatValue(key, value));
        }
      }
    });

    // Apply custom CSS variables if provided
    if (designParams.customVars) {
      Object.entries(designParams.customVars).forEach(([varName, varValue]) => {
        this.setCssVar(element, varName, varValue);
      });
    }
  }

  /**
   * Set a CSS custom property and track it
   */
  private setCssVar(element: HTMLElement, varName: string, value: string): void {
    element.style.setProperty(varName, value);
    this.appliedVars.add(varName);
  }

  /**
   * Clear all previously applied CSS custom properties
   */
  private clearAppliedVars(): void {
    const element = this.elementRef.nativeElement;
    this.appliedVars.forEach(varName => {
      element.style.removeProperty(varName);
    });
    this.appliedVars.clear();
  }

  /**
   * Format value for CSS (add units where needed, handle special cases)
   */
  private formatValue(key: string, value: unknown): string {
    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }

    // Handle numeric values that need units
    if (typeof value === 'number') {
      // Font weight doesn't need units
      if (key.includes('FontWeight') || key.includes('lineHeight')) {
        return String(value);
      }

      // Stagger delay needs ms
      if (key === 'staggerDelay') {
        return `${value}ms`;
      }

      // Other numeric values default to px
      return `${value}px`;
    }

    // Return string values as-is
    return String(value);
  }
}

