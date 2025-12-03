/**
 * Collection Utilities
 *
 * Generic collection utilities that work with arrays, Sets, and Maps.
 *
 * @example
 * ```typescript
 * import { toMap, toSet, frequency } from '@osi-cards/utils';
 *
 * const map = toMap(users, u => u.id);
 * const set = toSet(items);
 * const freq = frequency(['a', 'b', 'a', 'c', 'a']);
 * ```
 */

/**
 * Convert array to Map
 */
export function toMap<T, K>(
  items: T[],
  getKey: (item: T) => K
): Map<K, T> {
  const map = new Map<K, T>();
  items.forEach(item => map.set(getKey(item), item));
  return map;
}

/**
 * Convert array to Set
 */
export function toSet<T>(items: T[]): Set<T> {
  return new Set(items);
}

/**
 * Map to array
 */
export function mapToArray<K, V>(map: Map<K, V>): Array<[K, V]> {
  return Array.from(map.entries());
}

/**
 * Set to array
 */
export function setToArray<T>(set: Set<T>): T[] {
  return Array.from(set);
}

/**
 * Frequency counter
 */
export function frequency<T>(items: T[]): Map<T, number> {
  const freq = new Map<T, number>();
  items.forEach(item => {
    freq.set(item, (freq.get(item) || 0) + 1);
  });
  return freq;
}

/**
 * Most common element
 */
export function mostCommon<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;

  const freq = frequency(items);
  let maxCount = 0;
  let mostCommonItem: T | undefined;

  freq.forEach((count, item) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonItem = item;
    }
  });

  return mostCommonItem;
}

/**
 * Index by
 */
export function indexBy<T>(
  items: T[],
  getKey: (item: T) => string | number
): Record<string, T> {
  const result: Record<string, T> = {};
  items.forEach(item => {
    const key = String(getKey(item));
    result[key] = item;
  });
  return result;
}

/**
 * Group into Map
 */
export function groupToMap<T, K>(
  items: T[],
  getKey: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();

  items.forEach(item => {
    const key = getKey(item);
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  });

  return map;
}

/**
 * Partition into Map
 */
export function partitionToMap<T, K>(
  items: T[],
  getKey: (item: T) => K
): Map<K, T[]> {
  return groupToMap(items, getKey);
}

/**
 * Sum by
 */
export function sumBy<T>(items: T[], getValue: (item: T) => number): number {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

/**
 * Average by
 */
export function averageBy<T>(items: T[], getValue: (item: T) => number): number {
  if (items.length === 0) return 0;
  return sumBy(items, getValue) / items.length;
}

/**
 * Min by
 */
export function minBy<T>(items: T[], getValue: (item: T) => number): T | undefined {
  if (items.length === 0) return undefined;

  return items.reduce((min, item) => {
    return getValue(item) < getValue(min) ? item : min;
  });
}

/**
 * Max by
 */
export function maxBy<T>(items: T[], getValue: (item: T) => number): T | undefined {
  if (items.length === 0) return undefined;

  return items.reduce((max, item) => {
    return getValue(item) > getValue(max) ? item : max;
  });
}

/**
 * Sample from collection
 */
export function sampleFrom<T>(items: T[], count = 1): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Is subset
 */
export function isSubset<T>(subset: Set<T>, superset: Set<T>): boolean {
  for (const item of subset) {
    if (!superset.has(item)) return false;
  }
  return true;
}

/**
 * Is superset
 */
export function isSuperset<T>(superset: Set<T>, subset: Set<T>): boolean {
  return isSubset(subset, superset);
}

/**
 * Set union
 */
export function setUnion<T>(...sets: Set<T>[]): Set<T> {
  const result = new Set<T>();
  sets.forEach(set => {
    set.forEach(item => result.add(item));
  });
  return result;
}

/**
 * Set intersection
 */
export function setIntersection<T>(...sets: Set<T>[]): Set<T> {
  if (sets.length === 0) return new Set();

  const result = new Set(sets[0]);

  for (let i = 1; i < sets.length; i++) {
    for (const item of result) {
      if (!sets[i].has(item)) {
        result.delete(item);
      }
    }
  }

  return result;
}

/**
 * Set difference
 */
export function setDifference<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  const result = new Set<T>();
  set1.forEach(item => {
    if (!set2.has(item)) {
      result.add(item);
    }
  });
  return result;
}

