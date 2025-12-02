/**
 * Request Coalescing Utility (Point 11)
 *
 * Batches multiple rapid requests into single operations to reduce
 * API calls and improve performance during streaming updates.
 *
 * @example
 * ```typescript
 * const coalescer = new RequestCoalescer<string, Card>({
 *   batchWindow: 100,
 *   maxBatchSize: 10,
 *   processor: async (ids) => {
 *     return await this.fetchCards(ids);
 *   }
 * });
 *
 * // These will be batched into a single request
 * const card1 = coalescer.request('card-1');
 * const card2 = coalescer.request('card-2');
 * const card3 = coalescer.request('card-3');
 * ```
 */

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { bufferTime, filter, take } from 'rxjs/operators';

// =============================================================================
// TYPES
// =============================================================================

export interface CoalescerConfig<K, V> {
  /** Time window to collect requests (ms) */
  batchWindow?: number;
  /** Maximum batch size before forcing flush */
  maxBatchSize?: number;
  /** Batch processor function */
  processor: (keys: K[]) => Promise<Map<K, V>> | Observable<Map<K, V>>;
  /** Key serializer for deduplication */
  keySerializer?: (key: K) => string;
  /** Cache TTL in ms (0 = no cache) */
  cacheTtl?: number;
  /** Maximum concurrent batches */
  maxConcurrency?: number;
}

interface PendingRequest<K, V> {
  key: K;
  serializedKey: string;
  resolve: (value: V) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface CacheEntry<V> {
  value: V;
  timestamp: number;
}

// =============================================================================
// REQUEST COALESCER
// =============================================================================

/**
 * Coalesces multiple requests into batched operations
 */
export class RequestCoalescer<K, V> {
  private readonly config: Required<CoalescerConfig<K, V>>;
  private readonly pendingRequests = new Map<string, PendingRequest<K, V>[]>();
  private readonly cache = new Map<string, CacheEntry<V>>();
  private readonly requestSubject = new Subject<PendingRequest<K, V>>();
  private activeBatches = 0;
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Statistics for monitoring */
  private stats = {
    totalRequests: 0,
    batchedRequests: 0,
    cacheHits: 0,
    batches: 0,
  };

  constructor(config: CoalescerConfig<K, V>) {
    this.config = {
      batchWindow: 50,
      maxBatchSize: 20,
      keySerializer: (k) => JSON.stringify(k),
      cacheTtl: 0,
      maxConcurrency: 3,
      ...config,
    };

    this.initBatchProcessor();
  }

  /**
   * Request a value, potentially batched with other requests
   */
  request(key: K): Promise<V> {
    this.stats.totalRequests++;
    const serializedKey = this.config.keySerializer(key);

    // Check cache first
    if (this.config.cacheTtl > 0) {
      const cached = this.cache.get(serializedKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTtl) {
        this.stats.cacheHits++;
        return Promise.resolve(cached.value);
      }
    }

    // Check if already pending
    const existing = this.pendingRequests.get(serializedKey);
    if (existing && existing.length > 0) {
      // Piggyback on existing request
      return new Promise((resolve, reject) => {
        existing.push({
          key,
          serializedKey,
          resolve,
          reject,
          timestamp: Date.now(),
        });
      });
    }

    // Create new pending request
    return new Promise((resolve, reject) => {
      const request: PendingRequest<K, V> = {
        key,
        serializedKey,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.pendingRequests.set(serializedKey, [request]);
      this.requestSubject.next(request);
      this.scheduleFlush();
    });
  }

  /**
   * Request multiple values at once
   */
  requestMany(keys: K[]): Promise<Map<K, V>> {
    return Promise.all(
      keys.map(async (key) => {
        const value = await this.request(key);
        return [key, value] as [K, V];
      })
    ).then((entries) => new Map(entries));
  }

  /**
   * Force flush pending requests
   */
  flush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.processBatch();
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Destroy the coalescer
   */
  destroy(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.requestSubject.complete();
    this.pendingRequests.clear();
    this.cache.clear();
  }

  private initBatchProcessor(): void {
    this.requestSubject
      .pipe(
        bufferTime(this.config.batchWindow, null, this.config.maxBatchSize),
        filter((batch) => batch.length > 0)
      )
      .subscribe(() => {
        this.processBatch();
      });
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) {
      return;
    }

    // Check if we should flush immediately due to batch size
    const totalPending = Array.from(this.pendingRequests.values()).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    if (totalPending >= this.config.maxBatchSize) {
      this.processBatch();
      return;
    }

    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      this.processBatch();
    }, this.config.batchWindow);
  }

  private async processBatch(): Promise<void> {
    // Respect concurrency limit
    if (this.activeBatches >= this.config.maxConcurrency) {
      return;
    }

    // Collect pending requests
    const batch: PendingRequest<K, V>[] = [];
    const keys: K[] = [];
    const keySet = new Set<string>();

    for (const [serializedKey, requests] of this.pendingRequests.entries()) {
      if (!keySet.has(serializedKey) && requests.length > 0) {
        keySet.add(serializedKey);
        keys.push(requests[0]!.key);
        batch.push(...requests);
      }
    }

    if (keys.length === 0) {
      return;
    }

    // Clear pending requests
    for (const serializedKey of keySet) {
      this.pendingRequests.delete(serializedKey);
    }

    this.stats.batches++;
    this.stats.batchedRequests += batch.length;
    this.activeBatches++;

    try {
      // Process the batch
      const resultPromise = this.config.processor(keys);
      const results =
        resultPromise instanceof Observable
          ? await resultPromise.pipe(take(1)).toPromise()
          : await resultPromise;

      // Resolve pending requests
      for (const request of batch) {
        const value = results?.get(request.key);
        if (value !== undefined) {
          // Cache the result
          if (this.config.cacheTtl > 0) {
            this.cache.set(request.serializedKey, {
              value,
              timestamp: Date.now(),
            });
          }
          request.resolve(value);
        } else {
          request.reject(new Error(`No result for key: ${request.serializedKey}`));
        }
      }
    } catch (error) {
      // Reject all pending requests
      for (const request of batch) {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      this.activeBatches--;
    }
  }
}

// =============================================================================
// DEBOUNCED REQUEST
// =============================================================================

/**
 * Creates a debounced request function that coalesces rapid calls
 */
export function createDebouncedRequest<T>(
  fn: () => Promise<T> | Observable<T>,
  delay = 100
): () => Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingResolvers: {
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  }[] = [];

  return () => {
    return new Promise<T>((resolve, reject) => {
      pendingResolvers.push({ resolve, reject });

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(async () => {
        const resolvers = pendingResolvers;
        pendingResolvers = [];
        timeout = null;

        try {
          const result = fn();
          const value =
            result instanceof Observable ? await result.pipe(take(1)).toPromise() : await result;

          for (const r of resolvers) {
            r.resolve(value as T);
          }
        } catch (error) {
          for (const r of resolvers) {
            r.reject(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }, delay);
    });
  };
}

// =============================================================================
// THROTTLED REQUEST
// =============================================================================

/**
 * Creates a throttled request function that limits call frequency
 */
export function createThrottledRequest<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T> | Observable<T>,
  interval = 100
): (...args: A) => Promise<T> {
  let lastCall = 0;
  let pendingCall: Promise<T> | null = null;
  let pendingArgs: A | null = null;

  return (...args: A): Promise<T> => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= interval) {
      lastCall = now;
      const result = fn(...args);
      return result instanceof Observable
        ? (result.pipe(take(1)).toPromise() as Promise<T>)
        : result;
    }

    // Queue the call
    pendingArgs = args;

    if (!pendingCall) {
      pendingCall = new Promise<T>((resolve, reject) => {
        setTimeout(async () => {
          lastCall = Date.now();
          pendingCall = null;
          const argsToUse = pendingArgs!;
          pendingArgs = null;

          try {
            const result = fn(...argsToUse);
            const value =
              result instanceof Observable ? await result.pipe(take(1)).toPromise() : await result;
            resolve(value as T);
          } catch (error) {
            reject(error);
          }
        }, interval - timeSinceLastCall);
      });
    }

    return pendingCall;
  };
}

// =============================================================================
// UPDATE COALESCER
// =============================================================================

/**
 * Coalesces rapid updates into batched state changes
 * Useful for streaming card updates
 */
export class UpdateCoalescer<T> {
  private readonly updates$ = new Subject<Partial<T>>();
  private readonly state$ = new BehaviorSubject<T | null>(null);
  private pendingUpdates: Partial<T>[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly initialState: T,
    private readonly mergeStrategy: (current: T, updates: Partial<T>[]) => T,
    private readonly batchWindow = 50
  ) {
    this.state$.next(initialState);
  }

  /**
   * Queue an update
   */
  update(partial: Partial<T>): void {
    this.pendingUpdates.push(partial);
    this.scheduleFlush();
  }

  /**
   * Get current state as observable
   */
  getState$(): Observable<T> {
    return this.state$.asObservable().pipe(filter((state): state is T => state !== null));
  }

  /**
   * Get current state synchronously
   */
  getState(): T {
    return this.state$.getValue() ?? this.initialState;
  }

  /**
   * Force flush pending updates
   */
  flush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.applyUpdates();
  }

  /**
   * Destroy the coalescer
   */
  destroy(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.updates$.complete();
    this.state$.complete();
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) {
      return;
    }

    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      this.applyUpdates();
    }, this.batchWindow);
  }

  private applyUpdates(): void {
    if (this.pendingUpdates.length === 0) {
      return;
    }

    const updates = this.pendingUpdates;
    this.pendingUpdates = [];

    const currentState = this.state$.getValue() ?? this.initialState;
    const newState = this.mergeStrategy(currentState, updates);
    this.state$.next(newState);
  }
}

/**
 * Default merge strategy for card updates
 */
export function defaultCardMergeStrategy<T extends Record<string, unknown>>(
  current: T,
  updates: Partial<T>[]
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return updates.reduce((state, update) => ({ ...state, ...update }), current) as any;
}
