/**
 * Section Design Utilities
 *
 * Helper functions for working with section design parameters.
 * Provides utilities for creating, merging, and applying design configurations.
 */

import {
  SectionDesignParams,
  SectionDesignConfig,
  SectionDesignPreset,
  SECTION_DESIGN_PRESETS,
  getSectionDesignParams,
  SectionColorParams,
  SectionBorderParams,
  SectionSpacingParams,
  SectionAnimationParams,
  SectionShadowParams,
  SectionTypographyParams,
} from '../models/section-design-params.model';

/**
 * Create a design configuration from a preset
 */
export function createDesignFromPreset(preset: SectionDesignPreset): SectionDesignConfig {
  return { preset };
}

/**
 * Create a design configuration with custom parameters
 */
export function createDesignParams(params: SectionDesignParams): SectionDesignConfig {
  return { params };
}

/**
 * Create a design configuration with preset and overrides
 */
export function createDesignWithOverrides(
  preset: SectionDesignPreset,
  overrides: Partial<SectionDesignParams>
): SectionDesignConfig {
  return {
    preset,
    params: overrides,
  };
}

/**
 * Merge multiple design parameter objects
 * Later parameters override earlier ones
 */
export function mergeDesignParams(...params: (SectionDesignParams | undefined)[]): SectionDesignParams {
  // Filter out undefined params first
  const validParams = params.filter((p): p is SectionDesignParams => p !== undefined);

  if (validParams.length === 0) {
    return {} as SectionDesignParams;
  }

  return validParams.reduce((merged, current) => {
    // Handle customVars specially to merge them
    if (current.customVars || merged.customVars) {
      return {
        ...merged,
        ...current,
        customVars: {
          ...(merged.customVars || {}),
          ...(current.customVars || {}),
        },
      };
    }

    return { ...merged, ...current };
  }, {} as SectionDesignParams);
}

/**
 * Generate CSS custom properties object from design parameters
 * Can be used for inline styles or style bindings
 */
export function designParamsToCssVars(params: SectionDesignParams): Record<string, string> {
  const cssVars: Record<string, string> = {};

  // Colors
  if (params.itemColor) cssVars['--section-item-color'] = params.itemColor;
  if (params.itemBackground) cssVars['--section-item-background'] = params.itemBackground;
  if (params.itemBackgroundHover) cssVars['--section-item-background-hover'] = params.itemBackgroundHover;
  if (params.itemBorderColor) cssVars['--section-item-border-color'] = params.itemBorderColor;
  if (params.itemBorderHover) cssVars['--section-item-border-hover'] = params.itemBorderHover;
  if (params.accentColor) cssVars['--section-accent-color'] = params.accentColor;
  if (params.labelColor) cssVars['--section-label-color'] = params.labelColor;
  if (params.valueColor) cssVars['--section-value-color'] = params.valueColor;
  if (params.mutedColor) cssVars['--section-muted-color'] = params.mutedColor;
  if (params.successColor) cssVars['--section-success-color'] = params.successColor;
  if (params.warningColor) cssVars['--section-warning-color'] = params.warningColor;
  if (params.errorColor) cssVars['--section-error-color'] = params.errorColor;

  // Borders
  if (params.itemBorderWidth) cssVars['--section-item-border-width'] = params.itemBorderWidth;
  if (params.itemBorderStyle) cssVars['--section-item-border-style'] = params.itemBorderStyle;
  if (params.borderRadius) cssVars['--section-border-radius'] = params.borderRadius;
  if (params.borderRadiusSmall) cssVars['--section-border-radius-small'] = params.borderRadiusSmall;

  // Spacing
  if (params.itemGap) cssVars['--section-item-gap'] = params.itemGap;
  if (params.itemPadding) cssVars['--section-item-padding'] = params.itemPadding;
  if (params.itemPaddingSmall) cssVars['--section-item-padding-small'] = params.itemPaddingSmall;
  if (params.elementGap) cssVars['--section-element-gap'] = params.elementGap;
  if (params.containerPadding) cssVars['--section-container-padding'] = params.containerPadding;
  if (params.gridGap) cssVars['--section-grid-gap'] = params.gridGap;
  if (params.gridRowGap) cssVars['--section-grid-row-gap'] = params.gridRowGap;
  if (params.gridColumnGap) cssVars['--section-grid-column-gap'] = params.gridColumnGap;
  if (params.sectionMargin) cssVars['--section-margin'] = params.sectionMargin;
  if (params.verticalSpacing) cssVars['--section-vertical-spacing'] = params.verticalSpacing;
  if (params.horizontalSpacing) cssVars['--section-horizontal-spacing'] = params.horizontalSpacing;

  // Animation
  if (params.animationDuration) cssVars['--section-animation-duration'] = params.animationDuration;
  if (params.animationEasing) cssVars['--section-animation-easing'] = params.animationEasing;
  if (params.disableAnimations !== undefined) {
    cssVars['--section-disable-animations'] = params.disableAnimations ? '1' : '0';
  }
  if (params.staggerDelay !== undefined) {
    cssVars['--section-stagger-delay'] = `${params.staggerDelay}ms`;
  }

  // Shadow
  if (params.itemBoxShadow) cssVars['--section-item-box-shadow'] = params.itemBoxShadow;
  if (params.itemBoxShadowHover) cssVars['--section-item-box-shadow-hover'] = params.itemBoxShadowHover;
  if (params.itemBoxShadowFocus) cssVars['--section-item-box-shadow-focus'] = params.itemBoxShadowFocus;

  // Typography
  if (params.labelFontSize) cssVars['--section-label-font-size'] = params.labelFontSize;
  if (params.valueFontSize) cssVars['--section-value-font-size'] = params.valueFontSize;
  if (params.titleFontSize) cssVars['--section-title-font-size'] = params.titleFontSize;
  if (params.labelFontWeight) cssVars['--section-label-font-weight'] = String(params.labelFontWeight);
  if (params.valueFontWeight) cssVars['--section-value-font-weight'] = String(params.valueFontWeight);
  if (params.fontFamily) cssVars['--section-font-family'] = params.fontFamily;
  if (params.letterSpacing) cssVars['--section-letter-spacing'] = params.letterSpacing;
  if (params.lineHeight) cssVars['--section-line-height'] = String(params.lineHeight);

  // Custom variables
  if (params.customVars) {
    Object.entries(params.customVars).forEach(([key, value]) => {
      cssVars[key] = value;
    });
  }

  return cssVars;
}

/**
 * Apply design parameters to an HTML element
 * Useful for programmatic styling
 */
export function applyDesignParamsToElement(element: HTMLElement, params: SectionDesignParams): void {
  const cssVars = designParamsToCssVars(params);
  Object.entries(cssVars).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
}

/**
 * Get design parameters from section meta with fallback
 */
export function getDesignParamsWithFallback(
  meta: Record<string, unknown> | undefined,
  fallback?: SectionDesignParams
): SectionDesignParams | undefined {
  const params = getSectionDesignParams(meta);
  return params || fallback;
}

/**
 * Create color scheme parameters from a base color
 * Automatically generates related colors (hover, border, etc.)
 */
export function createColorScheme(baseColor: string, options?: {
  generateHover?: boolean;
  generateBorder?: boolean;
  hoverLighten?: number; // 0-100
  borderAlpha?: number; // 0-1
}): Partial<SectionDesignParams> {
  const {
    generateHover = true,
    generateBorder = true,
    hoverLighten = 10,
    borderAlpha = 0.2,
  } = options || {};

  const params: Partial<SectionDesignParams> = {
    accentColor: baseColor,
  };

  // Generate hover color (lighter version)
  if (generateHover) {
    // This is a simple implementation; for production, consider using a color library
    params.itemBackgroundHover = `color-mix(in srgb, ${baseColor} ${100 - hoverLighten}%, white)`;
  }

  // Generate border color (transparent version)
  if (generateBorder) {
    // Extract RGB if possible, or use rgba with alpha
    params.itemBorderColor = `color-mix(in srgb, ${baseColor} ${borderAlpha * 100}%, transparent)`;
  }

  return params;
}

/**
 * Validate design parameters
 * Returns an array of validation errors, or empty array if valid
 */
export function validateDesignParams(params: SectionDesignParams): string[] {
  const errors: string[] = [];

  // Validate numeric ranges
  if (params.staggerDelay !== undefined && params.staggerDelay < 0) {
    errors.push('staggerDelay must be non-negative');
  }

  // Validate border style
  const validBorderStyles = ['solid', 'dashed', 'dotted', 'double', 'none'];
  if (params.itemBorderStyle && !validBorderStyles.includes(params.itemBorderStyle)) {
    errors.push(`itemBorderStyle must be one of: ${validBorderStyles.join(', ')}`);
  }

  // Validate color formats (basic check)
  const colorParams = [
    'itemColor', 'itemBackground', 'itemBackgroundHover',
    'itemBorderColor', 'itemBorderHover', 'accentColor',
    'labelColor', 'valueColor', 'mutedColor',
    'successColor', 'warningColor', 'errorColor'
  ] as const;

  colorParams.forEach(param => {
    const value = params[param];
    if (value && typeof value === 'string') {
      // Basic validation - must start with #, rgb, rgba, hsl, hsla, or var(
      if (!/^(#|rgb|rgba|hsl|hsla|var\(|color-mix\()/.test(value.trim())) {
        errors.push(`${param} appears to have an invalid color format: ${value}`);
      }
    }
  });

  return errors;
}

/**
 * Get all available preset names
 */
export function getAvailablePresets(): SectionDesignPreset[] {
  return Object.keys(SECTION_DESIGN_PRESETS) as SectionDesignPreset[];
}

/**
 * Get design parameters for a specific preset
 */
export function getPresetParams(preset: SectionDesignPreset): SectionDesignParams {
  return { ...SECTION_DESIGN_PRESETS[preset] };
}

/**
 * Create a complete design configuration with type safety
 */
export function createSectionDesign(config: {
  preset?: SectionDesignPreset;
  colors?: Partial<SectionColorParams>;
  borders?: Partial<SectionBorderParams>;
  spacing?: Partial<SectionSpacingParams>;
  animations?: Partial<SectionAnimationParams>;
  shadows?: Partial<SectionShadowParams>;
  typography?: Partial<SectionTypographyParams>;
  customVars?: Record<string, string>;
}): SectionDesignConfig {
  const params: SectionDesignParams = {
    ...config.colors,
    ...config.borders,
    ...config.spacing,
    ...config.animations,
    ...config.shadows,
    ...config.typography,
    customVars: config.customVars,
  };

  return {
    preset: config.preset,
    params,
  };
}

