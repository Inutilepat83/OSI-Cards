/**
 * Data Transformation Utilities
 *
 * Collection of utilities for transforming and manipulating data structures,
 * including array operations, object transformations, and data normalization.
 *
 * Features:
 * - Array transformations
 * - Object deep operations
 * - Data normalization
 * - Type-safe transformations
 *
 * @example
 * ```typescript
 * import { groupBy, partition, deepClone } from '@osi-cards/utils';
 *
 * const byCategory = groupBy(items, item => item.category);
 * const [active, inactive] = partition(users, user => user.isActive);
 * const copy = deepClone(original);
 * ```
 */

/**
 * Group array by key function
 *
 * @param items - Array to group
 * @param keyFn - Function to generate group key
 * @returns Map of key to items
 *
 * @example
 * ```typescript
 * const users = [
 *   { name: 'Alice', role: 'admin' },
 *   { name: 'Bob', role: 'user' },
 *   { name: 'Charlie', role: 'admin' }
 * ];
 *
 * const byRole = groupBy(users, u => u.role);
 * // Map { 'admin' => [...], 'user' => [...] }
 * ```
 */
export function groupBy<T, K>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();

  items.forEach(item => {
    const key = keyFn(item);
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  });

  return map;
}

/**
 * Partition array by predicate
 *
 * @param items - Array to partition
 * @param predicate - Function to test items
 * @returns Tuple of [matching, non-matching] arrays
 *
 * @example
 * ```typescript
 * const [adults, children] = partition(users, u => u.age >= 18);
 * ```
 */
export function partition<T>(
  items: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const matching: T[] = [];
  const nonMatching: T[] = [];

  items.forEach(item => {
    if (predicate(item)) {
      matching.push(item);
    } else {
      nonMatching.push(item);
    }
  });

  return [matching, nonMatching];
}

/**
 * Deep clone an object
 *
 * @param obj - Object to clone
 * @returns Deep cloned object
 *
 * @example
 * ```typescript
 * const copy = deepClone(original);
 * copy.nested.value = 'changed'; // Doesn't affect original
 * ```
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }

  if (obj instanceof Map) {
    const cloned = new Map();
    obj.forEach((value, key) => {
      cloned.set(deepClone(key), deepClone(value));
    });
    return cloned as any;
  }

  if (obj instanceof Set) {
    const cloned = new Set();
    obj.forEach(value => {
      cloned.add(deepClone(value));
    });
    return cloned as any;
  }

  // Plain object
  const cloned: any = {};
  Object.keys(obj).forEach(key => {
    cloned[key] = deepClone((obj as any)[key]);
  });

  return cloned;
}

/**
 * Deep merge objects
 *
 * @param target - Target object
 * @param sources - Source objects to merge
 * @returns Merged object
 *
 * @example
 * ```typescript
 * const merged = deepMerge(
 *   { a: { b: 1 } },
 *   { a: { c: 2 } }
 * );
 * // { a: { b: 1, c: 2 } }
 * ```
 */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;

  const source = sources.shift();

  if (source === undefined) {
    return target;
  }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = (source as any)[key];
      const targetValue = (target as any)[key];

      if (isObject(sourceValue)) {
        if (!targetValue || !isObject(targetValue)) {
          (target as any)[key] = {};
        }
        (target as any)[key] = deepMerge(targetValue, sourceValue);
      } else {
        (target as any)[key] = sourceValue;
      }
    });
  }

  return deepMerge(target, ...sources);
}

function isObject(item: any): item is object {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Pick properties from object
 *
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns Object with only picked keys
 *
 * @example
 * ```typescript
 * const user = { id: 1, name: 'Alice', email: 'alice@example.com', password: '***' };
 * const safe = pick(user, ['id', 'name', 'email']);
 * // { id: 1, name: 'Alice', email: 'alice@example.com' }
 * ```
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });

  return result;
}

/**
 * Omit properties from object
 *
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns Object without omitted keys
 *
 * @example
 * ```typescript
 * const user = { id: 1, name: 'Alice', password: '***' };
 * const safe = omit(user, ['password']);
 * // { id: 1, name: 'Alice' }
 * ```
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };

  keys.forEach(key => {
    delete result[key];
  });

  return result;
}

/**
 * Flatten nested array
 *
 * @param arr - Nested array
 * @param depth - Depth to flatten (default: Infinity)
 * @returns Flattened array
 *
 * @example
 * ```typescript
 * const nested = [1, [2, [3, [4]]]];
 * const flat = flatten(nested);
 * // [1, 2, 3, 4]
 * ```
 */
export function flatten<T>(arr: any[], depth = Infinity): T[] {
  if (depth === 0) return arr;

  return arr.reduce((acc, item) => {
    if (Array.isArray(item)) {
      return acc.concat(flatten(item, depth - 1));
    }
    return acc.concat(item);
  }, []);
}

/**
 * Unique array values
 *
 * @param arr - Array with potential duplicates
 * @param keyFn - Optional function to generate comparison key
 * @returns Array with unique values
 *
 * @example
 * ```typescript
 * const unique = uniq([1, 2, 2, 3, 3, 3]);
 * // [1, 2, 3]
 *
 * const uniqueUsers = uniq(users, u => u.id);
 * ```
 */
export function uniq<T>(arr: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return Array.from(new Set(arr));
  }

  const seen = new Set();
  return arr.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Chunk array into smaller arrays
 *
 * @param arr - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 *
 * @example
 * ```typescript
 * const chunks = chunk([1, 2, 3, 4, 5], 2);
 * // [[1, 2], [3, 4], [5]]
 * ```
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }

  return chunks;
}

/**
 * Sort array by key function
 *
 * @param arr - Array to sort
 * @param keyFn - Function to generate sort key
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array (new array)
 *
 * @example
 * ```typescript
 * const sorted = sortBy(users, u => u.name, 'asc');
 * ```
 */
export function sortBy<T>(
  arr: T[],
  keyFn: (item: T) => any,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const sorted = [...arr].sort((a, b) => {
    const aKey = keyFn(a);
    const bKey = keyFn(b);

    if (aKey < bKey) return order === 'asc' ? -1 : 1;
    if (aKey > bKey) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Sum array values
 *
 * @param arr - Array of numbers or objects
 * @param keyFn - Optional function to extract number
 * @returns Sum
 *
 * @example
 * ```typescript
 * const total = sum([1, 2, 3, 4, 5]); // 15
 * const totalPrice = sum(items, item => item.price);
 * ```
 */
export function sum<T>(arr: T[], keyFn?: (item: T) => number): number {
  if (!keyFn) {
    return (arr as number[]).reduce((sum, n) => sum + n, 0);
  }

  return arr.reduce((sum, item) => sum + keyFn(item), 0);
}

/**
 * Get property value by path
 *
 * @param obj - Object to query
 * @param path - Property path (dot notation)
 * @param defaultValue - Default value if not found
 * @returns Property value
 *
 * @example
 * ```typescript
 * const name = get(user, 'profile.name', 'Unknown');
 * ```
 */
export function get<T = any>(
  obj: any,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
}

/**
 * Set property value by path
 *
 * @param obj - Object to modify
 * @param path - Property path (dot notation)
 * @param value - Value to set
 *
 * @example
 * ```typescript
 * set(user, 'profile.name', 'Alice');
 * ```
 */
export function set(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
}

/**
 * Compact array (remove falsy values)
 *
 * @param arr - Array to compact
 * @returns Array without falsy values
 *
 * @example
 * ```typescript
 * const compacted = compact([1, 0, '', 'hello', null, undefined, false, 2]);
 * // [1, 'hello', 2]
 * ```
 */
export function compact<T>(arr: (T | null | undefined | false | 0 | '')[]): T[] {
  return arr.filter(Boolean) as T[];
}

/**
 * Create object from entries
 *
 * @param entries - Array of [key, value] tuples
 * @returns Object
 *
 * @example
 * ```typescript
 * const obj = fromEntries([['a', 1], ['b', 2]]);
 * // { a: 1, b: 2 }
 * ```
 */
export function fromEntries<K extends string | number | symbol, V>(
  entries: Array<[K, V]>
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

/**
 * Map object values
 *
 * @param obj - Object to map
 * @param mapper - Mapper function
 * @returns New object with mapped values
 *
 * @example
 * ```typescript
 * const doubled = mapValues({ a: 1, b: 2 }, v => v * 2);
 * // { a: 2, b: 4 }
 * ```
 */
export function mapValues<T extends object, R>(
  obj: T,
  mapper: (value: T[keyof T], key: keyof T) => R
): Record<keyof T, R> {
  const result = {} as Record<keyof T, R>;

  (Object.keys(obj) as Array<keyof T>).forEach(key => {
    result[key] = mapper(obj[key], key);
  });

  return result;
}

/**
 * Map object keys
 *
 * @param obj - Object to map
 * @param mapper - Mapper function
 * @returns New object with mapped keys
 *
 * @example
 * ```typescript
 * const prefixed = mapKeys({ a: 1, b: 2 }, k => `prefix_${k}`);
 * // { prefix_a: 1, prefix_b: 2 }
 * ```
 */
export function mapKeys<T extends object, K extends string>(
  obj: T,
  mapper: (key: keyof T) => K
): Record<K, T[keyof T]> {
  const result = {} as Record<K, T[keyof T]>;

  (Object.keys(obj) as Array<keyof T>).forEach(key => {
    const newKey = mapper(key);
    result[newKey] = obj[key];
  });

  return result;
}

/**
 * Invert object (swap keys and values)
 *
 * @param obj - Object to invert
 * @returns Inverted object
 *
 * @example
 * ```typescript
 * const inverted = invert({ a: '1', b: '2' });
 * // { '1': 'a', '2': 'b' }
 * ```
 */
export function invert<K extends string, V extends string>(
  obj: Record<K, V>
): Record<V, K> {
  const result = {} as Record<V, K>;

  (Object.keys(obj) as K[]).forEach(key => {
    const value = obj[key];
    result[value] = key;
  });

  return result;
}

/**
 * Find item in array by predicate
 *
 * @param arr - Array to search
 * @param predicate - Predicate function
 * @returns Found item or undefined
 */
export function findItem<T>(
  arr: T[],
  predicate: (item: T) => boolean
): T | undefined {
  return arr.find(predicate);
}

/**
 * Remove item from array (immutable)
 *
 * @param arr - Source array
 * @param predicate - Predicate to find item
 * @returns New array without item
 *
 * @example
 * ```typescript
 * const newArray = removeItem(items, item => item.id === 3);
 * ```
 */
export function removeItem<T>(
  arr: T[],
  predicate: (item: T) => boolean
): T[] {
  return arr.filter(item => !predicate(item));
}

/**
 * Update item in array (immutable)
 *
 * @param arr - Source array
 * @param predicate - Predicate to find item
 * @param updater - Function to update item
 * @returns New array with updated item
 *
 * @example
 * ```typescript
 * const updated = updateItem(
 *   users,
 *   u => u.id === userId,
 *   u => ({ ...u, name: 'New Name' })
 * );
 * ```
 */
export function updateItem<T>(
  arr: T[],
  predicate: (item: T) => boolean,
  updater: (item: T) => T
): T[] {
  return arr.map(item => (predicate(item) ? updater(item) : item));
}

/**
 * Toggle item in array
 *
 * @param arr - Source array
 * @param item - Item to toggle
 * @returns New array with item toggled
 *
 * @example
 * ```typescript
 * const tags = ['js', 'ts'];
 * const withReact = toggleItem(tags, 'react');
 * // ['js', 'ts', 'react']
 * const withoutJs = toggleItem(withReact, 'js');
 * // ['ts', 'react']
 * ```
 */
export function toggleItem<T>(arr: T[], item: T): T[] {
  const index = arr.indexOf(item);

  if (index === -1) {
    return [...arr, item];
  }

  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

/**
 * Move item in array
 *
 * @param arr - Source array
 * @param from - From index
 * @param to - To index
 * @returns New array with moved item
 *
 * @example
 * ```typescript
 * const reordered = moveItem([1, 2, 3, 4], 0, 3);
 * // [2, 3, 4, 1]
 * ```
 */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const item = copy.splice(from, 1)[0];
  copy.splice(to, 0, item);
  return copy;
}

/**
 * Normalize data by ID
 *
 * @param items - Array of items with IDs
 * @param idKey - Key that contains ID
 * @returns Normalized data structure
 *
 * @example
 * ```typescript
 * const users = [
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' }
 * ];
 *
 * const normalized = normalize(users, 'id');
 * // {
 * //   byId: { 1: {...}, 2: {...} },
 * //   allIds: [1, 2]
 * // }
 * ```
 */
export function normalize<T extends Record<K, string | number>, K extends keyof T>(
  items: T[],
  idKey: K
): {
  byId: Record<string, T>;
  allIds: Array<T[K]>;
} {
  const byId: Record<string, T> = {};
  const allIds: Array<T[K]> = [];

  items.forEach(item => {
    const id = item[idKey];
    byId[String(id)] = item;
    allIds.push(id);
  });

  return { byId, allIds };
}

/**
 * Denormalize data
 *
 * @param normalized - Normalized data structure
 * @returns Array of items
 *
 * @example
 * ```typescript
 * const users = denormalize(normalizedUsers);
 * ```
 */
export function denormalize<T>(normalized: {
  byId: Record<string, T>;
  allIds: Array<string | number>;
}): T[] {
  return normalized.allIds.map(id => normalized.byId[String(id)]);
}

/**
 * Zip multiple arrays together
 *
 * @param arrays - Arrays to zip
 * @returns Array of tuples
 *
 * @example
 * ```typescript
 * const zipped = zip([1, 2, 3], ['a', 'b', 'c']);
 * // [[1, 'a'], [2, 'b'], [3, 'c']]
 * ```
 */
export function zip<T extends any[][]>(...arrays: T): Array<{ [K in keyof T]: T[K][number] }> {
  const minLength = Math.min(...arrays.map(arr => arr.length));
  const result: any[] = [];

  for (let i = 0; i < minLength; i++) {
    result.push(arrays.map(arr => arr[i]));
  }

  return result;
}

/**
 * Index array by key function
 *
 * @param arr - Array to index
 * @param keyFn - Function to generate index key
 * @returns Map of key to item
 *
 * @example
 * ```typescript
 * const byId = indexBy(users, u => u.id);
 * const user = byId.get(123);
 * ```
 */
export function indexBy<T, K>(
  arr: T[],
  keyFn: (item: T) => K
): Map<K, T> {
  const map = new Map<K, T>();

  arr.forEach(item => {
    const key = keyFn(item);
    map.set(key, item);
  });

  return map;
}

/**
 * Count occurrences in array
 *
 * @param arr - Array to count
 * @param keyFn - Optional function to generate count key
 * @returns Map of value to count
 *
 * @example
 * ```typescript
 * const counts = countBy(['a', 'b', 'a', 'c', 'a']);
 * // Map { 'a' => 3, 'b' => 1, 'c' => 1 }
 * ```
 */
export function countBy<T>(
  arr: T[],
  keyFn?: (item: T) => any
): Map<any, number> {
  const map = new Map<any, number>();

  arr.forEach(item => {
    const key = keyFn ? keyFn(item) : item;
    const count = map.get(key) || 0;
    map.set(key, count + 1);
  });

  return map;
}

/**
 * Difference between two arrays
 *
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns Items in arr1 not in arr2
 *
 * @example
 * ```typescript
 * const diff = difference([1, 2, 3, 4], [2, 4]);
 * // [1, 3]
 * ```
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter(item => !set2.has(item));
}

/**
 * Intersection of two arrays
 *
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns Items in both arrays
 *
 * @example
 * ```typescript
 * const common = intersection([1, 2, 3], [2, 3, 4]);
 * // [2, 3]
 * ```
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter(item => set2.has(item));
}

