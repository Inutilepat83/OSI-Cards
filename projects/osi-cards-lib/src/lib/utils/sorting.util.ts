/**
 * Advanced Sorting Utilities
 *
 * Utilities for advanced sorting operations.
 *
 * @example
 * ```typescript
 * import { sortByMultiple, naturalSort } from '@osi-cards/utils';
 *
 * const sorted = sortByMultiple(items, [
 *   { key: 'priority', order: 'desc' },
 *   { key: 'name', order: 'asc' }
 * ]);
 * ```
 */

export type SortOrder = 'asc' | 'desc';

export interface SortCriteria<T> {
  key: keyof T | ((item: T) => any);
  order?: SortOrder;
}

/**
 * Sort by multiple criteria
 */
export function sortByMultiple<T>(items: T[], criteria: SortCriteria<T>[]): T[] {
  return [...items].sort((a, b) => {
    for (const criterion of criteria) {
      const { key, order = 'asc' } = criterion;

      const valueA = typeof key === 'function' ? key(a) : a[key];
      const valueB = typeof key === 'function' ? key(b) : b[key];

      const comparison = compare(valueA, valueB);

      if (comparison !== 0) {
        return order === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

/**
 * Compare two values
 */
function compare(a: any, b: any): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  return a < b ? -1 : 1;
}

/**
 * Natural sort (handles numbers in strings)
 */
export function naturalSort(items: string[], order: SortOrder = 'asc'): string[] {
  return [...items].sort((a, b) => {
    const comparison = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Sort by date
 */
export function sortByDate<T>(
  items: T[],
  getDate: (item: T) => Date | string | number,
  order: SortOrder = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(getDate(a)).getTime();
    const dateB = new Date(getDate(b)).getTime();
    const comparison = dateA - dateB;
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Stable sort
 */
export function stableSort<T>(items: T[], compareFn: (a: T, b: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const comparison = compareFn(a.item, b.item);
      return comparison !== 0 ? comparison : a.index - b.index;
    })
    .map(({ item }) => item);
}

/**
 * Sort with null/undefined handling
 */
export function sortWithNulls<T>(
  items: T[],
  getValue: (item: T) => any,
  order: SortOrder = 'asc',
  nullsFirst = false
): T[] {
  return [...items].sort((a, b) => {
    const valueA = getValue(a);
    const valueB = getValue(b);

    const aIsNull = valueA === null || valueA === undefined;
    const bIsNull = valueB === null || valueB === undefined;

    if (aIsNull && bIsNull) return 0;
    if (aIsNull) return nullsFirst ? -1 : 1;
    if (bIsNull) return nullsFirst ? 1 : -1;

    const comparison = compare(valueA, valueB);
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Case-insensitive sort
 */
export function sortCaseInsensitive(items: string[], order: SortOrder = 'asc'): string[] {
  return [...items].sort((a, b) => {
    const comparison = a.toLowerCase().localeCompare(b.toLowerCase());
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Top N items
 */
export function topN<T>(items: T[], n: number, compareFn: (a: T, b: T) => number): T[] {
  return [...items].sort(compareFn).slice(0, n);
}

/**
 * Bottom N items
 */
export function bottomN<T>(items: T[], n: number, compareFn: (a: T, b: T) => number): T[] {
  return [...items].sort(compareFn).slice(-n);
}
