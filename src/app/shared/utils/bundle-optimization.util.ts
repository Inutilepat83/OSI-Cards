/**
 * Bundle optimization utilities
 * Helpers for analyzing and optimizing bundle size
 */

export interface BundleInfo {
  name: string;
  size: number;
  gzippedSize?: number;
  dependencies: string[];
}

/**
 * Estimate gzipped size (rough approximation)
 */
export function estimateGzippedSize(originalSize: number): number {
  // Rough estimate: gzip typically achieves 70% compression for text
  return Math.round(originalSize * 0.3);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if bundle size exceeds threshold
 */
export function exceedsSizeThreshold(size: number, threshold: number): boolean {
  return size > threshold;
}

/**
 * Get bundle size warning message
 */
export function getSizeWarning(size: number, threshold: number): string | null {
  if (exceedsSizeThreshold(size, threshold)) {
    const overage = size - threshold;
    return `Bundle size (${formatFileSize(size)}) exceeds threshold (${formatFileSize(threshold)}) by ${formatFileSize(overage)}`;
  }
  return null;
}


