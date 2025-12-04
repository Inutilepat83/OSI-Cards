/**
 * Build Optimization Utilities
 *
 * Utilities for analyzing and optimizing build output.
 *
 * @example
 * ```typescript
 * import { analyzeBundle, getChunkInfo } from '@osi-cards/utils';
 *
 * const analysis = analyzeBundle(stats);
 * const chunks = getChunkInfo(stats);
 * ```
 */

export interface BundleAnalysis {
  totalSize: number;
  gzipSize: number;
  chunks: ChunkInfo[];
  modules: ModuleInfo[];
  warnings: string[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
}

export interface ModuleInfo {
  name: string;
  size: number;
  chunks: string[];
}

/**
 * Analyze bundle size
 */
export function analyzeBundleSize(stats: any): BundleAnalysis {
  return {
    totalSize: stats.assets?.reduce((sum: number, asset: any) => sum + asset.size, 0) || 0,
    gzipSize: 0,
    chunks: [],
    modules: [],
    warnings: [],
  };
}

/**
 * Get largest modules
 */
export function getLargestModules(stats: any, count = 10): ModuleInfo[] {
  const modules = stats.modules || [];
  return modules
    .sort((a: any, b: any) => b.size - a.size)
    .slice(0, count)
    .map((m: any) => ({
      name: m.name,
      size: m.size,
      chunks: m.chunks || [],
    }));
}

/**
 * Detect duplicate modules
 */
export function detectDuplicates(stats: any): string[] {
  const modules = stats.modules || [];
  const names = modules.map((m: any) => m.name);
  const duplicates = names.filter((name: string, index: number) => names.indexOf(name) !== index);
  return Array.from(new Set(duplicates));
}

/**
 * Calculate tree-shaking efficiency
 */
export function calculateTreeShakingEfficiency(originalSize: number, shakdenSize: number): number {
  return ((originalSize - shakdenSize) / originalSize) * 100;
}

/**
 * Get bundle recommendations
 */
export function getBundleRecommendations(analysis: BundleAnalysis): string[] {
  const recommendations: string[] = [];

  if (analysis.totalSize > 1000000) {
    recommendations.push('Consider code splitting for large bundles');
  }

  if (analysis.warnings.length > 0) {
    recommendations.push('Address build warnings');
  }

  return recommendations;
}
