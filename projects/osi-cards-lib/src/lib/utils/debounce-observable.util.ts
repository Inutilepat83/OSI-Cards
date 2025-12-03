/**
 * Observable Debounce & Throttle Utilities
 *
 * RxJS operators for debouncing and throttling.
 *
 * @example
 * ```typescript
 * import { debounceTime$, throttleTime$ } from '@osi-cards/utils';
 *
 * clicks$.pipe(debounceTime$(300)).subscribe();
 * scrolls$.pipe(throttleTime$(100)).subscribe();
 * ```
 */

import { Observable, Subject } from 'rxjs';
import { debounceTime, throttleTime, distinctUntilChanged, filter } from 'rxjs/operators';

/**
 * Debounce observable
 */
export function debounceTime$<T>(delay: number) {
  return (source: Observable<T>) => source.pipe(debounceTime(delay));
}

/**
 * Throttle observable
 */
export function throttleTime$<T>(delay: number) {
  return (source: Observable<T>) => source.pipe(throttleTime(delay));
}

/**
 * Distinct until changed with compare function
 */
export function distinctBy$<T, K>(keySelector: (value: T) => K) {
  return (source: Observable<T>) => source.pipe(
    distinctUntilChanged((prev, curr) => keySelector(prev) === keySelector(curr))
  );
}

/**
 * Filter truthy values
 */
export function filterTruthy$<T>() {
  return (source: Observable<T>) => source.pipe(filter(value => !!value));
}

/**
 * Filter null and undefined
 */
export function filterNullish$<T>() {
  return (source: Observable<T>) => source.pipe(
    filter(value => value !== null && value !== undefined)
  ) as Observable<NonNullable<T>>;
}

/**
 * Create debounced subject
 */
export class DebouncedSubject<T> extends Subject<T> {
  private debounced$ = this.pipe(debounceTime(this.delay));

  constructor(private delay: number) {
    super();
  }

  subscribe(...args: any[]): any {
    return this.debounced$.subscribe(...args);
  }
}

/**
 * Create throttled subject
 */
export class ThrottledSubject<T> extends Subject<T> {
  private throttled$ = this.pipe(throttleTime(this.delay));

  constructor(private delay: number) {
    super();
  }

  subscribe(...args: any[]): any {
    return this.throttled$.subscribe(...args);
  }
}

