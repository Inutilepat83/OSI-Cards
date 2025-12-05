/**
 * Height Estimation Utility
 * Stub for backward compatibility
 */

export interface HeightEstimationContext {
  containerWidth?: number;
  columns?: number;
  [key: string]: any;
}

export class HeightEstimator {
  estimate(section: any, context?: HeightEstimationContext): number {
    return 200; // Default height
  }

  static generateContentHash(section: any): string {
    return JSON.stringify(section).substring(0, 32);
  }
}

export function recordHeightMeasurement(
  sectionType: string,
  estimated: number,
  actual?: number,
  hash?: string
): void {
  // Stub - implement height recording if needed
}

export function estimateSectionHeight(section: any, context?: HeightEstimationContext): number {
  return 200; // Default height estimate
}
