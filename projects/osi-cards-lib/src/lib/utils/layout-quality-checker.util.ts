/**
 * Layout Quality Checker
 *
 * Validates and scores layout quality based on utilization, gap count, and height variance.
 * Provides recommendations for improving layout quality.
 */

import { CardSection } from '../models/card.model';

export interface LayoutQualityResult {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  metrics: {
    utilization: number;
    gapCount: number;
    gapArea: number;
    heightVariance: number;
    sectionCount: number;
  };
}

export interface LayoutMetrics {
  utilization: number;
  gapCount: number;
  gapArea?: number;
  heightVariance?: number;
  totalHeight?: number;
  sectionCount?: number;
}

/**
 * Validates layout quality and provides recommendations
 *
 * @param metrics - Layout metrics from packing algorithm
 * @param sections - Optional sections array for context
 * @returns Quality assessment with recommendations
 */
export function validateLayoutQuality(
  metrics: LayoutMetrics,
  sections?: CardSection[]
): LayoutQualityResult {
  const sectionCount = sections?.length ?? metrics.sectionCount ?? 0;
  const utilization = metrics.utilization;
  const gapCount = metrics.gapCount;
  const gapArea = metrics.gapArea ?? 0;
  const heightVariance = metrics.heightVariance ?? 0;

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check utilization
  if (utilization < 70) {
    issues.push(`Low space utilization: ${utilization.toFixed(1)}%`);
    recommendations.push('Enable section expansion (canGrow: true)');
    recommendations.push('Consider using row-based packing algorithm');
    recommendations.push('Check if sections have appropriate column spans');
  } else if (utilization < 80) {
    issues.push(`Moderate space utilization: ${utilization.toFixed(1)}%`);
    recommendations.push('Enable gap-aware placement');
    recommendations.push('Consider increasing optimization passes');
  }

  // Check gaps
  const gapPercentage = sectionCount > 0 ? (gapCount / sectionCount) * 100 : 0;
  if (gapCount > sectionCount * 0.3) {
    issues.push(
      `Too many gaps: ${gapCount} gaps for ${sectionCount} sections (${gapPercentage.toFixed(1)}%)`
    );
    recommendations.push('Enable gap-aware placement');
    recommendations.push('Increase optimization passes');
    recommendations.push('Consider using Skyline algorithm for better compaction');
  } else if (gapCount > sectionCount * 0.1) {
    issues.push(`Some gaps detected: ${gapCount} gaps (${gapPercentage.toFixed(1)}%)`);
    recommendations.push('Enable gap-aware placement');
    recommendations.push('Try post-processing gap filling');
  }

  // Check height variance
  if (heightVariance > 200) {
    issues.push(`High height variance: ${heightVariance.toFixed(0)}px`);
    recommendations.push('Consider sorting sections by height (sortByHeight: true)');
    recommendations.push('Group similar-height sections together');
  } else if (heightVariance > 100) {
    issues.push(`Moderate height variance: ${heightVariance.toFixed(0)}px`);
    recommendations.push('Consider enabling height-based sorting');
  }

  // Check gap area
  if (gapArea > 10000) {
    issues.push(`Large gap area: ${gapArea.toFixed(0)}px²`);
    recommendations.push('Enable aggressive gap filling');
    recommendations.push('Consider section expansion to fill gaps');
  }

  // Calculate quality score (0-100)
  let score = 100;

  // Utilization penalty (max -30 points)
  if (utilization < 70) {
    score -= 30;
  } else if (utilization < 80) {
    score -= 15;
  } else if (utilization < 85) {
    score -= 5;
  }

  // Gap count penalty (max -30 points)
  if (gapCount > sectionCount * 0.3) {
    score -= 30;
  } else if (gapCount > sectionCount * 0.1) {
    score -= 15;
  } else if (gapCount > 0) {
    score -= 5;
  }

  // Height variance penalty (max -20 points)
  if (heightVariance > 200) {
    score -= 20;
  } else if (heightVariance > 100) {
    score -= 10;
  } else if (heightVariance > 50) {
    score -= 5;
  }

  // Gap area penalty (max -20 points)
  if (gapArea > 10000) {
    score -= 20;
  } else if (gapArea > 5000) {
    score -= 10;
  } else if (gapArea > 1000) {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  // Determine quality level
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 90 && utilization >= 85 && gapCount === 0) {
    quality = 'excellent';
  } else if (score >= 75 && utilization >= 75 && gapCount <= 2) {
    quality = 'good';
  } else if (score >= 60) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }

  return {
    quality,
    score,
    issues,
    recommendations,
    metrics: {
      utilization,
      gapCount,
      gapArea,
      heightVariance,
      sectionCount,
    },
  };
}

/**
 * Checks if layout quality meets minimum thresholds
 *
 * @param metrics - Layout metrics
 * @param strictness - How strict the validation should be
 * @returns Whether layout quality is acceptable
 */
export function isLayoutQualityAcceptable(
  metrics: LayoutMetrics,
  strictness: 'normal' | 'strict' | 'lenient' = 'normal'
): boolean {
  const result = validateLayoutQuality(metrics);

  switch (strictness) {
    case 'strict':
      return result.quality === 'excellent' || result.quality === 'good';
    case 'lenient':
      return result.quality !== 'poor';
    case 'normal':
    default:
      return (
        result.quality === 'excellent' || result.quality === 'good' || result.quality === 'fair'
      );
  }
}

/**
 * Gets a summary message for layout quality
 */
export function getLayoutQualitySummary(result: LayoutQualityResult): string {
  const { quality, score } = result;
  const { utilization, gapCount } = result.metrics;

  let summary = `Layout Quality: ${quality.toUpperCase()} (Score: ${score}/100)\n`;
  summary += `- Utilization: ${utilization.toFixed(1)}%\n`;
  summary += `- Gaps: ${gapCount}\n`;

  if (result.issues.length > 0) {
    summary += `\nIssues:\n${result.issues.map((i) => `  - ${i}`).join('\n')}\n`;
  }

  if (result.recommendations.length > 0) {
    summary += `\nRecommendations:\n${result.recommendations.map((r) => `  - ${r}`).join('\n')}`;
  }

  return summary;
}
