/**
 * Extended Array Utilities
 *
 * Additional array manipulation utilities beyond standard methods.
 *
 * @example
 * ```typescript
 * import { shuffle, sample, chunk } from '@osi-cards/utils';
 *
 * const shuffled = shuffle([1, 2, 3, 4, 5]);
 * const random = sample(array);
 * const chunked = chunk(array, 3);
 * ```
 */

/**
 * Shuffle array
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get random element
 */
export function sample<T>(array: T[]): T | undefined {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get N random elements
 */
export function sampleSize<T>(array: T[], n: number): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(n, array.length));
}

/**
 * Remove duplicates
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Remove duplicates by key
 */
export function uniqueBy<T>(array: T[], key: keyof T | ((item: T) => any)): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Chunk array
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flatten array
 */
export function flatten<T>(array: any[]): T[] {
  return array.reduce(
    (acc, val) => (Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val)),
    []
  );
}

/**
 * Difference between arrays
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((item) => !array2.includes(item));
}

/**
 * Intersection of arrays
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((item) => array2.includes(item));
}

/**
 * Union of arrays
 */
export function union<T>(...arrays: T[][]): T[] {
  return unique(arrays.flat());
}

/**
 * Zip arrays
 */
export function zip<T>(...arrays: T[][]): T[][] {
  const maxLength = Math.max(...arrays.map((arr) => arr.length));
  return Array.from({ length: maxLength }, (_, i) => arrays.map((arr) => arr[i]));
}

/**
 * Group by
 */
export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Count by
 */
export function countBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string)
): Record<string, number> {
  return array.reduce(
    (counts, item) => {
      const countKey = typeof key === 'function' ? key(item) : String(item[key]);
      counts[countKey] = (counts[countKey] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>
  );
}

/**
 * First N elements
 */
export function take<T>(array: T[], n: number): T[] {
  return array.slice(0, n);
}

/**
 * Last N elements
 */
export function takeLast<T>(array: T[], n: number): T[] {
  return array.slice(-n);
}

/**
 * Drop first N elements
 */
export function drop<T>(array: T[], n: number): T[] {
  return array.slice(n);
}

/**
 * Drop last N elements
 */
export function dropLast<T>(array: T[], n: number): T[] {
  return array.slice(0, -n);
}

/**
 * Rotate array
 */
export function rotate<T>(array: T[], n: number): T[] {
  const len = array.length;
  const rotations = ((n % len) + len) % len;
  return [...array.slice(rotations), ...array.slice(0, rotations)];
}

/**
 * Partition array
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  return array.reduce(
    ([pass, fail], item) => (predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]]),
    [[], []] as [T[], T[]]
  );
}

/**
 * Find index of max
 */
export function maxIndex(array: number[]): number {
  return array.indexOf(Math.max(...array));
}

/**
 * Find index of min
 */
export function minIndex(array: number[]): number {
  return array.indexOf(Math.min(...array));
}

/**
 * Sum array
 */
export function sumArray(array: number[]): number {
  return array.reduce((sum, n) => sum + n, 0);
}

/**
 * Average array
 */
export function averageArray(array: number[]): number {
  return sumArray(array) / array.length;
}

/**
 * Median array
 */
export function medianArray(array: number[]): number {
  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Range
 */
export function range(start: number, end: number, step = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Times
 */
export function times<T>(n: number, fn: (index: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => fn(i));
}

/**
 * Compact (remove falsy values)
 */
export function compact<T>(array: (T | null | undefined | false | 0 | '')[]): T[] {
  return array.filter(Boolean) as T[];
}

/**
 * Move element
 */
export function move<T>(array: T[], from: number, to: number): T[] {
  const result = [...array];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

/**
 * Insert at index
 */
export function insert<T>(array: T[], index: number, ...items: T[]): T[] {
  const result = [...array];
  result.splice(index, 0, ...items);
  return result;
}

/**
 * Remove at index
 */
export function removeAt<T>(array: T[], index: number): T[] {
  return [...array.slice(0, index), ...array.slice(index + 1)];
}

/**
 * Update at index
 */
export function updateAt<T>(array: T[], index: number, value: T): T[] {
  return [...array.slice(0, index), value, ...array.slice(index + 1)];
}
