/**
 * Custom RxJS Operators
 *
 * A collection of 10 custom RxJS operators.
 *
 * Operators:
 * 1. tapOnce
 * 2. retryWithBackoff
 * 3. delayWhen
 * 4. bufferDebounce
 * 5. shareReplayOne
 * 6. filterNotNull
 * 7. mapToVoid
 * 8. catchAndContinue
 * 9. tapError
 * 10. timeoutWith
 */

import { Observable, throwError, timer, EMPTY, of, ReplaySubject } from 'rxjs';
import {
  retry,
  mergeMap,
  debounceTime,
  bufferTime,
  shareReplay,
  filter,
  map,
  catchError,
  tap,
  timeout,
  finalize,
} from 'rxjs/operators';

/**
 * 1. Tap once (side effect only for first emission)
 */
export function tapOnce<T>(fn: (value: T) => void) {
  let called = false;

  return (source: Observable<T>) =>
    source.pipe(
      tap((value) => {
        if (!called) {
          called = true;
          fn(value);
        }
      })
    );
}

/**
 * 2. Retry with exponential backoff
 */
export function retryWithBackoff(maxRetries = 3, initialDelay = 1000, maxDelay = 30000) {
  return <T>(source: Observable<T>) =>
    source.pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          const delay = Math.min(initialDelay * Math.pow(2, retryCount - 1), maxDelay);
          return timer(delay);
        },
      })
    );
}

/**
 * 3. Delay when condition is met
 */
export function delayWhen<T>(condition: (value: T) => boolean, delay: number) {
  return (source: Observable<T>) =>
    source.pipe(
      mergeMap((value) => {
        if (condition(value)) {
          return timer(delay).pipe(map(() => value));
        }
        return of(value);
      })
    );
}

/**
 * 4. Buffer with debounce
 */
export function bufferDebounce<T>(delay: number) {
  return (source: Observable<T>) =>
    source.pipe(
      bufferTime(delay),
      filter((buffer) => buffer.length > 0)
    );
}

/**
 * 5. Share replay one
 */
export function shareReplayOne<T>() {
  return (source: Observable<T>) => source.pipe(shareReplay({ bufferSize: 1, refCount: true }));
}

/**
 * 6. Filter not null
 */
export function filterNotNull<T>() {
  return (source: Observable<T | null | undefined>) =>
    source.pipe(filter((value): value is T => value !== null && value !== undefined));
}

/**
 * 7. Map to void
 */
export function mapToVoid<T>() {
  return (source: Observable<T>) => source.pipe(map(() => undefined as void));
}

/**
 * 8. Catch and continue
 */
export function catchAndContinue<T>(defaultValue: T) {
  return (source: Observable<T>) => source.pipe(catchError(() => of(defaultValue)));
}

/**
 * 9. Tap error
 */
export function tapError<T>(fn: (error: any) => void) {
  return (source: Observable<T>) =>
    source.pipe(
      catchError((error) => {
        fn(error);
        return throwError(() => error);
      })
    );
}

/**
 * 10. Timeout with fallback
 */
export function timeoutWith<T>(timeoutMs: number, fallbackValue: T) {
  return (source: Observable<T>) =>
    source.pipe(
      timeout(timeoutMs),
      catchError(() => of(fallbackValue))
    );
}

/**
 * Log emissions
 */
export function logEmissions<T>(label: string) {
  return (source: Observable<T>) =>
    source.pipe(
      tap({
        next: (value) => console.log(`[${label}] Next:`, value),
        error: (error) => console.error(`[${label}] Error:`, error),
        complete: () => console.log(`[${label}] Complete`),
      })
    );
}

/**
 * Take until condition
 */
export function takeUntilCondition<T>(predicate: (value: T) => boolean) {
  return (source: Observable<T>) =>
    new Observable<T>((observer) => {
      const subscription = source.subscribe({
        next: (value) => {
          observer.next(value);
          if (predicate(value)) {
            observer.complete();
          }
        },
        error: (error) => observer.error(error),
        complete: () => observer.complete(),
      });

      return () => subscription.unsubscribe();
    });
}
