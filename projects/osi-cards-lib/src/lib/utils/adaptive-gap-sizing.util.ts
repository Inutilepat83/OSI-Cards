/**
 * Adaptive Gap Sizing Utility
 *
 * Dynamically adjusts grid gaps based on:
 * - Screen size / viewport width
 * - Device type (mobile, tablet, desktop)
 * - Content density
 * - User preferences
 *
 * Provides smooth transitions between gap sizes and maintains visual consistency.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Gap sizing strategy
 */
export type GapSizingStrategy = 'fixed' | 'responsive' | 'adaptive' | 'dynamic';

/**
 * Device category for gap sizing
 */
export type DeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Configuration for adaptive gap sizing
 */
export interface AdaptiveGapConfig {
  /** Base gap size for desktop */
  baseGap?: number;
  /** Sizing strategy */
  strategy?: GapSizingStrategy;
  /** Minimum gap size */
  minGap?: number;
  /** Maximum gap size */
  maxGap?: number;
  /** Custom breakpoint overrides */
  breakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  /** Content density factor (0-1, higher = more dense) */
  contentDensity?: number;
  /** Enable smooth interpolation between sizes */
  smoothTransition?: boolean;
}

/**
 * Gap size result with metadata
 */
export interface GapSizeResult {
  /** Calculated gap size in pixels */
  gap: number;
  /** Device category used */
  device: DeviceCategory;
  /** Strategy applied */
  strategy: GapSizingStrategy;
  /** Explanation for debugging */
  reason: string;
}

const DEFAULT_CONFIG: Required<AdaptiveGapConfig> = {
  baseGap: 12,
  strategy: 'adaptive',
  minGap: 4,
  maxGap: 24,
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1440,
    wide: 1920,
  },
  contentDensity: 0.5,
  smoothTransition: true,
};

// Recommended gap sizes per device category (based on UI/UX best practices)
const RECOMMENDED_GAPS: Record<DeviceCategory, number> = {
  mobile: 8,    // Smaller screens need tighter spacing
  tablet: 12,   // Balanced spacing
  desktop: 16,  // Comfortable spacing
  wide: 20,     // Generous spacing for large displays
};

// ============================================================================
// ADAPTIVE GAP CALCULATOR
// ============================================================================

/**
 * Calculate adaptive gap size based on container width and configuration
 */
export function calculateAdaptiveGap(
  containerWidth: number,
  config: AdaptiveGapConfig = {}
): GapSizeResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Determine device category
  const device = getDeviceCategory(containerWidth, cfg.breakpoints);

  // Calculate based on strategy
  let gap: number;
  let reason: string;

  switch (cfg.strategy) {
    case 'fixed':
      gap = cfg.baseGap;
      reason = 'Fixed gap size';
      break;

    case 'responsive':
      gap = getResponsiveGap(device);
      reason = `Responsive gap for ${device}`;
      break;

    case 'adaptive':
      gap = getAdaptiveGap(containerWidth, device, cfg);
      reason = `Adaptive gap based on ${device} and content density`;
      break;

    case 'dynamic':
      gap = getDynamicGap(containerWidth, cfg);
      reason = 'Dynamic gap with smooth interpolation';
      break;

    default:
      gap = cfg.baseGap;
      reason = 'Default gap size';
  }

  // Apply constraints
  gap = Math.max(cfg.minGap, Math.min(cfg.maxGap, gap));

  return {
    gap: Math.round(gap),
    device,
    strategy: cfg.strategy,
    reason,
  };
}

/**
 * Get device category from container width
 */
function getDeviceCategory(
  width: number,
  breakpoints: Required<AdaptiveGapConfig>['breakpoints']
): DeviceCategory {
  const mobile = breakpoints?.mobile ?? 640;
  const tablet = breakpoints?.tablet ?? 1024;
  const desktop = breakpoints?.desktop ?? 1440;

  if (width < mobile) {
    return 'mobile';
  } else if (width < tablet) {
    return 'tablet';
  } else if (width < desktop) {
    return 'desktop';
  } else {
    return 'wide';
  }
}

/**
 * Get responsive gap (stepped by breakpoint)
 */
function getResponsiveGap(device: DeviceCategory): number {
  return RECOMMENDED_GAPS[device];
}

/**
 * Get adaptive gap (considers content density)
 */
function getAdaptiveGap(
  containerWidth: number,
  device: DeviceCategory,
  config: Required<AdaptiveGapConfig>
): number {
  const baseGap = RECOMMENDED_GAPS[device];

  // Adjust for content density
  // Higher density = smaller gaps
  const densityFactor = 1 - (config.contentDensity * 0.4); // Max 40% reduction
  let gap = baseGap * densityFactor;

  // Fine-tune based on exact width within device category
  if (config.smoothTransition) {
    gap = interpolateGap(containerWidth, config.breakpoints, gap);
  }

  return gap;
}

/**
 * Get dynamic gap with smooth interpolation
 */
function getDynamicGap(
  containerWidth: number,
  config: Required<AdaptiveGapConfig>
): number {
  const { breakpoints, minGap, maxGap } = config;

  // Linear interpolation between min and max
  const minWidth = 320; // Minimum supported width
  const maxWidth = breakpoints?.wide ?? 1920;

  const ratio = (containerWidth - minWidth) / (maxWidth - minWidth);
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  return minGap + (maxGap - minGap) * clampedRatio;
}

/**
 * Interpolate gap size for smooth transitions
 */
function interpolateGap(
  containerWidth: number,
  breakpoints: Required<AdaptiveGapConfig>['breakpoints'],
  baseGap: number
): number {
  // Apply smooth curve around breakpoints
  const mobile = breakpoints?.mobile ?? 640;
  const tablet = breakpoints?.tablet ?? 1024;
  const desktop = breakpoints?.desktop ?? 1440;

  if (containerWidth < mobile) {
    // Below mobile: reduce gap slightly
    return baseGap * 0.9;
  } else if (containerWidth < mobile + 100) {
    // Near mobile breakpoint: smooth transition
    const progress = (containerWidth - mobile) / 100;
    return baseGap * (0.9 + 0.1 * progress);
  } else if (containerWidth < tablet - 100) {
    // Stable tablet range
    return baseGap;
  } else if (containerWidth < tablet + 100) {
    // Near tablet breakpoint: smooth transition
    const progress = (containerWidth - (tablet - 100)) / 200;
    return baseGap * (1 + 0.1 * progress);
  } else if (containerWidth < desktop - 100) {
    // Stable desktop range
    return baseGap * 1.1;
  } else {
    // Wide screens: generous gaps
    return baseGap * 1.2;
  }
}

// ============================================================================
// GAP OPTIMIZER
// ============================================================================

/**
 * Optimize gap size for a specific layout
 */
export interface GapOptimizationInput {
  containerWidth: number;
  sectionCount: number;
  columns: number;
  averageSectionHeight: number;
  hasMixedContent: boolean;
}

/**
 * Optimize gap based on layout characteristics
 */
export function optimizeGapForLayout(
  input: GapOptimizationInput,
  config: AdaptiveGapConfig = {}
): GapSizeResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Calculate base adaptive gap
  const baseResult = calculateAdaptiveGap(input.containerWidth, cfg);
  let gap = baseResult.gap;
  let reason = baseResult.reason;

  // Adjust for section density
  const sectionsPerColumn = input.sectionCount / input.columns;

  if (sectionsPerColumn > 8) {
    // Many sections: reduce gap to fit more content
    gap = Math.max(cfg.minGap, gap * 0.85);
    reason += '; Reduced for high section density';
  } else if (sectionsPerColumn < 3) {
    // Few sections: increase gap for better visual separation
    gap = Math.min(cfg.maxGap, gap * 1.15);
    reason += '; Increased for low section density';
  }

  // Adjust for mixed content
  if (input.hasMixedContent) {
    // Mixed content benefits from clearer separation
    gap = Math.min(cfg.maxGap, gap * 1.1);
    reason += '; Increased for mixed content';
  }

  // Adjust for section height
  if (input.averageSectionHeight < 150) {
    // Short sections: smaller gaps look better
    gap = Math.max(cfg.minGap, gap * 0.9);
    reason += '; Reduced for short sections';
  } else if (input.averageSectionHeight > 400) {
    // Tall sections: larger gaps help visual grouping
    gap = Math.min(cfg.maxGap, gap * 1.1);
    reason += '; Increased for tall sections';
  }

  return {
    gap: Math.round(gap),
    device: baseResult.device,
    strategy: cfg.strategy,
    reason,
  };
}

// ============================================================================
// GAP PRESETS
// ============================================================================

/**
 * Predefined gap configurations for common use cases
 */
export const GapPresets: Record<string, AdaptiveGapConfig> = {
  /** Compact layout with minimal gaps */
  compact: {
    baseGap: 8,
    strategy: 'adaptive',
    minGap: 4,
    maxGap: 12,
    contentDensity: 0.8,
    smoothTransition: true,
  },

  /** Standard balanced layout */
  standard: {
    baseGap: 12,
    strategy: 'adaptive',
    minGap: 8,
    maxGap: 16,
    contentDensity: 0.5,
    smoothTransition: true,
  },

  /** Spacious layout with generous gaps */
  spacious: {
    baseGap: 16,
    strategy: 'adaptive',
    minGap: 12,
    maxGap: 24,
    contentDensity: 0.3,
    smoothTransition: true,
  },

  /** Fixed gap for consistent spacing */
  fixed: {
    baseGap: 12,
    strategy: 'fixed',
    minGap: 12,
    maxGap: 12,
    contentDensity: 0.5,
    smoothTransition: false,
  },

  /** Mobile-optimized gaps */
  mobileFirst: {
    baseGap: 8,
    strategy: 'responsive',
    minGap: 4,
    maxGap: 16,
    contentDensity: 0.6,
    smoothTransition: true,
  },

  /** Desktop-optimized gaps */
  desktopFirst: {
    baseGap: 16,
    strategy: 'responsive',
    minGap: 8,
    maxGap: 24,
    contentDensity: 0.4,
    smoothTransition: true,
  },
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculate gap transition duration for animations
 */
export function calculateGapTransitionDuration(
  oldGap: number,
  newGap: number
): number {
  const diff = Math.abs(newGap - oldGap);

  // Longer transitions for larger changes
  if (diff < 2) return 0; // No animation for tiny changes
  if (diff < 4) return 150;
  if (diff < 8) return 200;
  return 300;
}

/**
 * Check if gap change is significant enough to trigger re-layout
 */
export function isSignificantGapChange(oldGap: number, newGap: number): boolean {
  const diff = Math.abs(newGap - oldGap);
  return diff >= 2; // Re-layout if difference is 2px or more
}

/**
 * Batch calculate gaps for multiple widths (useful for precomputing)
 */
export function batchCalculateGaps(
  widths: number[],
  config: AdaptiveGapConfig = {}
): Map<number, GapSizeResult> {
  const results = new Map<number, GapSizeResult>();

  for (const width of widths) {
    results.set(width, calculateAdaptiveGap(width, config));
  }

  return results;
}

