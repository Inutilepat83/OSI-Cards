/**
 * Promise Utilities
 *
 * Extended promise utilities for async operations.
 *
 * @example
 * ```typescript
 * import { promiseAll, promiseRace, promiseSettled } from '@osi-cards/utils';
 *
 * const results = await promiseAll([p1, p2, p3]);
 * const winner = await promiseRace([p1, p2, p3]);
 * ```
 */

/**
 * Promise all with progress
 */
export async function promiseAllProgress<T>(
  promises: Promise<T>[],
  onProgress?: (completed: number, total: number) => void
): Promise<T[]> {
  let completed = 0;
  const total = promises.length;

  const wrappedPromises = promises.map(promise =>
    promise.then(result => {
      completed++;
      onProgress?.(completed, total);
      return result;
    })
  );

  return Promise.all(wrappedPromises);
}

/**
 * Promise all settled with results
 */
export async function promiseAllSettled<T>(
  promises: Promise<T>[]
): Promise<Array<{ status: 'fulfilled' | 'rejected'; value?: T; reason?: any }>> {
  const results = await Promise.allSettled(promises);
  return results.map(result => ({
    status: result.status,
    value: result.status === 'fulfilled' ? result.value : undefined,
    reason: result.status === 'rejected' ? result.reason : undefined,
  }));
}

/**
 * Promise any (first to resolve)
 */
export async function promiseAny<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let rejectionCount = 0;
    const errors: any[] = [];

    promises.forEach((promise, index) => {
      promise
        .then(resolve)
        .catch(error => {
          rejectionCount++;
          errors[index] = error;
          if (rejectionCount === promises.length) {
            reject(errors);
          }
        });
    });
  });
}

/**
 * Promise with timeout
 */
export async function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Promise timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Retry promise
 */
export async function retryPromise<T>(
  fn: () => Promise<T>,
  attempts: number,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max attempts reached');
}

/**
 * Delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Deferred promise
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Promise queue
 */
export class PromiseQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;

  constructor(private concurrency = 1) {}

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    while (this.running < this.concurrency && this.queue.length > 0) {
      this.running++;
      const task = this.queue.shift();

      if (task) {
        await task();
      }

      this.running--;

      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

