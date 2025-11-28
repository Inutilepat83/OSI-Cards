import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TIME_CONSTANTS } from './constants';

/**
 * Debounce utility functions
 * 
 * Provides reusable debouncing patterns for common operations like
 * search, filter, and user input handling.
 */

/**
 * Create a debounced search observable
 * 
 * @param searchSubject - Subject that emits search terms
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 * @returns Observable that emits debounced search terms
 */
export function createDebouncedSearch<T>(
  searchSubject: Subject<T>,
  debounceMs: number = TIME_CONSTANTS.SEARCH_DEBOUNCE_DELAY
): Observable<T> {
  return searchSubject.pipe(
    debounceTime(debounceMs),
    distinctUntilChanged()
  );
}

/**
 * Create a debounced filter observable
 * 
 * @param filterSubject - Subject that emits filter values
 * @param debounceMs - Debounce delay in milliseconds (default: 200ms)
 * @returns Observable that emits debounced filter values
 */
export function createDebouncedFilter<T>(
  filterSubject: Subject<T>,
  debounceMs: number = TIME_CONSTANTS.FILTER_DEBOUNCE_DELAY
): Observable<T> {
  return filterSubject.pipe(
    debounceTime(debounceMs),
    distinctUntilChanged()
  );
}

/**
 * Debounce function for direct function calls
 * 
 * @param fn - Function to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}



