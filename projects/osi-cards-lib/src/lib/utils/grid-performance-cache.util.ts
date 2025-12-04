/**
 * Grid Performance Cache Utility
 *
 * Provides intelligent caching for expensive grid calculations:
 * - Section analysis results
 * - Column calculations
 * - Gap detection results
 * - Layout metrics
 *
 * Uses LRU eviction strategy and content-based cache keys to maximize hit rate.
 */

import { CardSection } from '../models/card.model';
import { OptimizedSectionLayout } from './section-layout-intelligence.util';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  size: number; // Estimated memory size in bytes
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * Configuration for the performance cache
 */
export interface GridCacheConfig {
  /** Maximum cache size in entries */
  maxEntries?: number;
  /** Maximum memory size in bytes (approximate) */
  maxMemoryBytes?: number;
  /** Time-to-live for cache entries in milliseconds */
  ttl?: number;
  /** Enable detailed logging */
  debug?: boolean;
}

const DEFAULT_CONFIG: Required<GridCacheConfig> = {
  maxEntries: 100,
  maxMemoryBytes: 10 * 1024 * 1024, // 10 MB
  ttl: 60000, // 1 minute
  debug: false,
};

// ============================================================================
// GRID PERFORMANCE CACHE
// ============================================================================

/**
 * High-performance LRU cache for grid calculations
 */
export class GridPerformanceCache {
  private readonly config: Required<GridCacheConfig>;

  // Separate caches for different types of data
  private sectionAnalysisCache = new Map<string, CacheEntry<OptimizedSectionLayout>>();
  private columnCalculationCache = new Map<string, CacheEntry<number>>();
  private gapDetectionCache = new Map<string, CacheEntry<number>>();
  private layoutMetricsCache = new Map<string, CacheEntry<any>>();

  // Access order tracking for LRU
  private accessOrder: string[] = [];

  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    currentSize: 0,
  };

  constructor(config: GridCacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // SECTION ANALYSIS CACHING
  // ==========================================================================

  /**
   * Get cached section analysis result
   */
  getSectionAnalysis(
    section: CardSection,
    containerWidth: number,
    columns: number
  ): OptimizedSectionLayout | null {
    const key = this.createSectionKey(section, containerWidth, columns);
    return this.get(this.sectionAnalysisCache, key);
  }

  /**
   * Cache section analysis result
   */
  setSectionAnalysis(
    section: CardSection,
    containerWidth: number,
    columns: number,
    result: OptimizedSectionLayout
  ): void {
    const key = this.createSectionKey(section, containerWidth, columns);
    const size = this.estimateSize(result);
    this.set(this.sectionAnalysisCache, key, result, size);
  }

  /**
   * Create a stable key for section caching
   */
  private createSectionKey(section: CardSection, containerWidth: number, columns: number): string {
    const sectionHash = this.hashSection(section);
    return `section:${sectionHash}:${containerWidth}:${columns}`;
  }

  /**
   * Hash section properties for cache key
   */
  private hashSection(section: CardSection): string {
    const key = [
      section.type || 'unknown',
      section.title || '',
      section.colSpan || 1,
      section.items?.length || 0,
      (section.content as any)?.length || 0,
      section.imageUrl ? 'img' : 'no-img',
      section.layout || 'default',
    ].join(':');

    return this.simpleHash(key);
  }

  // ==========================================================================
  // COLUMN CALCULATION CACHING
  // ==========================================================================

  /**
   * Get cached column count
   */
  getColumnCount(containerWidth: number, minColumnWidth: number): number | null {
    const key = `columns:${containerWidth}:${minColumnWidth}`;
    return this.get(this.columnCalculationCache, key);
  }

  /**
   * Cache column count
   */
  setColumnCount(containerWidth: number, minColumnWidth: number, columns: number): void {
    const key = `columns:${containerWidth}:${minColumnWidth}`;
    this.set(this.columnCalculationCache, key, columns, 8); // Small size
  }

  // ==========================================================================
  // GAP DETECTION CACHING
  // ==========================================================================

  /**
   * Get cached gap count
   */
  getGapCount(layoutHash: string): number | null {
    const key = `gaps:${layoutHash}`;
    return this.get(this.gapDetectionCache, key);
  }

  /**
   * Cache gap count
   */
  setGapCount(layoutHash: string, gapCount: number): void {
    const key = `gaps:${layoutHash}`;
    this.set(this.gapDetectionCache, key, gapCount, 8);
  }

  /**
   * Create hash of layout for caching
   */
  createLayoutHash(sections: Array<{ key: string; top: number; column: number }>): string {
    const positions = sections
      .map((s) => `${s.key}:${s.top}:${s.column}`)
      .sort()
      .join('|');
    return this.simpleHash(positions);
  }

  // ==========================================================================
  // LAYOUT METRICS CACHING
  // ==========================================================================

  /**
   * Get cached layout metrics
   */
  getLayoutMetrics(layoutHash: string): any | null {
    const key = `metrics:${layoutHash}`;
    return this.get(this.layoutMetricsCache, key);
  }

  /**
   * Cache layout metrics
   */
  setLayoutMetrics(layoutHash: string, metrics: any): void {
    const key = `metrics:${layoutHash}`;
    const size = this.estimateSize(metrics);
    this.set(this.layoutMetricsCache, key, metrics, size);
  }

  // ==========================================================================
  // CORE CACHE OPERATIONS
  // ==========================================================================

  /**
   * Get value from cache with TTL checking
   */
  private get<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    const age = Date.now() - entry.timestamp;
    if (age > this.config.ttl) {
      cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.misses++;
      return null;
    }

    // Update access tracking
    this.stats.hits++;
    entry.hits++;
    this.updateAccessOrder(key);

    return entry.value;
  }

  /**
   * Set value in cache with LRU eviction
   */
  private set<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, size: number): void {
    // Check if we need to evict
    while (this.needsEviction(size)) {
      this.evictLRU();
    }

    // Add or update entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      hits: 0,
      size,
    };

    cache.set(key, entry);
    this.updateAccessOrder(key);
    this.stats.currentSize += size;

    if (this.config.debug) {
      console.log(`[GridCache] Set ${key}, size: ${size}b, total: ${this.stats.currentSize}b`);
    }
  }

  /**
   * Check if eviction is needed
   */
  private needsEviction(newSize: number): boolean {
    const totalEntries =
      this.sectionAnalysisCache.size +
      this.columnCalculationCache.size +
      this.gapDetectionCache.size +
      this.layoutMetricsCache.size;

    return (
      totalEntries >= this.config.maxEntries ||
      this.stats.currentSize + newSize > this.config.maxMemoryBytes
    );
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const keyToEvict = this.accessOrder.shift();
    if (!keyToEvict) return;

    // Find and remove from appropriate cache
    const caches = [
      this.sectionAnalysisCache,
      this.columnCalculationCache,
      this.gapDetectionCache,
      this.layoutMetricsCache,
    ];

    for (const cache of caches) {
      const entry = cache.get(keyToEvict);
      if (entry) {
        cache.delete(keyToEvict);
        this.stats.currentSize -= entry.size;
        this.stats.evictions++;

        if (this.config.debug) {
          console.log(`[GridCache] Evicted ${keyToEvict}, freed: ${entry.size}b`);
        }

        break;
      }
    }
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Estimate memory size of object
   */
  private estimateSize(obj: any): number {
    if (obj === null || obj === undefined) return 8;

    if (typeof obj === 'number') return 8;
    if (typeof obj === 'boolean') return 4;
    if (typeof obj === 'string') return obj.length * 2;

    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + this.estimateSize(item), 16);
    }

    if (typeof obj === 'object') {
      return Object.keys(obj).reduce(
        (sum, key) => sum + key.length * 2 + this.estimateSize(obj[key]),
        16
      );
    }

    return 16; // Default size
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.sectionAnalysisCache.clear();
    this.columnCalculationCache.clear();
    this.gapDetectionCache.clear();
    this.layoutMetricsCache.clear();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      currentSize: 0,
    };

    if (this.config.debug) {
      console.log('[GridCache] Cleared all caches');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.stats.currentSize,
      maxSize: this.config.maxMemoryBytes,
      hitRate,
    };
  }

  /**
   * Prune expired entries
   */
  pruneExpired(): void {
    const now = Date.now();
    const allCaches = [
      this.sectionAnalysisCache,
      this.columnCalculationCache,
      this.gapDetectionCache,
      this.layoutMetricsCache,
    ];

    for (const cache of allCaches) {
      for (const [key, entry] of cache.entries()) {
        const age = now - entry.timestamp;
        if (age > this.config.ttl) {
          cache.delete(key);
          this.removeFromAccessOrder(key);
          this.stats.currentSize -= entry.size;
        }
      }
    }

    if (this.config.debug) {
      console.log('[GridCache] Pruned expired entries');
    }
  }
}

/**
 * Global cache instance (singleton)
 */
let globalCache: GridPerformanceCache | null = null;

/**
 * Get or create global cache instance
 */
export function getGlobalGridCache(config?: GridCacheConfig): GridPerformanceCache {
  if (!globalCache) {
    globalCache = new GridPerformanceCache(config);
  }
  return globalCache;
}

/**
 * Reset global cache (useful for testing)
 */
export function resetGlobalGridCache(): void {
  globalCache = null;
}
