/**
 * Advanced Type Guards
 *
 * Collection of type guard utilities for runtime type checking and
 * type narrowing in TypeScript.
 *
 * Features:
 * - Primitive type guards
 * - Object shape validation
 * - Array type checking
 * - Nullable type guards
 * - Custom type predicate builders
 *
 * @example
 * ```typescript
 * import { isString, isObject, hasProperty } from '@osi-cards/types';
 *
 * function process(value: unknown) {
 *   if (isString(value)) {
 *     // value is string here
 *     console.log(value.toUpperCase());
 *   }
 * }
 * ```
 */

// ============================================================================
// Primitive Type Guards
// ============================================================================

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is a symbol
 */
export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
}

/**
 * Check if value is a function
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Check if value is null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Check if value is undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Check if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if value is not null or undefined
 */
export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// ============================================================================
// Object Type Guards
// ============================================================================

/**
 * Check if value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a plain object (created with {} or new Object())
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if value is an array of specific type
 *
 * @param value - Value to check
 * @param guard - Type guard for array elements
 * @returns Type predicate
 *
 * @example
 * ```typescript
 * if (isArrayOf(value, isString)) {
 *   // value is string[]
 * }
 * ```
 */
export function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return isArray(value) && value.every(guard);
}

/**
 * Check if value is an empty object
 */
export function isEmptyObject(value: unknown): value is Record<string, never> {
  return isObject(value) && Object.keys(value).length === 0;
}

/**
 * Check if value is an empty array
 */
export function isEmptyArray(value: unknown): value is [] {
  return isArray(value) && value.length === 0;
}

/**
 * Check if object has a specific property
 *
 * @param obj - Object to check
 * @param key - Property key
 * @returns Type predicate
 *
 * @example
 * ```typescript
 * if (hasProperty(obj, 'name')) {
 *   // obj.name is accessible
 *   console.log(obj.name);
 * }
 * ```
 */
export function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * Check if object has multiple properties
 *
 * @param obj - Object to check
 * @param keys - Property keys
 * @returns Type predicate
 *
 * @example
 * ```typescript
 * if (hasProperties(obj, ['id', 'name'])) {
 *   // obj.id and obj.name are accessible
 * }
 * ```
 */
export function hasProperties<K extends string>(
  obj: unknown,
  keys: readonly K[]
): obj is Record<K, unknown> {
  if (!isObject(obj)) return false;
  return keys.every((key) => key in obj);
}

// ============================================================================
// Numeric Type Guards
// ============================================================================

/**
 * Check if value is a finite number
 */
export function isFiniteNumber(value: unknown): value is number {
  return isNumber(value) && Number.isFinite(value);
}

/**
 * Check if value is an integer
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * Check if value is a positive number
 */
export function isPositive(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Check if value is a negative number
 */
export function isNegative(value: unknown): value is number {
  return isNumber(value) && value < 0;
}

/**
 * Check if value is within range
 *
 * @param value - Value to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Type predicate
 */
export function isInRange(value: unknown, min: number, max: number): value is number {
  return isNumber(value) && value >= min && value <= max;
}

// ============================================================================
// String Type Guards
// ============================================================================

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

/**
 * Check if value matches a regex pattern
 *
 * @param value - Value to check
 * @param pattern - Regex pattern
 * @returns Type predicate
 */
export function matchesPattern(value: unknown, pattern: RegExp): value is string {
  return isString(value) && pattern.test(value);
}

/**
 * Check if value is a valid JSON string
 */
export function isJSONString(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Date Type Guards
// ============================================================================

/**
 * Check if value is a Date object
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Check if value is a valid date string
 */
export function isDateString(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

// ============================================================================
// Promise Type Guards
// ============================================================================

/**
 * Check if value is a Promise
 */
export function isPromise<T = any>(value: unknown): value is Promise<T> {
  return value instanceof Promise || (isObject(value) && isFunction((value as any).then));
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Check if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// ============================================================================
// Custom Type Builders
// ============================================================================

/**
 * Create a type guard that checks object shape
 *
 * @param shape - Object shape with type guards
 * @returns Type guard function
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   age: number;
 * }
 *
 * const isUser = createShapeGuard<User>({
 *   id: isString,
 *   name: isString,
 *   age: isNumber
 * });
 *
 * if (isUser(data)) {
 *   // data is User
 * }
 * ```
 */
export function createShapeGuard<T extends Record<string, any>>(shape: {
  [K in keyof T]: (value: unknown) => value is T[K];
}): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    if (!isObject(value)) return false;

    return (Object.keys(shape) as Array<keyof T>).every((key) => {
      const guard = shape[key];
      return guard((value as any)[key]);
    });
  };
}

/**
 * Create a type guard for union types
 *
 * @param guards - Array of type guards
 * @returns Type guard for union
 *
 * @example
 * ```typescript
 * const isStringOrNumber = createUnionGuard(isString, isNumber);
 *
 * if (isStringOrNumber(value)) {
 *   // value is string | number
 * }
 * ```
 */
export function createUnionGuard<T extends unknown[]>(
  ...guards: { [K in keyof T]: (value: unknown) => value is T[K] }
): (value: unknown) => value is T[number] {
  return (value: unknown): value is T[number] => {
    return guards.some((guard) => guard(value));
  };
}

/**
 * Create a type guard for literal values
 *
 * @param literals - Array of literal values
 * @returns Type guard for literal union
 *
 * @example
 * ```typescript
 * const isStatus = createLiteralGuard('pending', 'active', 'completed');
 *
 * if (isStatus(value)) {
 *   // value is 'pending' | 'active' | 'completed'
 * }
 * ```
 */
export function createLiteralGuard<T extends readonly (string | number | boolean)[]>(
  ...literals: T
): (value: unknown) => value is T[number] {
  return (value: unknown): value is T[number] => {
    return literals.includes(value as any);
  };
}

// ============================================================================
// Assertion Functions
// ============================================================================

/**
 * Assert that value is defined (throws if not)
 *
 * @param value - Value to assert
 * @param message - Optional error message
 * @throws {Error} If value is null or undefined
 *
 * @example
 * ```typescript
 * function process(value: string | null) {
 *   assertDefined(value);
 *   // value is string here
 * }
 * ```
 */
export function assertDefined<T>(
  value: T,
  message = 'Value must be defined'
): asserts value is NonNullable<T> {
  if (!isDefined(value)) {
    throw new Error(message);
  }
}

/**
 * Assert that value is a string (throws if not)
 *
 * @param value - Value to assert
 * @param message - Optional error message
 * @throws {Error} If value is not a string
 */
export function assertString(
  value: unknown,
  message = 'Value must be a string'
): asserts value is string {
  if (!isString(value)) {
    throw new Error(message);
  }
}

/**
 * Assert that value is a number (throws if not)
 *
 * @param value - Value to assert
 * @param message - Optional error message
 * @throws {Error} If value is not a number
 */
export function assertNumber(
  value: unknown,
  message = 'Value must be a number'
): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(message);
  }
}

/**
 * Assert that value is an object (throws if not)
 *
 * @param value - Value to assert
 * @param message - Optional error message
 * @throws {Error} If value is not an object
 */
export function assertObject(
  value: unknown,
  message = 'Value must be an object'
): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new Error(message);
  }
}

/**
 * Assert that condition is true (throws if not)
 *
 * @param condition - Condition to assert
 * @param message - Error message
 * @throws {Error} If condition is false
 *
 * @example
 * ```typescript
 * assert(user.age >= 18, 'User must be 18 or older');
 * ```
 */
export function assert(condition: boolean, message = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Assert that value is never (exhaustiveness check)
 *
 * @param value - Value that should be never
 * @param message - Optional error message
 * @throws {Error} Always throws
 *
 * @example
 * ```typescript
 * function handle(status: 'active' | 'inactive') {
 *   switch (status) {
 *     case 'active': return handleActive();
 *     case 'inactive': return handleInactive();
 *     default: assertNever(status); // Ensures all cases handled
 *   }
 * }
 * ```
 */
export function assertNever(
  value: never,
  message = `Unexpected value: ${JSON.stringify(value)}`
): never {
  throw new Error(message);
}



