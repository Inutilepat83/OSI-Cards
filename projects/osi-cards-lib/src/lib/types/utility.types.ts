/**
 * OSI Cards Utility Types
 *
 * Advanced TypeScript utility types for better developer experience
 * when working with card configurations and transformations.
 *
 * @example
 * ```typescript
 * import { DeepPartial, RequiredFields, SectionOf } from 'osi-cards-lib';
 *
 * // Create a partial card config for merging
 * const partialConfig: DeepPartial<AICardConfig> = {
 *   cardTitle: 'Updated Title',
 *   sections: [{ title: 'New Section' }]
 * };
 *
 * // Require specific fields
 * type RequiredCard = RequiredFields<AICardConfig, 'id' | 'cardTitle'>;
 * ```
 */

import type { AICardConfig, CardSection, CardField, CardItem, CardAction } from '@osi-cards/models';

// ============================================================================
// DEEP PARTIAL & REQUIRED
// ============================================================================

/**
 * Makes all properties in T optional recursively
 * Useful for creating partial update objects
 *
 * @example
 * ```typescript
 * const partialCard: DeepPartial<AICardConfig> = {
 *   sections: [{ title: 'Partial Section' }]
 * };
 * ```
 */
export type DeepPartial<T> = T extends object
  ? T extends (infer U)[]
    ? DeepPartial<U>[]
    : { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * Makes all properties in T required recursively
 * Useful for ensuring complete objects
 */
export type DeepRequired<T> = T extends object
  ? T extends (infer U)[]
    ? DeepRequired<U>[]
    : { [P in keyof T]-?: DeepRequired<T[P]> }
  : T;

/**
 * Makes specified properties required while keeping others optional
 *
 * @example
 * ```typescript
 * type CardWithId = RequiredFields<AICardConfig, 'id' | 'cardTitle'>;
 * ```
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Makes specified properties optional while keeping others required
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================================================
// READONLY TYPES
// ============================================================================

/**
 * Makes all properties in T readonly recursively
 * Useful for immutable data structures
 */
export type DeepReadonly<T> = T extends object
  ? T extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

/**
 * Removes readonly modifier from all properties recursively
 */
export type DeepMutable<T> = T extends object
  ? T extends (infer U)[]
    ? DeepMutable<U>[]
    : { -readonly [P in keyof T]: DeepMutable<T[P]> }
  : T;

/**
 * Immutable version of AICardConfig
 */
export type ImmutableCardConfig = DeepReadonly<AICardConfig>;

/**
 * Immutable version of CardSection
 */
export type ImmutableSection = DeepReadonly<CardSection>;

// ============================================================================
// SECTION TYPE HELPERS
// ============================================================================

/**
 * Extract section type from a CardSection
 * Returns the literal type of the section's type property
 */
export type SectionTypeOf<T extends CardSection> = T['type'];

/**
 * Create a section type with specific type discriminant
 * Useful for creating type-safe section handlers
 *
 * @example
 * ```typescript
 * type InfoSection = SectionOf<'info'>;
 * type AnalyticsSection = SectionOf<'analytics'>;
 * ```
 */
export type SectionOf<T extends string> = CardSection & { type: T };

/**
 * Extract fields from a section
 */
export type SectionFields<T extends CardSection> = NonNullable<T['fields']>;

/**
 * Extract items from a section
 */
export type SectionItems<T extends CardSection> = NonNullable<T['items']>;

// ============================================================================
// DISCRIMINATED UNION HELPERS
// ============================================================================

/**
 * Extract the discriminant value from a discriminated union
 */
export type Discriminant<T, K extends keyof T> = T[K];

/**
 * Filter a union type by a discriminant value
 *
 * @example
 * ```typescript
 * type MailAction = FilterByType<CardAction, 'type', 'mail'>;
 * ```
 */
export type FilterByType<T, K extends keyof T, V extends T[K]> = T extends { [key in K]: V }
  ? T
  : never;

/**
 * Exclude from a union type by a discriminant value
 */
export type ExcludeByType<T, K extends keyof T, V extends T[K]> = T extends { [key in K]: V }
  ? never
  : T;

// ============================================================================
// PICK & OMIT VARIANTS
// ============================================================================

/**
 * Pick properties from T that match type U
 *
 * @example
 * ```typescript
 * type StringFields = PickByType<CardField, string>;
 * ```
 */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/**
 * Omit properties from T that match type U
 */
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * Pick properties from T where the value is not undefined
 */
export type PickDefined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
};

/**
 * Get keys of T where value is type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// ============================================================================
// FUNCTION TYPES
// ============================================================================

/**
 * Extract parameter types from a function
 */
export type Parameters<T extends (...args: unknown[]) => unknown> = T extends (
  ...args: infer P
) => unknown
  ? P
  : never;

/**
 * Extract return type from a function
 */
export type ReturnType<T extends (...args: unknown[]) => unknown> = T extends (
  ...args: unknown[]
) => infer R
  ? R
  : never;

/**
 * Create a function type that transforms one type to another
 */
export type Transformer<TInput, TOutput> = (input: TInput) => TOutput;

/**
 * Create an async function type that transforms one type to another
 */
export type AsyncTransformer<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

// ============================================================================
// CARD-SPECIFIC UTILITY TYPES
// ============================================================================

/**
 * Configuration for creating a new card
 * Omits auto-generated fields like processedAt
 */
export type NewCardConfig = Omit<AICardConfig, 'processedAt'>;

/**
 * Card update payload - all fields optional except what's needed to identify
 */
export type CardUpdatePayload = RequiredFields<DeepPartial<AICardConfig>, 'id'>;

/**
 * Section update payload
 */
export type SectionUpdatePayload = RequiredFields<DeepPartial<CardSection>, 'id'>;

/**
 * Field update payload
 */
export type FieldUpdatePayload = RequiredFields<DeepPartial<CardField>, 'id'>;

/**
 * Minimal card config for validation
 */
export type MinimalCardConfig = Pick<AICardConfig, 'cardTitle' | 'sections'>;

/**
 * Card with guaranteed ID
 */
export type IdentifiedCard = RequiredFields<AICardConfig, 'id'>;

/**
 * Section with guaranteed ID
 */
export type IdentifiedSection = RequiredFields<CardSection, 'id'>;

/**
 * Field with guaranteed ID
 */
export type IdentifiedField = RequiredFields<CardField, 'id'>;

/**
 * Item with guaranteed ID
 */
export type IdentifiedItem = RequiredFields<CardItem, 'id'>;

// ============================================================================
// BUILDER PATTERN TYPES
// ============================================================================

/**
 * Fluent builder interface for cards
 */
export interface CardBuilder<T extends Partial<AICardConfig> = object> {
  withId(id: string): CardBuilder<T & { id: string }>;
  withTitle(title: string): CardBuilder<T & { cardTitle: string }>;
  withSections(sections: CardSection[]): CardBuilder<T & { sections: CardSection[] }>;
  withActions(actions: CardAction[]): CardBuilder<T & { actions: CardAction[] }>;
  build(): T extends MinimalCardConfig ? AICardConfig : never;
}

/**
 * Fluent builder interface for sections
 */
export interface SectionBuilder<T extends Partial<CardSection> = object> {
  withId(id: string): SectionBuilder<T & { id: string }>;
  withTitle(title: string): SectionBuilder<T & { title: string }>;
  withType(type: string): SectionBuilder<T & { type: string }>;
  withFields(fields: CardField[]): SectionBuilder<T & { fields: CardField[] }>;
  withItems(items: CardItem[]): SectionBuilder<T & { items: CardItem[] }>;
  build(): T extends Pick<CardSection, 'title' | 'type'> ? CardSection : never;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Result of a validation operation
 */
export interface ValidationResult<T> {
  readonly valid: boolean;
  readonly data?: T;
  readonly errors?: readonly string[];
}

/**
 * Validator function type
 */
export type Validator<T> = (value: unknown) => ValidationResult<T>;

/**
 * Schema type for validation
 */
export interface ValidationSchema<T> {
  readonly validate: Validator<T>;
  readonly isOptional?: boolean;
  readonly defaultValue?: T;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Generic event payload with type discrimination
 */
export interface TypedEvent<TType extends string, TPayload = void> {
  readonly type: TType;
  readonly payload: TPayload;
  readonly timestamp: number;
}

/**
 * Card event types
 */
export type CardEvent =
  | TypedEvent<'card:created', AICardConfig>
  | TypedEvent<'card:updated', CardUpdatePayload>
  | TypedEvent<'card:deleted', { id: string }>
  | TypedEvent<'section:added', { cardId: string; section: CardSection }>
  | TypedEvent<'section:removed', { cardId: string; sectionId: string }>
  | TypedEvent<'field:updated', { cardId: string; sectionId: string; field: CardField }>;

// ============================================================================
// MERGE & EXTEND TYPES
// ============================================================================

/**
 * Merge two types, with second type taking precedence
 */
export type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Extend a type with additional properties
 */
export type Extend<T, U> = T & U;

/**
 * Create a type with some properties replaced
 */
export type Replace<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: V };

/**
 * Nullable version of a type
 */
export type Nullable<T> = T | null;

/**
 * Optional version of a type
 */
export type Optional<T> = T | undefined;

/**
 * Maybe type - nullable and optional
 */
export type Maybe<T> = T | null | undefined;

// ============================================================================
// TUPLE TYPES
// ============================================================================

/**
 * Create a tuple type of length N filled with type T
 */
export type Tuple<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : Tuple<T, N, [T, ...R]>;

/**
 * First element of a tuple
 */
export type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;

/**
 * All elements except first of a tuple
 */
export type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never;

/**
 * Last element of a tuple
 */
export type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;

// ============================================================================
// STRING LITERAL TYPES
// ============================================================================

/**
 * Uppercase first letter of a string type
 */
export type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;

/**
 * Lowercase first letter of a string type
 */
export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S;

/**
 * Convert string to kebab-case type
 */
export type KebabCase<S extends string> = S extends `${infer C}${infer T}`
  ? T extends Uncapitalize<T>
    ? `${Lowercase<C>}${KebabCase<T>}`
    : `${Lowercase<C>}-${KebabCase<T>}`
  : S;

/**
 * Prefix all keys in an object type
 */
export type PrefixKeys<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : K]: T[K];
};

/**
 * Suffix all keys in an object type
 */
export type SuffixKeys<T, S extends string> = {
  [K in keyof T as K extends string ? `${K}${S}` : K]: T[K];
};
