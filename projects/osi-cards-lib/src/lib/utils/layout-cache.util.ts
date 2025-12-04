/**
 * Layout Cache Utilities
 *
 * High-performance caching for layout calculations using WeakMap
 * and dirty-checking. Prevents redundant recalculations when
 * section configurations haven't changed.
 *
 * @example
 * ```typescript
 * import { LayoutCache } from 'osi-cards-lib';
 *
 * const cache = new LayoutCache();
 * const layout = cache.getOrCompute(sections, columns, () => computeLayout(...));
 * ```
 */

import { CardSection, AICardConfig } from '../models/card.model';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Cached layout result for a section
 */
export interface CachedSectionLayout {
  /** Section identifier (id or generated key) */
  key: string;
  /** Calculated column span */
  colSpan: number;
  /** Estimated height in pixels */
  estimatedHeight: number;
  /** Actual measured height (if available) */
  measuredHeight?: number;
  /** Left position CSS expression */
  left: string;
  /** Top position in pixels */
  top: number;
  /** Width CSS expression */
  width: string;
  /** Content hash for dirty checking */
  contentHash: number;
  /** Timestamp of cache entry */
  timestamp: number;
}

/**
 * Cached layout result for entire card
 */
export interface CachedCardLayout {
  /** Positioned sections */
  sections: CachedSectionLayout[];
  /** Total container height */
  containerHeight: number;
  /** Number of columns used */
  columns: number;
  /** Container width used for calculation */
  containerWidth: number;
  /** Content hash of entire card */
  cardHash: number;
  /** Timestamp of cache entry */
  timestamp: number;
  /** Cache hit count */
  hitCount: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Total entries in cache */
  entries: number;
  /** Memory usage estimate in bytes */
  memoryEstimate: number;
  /** Average computation time saved (ms) */
  avgTimeSaved: number;
}

/**
 * Dirty check result for a section
 */
export interface DirtyCheckResult {
  /** Whether the section is dirty (needs recalculation) */
  isDirty: boolean;
  /** What changed (if dirty) */
  changes: ('content' | 'structure' | 'dimensions' | 'position')[];
  /** Previous hash (if available) */
  previousHash?: number;
  /** Current hash */
  currentHash: number;
}

// ============================================================================
// HASH UTILITIES
// ============================================================================

/**
 * FNV-1a hash implementation for fast string hashing
 */
function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

/**
 * Computes a content hash for a section
 * Changes in any content will produce a different hash
 */
export function computeSectionHash(section: CardSection): number {
  const parts = [
    section.id ?? '',
    section.title ?? '',
    section.type ?? '',
    section.description ?? '',
    String(section.colSpan ?? ''),
    String(section.preferredColumns ?? ''),
    String(section.fields?.length ?? 0),
    String(section.items?.length ?? 0),
  ];

  // Include field content in hash
  if (section.fields) {
    for (const field of section.fields) {
      parts.push(field.label ?? '');
      parts.push(String(field.value ?? ''));
    }
  }

  // Include item content in hash
  if (section.items) {
    for (const item of section.items) {
      parts.push(item.title ?? '');
      parts.push(item.description ?? '');
    }
  }

  return fnv1aHash(parts.join('|'));
}

/**
 * Computes a content hash for entire card
 */
export function computeCardHash(card: AICardConfig): number {
  const parts = [card.cardTitle ?? '', card.cardType ?? '', String(card.sections?.length ?? 0)];

  if (card.sections) {
    for (const section of card.sections) {
      parts.push(String(computeSectionHash(section)));
    }
  }

  return fnv1aHash(parts.join('|'));
}

/**
 * Computes a quick structural hash (for detecting section add/remove)
 */
export function computeStructureHash(sections: CardSection[]): number {
  const ids = sections.map((s) => s.id ?? s.title ?? 'unknown');
  return fnv1aHash(ids.join(','));
}

// ============================================================================
// LAYOUT CACHE CLASS
// ============================================================================

/**
 * High-performance layout cache using WeakMap for automatic cleanup
 */
export class LayoutCache {
  /** Section-level cache (keyed by section object) */
  private sectionCache = new WeakMap<CardSection, CachedSectionLayout>();

  /** Card-level cache (keyed by card object) */
  private cardCache = new WeakMap<AICardConfig, CachedCardLayout>();

  /** Hash-based backup cache for when WeakMap misses */
  private hashCache = new Map<number, CachedSectionLayout>();

  /** Statistics tracking */
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    memoryEstimate: 0,
    avgTimeSaved: 0,
  };

  /** Maximum entries in hash cache */
  private readonly maxHashCacheSize: number;

  /** Cache entry TTL in milliseconds */
  private readonly ttl: number;

  /** Computation time tracking */
  private computationTimes: number[] = [];

  constructor(options?: { maxHashCacheSize?: number; ttlMs?: number }) {
    this.maxHashCacheSize = options?.maxHashCacheSize ?? 500;
    this.ttl = options?.ttlMs ?? 60000; // 1 minute default
  }

  /**
   * Gets cached section layout or computes it
   */
  getSectionLayout(
    section: CardSection,
    compute: () => Omit<CachedSectionLayout, 'contentHash' | 'timestamp'>
  ): CachedSectionLayout {
    const currentHash = computeSectionHash(section);

    // Try WeakMap cache first
    const cached = this.sectionCache.get(section);
    if (cached && cached.contentHash === currentHash && !this.isExpired(cached.timestamp)) {
      this.stats.hits++;
      return cached;
    }

    // Try hash-based cache
    const hashCached = this.hashCache.get(currentHash);
    if (hashCached && !this.isExpired(hashCached.timestamp)) {
      // Move to WeakMap for faster future access
      this.sectionCache.set(section, hashCached);
      this.stats.hits++;
      return hashCached;
    }

    // Cache miss - compute
    this.stats.misses++;
    const startTime = performance.now();
    const computed = compute();
    const computeTime = performance.now() - startTime;
    this.trackComputationTime(computeTime);

    const entry: CachedSectionLayout = {
      ...computed,
      contentHash: currentHash,
      timestamp: Date.now(),
    };

    // Store in both caches
    this.sectionCache.set(section, entry);
    this.setHashCache(currentHash, entry);
    this.stats.entries++;

    return entry;
  }

  /**
   * Gets cached card layout or computes it
   */
  getCardLayout(
    card: AICardConfig,
    columns: number,
    containerWidth: number,
    compute: () => Omit<CachedCardLayout, 'cardHash' | 'timestamp' | 'hitCount'>
  ): CachedCardLayout {
    const currentHash = computeCardHash(card);

    // Try WeakMap cache
    const cached = this.cardCache.get(card);
    if (
      cached &&
      cached.cardHash === currentHash &&
      cached.columns === columns &&
      Math.abs(cached.containerWidth - containerWidth) < 4 &&
      !this.isExpired(cached.timestamp)
    ) {
      cached.hitCount++;
      this.stats.hits++;
      return cached;
    }

    // Cache miss - compute
    this.stats.misses++;
    const startTime = performance.now();
    const computed = compute();
    const computeTime = performance.now() - startTime;
    this.trackComputationTime(computeTime);

    const entry: CachedCardLayout = {
      ...computed,
      cardHash: currentHash,
      timestamp: Date.now(),
      hitCount: 1,
    };

    this.cardCache.set(card, entry);
    this.stats.entries++;

    return entry;
  }

  /**
   * Performs dirty check on a section
   */
  isDirty(section: CardSection): DirtyCheckResult {
    const currentHash = computeSectionHash(section);
    const cached = this.sectionCache.get(section);

    if (!cached) {
      return {
        isDirty: true,
        changes: ['content', 'structure'],
        currentHash,
      };
    }

    if (cached.contentHash === currentHash) {
      return {
        isDirty: false,
        changes: [],
        previousHash: cached.contentHash,
        currentHash,
      };
    }

    // Determine what changed
    const changes: ('content' | 'structure' | 'dimensions' | 'position')[] = [];

    // Check structural changes (id, type, title)
    const structureHash = fnv1aHash(`${section.id}|${section.type}|${section.title}`);
    const cachedStructureHash = fnv1aHash(`${cached.key}|${section.type}|${section.title}`);
    if (structureHash !== cachedStructureHash) {
      changes.push('structure');
    }

    // Content always changed if hash differs
    changes.push('content');

    return {
      isDirty: true,
      changes,
      previousHash: cached.contentHash,
      currentHash,
    };
  }

  /**
   * Batch dirty check for multiple sections
   */
  batchDirtyCheck(sections: CardSection[]): {
    dirty: CardSection[];
    clean: CardSection[];
    structureChanged: boolean;
  } {
    const dirty: CardSection[] = [];
    const clean: CardSection[] = [];
    let structureChanged = false;

    for (const section of sections) {
      const result = this.isDirty(section);
      if (result.isDirty) {
        dirty.push(section);
        if (result.changes.includes('structure')) {
          structureChanged = true;
        }
      } else {
        clean.push(section);
      }
    }

    return { dirty, clean, structureChanged };
  }

  /**
   * Updates measured height for a cached section
   */
  updateMeasuredHeight(section: CardSection, measuredHeight: number): void {
    const cached = this.sectionCache.get(section);
    if (cached) {
      cached.measuredHeight = measuredHeight;
      cached.timestamp = Date.now(); // Refresh TTL
    }
  }

  /**
   * Invalidates cache for a section
   */
  invalidateSection(section: CardSection): void {
    this.sectionCache.delete(section);
    const hash = computeSectionHash(section);
    this.hashCache.delete(hash);
  }

  /**
   * Invalidates cache for a card
   */
  invalidateCard(card: AICardConfig): void {
    this.cardCache.delete(card);
    if (card.sections) {
      for (const section of card.sections) {
        this.invalidateSection(section);
      }
    }
  }

  /**
   * Clears all caches
   */
  clear(): void {
    this.sectionCache = new WeakMap();
    this.cardCache = new WeakMap();
    this.hashCache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      memoryEstimate: 0,
      avgTimeSaved: 0,
    };
    this.computationTimes = [];
  }

  /**
   * Gets cache statistics
   */
  getStats(): CacheStats {
    // Estimate memory usage
    const entrySize = 200; // Rough estimate per entry
    this.stats.memoryEstimate = this.hashCache.size * entrySize;
    this.stats.entries = this.hashCache.size;

    // Calculate average time saved
    if (this.computationTimes.length > 0) {
      const avgTime =
        this.computationTimes.reduce((a, b) => a + b, 0) / this.computationTimes.length;
      this.stats.avgTimeSaved = this.stats.hits * avgTime;
    }

    return { ...this.stats };
  }

  /**
   * Gets hit rate percentage
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Prunes expired entries from hash cache
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [hash, entry] of this.hashCache.entries()) {
      if (this.isExpired(entry.timestamp)) {
        this.hashCache.delete(hash);
        pruned++;
      }
    }

    return pruned;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.ttl;
  }

  private setHashCache(hash: number, entry: CachedSectionLayout): void {
    // LRU eviction if at capacity
    if (this.hashCache.size >= this.maxHashCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.hashCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.maxHashCacheSize / 4));
      for (const [key] of toRemove) {
        this.hashCache.delete(key);
      }
    }

    this.hashCache.set(hash, entry);
  }

  private trackComputationTime(time: number): void {
    this.computationTimes.push(time);
    // Keep only last 100 measurements
    if (this.computationTimes.length > 100) {
      this.computationTimes.shift();
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/** Global layout cache instance */
let globalLayoutCache: LayoutCache | null = null;

/**
 * Gets or creates the global layout cache instance
 */
export function getLayoutCache(): LayoutCache {
  if (!globalLayoutCache) {
    globalLayoutCache = new LayoutCache();
  }
  return globalLayoutCache;
}

/**
 * Clears the global layout cache
 */
export function clearLayoutCache(): void {
  globalLayoutCache?.clear();
}

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

/**
 * Creates a memoized version of a layout computation function
 */
export function memoizeLayoutComputation<T extends (...args: any[]) => any>(
  fn: T,
  getKey: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  const ttl = 30000; // 30 second TTL

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });

    // Cleanup old entries periodically
    if (cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of cache.entries()) {
        if (now - v.timestamp > ttl) {
          cache.delete(k);
        }
      }
    }

    return result;
  }) as T;
}

/**
 * Debounced layout update with coalescing
 */
export function createDebouncedLayoutUpdate(
  updateFn: () => void,
  delay: number = 16
): {
  schedule: () => void;
  cancel: () => void;
  flush: () => void;
} {
  let timeoutId: number | null = null;
  let pending = false;

  const schedule = () => {
    pending = true;
    if (timeoutId !== null) return;

    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      if (pending) {
        pending = false;
        updateFn();
      }
    }, delay);
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pending = false;
  };

  const flush = () => {
    cancel();
    updateFn();
  };

  return { schedule, cancel, flush };
}
