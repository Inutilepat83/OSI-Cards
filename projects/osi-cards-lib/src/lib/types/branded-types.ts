/**
 * Branded Types Utility
 *
 * Provides type-safe branded types (also known as opaque types or nominal types)
 * to prevent mixing of semantically different values with the same underlying type.
 *
 * Benefits:
 * - Type safety at compile time
 * - No runtime overhead
 * - Prevents mixing of similar types
 * - Self-documenting code
 * - Better IDE autocomplete
 *
 * @example
 * ```typescript
 * import { Brand, make } from '@osi-cards/types';
 *
 * type UserId = Brand<string, 'UserId'>;
 * type CardId = Brand<string, 'CardId'>;
 *
 * const userId = make<UserId>('user-123');
 * const cardId = make<CardId>('card-456');
 *
 * function getUser(id: UserId) { ... }
 *
 * getUser(userId);  // ✓ OK
 * getUser(cardId);  // ✗ Type error!
 * ```
 */

/**
 * Brand symbol for nominal typing
 *
 * Uses a unique symbol to create a nominal type that TypeScript
 * treats as distinct even though the underlying type is the same.
 */
declare const __brand: unique symbol;

/**
 * Branded type
 *
 * Creates a branded version of a base type with a unique identifier.
 *
 * @template Base - The underlying type (string, number, etc.)
 * @template BrandName - Unique identifier for this branded type
 *
 * @example
 * ```typescript
 * type Email = Brand<string, 'Email'>;
 * type Age = Brand<number, 'Age'>;
 * ```
 */
export type Brand<Base, BrandName extends string> = Base & {
  readonly [__brand]: BrandName;
};

/**
 * Make a branded value
 *
 * Casts a base value to a branded type. Use this to create branded values.
 *
 * @param value - The base value
 * @returns Branded value
 *
 * @example
 * ```typescript
 * type UserId = Brand<string, 'UserId'>;
 * const id = make<UserId>('user-123');
 * ```
 */
export function make<T extends Brand<any, any>>(value: any): T {
  return value as T;
}

/**
 * Unwrap a branded value to its base type
 *
 * @param value - Branded value
 * @returns Base value
 *
 * @example
 * ```typescript
 * const id: UserId = make<UserId>('user-123');
 * const str: string = unwrap(id); // 'user-123'
 * ```
 */
export function unwrap<Base, BrandName extends string>(value: Brand<Base, BrandName>): Base {
  return value as Base;
}

// ============================================================================
// Predefined Branded Types for OSI Cards
// ============================================================================

/**
 * Card ID - Unique identifier for a card
 */
export type CardId = Brand<string, 'CardId'>;

/**
 * Section ID - Unique identifier for a section
 */
export type SectionId = Brand<string, 'SectionId'>;

/**
 * Field ID - Unique identifier for a field
 */
export type FieldId = Brand<string, 'FieldId'>;

/**
 * Item ID - Unique identifier for an item
 */
export type ItemId = Brand<string, 'ItemId'>;

/**
 * Action ID - Unique identifier for an action
 */
export type ActionId = Brand<string, 'ActionId'>;

/**
 * User ID - Unique identifier for a user
 */
export type UserId = Brand<string, 'UserId'>;

/**
 * Session ID - Unique identifier for a session
 */
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Request ID - Unique identifier for a request
 */
export type RequestId = Brand<string, 'RequestId'>;

/**
 * Timestamp in milliseconds
 */
export type Timestamp = Brand<number, 'Timestamp'>;

/**
 * Unix timestamp in seconds
 */
export type UnixTime = Brand<number, 'UnixTime'>;

/**
 * Percentage (0-100)
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Ratio (0-1)
 */
export type Ratio = Brand<number, 'Ratio'>;

/**
 * Pixels
 */
export type Pixels = Brand<number, 'Pixels'>;

/**
 * Milliseconds
 */
export type Milliseconds = Brand<number, 'Milliseconds'>;

/**
 * Degrees
 */
export type Degrees = Brand<number, 'Degrees'>;

/**
 * Radians
 */
export type Radians = Brand<number, 'Radians'>;

/**
 * Email address
 */
export type Email = Brand<string, 'Email'>;

/**
 * URL
 */
export type URL = Brand<string, 'URL'>;

/**
 * HTML string
 */
export type HTML = Brand<string, 'HTML'>;

/**
 * CSS class name
 */
export type ClassName = Brand<string, 'ClassName'>;

/**
 * CSS color
 */
export type Color = Brand<string, 'Color'>;

/**
 * Hex color (#RRGGBB)
 */
export type HexColor = Brand<string, 'HexColor'>;

/**
 * RGB color (rgb(r, g, b))
 */
export type RGBColor = Brand<string, 'RGBColor'>;

/**
 * JSON string
 */
export type JSONString = Brand<string, 'JSONString'>;

/**
 * Base64 encoded string
 */
export type Base64 = Brand<string, 'Base64'>;

/**
 * ISO 8601 date string
 */
export type ISODate = Brand<string, 'ISODate'>;

/**
 * UUID
 */
export type UUID = Brand<string, 'UUID'>;

/**
 * Semantic version (1.2.3)
 */
export type SemVer = Brand<string, 'SemVer'>;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a CardId
 *
 * @param id - String identifier
 * @returns Branded CardId
 */
export function cardId(id: string): CardId {
  return make<CardId>(id);
}

/**
 * Create a SectionId
 *
 * @param id - String identifier
 * @returns Branded SectionId
 */
export function sectionId(id: string): SectionId {
  return make<SectionId>(id);
}

/**
 * Create a FieldId
 *
 * @param id - String identifier
 * @returns Branded FieldId
 */
export function fieldId(id: string): FieldId {
  return make<FieldId>(id);
}

/**
 * Create a Timestamp (milliseconds since epoch)
 *
 * @param ms - Milliseconds
 * @returns Branded Timestamp
 */
export function timestamp(ms: number = Date.now()): Timestamp {
  return make<Timestamp>(ms);
}

/**
 * Create a Percentage (0-100)
 *
 * @param value - Percentage value
 * @returns Branded Percentage
 * @throws If value is not between 0 and 100
 */
export function percentage(value: number): Percentage {
  if (value < 0 || value > 100) {
    throw new Error(`Invalid percentage: ${value}. Must be between 0 and 100.`);
  }
  return make<Percentage>(value);
}

/**
 * Create a Ratio (0-1)
 *
 * @param value - Ratio value
 * @returns Branded Ratio
 * @throws If value is not between 0 and 1
 */
export function ratio(value: number): Ratio {
  if (value < 0 || value > 1) {
    throw new Error(`Invalid ratio: ${value}. Must be between 0 and 1.`);
  }
  return make<Ratio>(value);
}

/**
 * Create Pixels
 *
 * @param value - Pixel value
 * @returns Branded Pixels
 */
export function pixels(value: number): Pixels {
  return make<Pixels>(value);
}

/**
 * Create Milliseconds
 *
 * @param value - Millisecond value
 * @returns Branded Milliseconds
 */
export function milliseconds(value: number): Milliseconds {
  return make<Milliseconds>(value);
}

/**
 * Create an Email
 *
 * @param value - Email string
 * @returns Branded Email
 * @throws If email format is invalid
 */
export function email(value: string): Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new Error(`Invalid email format: ${value}`);
  }
  return make<Email>(value);
}

/**
 * Create a URL
 *
 * @param value - URL string
 * @returns Branded URL
 * @throws If URL format is invalid
 */
export function url(value: string): URL {
  try {
    new globalThis.URL(value);
    return make<URL>(value);
  } catch {
    throw new Error(`Invalid URL format: ${value}`);
  }
}

/**
 * Create a HexColor
 *
 * @param value - Hex color string (#RGB or #RRGGBB)
 * @returns Branded HexColor
 * @throws If hex color format is invalid
 */
export function hexColor(value: string): HexColor {
  const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  if (!hexRegex.test(value)) {
    throw new Error(`Invalid hex color format: ${value}`);
  }
  return make<HexColor>(value);
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is a valid CardId
 *
 * @param value - Value to check
 * @returns Type predicate
 */
export function isCardId(value: any): value is CardId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if value is a valid Percentage
 *
 * @param value - Value to check
 * @returns Type predicate
 */
export function isPercentage(value: any): value is Percentage {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

/**
 * Check if value is a valid Ratio
 *
 * @param value - Value to check
 * @returns Type predicate
 */
export function isRatio(value: any): value is Ratio {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

/**
 * Check if value is a valid Email
 *
 * @param value - Value to check
 * @returns Type predicate
 */
export function isEmail(value: any): value is Email {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if value is a valid URL
 *
 * @param value - Value to check
 * @returns Type predicate
 */
export function isURL(value: any): value is URL {
  if (typeof value !== 'string') return false;
  try {
    new globalThis.URL(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract base type from branded type
 *
 * @example
 * ```typescript
 * type BaseType = UnBrand<UserId>; // string
 * ```
 */
export type UnBrand<T> = T extends Brand<infer Base, any> ? Base : T;

/**
 * Make all branded types in an object optional
 *
 * @example
 * ```typescript
 * type User = {
 *   id: UserId;
 *   email: Email;
 * };
 *
 * type PartialUser = PartialBranded<User>;
 * // { id?: UserId; email?: Email; }
 * ```
 */
export type PartialBranded<T> = {
  [K in keyof T]?: T[K];
};

/**
 * Convert all branded types in an object to their base types
 *
 * @example
 * ```typescript
 * type User = {
 *   id: UserId;
 *   email: Email;
 * };
 *
 * type PlainUser = UnBrandObject<User>;
 * // { id: string; email: string; }
 * ```
 */
export type UnBrandObject<T> = {
  [K in keyof T]: UnBrand<T[K]>;
};



