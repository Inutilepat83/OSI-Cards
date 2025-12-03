/**
 * Object Utilities
 *
 * Extended object manipulation utilities.
 *
 * @example
 * ```typescript
 * import { deepFreeze, isEmpty, hasPath } from '@osi-cards/utils';
 *
 * const frozen = deepFreeze(obj);
 * const empty = isEmpty(obj);
 * const exists = hasPath(obj, 'user.profile.name');
 * ```
 */

/**
 * Deep freeze object
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = (obj as any)[prop];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });

  return obj;
}

/**
 * Is empty object
 */
export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * Has path in object
 */
export function hasPath(obj: any, path: string): boolean {
  return getPath(obj, path) !== undefined;
}

/**
 * Get value at path
 */
export function getPath(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current?.[key] === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  return current;
}

/**
 * Set value at path
 */
export function setPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
}

/**
 * Delete path
 */
export function deletePath(obj: any, path: string): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (!current[key]) return;
    current = current[key];
  }

  delete current[lastKey];
}

/**
 * Map object values
 */
export function mapValues<T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {};

  Object.entries(obj).forEach(([key, value]) => {
    result[key] = fn(value, key);
  });

  return result;
}

/**
 * Map object keys
 */
export function mapKeys<T>(
  obj: Record<string, T>,
  fn: (key: string, value: T) => string
): Record<string, T> {
  const result: Record<string, T> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = fn(key, value);
    result[newKey] = value;
  });

  return result;
}

/**
 * Filter object
 */
export function filterObject<T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean
): Record<string, T> {
  const result: Record<string, T> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (predicate(value, key)) {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Invert object (swap keys and values)
 */
export function invert<T extends Record<string, string | number>>(obj: T): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(obj).forEach(([key, value]) => {
    result[String(value)] = key;
  });

  return result;
}

/**
 * Flatten object
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  });

  return result;
}

/**
 * Unflatten object
 */
export function unflattenObject(obj: Record<string, any>): any {
  const result: any = {};

  Object.entries(obj).forEach(([key, value]) => {
    setPath(result, key, value);
  });

  return result;
}

/**
 * Object size (number of keys)
 */
export function objectSize(obj: any): number {
  return Object.keys(obj).length;
}

/**
 * Object equals (deep)
 */
export function objectEquals(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

