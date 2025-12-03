/**
 * JSON Utilities
 *
 * Safe JSON parsing and stringification with error handling.
 *
 * @example
 * ```typescript
 * import { safeJSONParse, prettyJSON } from '@osi-cards/utils';
 *
 * const data = safeJSONParse(jsonString);
 * const formatted = prettyJSON(obj);
 * ```
 */

/**
 * Safe JSON parse
 */
export function safeJSONParse<T = any>(json: string, defaultValue?: T): T | undefined {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Safe JSON stringify
 */
export function safeJSONStringify(obj: any, defaultValue = ''): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
}

/**
 * Pretty JSON
 */
export function prettyJSON(obj: any, indent = 2): string {
  return JSON.stringify(obj, null, indent);
}

/**
 * Deep clone via JSON
 */
export function jsonClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Is valid JSON
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON safely with validation
 */
export function parseJSONWithValidation<T>(
  json: string,
  validator: (obj: any) => obj is T
): T | null {
  try {
    const obj = JSON.parse(json);
    return validator(obj) ? obj : null;
  } catch {
    return null;
  }
}

/**
 * Stringify with circular reference handling
 */
export function stringifyWithCircular(obj: any, indent?: number): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  }, indent);
}

/**
 * Compare JSON objects
 */
export function jsonEquals(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * JSON diff (simple)
 */
export function jsonDiff(obj1: any, obj2: any): any {
  const diff: any = {};

  Object.keys(obj1).forEach(key => {
    if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      diff[key] = { old: obj1[key], new: obj2[key] };
    }
  });

  Object.keys(obj2).forEach(key => {
    if (!(key in obj1)) {
      diff[key] = { old: undefined, new: obj2[key] };
    }
  });

  return diff;
}

