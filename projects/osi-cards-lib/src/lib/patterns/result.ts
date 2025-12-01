/**
 * Result Type Pattern (Point 16)
 * 
 * Provides a type-safe way to handle operations that can fail
 * without throwing exceptions. Replaces try-catch in critical paths.
 * 
 * @example
 * ```typescript
 * function parseCard(json: string): Result<AICardConfig, ParseError> {
 *   try {
 *     const data = JSON.parse(json);
 *     return ok(data);
 *   } catch (e) {
 *     return err(new ParseError('Invalid JSON', e));
 *   }
 * }
 * 
 * const result = parseCard(input);
 * 
 * // Pattern matching style
 * const card = result.match({
 *   ok: (value) => value,
 *   err: (error) => defaultCard
 * });
 * 
 * // Chaining
 * const validated = parseCard(input)
 *   .map(card => validateCard(card))
 *   .mapErr(e => new ValidationError(e.message))
 *   .unwrapOr(defaultCard);
 * ```
 */

/**
 * Success result type
 */
export interface Ok<T> {
  readonly kind: 'ok';
  readonly value: T;
}

/**
 * Error result type
 */
export interface Err<E> {
  readonly kind: 'err';
  readonly error: E;
}

/**
 * Result type - either Ok or Err
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Pattern matching handlers
 */
export interface ResultMatcher<T, E, U> {
  ok: (value: T) => U;
  err: (error: E) => U;
}

/**
 * Create success result
 */
export function ok<T, E = never>(value: T): Result<T, E> {
  return { kind: 'ok', value };
}

/**
 * Create error result
 */
export function err<E, T = never>(error: E): Result<T, E> {
  return { kind: 'err', error };
}

/**
 * Check if result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.kind === 'ok';
}

/**
 * Check if result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.kind === 'err';
}

/**
 * Pattern match on result
 */
export function match<T, E, U>(
  result: Result<T, E>,
  matcher: ResultMatcher<T, E, U>
): U {
  if (isOk(result)) {
    return matcher.ok(result.value);
  }
  return matcher.err(result.error);
}

/**
 * Map success value
 */
export function map<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Map error value
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Flat map success value
 */
export function flatMap<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
}

/**
 * Unwrap or return default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Unwrap or compute default value
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T
): T {
  if (isOk(result)) {
    return result.value;
  }
  return fn(result.error);
}

/**
 * Unwrap or throw
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw new Error(`Attempted to unwrap an Err: ${result.error}`);
}

/**
 * Unwrap error or throw
 */
export function unwrapErr<T, E>(result: Result<T, E>): E {
  if (isErr(result)) {
    return result.error;
  }
  throw new Error(`Attempted to unwrapErr an Ok: ${result.value}`);
}

/**
 * Convert nullable to Result
 */
export function fromNullable<T, E>(
  value: T | null | undefined,
  error: E
): Result<T, E> {
  if (value === null || value === undefined) {
    return err(error);
  }
  return ok(value);
}

/**
 * Convert promise to Result
 */
export async function fromPromise<T, E = Error>(
  promise: Promise<T>,
  mapError?: (e: unknown) => E
): Promise<Result<T, E>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (e) {
    if (mapError) {
      return err(mapError(e));
    }
    return err(e as E);
  }
}

/**
 * Try-catch wrapper returning Result
 */
export function tryCatch<T, E = Error>(
  fn: () => T,
  mapError?: (e: unknown) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (e) {
    if (mapError) {
      return err(mapError(e));
    }
    return err(e as E);
  }
}

/**
 * Async try-catch wrapper returning Result
 */
export async function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>,
  mapError?: (e: unknown) => E
): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (e) {
    if (mapError) {
      return err(mapError(e));
    }
    return err(e as E);
  }
}

/**
 * Combine multiple Results - all must succeed
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.value);
  }
  return ok(values);
}

/**
 * Get first successful Result
 */
export function any<T, E>(results: Result<T, E>[]): Result<T, E[]> {
  const errors: E[] = [];
  for (const result of results) {
    if (isOk(result)) {
      return result;
    }
    errors.push(result.error);
  }
  return err(errors);
}

/**
 * Result builder class for method chaining
 */
export class ResultBuilder<T, E> {
  private constructor(private readonly result: Result<T, E>) {}

  public static ok<T, E = never>(value: T): ResultBuilder<T, E> {
    return new ResultBuilder(ok(value));
  }

  public static err<E, T = never>(error: E): ResultBuilder<T, E> {
    return new ResultBuilder(err(error));
  }

  public static from<T, E>(result: Result<T, E>): ResultBuilder<T, E> {
    return new ResultBuilder(result);
  }

  public map<U>(fn: (value: T) => U): ResultBuilder<U, E> {
    return new ResultBuilder(map(this.result, fn));
  }

  public mapErr<F>(fn: (error: E) => F): ResultBuilder<T, F> {
    return new ResultBuilder(mapErr(this.result, fn));
  }

  public flatMap<U>(fn: (value: T) => Result<U, E>): ResultBuilder<U, E> {
    return new ResultBuilder(flatMap(this.result, fn));
  }

  public match<U>(matcher: ResultMatcher<T, E, U>): U {
    return match(this.result, matcher);
  }

  public unwrapOr(defaultValue: T): T {
    return unwrapOr(this.result, defaultValue);
  }

  public unwrapOrElse(fn: (error: E) => T): T {
    return unwrapOrElse(this.result, fn);
  }

  public unwrap(): T {
    return unwrap(this.result);
  }

  public isOk(): boolean {
    return isOk(this.result);
  }

  public isErr(): boolean {
    return isErr(this.result);
  }

  public toResult(): Result<T, E> {
    return this.result;
  }
}

/**
 * Common error types for Result
 */
export class ValidationResultError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'ValidationResultError';
  }
}

export class ParseResultError extends Error {
  constructor(
    message: string,
    public readonly source?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ParseResultError';
  }
}

export class NotFoundResultError extends Error {
  constructor(
    public readonly resourceType: string,
    public readonly resourceId: string
  ) {
    super(`${resourceType} not found: ${resourceId}`);
    this.name = 'NotFoundResultError';
  }
}

