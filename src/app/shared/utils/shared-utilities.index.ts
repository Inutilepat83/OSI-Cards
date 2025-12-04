/**
 * Shared Utilities Index
 *
 * Central index for all commonly used utilities across the application.
 * These are high-level utilities that combine multiple lower-level utilities.
 *
 * @example
 * ```typescript
 * import { validateAndSanitize, safeApiCall } from '@app/shared/utils/shared-utilities.index';
 * ```
 */

import { FormValidator, Validator } from './validation.util';
import { Sanitizer } from './sanitization.util';

/**
 * Validate and sanitize user input in one call
 */
export function validateAndSanitize(
  value: string,
  validators: ((val: string) => boolean)[],
  sanitizer: (val: string) => string = Sanitizer.html
): { valid: boolean; sanitized: string; errors: string[] } {
  const errors: string[] = [];

  validators.forEach((validator, index) => {
    if (!validator(value)) {
      errors.push(`Validation ${index + 1} failed`);
    }
  });

  const sanitized = sanitizer(value);

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Validate email and sanitize
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string } {
  const valid = Validator.email(email);
  const sanitized = Sanitizer.email(email);
  return { valid, sanitized };
}

/**
 * Validate URL and sanitize
 */
export function validateUrl(url: string): { valid: boolean; sanitized: string } {
  const valid = Validator.url(url);
  const sanitized = Sanitizer.url(url);
  return { valid, sanitized };
}

/**
 * Safe JSON parse with validation
 */
export function safeJsonParse<T>(
  json: string,
  validator?: (obj: any) => obj is T
): { success: boolean; data?: T; error?: string } {
  try {
    const parsed = JSON.parse(json);

    if (validator && !validator(parsed)) {
      return { success: false, error: 'Validation failed' };
    }

    return { success: true, data: parsed as T };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Batch validate array of items
 */
export function batchValidate<T>(
  items: T[],
  validator: (item: T) => boolean
): { valid: T[]; invalid: T[]; validCount: number; invalidCount: number } {
  const valid: T[] = [];
  const invalid: T[] = [];

  items.forEach((item) => {
    if (validator(item)) {
      valid.push(item);
    } else {
      invalid.push(item);
    }
  });

  return {
    valid,
    invalid,
    validCount: valid.length,
    invalidCount: invalid.length,
  };
}

/**
 * Debounce with validation
 */
export function debounceValidate<T>(
  value: T,
  validator: (val: T) => boolean,
  delay: number,
  callback: (valid: boolean, value: T) => void
): () => void {
  let timeoutId: number | undefined;

  return () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      const valid = validator(value);
      callback(valid, value);
    }, delay);
  };
}

/**
 * Create validated form data
 */
export function createValidatedFormData(
  data: Record<string, any>,
  rules: Record<string, (val: any) => boolean>
): { valid: boolean; data: Record<string, any>; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const validatedData: Record<string, any> = {};

  Object.keys(data).forEach((key) => {
    const value = data[key];
    const rule = rules[key];

    if (rule && !rule(value)) {
      errors[key] = `Validation failed for ${key}`;
    } else {
      validatedData[key] = value;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    data: validatedData,
    errors,
  };
}

/**
 * Safe API response handler
 */
export function safeApiResponse<T>(
  response: any,
  validator?: (data: any) => data is T
): { success: boolean; data?: T; error?: string } {
  if (!response) {
    return { success: false, error: 'No response' };
  }

  if (validator && !validator(response)) {
    return { success: false, error: 'Invalid response format' };
  }

  return { success: true, data: response as T };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Memoize with TTL
 */
export function memoizeWithTTL<T extends (...args: any[]) => any>(fn: T, ttl = 60000): T {
  const cache = new Map<string, { value: ReturnType<T>; expiry: number }>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && cached.expiry > now) {
      return cached.value;
    }

    const value = fn(...args);
    cache.set(key, { value, expiry: now + ttl });

    // Cleanup expired entries
    setTimeout(() => {
      cache.forEach((entry, cacheKey) => {
        if (entry.expiry <= Date.now()) {
          cache.delete(cacheKey);
        }
      });
    }, ttl);

    return value;
  }) as T;
}

/**
 * Deep freeze object (immutability helper)
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);

  Object.keys(obj).forEach((key) => {
    const value = (obj as any)[key];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });

  return obj;
}

/**
 * Safe property access with default
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K]
): T[K] {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }
  return obj[key] ?? defaultValue;
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array
 */
export function uniqueArray<T>(array: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string | number): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = String(keyFn(item));
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Sort array by multiple keys
 */
export function sortBy<T>(array: T[], ...keys: ((item: T) => any)[]): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      const aVal = key(a);
      const bVal = key(b);

      if (aVal < bVal) {
        return -1;
      }
      if (aVal > bVal) {
        return 1;
      }
    }
    return 0;
  });
}
