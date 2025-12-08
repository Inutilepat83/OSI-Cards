/**
 * Object Pooling Utility (Point 19)
 *
 * Provides object pooling for frequently created/destroyed objects
 * to reduce garbage collection pressure during streaming.
 *
 * @example
 * ```typescript
 * // Create a pool for card configs
 * const cardPool = new ObjectPool<CardConfig>({
 *   factory: () => ({ id: '', title: '', sections: [] }),
 *   reset: (card) => {
 *     card.id = '';
 *     card.title = '';
 *     card.sections = [];
 *   },
 *   maxSize: 50
 * });
 *
 * // Acquire an object from the pool
 * const card = cardPool.acquire();
 * card.id = 'card-1';
 * card.title = 'My Card';
 *
 * // Release back to pool when done
 * cardPool.release(card);
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ObjectPoolConfig<T> {
  /** Factory function to create new objects */
  factory: () => T;
  /** Reset function to prepare object for reuse */
  reset?: (obj: T) => void;
  /** Validation function to check if object is still valid */
  validate?: (obj: T) => boolean;
  /** Maximum pool size */
  maxSize?: number;
  /** Initial pool size (pre-allocate) */
  initialSize?: number;
  /** Name for debugging */
  name?: string;
}

export interface PoolStats {
  /** Current pool size */
  poolSize: number;
  /** Total objects created */
  created: number;
  /** Total acquisitions */
  acquired: number;
  /** Total releases */
  released: number;
  /** Cache hit rate */
  hitRate: number;
}

// =============================================================================
// OBJECT POOL
// =============================================================================

/**
 * Generic object pool for reusing objects
 */
export class ObjectPool<T> {
  private readonly pool: T[] = [];
  private readonly config: Required<ObjectPoolConfig<T>>;
  private stats = {
    created: 0,
    acquired: 0,
    released: 0,
    hits: 0,
  };

  constructor(config: ObjectPoolConfig<T>) {
    this.config = {
      reset: () => {},
      validate: () => true,
      maxSize: 100,
      initialSize: 0,
      name: 'ObjectPool',
      ...config,
    };

    // Pre-allocate initial objects
    for (let i = 0; i < this.config.initialSize; i++) {
      this.pool.push(this.createObject());
    }
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    this.stats.acquired++;

    // Try to get from pool
    while (this.pool.length > 0) {
      const obj = this.pool.pop()!;

      // Validate the object
      if (this.config.validate(obj)) {
        this.stats.hits++;
        return obj;
      }
      // Object invalid, discard and try next
    }

    // Pool empty, create new object
    return this.createObject();
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    this.stats.released++;

    // Don't exceed max size
    if (this.pool.length >= this.config.maxSize) {
      return;
    }

    // Validate before pooling
    if (!this.config.validate(obj)) {
      return;
    }

    // Reset the object
    this.config.reset(obj);

    // Add to pool
    this.pool.push(obj);
  }

  /**
   * Release multiple objects
   */
  releaseAll(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj);
    }
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool.length = 0;
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return {
      poolSize: this.pool.length,
      created: this.stats.created,
      acquired: this.stats.acquired,
      released: this.stats.released,
      hitRate: this.stats.acquired > 0 ? this.stats.hits / this.stats.acquired : 0,
    };
  }

  /**
   * Pre-warm the pool with objects
   */
  prewarm(count: number): void {
    const toCreate = Math.min(count, this.config.maxSize - this.pool.length);
    for (let i = 0; i < toCreate; i++) {
      this.pool.push(this.createObject());
    }
  }

  private createObject(): T {
    this.stats.created++;
    return this.config.factory();
  }
}

// =============================================================================
// SPECIALIZED POOLS
// =============================================================================

/**
 * Array pool for reusing arrays
 */
export class ArrayPool<T> {
  private readonly pools = new Map<number, T[][]>();
  private readonly maxPoolSize: number;

  constructor(maxPoolSize = 50) {
    this.maxPoolSize = maxPoolSize;
  }

  /**
   * Acquire an array of specified size
   */
  acquire(size: number): T[] {
    const pool = this.pools.get(size);

    if (pool && pool.length > 0) {
      return pool.pop()!;
    }

    return new Array(size);
  }

  /**
   * Release an array back to the pool
   */
  release(arr: T[]): void {
    const size = arr.length;

    // Clear the array
    arr.length = 0;

    let pool = this.pools.get(size);
    if (!pool) {
      pool = [];
      this.pools.set(size, pool);
    }

    if (pool.length < this.maxPoolSize) {
      // Restore original length
      arr.length = size;
      pool.push(arr);
    }
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.pools.clear();
  }
}

/**
 * Map pool for reusing Map objects
 */
export class MapPool<K, V> {
  private readonly pool: Map<K, V>[] = [];
  private readonly maxPoolSize: number;

  constructor(maxPoolSize = 50) {
    this.maxPoolSize = maxPoolSize;
  }

  acquire(): Map<K, V> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return new Map();
  }

  release(map: Map<K, V>): void {
    if (this.pool.length < this.maxPoolSize) {
      map.clear();
      this.pool.push(map);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }
}

/**
 * Set pool for reusing Set objects
 */
export class SetPool<T> {
  private readonly pool: Set<T>[] = [];
  private readonly maxPoolSize: number;

  constructor(maxPoolSize = 50) {
    this.maxPoolSize = maxPoolSize;
  }

  acquire(): Set<T> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return new Set();
  }

  release(set: Set<T>): void {
    if (this.pool.length < this.maxPoolSize) {
      set.clear();
      this.pool.push(set);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }
}

// =============================================================================
// CARD-SPECIFIC POOLS
// =============================================================================

/**
 * Card section pool configuration
 */
export interface CardSectionPoolable {
  id: string;
  type: string;
  title: string;
  fields?: unknown[];
  items?: unknown[];
  [key: string]: unknown;
}

/**
 * Create a pool for card sections
 */
export function createSectionPool(maxSize = 100): ObjectPool<CardSectionPoolable> {
  return new ObjectPool<CardSectionPoolable>({
    name: 'CardSectionPool',
    maxSize,
    factory: () => ({
      id: '',
      type: '',
      title: '',
      fields: [],
      items: [],
    }),
    reset: (section) => {
      section.id = '';
      section.type = '';
      section.title = '';
      section.fields = [];
      section.items = [];
      // Clear any additional properties
      for (const key of Object.keys(section)) {
        if (!['id', 'type', 'title', 'fields', 'items'].includes(key)) {
          delete section[key];
        }
      }
    },
    validate: (section) => {
      return typeof section === 'object' && section !== null;
    },
  });
}

/**
 * Card field pool configuration
 */
export interface CardFieldPoolable {
  label: string;
  value: unknown;
  icon?: string;
  [key: string]: unknown;
}

/**
 * Create a pool for card fields
 */
export function createFieldPool(maxSize = 200): ObjectPool<CardFieldPoolable> {
  return new ObjectPool<CardFieldPoolable>({
    name: 'CardFieldPool',
    maxSize,
    factory: () => ({
      label: '',
      value: '',
    }),
    reset: (field) => {
      field.label = '';
      field.value = '';
      delete field.icon;
      // Clear any additional properties
      for (const key of Object.keys(field)) {
        if (!['label', 'value'].includes(key)) {
          delete field[key];
        }
      }
    },
  });
}

// =============================================================================
// GLOBAL POOL INSTANCES
// =============================================================================

/** Global section pool */
export const sectionPool = createSectionPool();

/** Global field pool */
export const fieldPool = createFieldPool();

/** Global array pool */
export const arrayPool = new ArrayPool<unknown>();

/** Global map pool */
export const mapPool = new MapPool<string, unknown>();

/** Global set pool */
export const setPool = new SetPool<string>();

// =============================================================================
// POOL MANAGER
// =============================================================================

/**
 * Manages multiple object pools
 */
export class PoolManager {
  private readonly pools = new Map<string, ObjectPool<unknown>>();

  /**
   * Register a pool
   */
  register<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool as ObjectPool<unknown>);
  }

  /**
   * Get a pool by name
   */
  get<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name) as ObjectPool<T> | undefined;
  }

  /**
   * Get statistics for all pools
   */
  getAllStats(): Record<string, PoolStats> {
    const stats: Record<string, PoolStats> = {};
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats();
    }
    return stats;
  }

  /**
   * Clear all pools
   */
  clearAll(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  /**
   * Pre-warm all pools
   */
  prewarmAll(count: number): void {
    for (const pool of this.pools.values()) {
      pool.prewarm(count);
    }
  }
}

/** Global pool manager */
export const poolManager = new PoolManager();

// Register default pools
poolManager.register('sections', sectionPool);
poolManager.register('fields', fieldPool);



