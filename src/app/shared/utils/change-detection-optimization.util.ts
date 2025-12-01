/**
 * Change detection optimization utilities
 * Review and optimize OnPush change detection strategy usage
 */

/**
 * Check if object reference changed
 */
export function hasReferenceChanged<T>(oldValue: T, newValue: T): boolean {
  return oldValue !== newValue;
}

/**
 * Check if object content changed (shallow comparison)
 */
export function hasContentChanged<T extends Record<string, any>>(
  oldValue: T,
  newValue: T
): boolean {
  if (oldValue === newValue) {
    return false;
  }

  const oldKeys = Object.keys(oldValue);
  const newKeys = Object.keys(newValue);

  if (oldKeys.length !== newKeys.length) {
    return true;
  }

  for (const key of oldKeys) {
    if (oldValue[key] !== newValue[key]) {
      return true;
    }
  }

  return false;
}

/**
 * Check if array content changed (shallow comparison)
 */
export function hasArrayContentChanged<T>(oldArray: T[], newArray: T[]): boolean {
  if (oldArray === newArray) {
    return false;
  }

  if (oldArray.length !== newArray.length) {
    return true;
  }

  for (let i = 0; i < oldArray.length; i++) {
    if (oldArray[i] !== newArray[i]) {
      return true;
    }
  }

  return false;
}

/**
 * Create immutable update (for OnPush optimization)
 */
export function createImmutableUpdate<T>(obj: T, updates: Partial<T>): T {
  return { ...obj, ...updates };
}

/**
 * Create immutable array update
 */
export function createImmutableArrayUpdate<T>(array: T[], index: number, item: T): T[] {
  const newArray = [...array];
  newArray[index] = item;
  return newArray;
}

/**
 * Create immutable array with item added
 */
export function createImmutableArrayAdd<T>(array: T[], item: T): T[] {
  return [...array, item];
}

/**
 * Create immutable array with item removed
 */
export function createImmutableArrayRemove<T>(array: T[], index: number): T[] {
  return array.filter((_, i) => i !== index);
}
