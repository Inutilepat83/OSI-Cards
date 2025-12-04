/**
 * Filtering Utilities
 *
 * Advanced filtering utilities with multiple criteria.
 *
 * @example
 * ```typescript
 * import { createFilter, filterByRange } from '@osi-cards/utils';
 *
 * const filter = createFilter<User>({
 *   age: (age) => age >= 18,
 *   active: true
 * });
 *
 * const adults = items.filter(filter);
 * ```
 */

export type FilterPredicate<T> = (item: T) => boolean;

export interface FilterConfig<T> {
  [key: string]: any | ((value: any) => boolean);
}

/**
 * Create filter from config
 */
export function createFilter<T>(config: FilterConfig<T>): FilterPredicate<T> {
  return (item: T) => {
    return Object.entries(config).every(([key, criterion]) => {
      const value = (item as any)[key];

      if (typeof criterion === 'function') {
        return criterion(value);
      }

      return value === criterion;
    });
  };
}

/**
 * Filter by range
 */
export function filterByRange<T>(
  items: T[],
  getValue: (item: T) => number,
  min: number,
  max: number
): T[] {
  return items.filter((item) => {
    const value = getValue(item);
    return value >= min && value <= max;
  });
}

/**
 * Filter by date range
 */
export function filterByDateRange<T>(
  items: T[],
  getDate: (item: T) => Date | string | number,
  start: Date,
  end: Date
): T[] {
  return items.filter((item) => {
    const date = new Date(getDate(item));
    return date >= start && date <= end;
  });
}

/**
 * Filter by text
 */
export function filterByText<T>(
  items: T[],
  query: string,
  getFields: Array<(item: T) => string>
): T[] {
  const lowerQuery = query.toLowerCase();

  return items.filter((item) => {
    return getFields.some((getField) => {
      const text = getField(item).toLowerCase();
      return text.includes(lowerQuery);
    });
  });
}

/**
 * Filter by tags
 */
export function filterByTags<T>(
  items: T[],
  selectedTags: string[],
  getTags: (item: T) => string[]
): T[] {
  if (selectedTags.length === 0) return items;

  return items.filter((item) => {
    const itemTags = getTags(item);
    return selectedTags.every((tag) => itemTags.includes(tag));
  });
}

/**
 * Filter by any tags (OR logic)
 */
export function filterByAnyTags<T>(
  items: T[],
  selectedTags: string[],
  getTags: (item: T) => string[]
): T[] {
  if (selectedTags.length === 0) return items;

  return items.filter((item) => {
    const itemTags = getTags(item);
    return selectedTags.some((tag) => itemTags.includes(tag));
  });
}

/**
 * Combine filters (AND logic)
 */
export function combineFilters<T>(...filters: FilterPredicate<T>[]): FilterPredicate<T> {
  return (item: T) => filters.every((filter) => filter(item));
}

/**
 * Any filter (OR logic)
 */
export function anyFilter<T>(...filters: FilterPredicate<T>[]): FilterPredicate<T> {
  return (item: T) => filters.some((filter) => filter(item));
}

/**
 * Negate filter
 */
export function notFilter<T>(filter: FilterPredicate<T>): FilterPredicate<T> {
  return (item: T) => !filter(item);
}

/**
 * Filter unique by key
 */
export function filterUnique<T>(items: T[], getKey: (item: T) => any): T[] {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Filter duplicates
 */
export function filterDuplicates<T>(items: T[], getKey: (item: T) => any): T[] {
  const counts = new Map<any, number>();

  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return items.filter((item) => {
    const key = getKey(item);
    return (counts.get(key) || 0) > 1;
  });
}
