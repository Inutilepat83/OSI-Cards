/**
 * Async Helpers Utility
 *
 * Collection of utilities for working with Promises and async operations,
 * including retry logic, timeout handling, and parallel execution.
 *
 * Features:
 * - Retry with exponential backoff
 * - Timeout handling
 * - Parallel execution with limits
 * - Race conditions management
 * - Error aggregation
 *
 * @example
 * ```typescript
 * import { retry, timeout, parallel } from '@osi-cards/utils';
 *
 * // Retry failed requests
 * const data = await retry(() => fetchData(), { attempts: 3 });
 *
 * // Add timeout
 * const result = await timeout(longOperation(), 5000);
 *
 * // Run in parallel with concurrency limit
 * const results = await parallel(tasks, { concurrency: 5 });
 * ```
 */

/**
 * Retry options
 */
export interface RetryOptions {
  /**
   * Number of retry attempts
   * Default: 3
   */
  attempts?: number;

  /**
   * Initial delay in milliseconds
   * Default: 1000
   */
  delay?: number;

  /**
   * Exponential backoff multiplier
   * Default: 2
   */
  backoff?: number;

  /**
   * Maximum delay in milliseconds
   * Default: 30000
   */
  maxDelay?: number;

  /**
   * Function to determine if error is retryable
   * Default: all errors are retryable
   */
  isRetryable?: (error: any) => boolean;

  /**
   * Callback on each retry
   */
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Retry a promise-returning function
 *
 * @param fn - Function that returns a promise
 * @param options - Retry options
 * @returns Promise that resolves with result or rejects after all attempts
 *
 * @example
 * ```typescript
 * const data = await retry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { attempts: 3, delay: 1000 }
 * );
 * ```
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    attempts = 3,
    delay = 1000,
    backoff = 2,
    maxDelay = 30000,
    isRetryable = () => true,
    onRetry,
  } = options;

  let lastError: any;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === attempts || !isRetryable(error)) {
        throw error;
      }

      // Call onRetry callback
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Wait before retrying
      await sleep(currentDelay);

      // Calculate next delay with exponential backoff
      currentDelay = Math.min(currentDelay * backoff, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Add timeout to a promise
 *
 * @param promise - Promise to add timeout to
 * @param ms - Timeout in milliseconds
 * @param message - Optional timeout error message
 * @returns Promise that rejects if timeout occurs
 *
 * @example
 * ```typescript
 * try {
 *   const result = await timeout(longOperation(), 5000);
 * } catch (error) {
 *   console.log('Operation timed out');
 * }
 * ```
 */
export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 *
 * @example
 * ```typescript
 * console.log('Start');
 * await sleep(1000);
 * console.log('One second later');
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parallel execution options
 */
export interface ParallelOptions {
  /**
   * Maximum concurrent executions
   * Default: Infinity (all at once)
   */
  concurrency?: number;

  /**
   * Whether to stop on first error
   * Default: false
   */
  stopOnError?: boolean;

  /**
   * Callback for each completed task
   */
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Execute promises in parallel with concurrency limit
 *
 * @param tasks - Array of promise-returning functions
 * @param options - Parallel execution options
 * @returns Promise that resolves with array of results
 *
 * @example
 * ```typescript
 * const urls = ['url1', 'url2', 'url3', ...]; // 100 URLs
 *
 * // Fetch 5 at a time
 * const results = await parallel(
 *   urls.map(url => () => fetch(url)),
 *   { concurrency: 5 }
 * );
 * ```
 */
export async function parallel<T>(
  tasks: Array<() => Promise<T>>,
  options: ParallelOptions = {}
): Promise<T[]> {
  const { concurrency = Infinity, stopOnError = false, onProgress } = options;

  const results: T[] = [];
  const errors: any[] = [];
  let completed = 0;

  // Execute all at once if no concurrency limit
  if (concurrency >= tasks.length) {
    return Promise.all(tasks.map((task) => task()));
  }

  // Execute with concurrency limit
  const executing: Promise<void>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    const promise = task()
      .then((result) => {
        results[i] = result;
        completed++;

        if (onProgress) {
          onProgress(completed, tasks.length);
        }
      })
      .catch((error) => {
        errors[i] = error;

        if (stopOnError) {
          throw error;
        }
      });

    executing.push(promise as Promise<void>);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  // Wait for remaining
  await Promise.all(executing);

  // Throw if there were errors and stopOnError
  if (stopOnError && errors.some((e) => e)) {
    throw errors.find((e) => e);
  }

  return results;
}

/**
 * Execute promises in sequence
 *
 * @param tasks - Array of promise-returning functions
 * @returns Promise that resolves with array of results
 *
 * @example
 * ```typescript
 * const results = await sequence([
 *   () => step1(),
 *   () => step2(),
 *   () => step3()
 * ]);
 * ```
 */
export async function sequence<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];

  for (const task of tasks) {
    const result = await task();
    results.push(result);
  }

  return results;
}

/**
 * Race multiple promises and return first successful result
 *
 * @param promises - Array of promises
 * @returns Promise that resolves with first successful result
 *
 * @example
 * ```typescript
 * // Try multiple endpoints, use first one that responds
 * const data = await raceSuccess([
 *   fetch('/api/v1/data'),
 *   fetch('/api/v2/data'),
 *   fetch('/backup/data')
 * ]);
 * ```
 */
export async function raceSuccess<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    let errorCount = 0;
    const errors: any[] = [];

    promises.forEach((promise, index) => {
      promise
        .then((result) => {
          if (!resolved) {
            resolved = true;
            resolve(result);
          }
        })
        .catch((error) => {
          errors[index] = error;
          errorCount++;

          if (errorCount === promises.length) {
            const aggregateError = new Error('All promises failed');
            (aggregateError as any).errors = errors;
            reject(aggregateError);
          }
        });
    });
  });
}

/**
 * Delay function execution
 *
 * @param fn - Function to delay
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves with function result
 *
 * @example
 * ```typescript
 * const result = await delay(() => calculate(), 1000);
 * ```
 */
export async function delay<T>(fn: () => T | Promise<T>, ms: number): Promise<T> {
  await sleep(ms);
  return fn();
}

/**
 * Batch async operations
 *
 * @param items - Items to process
 * @param batchSize - Size of each batch
 * @param processor - Function to process each batch
 * @returns Promise that resolves when all batches are processed
 *
 * @example
 * ```typescript
 * await batch(
 *   users, // 1000 users
 *   50,    // Process 50 at a time
 *   async (batch) => {
 *     await saveUsers(batch);
 *   }
 * );
 * ```
 */
export async function batch<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);
  }
}

/**
 * Debounce a promise-returning function
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounceAsync(
 *   async (query: string) => {
 *     return await searchAPI(query);
 *   },
 *   300
 * );
 * ```
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(fn: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let latestResolve: ((value: any) => void) | null = null;
  let latestReject: ((error: any) => void) | null = null;

  return ((...args: any[]) => {
    return new Promise((resolve, reject) => {
      if (timeout) {
        clearTimeout(timeout);

        // Reject previous pending promise
        if (latestReject) {
          latestReject(new Error('Debounced'));
        }
      }

      latestResolve = resolve;
      latestReject = reject;

      timeout = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }) as T;
}

/**
 * Poll function until condition is met
 *
 * @param fn - Function to poll
 * @param condition - Condition to check result
 * @param options - Polling options
 * @returns Promise that resolves when condition is met
 *
 * @example
 * ```typescript
 * const result = await poll(
 *   () => checkJobStatus(jobId),
 *   (status) => status === 'completed',
 *   { interval: 1000, maxAttempts: 30 }
 * );
 * ```
 */
export async function poll<T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  options: {
    interval?: number;
    maxAttempts?: number;
    timeout?: number;
  } = {}
): Promise<T> {
  const { interval = 1000, maxAttempts = Infinity, timeout: timeoutMs } = options;

  const startTime = Date.now();
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await fn();

    if (condition(result)) {
      return result;
    }

    attempts++;

    // Check timeout
    if (timeoutMs && Date.now() - startTime >= timeoutMs) {
      throw new Error('Polling timed out');
    }

    if (attempts < maxAttempts) {
      await sleep(interval);
    }
  }

  throw new Error('Max polling attempts reached');
}

/**
 * Wrap callback-based function to promise
 *
 * @param fn - Callback-based function
 * @returns Promise-returning function
 *
 * @example
 * ```typescript
 * const readFileAsync = promisify(fs.readFile);
 * const content = await readFileAsync('file.txt', 'utf8');
 * ```
 */
export function promisify<T>(fn: (...args: any[]) => void): (...args: any[]) => Promise<T> {
  return (...args: any[]) => {
    return new Promise<T>((resolve, reject) => {
      fn(...args, (error: any, result: T) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  };
}

/**
 * Memoize async function
 *
 * @param fn - Async function to memoize
 * @returns Memoized function
 *
 * @example
 * ```typescript
 * const getCachedUser = memoizeAsync(
 *   async (id: string) => {
 *     return await fetchUser(id);
 *   }
 * );
 * ```
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  const cache = new Map<string, Promise<any>>();

  return (async (...args: any[]) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const promise = fn(...args);
    cache.set(key, promise);

    try {
      const result = await promise;
      return result;
    } catch (error) {
      // Remove failed promises from cache
      cache.delete(key);
      throw error;
    }
  }) as T;
}

/**
 * Catch and return result
 *
 * @param promise - Promise to catch
 * @param defaultValue - Default value on error
 * @returns Result or default value
 *
 * @example
 * ```typescript
 * const user = await catchDefault(fetchUser(id), null);
 * // Returns null if fetch fails
 * ```
 */
export async function catchDefault<T>(promise: Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return defaultValue;
  }
}

/**
 * Throttle async function
 *
 * @param fn - Async function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * const throttledSave = throttleAsync(
 *   async (data) => await saveToServer(data),
 *   1000
 * );
 * ```
 */
export function throttleAsync<T extends (...args: any[]) => Promise<any>>(fn: T, delay: number): T {
  let lastExecution = 0;
  let pending: Promise<any> | null = null;

  return (async (...args: any[]) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecution;

    if (timeSinceLastExecution >= delay) {
      lastExecution = now;
      return fn(...args);
    }

    // Return pending promise if exists
    if (pending) {
      return pending;
    }

    // Create new pending promise
    const remaining = delay - timeSinceLastExecution;
    pending = sleep(remaining).then(() => {
      lastExecution = Date.now();
      pending = null;
      return fn(...args);
    });

    return pending;
  }) as T;
}

/**
 * All settled with typed results
 *
 * @param promises - Array of promises
 * @returns Array of fulfilled/rejected results
 *
 * @example
 * ```typescript
 * const results = await allSettled([
 *   fetch('/api/1'),
 *   fetch('/api/2'),
 *   fetch('/api/3')
 * ]);
 *
 * results.forEach(result => {
 *   if (result.status === 'fulfilled') {
 *     console.log(result.value);
 *   } else {
 *     console.error(result.reason);
 *   }
 * });
 * ```
 */
export async function allSettled<T>(
  promises: Promise<T>[]
): Promise<Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: any }>> {
  return Promise.allSettled(promises);
}

/**
 * Wrap function with automatic retry
 *
 * @param fn - Function to wrap
 * @param options - Retry options
 * @returns Wrapped function with retry logic
 *
 * @example
 * ```typescript
 * const reliableFetch = withRetry(
 *   async (url: string) => {
 *     const response = await fetch(url);
 *     return response.json();
 *   },
 *   { attempts: 3 }
 * );
 * ```
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: any[]) => {
    return retry(() => fn(...args), options);
  }) as T;
}

/**
 * Wrap function with timeout
 *
 * @param fn - Function to wrap
 * @param ms - Timeout in milliseconds
 * @returns Wrapped function with timeout
 *
 * @example
 * ```typescript
 * const fetchWithTimeout = withTimeout(
 *   async (url: string) => fetch(url),
 *   5000
 * );
 * ```
 */
export function withTimeout<T extends (...args: any[]) => Promise<any>>(fn: T, ms: number): T {
  return (async (...args: any[]) => {
    return timeout(fn(...args), ms);
  }) as T;
}

/**
 * Map array in parallel with concurrency limit
 *
 * @param items - Items to map
 * @param mapper - Async mapper function
 * @param concurrency - Max concurrent operations
 * @returns Promise with mapped results
 *
 * @example
 * ```typescript
 * const users = await parallelMap(
 *   userIds,
 *   async (id) => await fetchUser(id),
 *   5 // Fetch 5 at a time
 * );
 * ```
 */
export async function parallelMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency = Infinity
): Promise<R[]> {
  return parallel(
    items.map((item, index) => () => mapper(item, index)),
    { concurrency }
  );
}

/**
 * Defer promise resolution
 *
 * @returns Object with promise and resolve/reject functions
 *
 * @example
 * ```typescript
 * const deferred = defer<string>();
 *
 * setTimeout(() => {
 *   deferred.resolve('Done!');
 * }, 1000);
 *
 * const result = await deferred.promise;
 * ```
 */
export function defer<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
