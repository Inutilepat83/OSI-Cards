/**
 * Section Design Parameters
 *
 * Defines customizable design properties for sections.
 * These parameters can be passed via the `meta.design` field in CardSection
 * to customize colors, animations, borders, and other visual properties.
 *
 * @example
 * ```typescript
 * const section: CardSection = {
 *   title: 'My Section',
 *   type: 'info',
 *   fields: [...],
 *   meta: {
 *     design: {
 *       itemColor: '#ff7900',
 *       itemBackground: '#1a1a1a',
 *       itemBorderColor: 'rgba(255, 121, 0, 0.2)',
 *       animationDuration: '300ms',
 *       borderRadius: '12px'
 *     }
 *   }
 * };
 * ```
 */

/**
 * Color properties for section items
 */
export interface SectionColorParams {
  /** Primary color for section items */
  itemColor?: string;

  /** Background color for section items */
  itemBackground?: string;

  /** Background color on hover */
  itemBackgroundHover?: string;

  /** Border color for section items */
  itemBorderColor?: string;

  /** Border color on hover */
  itemBorderHover?: string;

  /** Accent color (used for highlights, progress bars, etc.) */
  accentColor?: string;

  /** Text color for labels */
  labelColor?: string;

  /** Text color for values */
  valueColor?: string;

  /** Text color for muted/secondary text */
  mutedColor?: string;

  /** Success indicator color */
  successColor?: string;

  /** Warning indicator color */
  warningColor?: string;

  /** Error indicator color */
  errorColor?: string;
}

/**
 * Border and shape properties
 */
export interface SectionBorderParams {
  /** Border width for section items */
  itemBorderWidth?: string;

  /** Border style (solid, dashed, dotted, etc.) */
  itemBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';

  /** Border radius for section items */
  borderRadius?: string;

  /** Border radius for small elements */
  borderRadiusSmall?: string;
}

/**
 * Spacing properties
 */
export interface SectionSpacingParams {
  /** Gap between section items */
  itemGap?: string;

  /** Internal padding for section items */
  itemPadding?: string;

  /** Padding for small items */
  itemPaddingSmall?: string;

  /** Gap between elements within an item */
  elementGap?: string;

  /** Padding for the section container */
  containerPadding?: string;

  /** Gap for grid layouts (rows and columns) */
  gridGap?: string;

  /** Gap between grid rows */
  gridRowGap?: string;

  /** Gap between grid columns */
  gridColumnGap?: string;

  /** Margin around the section */
  sectionMargin?: string;

  /** Vertical spacing (for stacked layouts) */
  verticalSpacing?: string;

  /** Horizontal spacing (for horizontal layouts) */
  horizontalSpacing?: string;
}

/**
 * Animation properties
 */
export interface SectionAnimationParams {
  /** Animation duration for transitions */
  animationDuration?: string;

  /** Animation easing function */
  animationEasing?: string;

  /** Disable animations */
  disableAnimations?: boolean;

  /** Stagger delay between items (in milliseconds) */
  staggerDelay?: number;
}

/**
 * Shadow and elevation properties
 */
export interface SectionShadowParams {
  /** Box shadow for section items */
  itemBoxShadow?: string;

  /** Box shadow on hover */
  itemBoxShadowHover?: string;

  /** Box shadow for focused items */
  itemBoxShadowFocus?: string;
}

/**
 * Typography properties
 */
export interface SectionTypographyParams {
  /** Font size for labels */
  labelFontSize?: string;

  /** Font size for values */
  valueFontSize?: string;

  /** Font size for titles */
  titleFontSize?: string;

  /** Font weight for labels */
  labelFontWeight?: string | number;

  /** Font weight for values */
  valueFontWeight?: string | number;

  /** Font family override */
  fontFamily?: string;

  /** Letter spacing */
  letterSpacing?: string;

  /** Line height */
  lineHeight?: string | number;
}

/**
 * Complete design parameters interface
 * Combine all parameter types for comprehensive customization
 */
export interface SectionDesignParams
  extends
    SectionColorParams,
    SectionBorderParams,
    SectionSpacingParams,
    SectionAnimationParams,
    SectionShadowParams,
    SectionTypographyParams {
  /** Custom CSS variables (for advanced use cases) */
  customVars?: Record<string, string>;
}

/**
 * Preset design themes for common use cases
 */
export type SectionDesignPreset =
  | 'default'
  | 'compact'
  | 'spacious'
  | 'minimal'
  | 'bold'
  | 'glass'
  | 'outlined'
  | 'flat';

/**
 * Design configuration that can include a preset or custom parameters
 */
export interface SectionDesignConfig {
  /** Use a preset theme */
  preset?: SectionDesignPreset;

  /** Custom design parameters (override preset if both provided) */
  params?: SectionDesignParams;
}

/**
 * Preset configurations
 */
export const SECTION_DESIGN_PRESETS: Record<SectionDesignPreset, SectionDesignParams> = {
  default: {
    // Uses system defaults
  },

  compact: {
    itemPadding: '8px 10px',
    itemGap: '4px',
    elementGap: '2px',
    containerPadding: '8px',
    gridGap: '6px',
    gridRowGap: '4px',
    gridColumnGap: '6px',
    borderRadius: '6px',
    labelFontSize: '0.6rem',
    valueFontSize: '0.75rem',
  },

  spacious: {
    itemPadding: '16px 20px',
    itemGap: '16px',
    elementGap: '8px',
    containerPadding: '20px',
    gridGap: '20px',
    gridRowGap: '20px',
    gridColumnGap: '20px',
    borderRadius: '12px',
    labelFontSize: '0.75rem',
    valueFontSize: '1rem',
  },

  minimal: {
    itemBorderStyle: 'none',
    itemBoxShadow: 'none',
    itemBackground: 'transparent',
    borderRadius: '0',
  },

  bold: {
    itemBorderWidth: '2px',
    labelFontWeight: '700',
    valueFontWeight: '600',
    itemBoxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },

  glass: {
    itemBackground: 'rgba(255, 255, 255, 0.05)',
    itemBorderColor: 'rgba(255, 255, 255, 0.1)',
    itemBoxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    itemBackgroundHover: 'rgba(255, 255, 255, 0.08)',
  },

  outlined: {
    itemBackground: 'transparent',
    itemBorderWidth: '1px',
    itemBorderStyle: 'solid',
    itemBoxShadow: 'none',
    itemBackgroundHover: 'rgba(255, 121, 0, 0.05)',
  },

  flat: {
    itemBorderStyle: 'none',
    itemBoxShadow: 'none',
    itemBackground: 'var(--section-item-background, #f5f5f5)',
    borderRadius: '8px',
  },
};

/**
 * Type guard to check if meta contains design parameters
 */
export function hasSectionDesign(
  meta: Record<string, unknown> | undefined
): meta is { design: SectionDesignParams } {
  return meta !== undefined && 'design' in meta && typeof meta.design === 'object';
}

/**
 * Type guard to check if meta contains design config
 */
export function hasSectionDesignConfig(
  meta: Record<string, unknown> | undefined
): meta is { design: SectionDesignConfig } {
  return meta !== undefined && 'design' in meta && typeof meta.design === 'object';
}

/**
 * Extract design parameters from section meta
 */
export function getSectionDesignParams(
  meta: Record<string, unknown> | undefined
): SectionDesignParams | undefined {
  if (!hasSectionDesign(meta) && !hasSectionDesignConfig(meta)) {
    return undefined;
  }

  const design = meta.design as SectionDesignConfig | SectionDesignParams;

  // Check if it's a config with preset
  if ('preset' in design && design.preset) {
    const presetParams = SECTION_DESIGN_PRESETS[design.preset] || {};
    // Merge preset with custom params if provided
    return { ...presetParams, ...(design.params || {}) };
  }

  // Direct parameters or config with only params
  return 'params' in design ? design.params : (design as SectionDesignParams);
}
