/**
 * OSI Cards Memory Management Utilities
 * 
 * Utilities for managing memory, preventing leaks, and cleaning up resources.
 * Includes subscription management, cache cleanup, and WeakRef helpers.
 * 
 * @example
 * ```typescript
 * import { SubscriptionManager, CacheManager } from 'osi-cards-lib';
 * 
 * // Manage subscriptions
 * const subs = new SubscriptionManager();
 * subs.add(observable$.subscribe());
 * subs.unsubscribeAll(); // Clean up all subscriptions
 * 
 * // Manage caches with auto-cleanup
 * const cache = new CacheManager<string, Data>({ maxAge: 60000 });
 * cache.set('key', data);
 * cache.startAutoCleanup(30000);
 * ```
 * 
 * @module utils/memory
 */

import { Subscription, Subject, takeUntil } from 'rxjs';

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Manages multiple subscriptions for easy cleanup
 * Prevents memory leaks from forgotten subscriptions
 * 
 * @example
 * ```typescript
 * class MyComponent implements OnDestroy {
 *   private subs = new SubscriptionManager();
 * 
 *   ngOnInit() {
 *     this.subs.add(
 *       this.service.data$.subscribe(data => this.handle(data))
 *     );
 *     this.subs.add(
 *       this.service.events$.subscribe(event => this.process(event))
 *     );
 *   }
 * 
 *   ngOnDestroy() {
 *     this.subs.unsubscribeAll();
 *   }
 * }
 * ```
 */
export class SubscriptionManager {
  private readonly subscriptions: Subscription[] = [];
  private readonly destroy$ = new Subject<void>();

  /**
   * Add a subscription to be managed
   */
  public add(subscription: Subscription): Subscription {
    this.subscriptions.push(subscription);
    return subscription;
  }

  /**
   * Add multiple subscriptions
   */
  public addAll(...subscriptions: Subscription[]): void {
    this.subscriptions.push(...subscriptions);
  }

  /**
   * Get the destroy subject for use with takeUntil
   */
  public get takeUntil$(): Subject<void> {
    return this.destroy$;
  }

  /**
   * Create an operator to automatically unsubscribe
   */
  public untilDestroyed<T>(): (source: import('rxjs').Observable<T>) => import('rxjs').Observable<T> {
    return (source) => source.pipe(takeUntil(this.destroy$));
  }

  /**
   * Unsubscribe from all managed subscriptions
   */
  public unsubscribeAll(): void {
    // Signal destruction for takeUntil subscribers
    this.destroy$.next();
    this.destroy$.complete();

    // Unsubscribe all direct subscriptions
    for (const subscription of this.subscriptions) {
      if (!subscription.closed) {
        subscription.unsubscribe();
      }
    }
    this.subscriptions.length = 0;
  }

  /**
   * Get the number of active subscriptions
   */
  public get count(): number {
    return this.subscriptions.filter(s => !s.closed).length;
  }

  /**
   * Check if there are any active subscriptions
   */
  public get hasActive(): boolean {
    return this.count > 0;
  }

  /**
   * Remove closed subscriptions from the list
   */
  public prune(): number {
    const initialLength = this.subscriptions.length;
    const active = this.subscriptions.filter(s => !s.closed);
    this.subscriptions.length = 0;
    this.subscriptions.push(...active);
    return initialLength - active.length;
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Configuration for CacheManager
 */
export interface CacheManagerConfig {
  /** Maximum number of entries */
  maxSize?: number;
  /** Maximum age of entries in milliseconds */
  maxAge?: number;
  /** Enable LRU eviction */
  lru?: boolean;
  /** Callback when entry is evicted */
  onEvict?: (key: string, value: unknown) => void;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<V> {
  value: V;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

/**
 * Manages a cache with automatic cleanup and eviction policies
 * 
 * @example
 * ```typescript
 * const cache = new CacheManager<string, ComputedData>({
 *   maxSize: 100,
 *   maxAge: 60000, // 1 minute
 *   lru: true,
 *   onEvict: (key, value) => console.log(`Evicted: ${key}`)
 * });
 * 
 * cache.set('key1', data);
 * const data = cache.get('key1');
 * 
 * // Start automatic cleanup every 30 seconds
 * cache.startAutoCleanup(30000);
 * ```
 */
export class CacheManager<K extends string | number, V> {
  private readonly cache = new Map<K, CacheEntry<V>>();
  private readonly config: Required<CacheManagerConfig>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: CacheManagerConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 1000,
      maxAge: config.maxAge ?? Infinity,
      lru: config.lru ?? true,
      onEvict: config.onEvict ?? (() => {}),
    };
  }

  /**
   * Get a value from the cache
   */
  public get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return undefined;
    }

    // Update access metadata for LRU
    if (this.config.lru) {
      entry.accessCount++;
      entry.lastAccess = Date.now();
    }

    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  public set(key: K, value: V): void {
    // Evict if at max size
    if (!this.cache.has(key) && this.cache.size >= this.config.maxSize) {
      this.evictOne();
    }

    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists and is not expired
   */
  public has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a key from the cache
   */
  public delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.config.onEvict(String(key), entry.value);
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Clear all entries
   */
  public clear(): void {
    for (const [key, entry] of this.cache.entries()) {
      this.config.onEvict(String(key), entry.value);
    }
    this.cache.clear();
  }

  /**
   * Get the number of entries
   */
  public get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  public keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Get all values
   */
  public values(): V[] {
    return Array.from(this.cache.values()).map(e => e.value);
  }

  /**
   * Remove expired entries
   */
  public cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxAge) {
        this.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Start automatic cleanup interval
   */
  public startAutoCleanup(intervalMs: number): void {
    this.stopAutoCleanup();
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  /**
   * Stop automatic cleanup
   */
  public stopAutoCleanup(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    maxSize: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestEntry) oldestEntry = entry.timestamp;
      if (entry.timestamp > newestEntry) newestEntry = entry.timestamp;
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Destroy the cache manager
   */
  public destroy(): void {
    this.stopAutoCleanup();
    this.clear();
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    return Date.now() - entry.timestamp > this.config.maxAge;
  }

  private evictOne(): void {
    if (this.cache.size === 0) return;

    if (this.config.lru) {
      // Find least recently used
      let oldestKey: K | null = null;
      let oldestAccess = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccess < oldestAccess) {
          oldestAccess = entry.lastAccess;
          oldestKey = key;
        }
      }

      if (oldestKey !== null) {
        this.delete(oldestKey);
      }
    } else {
      // FIFO - remove first entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.delete(firstKey);
      }
    }
  }
}

// ============================================================================
// WEAKREF UTILITIES
// ============================================================================

/**
 * A WeakMap-based cache that allows garbage collection of unused entries
 * 
 * @example
 * ```typescript
 * const cache = new WeakCache<HTMLElement, ComputedStyle>();
 * 
 * cache.set(element, computedStyle);
 * const style = cache.get(element);
 * 
 * // When element is garbage collected, the cache entry is automatically removed
 * ```
 */
export class WeakCache<K extends object, V> {
  private readonly cache = new WeakMap<K, V>();

  public get(key: K): V | undefined {
    return this.cache.get(key);
  }

  public set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  public has(key: K): boolean {
    return this.cache.has(key);
  }

  public delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Get or create a value
   */
  public getOrCreate(key: K, factory: () => V): V {
    let value = this.cache.get(key);
    if (value === undefined) {
      value = factory();
      this.cache.set(key, value);
    }
    return value;
  }
}

// ============================================================================
// RESOURCE CLEANUP REGISTRY
// ============================================================================

/**
 * Registry for cleanup callbacks that should be called on destroy
 * 
 * @example
 * ```typescript
 * const cleanup = new CleanupRegistry();
 * 
 * // Register cleanup callbacks
 * cleanup.register(() => subscription.unsubscribe());
 * cleanup.register(() => observer.disconnect());
 * cleanup.register(() => element.remove());
 * 
 * // Later: clean everything up
 * cleanup.cleanupAll();
 * ```
 */
export class CleanupRegistry {
  private readonly callbacks: Array<() => void> = [];
  private destroyed = false;

  /**
   * Register a cleanup callback
   * Returns a function to unregister the callback
   */
  public register(callback: () => void): () => void {
    if (this.destroyed) {
      // Already destroyed, call immediately
      callback();
      return () => {};
    }

    this.callbacks.push(callback);
    
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index !== -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Execute all cleanup callbacks
   */
  public cleanupAll(): void {
    this.destroyed = true;
    
    // Execute in reverse order (LIFO)
    for (let i = this.callbacks.length - 1; i >= 0; i--) {
      try {
        this.callbacks[i]?.();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    
    this.callbacks.length = 0;
  }

  /**
   * Get the number of registered callbacks
   */
  public get count(): number {
    return this.callbacks.length;
  }

  /**
   * Check if already destroyed
   */
  public get isDestroyed(): boolean {
    return this.destroyed;
  }
}

// ============================================================================
// TIMER MANAGEMENT
// ============================================================================

/**
 * Manages multiple timers for easy cleanup
 * 
 * @example
 * ```typescript
 * const timers = new TimerManager();
 * 
 * timers.setTimeout(() => doSomething(), 1000, 'myTimer');
 * timers.setInterval(() => poll(), 5000, 'poller');
 * 
 * // Cancel specific timer
 * timers.clear('myTimer');
 * 
 * // Clear all timers
 * timers.clearAll();
 * ```
 */
export class TimerManager {
  private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly intervals = new Map<string, ReturnType<typeof setInterval>>();
  private counter = 0;

  /**
   * Set a timeout
   */
  public setTimeout(callback: () => void, delay: number, id?: string): string {
    const timerId = id ?? `timeout-${++this.counter}`;
    
    // Clear existing timer with same id
    this.clearTimeout(timerId);
    
    const handle = setTimeout(() => {
      this.timeouts.delete(timerId);
      callback();
    }, delay);
    
    this.timeouts.set(timerId, handle);
    return timerId;
  }

  /**
   * Set an interval
   */
  public setInterval(callback: () => void, delay: number, id?: string): string {
    const timerId = id ?? `interval-${++this.counter}`;
    
    // Clear existing interval with same id
    this.clearInterval(timerId);
    
    const handle = setInterval(callback, delay);
    this.intervals.set(timerId, handle);
    return timerId;
  }

  /**
   * Clear a timeout
   */
  public clearTimeout(id: string): boolean {
    const handle = this.timeouts.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.timeouts.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Clear an interval
   */
  public clearInterval(id: string): boolean {
    const handle = this.intervals.get(id);
    if (handle !== undefined) {
      clearInterval(handle);
      this.intervals.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Clear a timer by id (timeout or interval)
   */
  public clear(id: string): boolean {
    return this.clearTimeout(id) || this.clearInterval(id);
  }

  /**
   * Clear all timers
   */
  public clearAll(): void {
    for (const handle of this.timeouts.values()) {
      clearTimeout(handle);
    }
    for (const handle of this.intervals.values()) {
      clearInterval(handle);
    }
    this.timeouts.clear();
    this.intervals.clear();
  }

  /**
   * Get the number of active timers
   */
  public get count(): number {
    return this.timeouts.size + this.intervals.size;
  }
}

// ============================================================================
// FINALIZATION REGISTRY (for modern browsers)
// ============================================================================

/**
 * Creates a tracked object that logs when it's garbage collected
 * Useful for debugging memory leaks
 * 
 * @example
 * ```typescript
 * const tracked = trackGC(myObject, 'MyObject');
 * // When myObject is garbage collected, a message will be logged
 * ```
 */
export function trackGC<T extends object>(
  obj: T,
  label: string,
  onCollected?: () => void
): T {
  if (typeof FinalizationRegistry === 'undefined') {
    return obj;
  }

  const registry = new FinalizationRegistry((heldLabel: string) => {
    console.debug(`[GC] ${heldLabel} was garbage collected`);
    onCollected?.();
  });

  registry.register(obj, label);
  return obj;
}

// ============================================================================
// MEMORY USAGE MONITORING
// ============================================================================

/**
 * Get current memory usage (if available)
 */
export function getMemoryUsage(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} | null {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as { memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    } }).memory;
    
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
  }
  return null;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Log memory usage to console
 */
export function logMemoryUsage(label = 'Memory'): void {
  const usage = getMemoryUsage();
  if (usage) {
    console.debug(
      `[${label}] Used: ${formatBytes(usage.usedJSHeapSize ?? 0)} / ` +
      `Total: ${formatBytes(usage.totalJSHeapSize ?? 0)} / ` +
      `Limit: ${formatBytes(usage.jsHeapSizeLimit ?? 0)}`
    );
  }
}

