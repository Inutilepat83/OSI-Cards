/**
 * Discriminated Union Utilities
 *
 * Type utilities for working with discriminated unions (tagged unions)
 * in TypeScript, providing better type safety and exhaustiveness checking.
 *
 * Features:
 * - Type narrowing helpers
 * - Exhaustive switch checking
 * - Union builders
 * - Matcher pattern
 *
 * @example
 * ```typescript
 * import { match, exhaustive } from '@osi-cards/types';
 *
 * type Result =
 *   | { type: 'success'; data: string }
 *   | { type: 'error'; error: Error }
 *   | { type: 'loading' };
 *
 * const message = match(result, {
 *   success: (r) => `Got: ${r.data}`,
 *   error: (r) => `Error: ${r.error.message}`,
 *   loading: () => 'Loading...'
 * });
 * ```
 */

/**
 * Extract discriminant type from discriminated union
 *
 * @example
 * ```typescript
 * type Action =
 *   | { type: 'add'; value: number }
 *   | { type: 'subtract'; value: number };
 *
 * type ActionType = DiscriminantType<Action, 'type'>;
 * // 'add' | 'subtract'
 * ```
 */
export type DiscriminantType<T, K extends keyof T> = T[K];

/**
 * Extract union member by discriminant value
 *
 * @example
 * ```typescript
 * type Action =
 *   | { type: 'add'; value: number }
 *   | { type: 'subtract'; value: number };
 *
 * type AddAction = ExtractByDiscriminant<Action, 'type', 'add'>;
 * // { type: 'add'; value: number }
 * ```
 */
export type ExtractByDiscriminant<
  T,
  K extends keyof T,
  V extends T[K]
> = T extends Record<K, V> ? T : never;

/**
 * Exhaustive type checker
 *
 * @param value - Value that should be never
 * @returns Never
 * @throws {Error} Always throws if reached
 *
 * @example
 * ```typescript
 * function handle(action: Action) {
 *   switch (action.type) {
 *     case 'add': return action.value + 1;
 *     case 'subtract': return action.value - 1;
 *     default: return exhaustive(action); // Compile error if case missing
 *   }
 * }
 * ```
 */
export function exhaustive(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

/**
 * Type-safe matcher for discriminated unions
 *
 * @param value - Discriminated union value
 * @param matchers - Object with handlers for each case
 * @param key - Discriminant key (default: 'type')
 * @returns Result of matched handler
 *
 * @example
 * ```typescript
 * type Result =
 *   | { status: 'success'; data: string }
 *   | { status: 'error'; error: Error };
 *
 * const message = match(result, {
 *   success: (r) => r.data,
 *   error: (r) => r.error.message
 * }, 'status');
 * ```
 */
export function match<
  T extends Record<string, string>,
  R = any
>(
  value: T,
  matchers: Record<string, (value: any) => R>,
  key = 'type'
): R {
  const discriminant = value[key];
  const matcher = matchers[discriminant];

  if (!matcher) {
    throw new Error(`No matcher for discriminant: ${String(discriminant)}`);
  }

  return matcher(value);
}

/**
 * Create type guard for discriminated union member
 *
 * @param key - Discriminant key
 * @param value - Discriminant value
 * @returns Type guard function
 *
 * @example
 * ```typescript
 * type Action =
 *   | { type: 'add'; value: number }
 *   | { type: 'subtract'; value: number };
 *
 * const isAddAction = isUnionMember<Action, 'type', 'add'>('type', 'add');
 *
 * if (isAddAction(action)) {
 *   // action is { type: 'add'; value: number }
 * }
 * ```
 */
export function isUnionMember<
  T extends Record<K, string>,
  K extends keyof T,
  V extends T[K]
>(
  key: K,
  value: V
): (obj: T) => obj is ExtractByDiscriminant<T, K, V> {
  return (obj: T): obj is ExtractByDiscriminant<T, K, V> => {
    return obj[key] === value;
  };
}

/**
 * Pattern matching with default case
 *
 * @param value - Discriminated union value
 * @param matchers - Partial matchers with default
 * @param key - Discriminant key (default: 'type')
 * @returns Result of matched handler or default
 *
 * @example
 * ```typescript
 * const result = matchWithDefault(action, {
 *   add: (a) => a.value + 1,
 *   default: () => 0
 * }, 'type');
 * ```
 */
export function matchWithDefault<
  T extends Record<string, string>,
  R = any
>(
  value: T,
  matchers: Record<string, (value: any) => R> & {
    default: (value: T) => R;
  },
  key = 'type'
): R {
  const discriminant = value[key];
  const matcher = matchers[discriminant] || matchers.default;

  return matcher(value);
}

/**
 * Narrow discriminated union
 *
 * @param value - Union value
 * @param key - Discriminant key
 * @param expectedValue - Expected discriminant value
 * @returns Type predicate
 *
 * @example
 * ```typescript
 * if (narrow(result, 'status', 'success')) {
 *   // result is { status: 'success'; data: string }
 *   console.log(result.data);
 * }
 * ```
 */
export function narrow<
  T extends Record<K, string>,
  K extends keyof T,
  V extends T[K]
>(
  value: T,
  key: K,
  expectedValue: V
): value is ExtractByDiscriminant<T, K, V> {
  return value[key] === expectedValue;
}

/**
 * Filter array to specific union member
 *
 * @param items - Array of union items
 * @param key - Discriminant key
 * @param value - Discriminant value to filter by
 * @returns Filtered array
 *
 * @example
 * ```typescript
 * const actions: Action[] = [...];
 * const addActions = filterUnion(actions, 'type', 'add');
 * // addActions has type { type: 'add'; value: number }[]
 * ```
 */
export function filterUnion<
  T extends Record<K, string>,
  K extends keyof T,
  V extends T[K]
>(
  items: T[],
  key: K,
  value: V
): Array<ExtractByDiscriminant<T, K, V>> {
  return items.filter(
    (item): item is ExtractByDiscriminant<T, K, V> => item[key] === value
  );
}

/**
 * Group array by discriminant
 *
 * @param items - Array of union items
 * @param key - Discriminant key
 * @returns Map of discriminant value to items
 *
 * @example
 * ```typescript
 * const actions: Action[] = [...];
 * const grouped = groupByDiscriminant(actions, 'type');
 * // Map<'add' | 'subtract', Action[]>
 * ```
 */
export function groupByDiscriminant<
  T extends Record<K, string>,
  K extends keyof T
>(
  items: T[],
  key: K
): Map<T[K], T[]> {
  const map = new Map<T[K], T[]>();

  items.forEach(item => {
    const discriminant = item[key];
    const group = map.get(discriminant) || [];
    group.push(item);
    map.set(discriminant, group);
  });

  return map;
}

/**
 * Transform discriminated union
 *
 * @param value - Union value
 * @param transformers - Transformer for each case
 * @param key - Discriminant key (default: 'type')
 * @returns Transformed value
 *
 * @example
 * ```typescript
 * const newResult = transform(result, {
 *   success: (r) => ({ ...r, data: r.data.toUpperCase() }),
 *   error: (r) => r,
 *   loading: (r) => r
 * }, 'status');
 * ```
 */
export function transform<T extends Record<string, string>, R = any>(
  value: T,
  transformers: Record<string, (value: any) => R>,
  key = 'type'
): R {
  const discriminant = value[key];
  const transformer = transformers[discriminant];

  if (!transformer) {
    throw new Error(`No transformer for discriminant: ${String(discriminant)}`);
  }

  return transformer(value);
}

/**
 * Example discriminated union types
 */

/**
 * Result type for operations that can succeed or fail
 */
export type Result<T, E = Error> =
  | { type: 'success'; value: T }
  | { type: 'error'; error: E };

/**
 * Loading state type
 */
export type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

/**
 * Remote data type
 */
export type RemoteData<T, E = Error> =
  | { kind: 'not-asked' }
  | { kind: 'loading' }
  | { kind: 'failure'; error: E }
  | { kind: 'success'; data: T };

/**
 * Create success result
 */
export function success<T>(value: T): Result<T, never> {
  return { type: 'success', value };
}

/**
 * Create error result
 */
export function error<E = Error>(error: E): Result<never, E> {
  return { type: 'error', error };
}

/**
 * Check if result is success
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { type: 'success'; value: T } {
  return result.type === 'success';
}

/**
 * Check if result is error
 */
export function isError<T, E>(result: Result<T, E>): result is { type: 'error'; error: E } {
  return result.type === 'error';
}

/**
 * Map success value
 */
export function mapSuccess<T, E, R>(
  result: Result<T, E>,
  mapper: (value: T) => R
): Result<R, E> {
  if (isSuccess(result)) {
    return success(mapper(result.value));
  }
  return result as Result<R, E>;
}

/**
 * Map error value
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  mapper: (error: E) => F
): Result<T, F> {
  if (isError(result)) {
    return error(mapper(result.error));
  }
  return result as Result<T, F>;
}

/**
 * Unwrap result or throw
 */
export function unwrapResult<T, E>(result: Result<T, E>): T {
  if (isSuccess(result)) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap result or return default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isSuccess(result)) {
    return result.value;
  }
  return defaultValue;
}

