/**
 * Layout Configuration Presets
 *
 * Pre-configured settings optimized for different use cases:
 * - performance: Fast rendering, minimal optimization
 * - quality: Maximum space utilization, best layout quality
 * - balanced: Good balance between performance and quality (default)
 * - custom: User-defined configuration
 */

import { ColumnPackerConfig } from '@osi-cards/utils';

export type LayoutPreset = 'performance' | 'quality' | 'balanced' | 'custom';

export interface LayoutPresetConfig {
  /** Optimization level */
  optimizeLayout: boolean;
  /** Enable two-phase layout (estimate → measure → refine) */
  enableTwoPhaseLayout: boolean;
  /** Number of optimization passes */
  optimizationPasses: number;
  /** Enable gap-aware placement */
  enableGapAwarePlacement: boolean;
  /** Enable gap filling post-processing */
  enableGapFilling: boolean;
  /** Packing algorithm mode */
  packingMode: 'ffdh' | 'skyline' | 'hybrid';
  /** Allow section reordering for better packing */
  allowReordering: boolean;
  /** Sort sections by height before packing */
  sortByHeight: boolean;
  /** Enable virtual scrolling for large datasets */
  enableVirtualScroll: boolean;
  /** Virtual scroll threshold (number of sections) */
  virtualThreshold: number;
}

/**
 * Performance preset: Fast rendering, minimal optimization
 * Best for: Large datasets, real-time updates, mobile devices
 */
export const PERFORMANCE_PRESET = {
  optimizeLayout: false,
  enableTwoPhaseLayout: false,
  optimizationPasses: 1,
  enableGapAwarePlacement: false,
  enableGapFilling: false,
  packingMode: 'ffdh' as const,
  allowReordering: false,
  sortByHeight: false,
  enableVirtualScroll: true,
  virtualThreshold: 20,
} as const satisfies LayoutPresetConfig;

/**
 * Quality preset: Maximum space utilization, best layout quality
 * Best for: Static content, print layouts, presentations
 */
export const QUALITY_PRESET = {
  optimizeLayout: true,
  enableTwoPhaseLayout: true,
  optimizationPasses: 5,
  enableGapAwarePlacement: true,
  enableGapFilling: true,
  packingMode: 'hybrid' as const,
  allowReordering: true,
  sortByHeight: true,
  enableVirtualScroll: false,
  virtualThreshold: 100,
} as const satisfies LayoutPresetConfig;

/**
 * Balanced preset: Good balance between performance and quality
 * Best for: Most use cases (default)
 */
export const BALANCED_PRESET = {
  optimizeLayout: true,
  enableTwoPhaseLayout: true,
  optimizationPasses: 2,
  enableGapAwarePlacement: true,
  enableGapFilling: true,
  packingMode: 'ffdh' as const,
  allowReordering: false,
  sortByHeight: true,
  enableVirtualScroll: false,
  virtualThreshold: 50,
} as const satisfies LayoutPresetConfig;

/**
 * Get preset configuration by name
 */
export function getPresetConfig(preset: LayoutPreset): LayoutPresetConfig {
  switch (preset) {
    case 'performance':
      return { ...PERFORMANCE_PRESET };
    case 'quality':
      return { ...QUALITY_PRESET };
    case 'balanced':
      return { ...BALANCED_PRESET };
    case 'custom':
      return { ...BALANCED_PRESET }; // Default to balanced for custom
    default:
      return { ...BALANCED_PRESET };
  }
}

/**
 * Convert preset config to ColumnPackerConfig
 */
export function presetToColumnPackerConfig(
  preset: LayoutPresetConfig,
  baseConfig: Partial<ColumnPackerConfig & { minColumnWidth?: number }> = {}
): ColumnPackerConfig {
  return {
    columns: baseConfig.columns ?? 4,
    gap: baseConfig.gap ?? 12,
    containerWidth: baseConfig.containerWidth ?? 0,
    packingMode: preset.packingMode,
    allowReordering: preset.allowReordering,
    sortByHeight: preset.sortByHeight,
    optimizationPasses: preset.optimizationPasses,
    enableGapAwarePlacement: preset.enableGapAwarePlacement,
    ...baseConfig,
  };
}

/**
 * Merge preset with custom overrides
 */
export function mergePresetWithOverrides(
  preset: LayoutPresetConfig,
  overrides: Partial<LayoutPresetConfig>
): LayoutPresetConfig {
  return {
    ...preset,
    ...overrides,
  };
}
