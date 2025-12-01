/**
 * Input Coercion Utilities
 *
 * Provides type coercion functions for Angular component inputs.
 * These work with Angular's input transform feature to safely convert
 * string attributes to their proper types.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   // Boolean coercion: "true", "", present = true; "false", absent = false
 *   @Input({ transform: coerceBoolean }) disabled = false;
 *
 *   // Number coercion with fallback
 *   @Input({ transform: coerceNumber(0) }) count = 0;
 *
 *   // String array from comma-separated
 *   @Input({ transform: coerceStringArray }) tags: string[] = [];
 * }
 * ```
 *
 * @module utils/input-coercion
 */

// ============================================================================
// BOOLEAN COERCION
// ============================================================================

/**
 * Values that should be treated as true
 */
const TRUTHY_VALUES = new Set(['', 'true', '1', 'yes', 'on']);

/**
 * Coerce a value to boolean.
 *
 * Handles HTML attribute behavior where presence means true:
 * - `<my-comp disabled>` → `disabled=""` → true
 * - `<my-comp disabled="true">` → true
 * - `<my-comp disabled="false">` → false
 * - `<my-comp>` → absent → false
 *
 * @param value - Value to coerce
 * @returns Boolean value
 *
 * @example
 * ```typescript
 * @Input({ transform: coerceBoolean }) disabled = false;
 * ```
 */
export function coerceBoolean(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return TRUTHY_VALUES.has(value.toLowerCase().trim());
  }

  return Boolean(value);
}

/**
 * Create a boolean coercer with a default value
 *
 * @param defaultValue - Default value when input is null/undefined
 * @returns Coercion function
 */
export function coerceBooleanWithDefault(defaultValue: boolean) {
  return (value: unknown): boolean => {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return coerceBoolean(value);
  };
}

// ============================================================================
// NUMBER COERCION
// ============================================================================

/**
 * Coerce a value to number.
 *
 * @param value - Value to coerce
 * @param fallback - Fallback value for NaN results (default: 0)
 * @returns Number value
 *
 * @example
 * ```typescript
 * @Input({ transform: (v) => coerceNumber(v, 0) }) count = 0;
 * ```
 */
export function coerceNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? fallback : value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
}

/**
 * Create a number coercer with a specific fallback
 *
 * @param fallback - Fallback value for invalid inputs
 * @returns Coercion function
 *
 * @example
 * ```typescript
 * @Input({ transform: coerceNumberFactory(100) }) timeout = 100;
 * ```
 */
export function coerceNumberFactory(fallback: number) {
  return (value: unknown): number => coerceNumber(value, fallback);
}

/**
 * Coerce to integer
 *
 * @param value - Value to coerce
 * @param fallback - Fallback value
 * @returns Integer value
 */
export function coerceInteger(value: unknown, fallback = 0): number {
  const num = coerceNumber(value, fallback);
  return Math.round(num);
}

/**
 * Create an integer coercer with a specific fallback
 */
export function coerceIntegerFactory(fallback: number) {
  return (value: unknown): number => coerceInteger(value, fallback);
}

/**
 * Coerce to a number within a range
 *
 * @param value - Value to coerce
 * @param min - Minimum value
 * @param max - Maximum value
 * @param fallback - Fallback value
 * @returns Clamped number value
 */
export function coerceNumberInRange(
  value: unknown,
  min: number,
  max: number,
  fallback?: number
): number {
  const num = coerceNumber(value, fallback ?? min);
  return Math.max(min, Math.min(max, num));
}

/**
 * Create a range-constrained number coercer
 */
export function coerceNumberInRangeFactory(
  min: number,
  max: number,
  fallback?: number
) {
  return (value: unknown): number => coerceNumberInRange(value, min, max, fallback);
}

// ============================================================================
// STRING COERCION
// ============================================================================

/**
 * Coerce a value to string
 *
 * @param value - Value to coerce
 * @param fallback - Fallback value for null/undefined
 * @returns String value
 */
export function coerceString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value;
  }

  return String(value);
}

/**
 * Create a string coercer with a specific fallback
 */
export function coerceStringFactory(fallback: string) {
  return (value: unknown): string => coerceString(value, fallback);
}

/**
 * Coerce to trimmed string
 */
export function coerceTrimmedString(value: unknown, fallback = ''): string {
  return coerceString(value, fallback).trim();
}

/**
 * Coerce to lowercase string
 */
export function coerceLowercaseString(value: unknown, fallback = ''): string {
  return coerceString(value, fallback).toLowerCase();
}

/**
 * Coerce to uppercase string
 */
export function coerceUppercaseString(value: unknown, fallback = ''): string {
  return coerceString(value, fallback).toUpperCase();
}

// ============================================================================
// ARRAY COERCION
// ============================================================================

/**
 * Coerce a value to string array
 *
 * Handles:
 * - Arrays: returns as-is (mapped to strings)
 * - Strings: splits by separator (default: comma)
 * - Null/undefined: returns empty array
 *
 * @param value - Value to coerce
 * @param separator - Separator for string splitting (default: ',')
 * @returns String array
 *
 * @example
 * ```typescript
 * @Input({ transform: coerceStringArray }) tags: string[] = [];
 * // <my-comp tags="a,b,c"> → ['a', 'b', 'c']
 * ```
 */
export function coerceStringArray(
  value: unknown,
  separator: string | RegExp = ','
): string[] {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(v => v.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(separator)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  return [String(value)];
}

/**
 * Create a string array coercer with a specific separator
 */
export function coerceStringArrayFactory(separator: string | RegExp = ',') {
  return (value: unknown): string[] => coerceStringArray(value, separator);
}

/**
 * Coerce a value to number array
 *
 * @param value - Value to coerce
 * @param separator - Separator for string splitting
 * @returns Number array (NaN values filtered out)
 */
export function coerceNumberArray(
  value: unknown,
  separator: string | RegExp = ','
): number[] {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
      .filter(n => !isNaN(n));
  }

  if (typeof value === 'string') {
    return value
      .split(separator)
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n));
  }

  const num = parseFloat(String(value));
  return isNaN(num) ? [] : [num];
}

/**
 * Create a number array coercer with a specific separator
 */
export function coerceNumberArrayFactory(separator: string | RegExp = ',') {
  return (value: unknown): number[] => coerceNumberArray(value, separator);
}

// ============================================================================
// ENUM COERCION
// ============================================================================

/**
 * Coerce a value to an enum member
 *
 * @param value - Value to coerce
 * @param validValues - Set or array of valid values
 * @param fallback - Fallback value for invalid inputs
 * @returns Valid enum value or fallback
 *
 * @example
 * ```typescript
 * type Size = 'sm' | 'md' | 'lg';
 * const SIZES: Size[] = ['sm', 'md', 'lg'];
 *
 * @Input({ transform: (v) => coerceEnum(v, SIZES, 'md') }) size: Size = 'md';
 * ```
 */
export function coerceEnum<T extends string | number>(
  value: unknown,
  validValues: readonly T[] | Set<T>,
  fallback: T
): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  const coercedValue = typeof fallback === 'number'
    ? coerceNumber(value, fallback as number)
    : coerceString(value, fallback as string);

  const valueSet = validValues instanceof Set
    ? validValues
    : new Set(validValues);

  return valueSet.has(coercedValue as T) ? (coercedValue as T) : fallback;
}

/**
 * Create an enum coercer for a specific set of values
 */
export function coerceEnumFactory<T extends string | number>(
  validValues: readonly T[] | Set<T>,
  fallback: T
) {
  return (value: unknown): T => coerceEnum(value, validValues, fallback);
}

// ============================================================================
// OBJECT COERCION
// ============================================================================

/**
 * Coerce a value to an object (from JSON string)
 *
 * @param value - Value to coerce
 * @param fallback - Fallback value for invalid inputs
 * @returns Parsed object or fallback
 */
export function coerceObject<T extends object>(
  value: unknown,
  fallback: T
): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'object' && value !== null) {
    return value as T;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/**
 * Create an object coercer with a specific fallback
 */
export function coerceObjectFactory<T extends object>(fallback: T) {
  return (value: unknown): T => coerceObject(value, fallback);
}

// ============================================================================
// CSS VALUE COERCION
// ============================================================================

/**
 * Coerce a value to a CSS pixel value
 *
 * @param value - Value to coerce (number or string with unit)
 * @param fallback - Fallback value
 * @returns CSS pixel string (e.g., '100px')
 *
 * @example
 * ```typescript
 * @Input({ transform: coerceCssPixelValue }) width = '100px';
 * // <my-comp width="200"> → '200px'
 * // <my-comp width="200px"> → '200px'
 * ```
 */
export function coerceCssPixelValue(value: unknown, fallback = '0px'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'number') {
    return `${value}px`;
  }

  if (typeof value === 'string') {
    // If it already has a unit, return as-is
    if (/^\d+(\.\d+)?(px|em|rem|%|vh|vw|vmin|vmax|ch|ex)$/i.test(value)) {
      return value;
    }

    // Otherwise, try to parse as number and add px
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return `${num}px`;
    }
  }

  return fallback;
}

/**
 * Create a CSS pixel value coercer with a specific fallback
 */
export function coerceCssPixelValueFactory(fallback: string) {
  return (value: unknown): string => coerceCssPixelValue(value, fallback);
}

// ============================================================================
// DATE COERCION
// ============================================================================

/**
 * Coerce a value to Date
 *
 * @param value - Value to coerce
 * @param fallback - Fallback date
 * @returns Date object
 */
export function coerceDate(value: unknown, fallback?: Date): Date | null {
  if (value === null || value === undefined || value === '') {
    return fallback ?? null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? (fallback ?? null) : value;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? (fallback ?? null) : date;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? (fallback ?? null) : date;
  }

  return fallback ?? null;
}

/**
 * Create a date coercer with a specific fallback
 */
export function coerceDateFactory(fallback?: Date) {
  return (value: unknown): Date | null => coerceDate(value, fallback);
}

// ============================================================================
// TYPE NARROWING HELPERS
// ============================================================================

/**
 * Check if a value is a non-null object
 */
export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a finite number
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

/**
 * Check if a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

/**
 * Check if a value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}



