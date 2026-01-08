/**
 * Discriminated Union Exhaustiveness Checks (Point 40)
 *
 * Helpers for ensuring all cases in a discriminated union are handled.
 * Provides compile-time safety for switch statements.
 *
 * @example
 * ```typescript
 * type SectionType = 'info' | 'analytics' | 'list' | 'actions';
 *
 * function handleSection(type: SectionType): string {
 *   switch (type) {
 *     case 'info': return 'Info section';
 *     case 'analytics': return 'Analytics section';
 *     case 'list': return 'List section';
 *     case 'actions': return 'Actions section';
 *     default:
 *       // This will cause a compile error if a case is missing
 *       return assertNever(type);
 *   }
 * }
 * ```
 */

// =============================================================================
// EXHAUSTIVE CHECK FUNCTIONS
// =============================================================================

/**
 * Assert that a value is never (exhaustive check)
 *
 * Use in the default case of switch statements to ensure all cases are handled.
 * If a case is missing, TypeScript will show a compile-time error.
 *
 * @param value - The value that should be of type `never`
 * @param message - Optional custom error message
 * @throws Error if called at runtime (indicates a missing case)
 *
 * @example
 * ```typescript
 * type Status = 'pending' | 'active' | 'completed';
 *
 * function getStatusLabel(status: Status): string {
 *   switch (status) {
 *     case 'pending': return 'Pending';
 *     case 'active': return 'Active';
 *     case 'completed': return 'Completed';
 *     default:
 *       return assertNever(status);
 *   }
 * }
 * ```
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(
    message || `Unexpected value: ${JSON.stringify(value)}. This should be unreachable.`
  );
}

/**
 * Exhaustive check that returns a default value instead of throwing
 *
 * Useful when you want to handle unknown cases gracefully at runtime
 * while still getting compile-time exhaustiveness checking.
 *
 * @param value - The value that should be of type `never`
 * @param defaultValue - Value to return if an unexpected case is encountered
 * @returns The default value
 *
 * @example
 * ```typescript
 * type Theme = 'light' | 'dark' | 'system';
 *
 * function getThemeIcon(theme: Theme): string {
 *   switch (theme) {
 *     case 'light': return '☀️';
 *     case 'dark': return '🌙';
 *     case 'system': return '💻';
 *     default:
 *       return exhaustiveDefault(theme, '❓');
 *   }
 * }
 * ```
 */
export function exhaustiveDefault<T>(value: never, defaultValue: T): T {
  console.warn(`Unhandled case: ${JSON.stringify(value)}. Using default value.`);
  return defaultValue;
}

/**
 * Exhaustive check that logs a warning and returns undefined
 *
 * @param value - The value that should be of type `never`
 * @param context - Optional context for the warning message
 */
export function exhaustiveWarn(value: never, context?: string): undefined {
  const msg = context
    ? `[${context}] Unhandled case: ${JSON.stringify(value)}`
    : `Unhandled case: ${JSON.stringify(value)}`;
  console.warn(msg);
  return undefined;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard for checking if a value is one of the specified types
 *
 * @example
 * ```typescript
 * const validTypes = ['info', 'analytics', 'list'] as const;
 *
 * function processSection(type: string) {
 *   if (isOneOf(type, validTypes)) {
 *     // type is narrowed to 'info' | 'analytics' | 'list'
 *   }
 * }
 * ```
 */
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  options: T
): value is T[number] {
  return options.includes(value);
}

/**
 * Type guard for checking discriminated unions
 *
 * @example
 * ```typescript
 * type Section =
 *   | { type: 'analytics'; fields: Field[] }
 *   | { type: 'list'; items: Item[] };
 *
 * function isAnalyticsSection(section: Section): section is { type: 'analytics'; fields: Field[] } {
 *   return hasDiscriminator(section, 'type', 'analytics');
 * }
 * ```
 */
export function hasDiscriminator<T extends object, K extends keyof T, V extends T[K]>(
  obj: T,
  key: K,
  value: V
): obj is Extract<T, Record<K, V>> {
  return obj[key] === value;
}

// =============================================================================
// SECTION TYPE UTILITIES
// =============================================================================

/**
 * All valid section types
 *
 * Auto-generated from section definition files (*.definition.json).
 * Run: npm run generate:section-types
 */
import { SECTION_TYPE_IDENTIFIERS } from '../../models/section-types.generated';

export const SECTION_TYPES = SECTION_TYPE_IDENTIFIERS;

export type SectionType = (typeof SECTION_TYPES)[number];

/**
 * Check if a string is a valid section type
 */
export function isValidSectionType(type: string): type is SectionType {
  return isOneOf(type, SECTION_TYPES);
}

/**
 * Get section type with fallback
 */
export function getSectionTypeOrDefault(
  type: string,
  defaultType: SectionType = 'overview'
): SectionType {
  return isValidSectionType(type) ? type : defaultType;
}

/**
 * Handle section type exhaustively
 *
 * @example
 * ```typescript
 * const icon = handleSectionType(section.type, {
 *   info: () => 'ℹ️',
 *   analytics: () => '📊',
 *   list: () => '📋',
 *   actions: () => '⚡',
 *   // ... other types
 *   default: () => '❓',
 * });
 * ```
 */
export function handleSectionType<T>(
  type: SectionType,
  handlers: Partial<Record<SectionType, () => T>> & { default: () => T }
): T {
  const handler = handlers[type];
  return handler ? handler() : handlers.default();
}

// =============================================================================
// MATCH EXPRESSION
// =============================================================================

/**
 * Pattern matching helper for discriminated unions
 *
 * @example
 * ```typescript
 * type Result =
 *   | { status: 'success'; data: string }
 *   | { status: 'error'; error: Error }
 *   | { status: 'loading' };
 *
 * const message = match(result, 'status', {
 *   success: (r) => `Data: ${r.data}`,
 *   error: (r) => `Error: ${r.error.message}`,
 *   loading: () => 'Loading...',
 * });
 * ```
 */
export function match<
  T extends object,
  K extends keyof T,
  R,
  Handlers extends {
    [V in T[K] & (string | number | symbol)]: (value: Extract<T, Record<K, V>>) => R;
  },
>(value: T, discriminator: K, handlers: Handlers): R {
  const discriminatorValue = value[discriminator] as T[K] & (string | number | symbol);
  const handler = handlers[discriminatorValue];

  if (!handler) {
    throw new Error(`No handler for discriminator value: ${String(discriminatorValue)}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return handler(value as any);
}

/**
 * Pattern matching with default case
 */
export function matchWithDefault<T extends object, K extends keyof T, R>(
  value: T,
  discriminator: K,
  handlers: Partial<{
    [V in T[K] & (string | number | symbol)]: (value: Extract<T, Record<K, V>>) => R;
  }>,
  defaultHandler: (value: T) => R
): R {
  const discriminatorValue = value[discriminator] as T[K] & (string | number | symbol);
  const handler = handlers[discriminatorValue];

  if (handler) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return handler(value as any);
  }

  return defaultHandler(value);
}

// =============================================================================
// BUILDER PATTERN FOR HANDLERS
// =============================================================================

/**
 * Builder for creating exhaustive handlers
 *
 * @example
 * ```typescript
 * const handler = createHandler<SectionType, string>()
 *   .on('info', () => 'Info')
 *   .on('analytics', () => 'Analytics')
 *   .on('list', () => 'List')
 *   .default(() => 'Unknown')
 *   .build();
 *
 * const result = handler('info'); // 'Info'
 * ```
 */
export function createHandler<T extends string | number | symbol, R>(): HandlerBuilder<
  T,
  R,
  never
> {
  return new HandlerBuilder<T, R, never>({});
}

class HandlerBuilder<T extends string | number | symbol, R, Handled extends T> {
  constructor(private handlers: Partial<Record<T, () => R>>) {}

  on<K extends Exclude<T, Handled>>(key: K, handler: () => R): HandlerBuilder<T, R, Handled | K> {
    return new HandlerBuilder<T, R, Handled | K>({
      ...this.handlers,
      [key]: handler,
    } as Partial<Record<T, () => R>>);
  }

  default(handler: () => R): (value: T) => R {
    const handlers = this.handlers;
    return (value: T): R => {
      const h = handlers[value];
      return h ? h() : handler();
    };
  }

  build(): [Handled] extends [T] ? (value: T) => R : never {
    const handlers = this.handlers;
    return ((value: T): R => {
      const h = handlers[value];
      if (!h) {
        throw new Error(`No handler for: ${String(value)}`);
      }
      return h();
    }) as [Handled] extends [T] ? (value: T) => R : never;
  }
}
