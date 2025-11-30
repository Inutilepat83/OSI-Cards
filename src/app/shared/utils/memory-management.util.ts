/**
 * Memory management utilities
 * Implements proper memory management, especially for large card datasets
 */

/**
 * Clear object references to help garbage collection
 */
export function clearObjectReferences<T>(obj: T): void {
  if (obj === null || obj === undefined) {
    return;
  }

  if (Array.isArray(obj)) {
    obj.length = 0;
  } else if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        delete (obj as any)[key];
      }
    }
  }
}

/**
 * Create a memory-efficient array chunker
 */
export function createChunkedArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Process array in chunks to avoid memory issues
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (chunk: T[]) => Promise<R[]>,
  chunkSize = 100
): Promise<R[]> {
  const chunks = createChunkedArray(items, chunkSize);
  const results: R[] = [];

  for (const chunk of chunks) {
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
    
    // Allow garbage collection between chunks
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
  }
  return null;
}

/**
 * Check if memory usage is high
 */
export function isMemoryUsageHigh(threshold = 80): boolean {
  const usage = getMemoryUsage();
  if (!usage) {
    return false;
  }
  return usage.percentage > threshold;
}

/**
 * Force garbage collection (if available in development)
 */
export function forceGarbageCollection(): void {
  if ('gc' in window && typeof (window as any).gc === 'function') {
    (window as any).gc();
  }
}


