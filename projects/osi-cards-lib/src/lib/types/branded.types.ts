/**
 * OSI Cards Branded Types
 * 
 * Branded types (also known as nominal types) provide compile-time safety
 * by preventing accidental mixing of different ID types.
 * 
 * @example
 * ```typescript
 * import { CardId, SectionId, createCardId } from 'osi-cards-lib';
 * 
 * const cardId: CardId = createCardId('card-123');
 * const sectionId: SectionId = createSectionId('section-456');
 * 
 * // Type error: CardId is not assignable to SectionId
 * const wrongId: SectionId = cardId;
 * ```
 */

// ============================================================================
// BRAND SYMBOL
// ============================================================================

/**
 * Unique symbol for branding types
 * This ensures the brand is unique and cannot be accidentally created
 */
declare const __brand: unique symbol;

/**
 * Brand type helper - adds a unique brand to a base type
 */
type Brand<TBase, TBrand extends string> = TBase & {
  readonly [__brand]: TBrand;
};

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/**
 * Branded type for Card IDs
 * Prevents accidental mixing with Section or Field IDs
 */
export type CardId = Brand<string, 'CardId'>;

/**
 * Branded type for Section IDs
 * Prevents accidental mixing with Card or Field IDs
 */
export type SectionId = Brand<string, 'SectionId'>;

/**
 * Branded type for Field IDs
 * Prevents accidental mixing with Card or Section IDs
 */
export type FieldId = Brand<string, 'FieldId'>;

/**
 * Branded type for Item IDs
 * Prevents accidental mixing with other ID types
 */
export type ItemId = Brand<string, 'ItemId'>;

/**
 * Branded type for Action IDs
 * Prevents accidental mixing with other ID types
 */
export type ActionId = Brand<string, 'ActionId'>;

/**
 * Branded type for Plugin IDs
 * Prevents accidental mixing with other ID types
 */
export type PluginId = Brand<string, 'PluginId'>;

/**
 * Branded type for Theme IDs
 * Prevents accidental mixing with other ID types
 */
export type ThemeId = Brand<string, 'ThemeId'>;

// ============================================================================
// BRANDED VALUE TYPES
// ============================================================================

/**
 * Branded type for percentage values (0-100)
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Branded type for RGB hex color strings
 */
export type HexColor = Brand<string, 'HexColor'>;

/**
 * Branded type for URL strings
 */
export type Url = Brand<string, 'Url'>;

/**
 * Branded type for email addresses
 */
export type Email = Brand<string, 'Email'>;

/**
 * Branded type for CSS pixel values
 */
export type Pixels = Brand<number, 'Pixels'>;

/**
 * Branded type for milliseconds
 */
export type Milliseconds = Brand<number, 'Milliseconds'>;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a value is a valid CardId format
 */
export function isValidCardId(value: unknown): value is CardId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid SectionId format
 */
export function isValidSectionId(value: unknown): value is SectionId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid FieldId format
 */
export function isValidFieldId(value: unknown): value is FieldId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid ItemId format
 */
export function isValidItemId(value: unknown): value is ItemId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid percentage (0-100)
 */
export function isValidPercentage(value: unknown): value is Percentage {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

/**
 * Check if a value is a valid hex color
 */
export function isValidHexColor(value: unknown): value is HexColor {
  return typeof value === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
}

/**
 * Check if a value is a valid URL
 */
export function isValidUrl(value: unknown): value is Url {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a value is a valid email
 */
export function isValidEmail(value: unknown): value is Email {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a CardId from a string
 * @param id - The string ID value
 * @returns A branded CardId
 * @throws Error if id is empty
 */
export function createCardId(id: string): CardId {
  if (!id || id.trim().length === 0) {
    throw new Error('CardId cannot be empty');
  }
  return id as CardId;
}

/**
 * Create a SectionId from a string
 * @param id - The string ID value
 * @returns A branded SectionId
 * @throws Error if id is empty
 */
export function createSectionId(id: string): SectionId {
  if (!id || id.trim().length === 0) {
    throw new Error('SectionId cannot be empty');
  }
  return id as SectionId;
}

/**
 * Create a FieldId from a string
 * @param id - The string ID value
 * @returns A branded FieldId
 * @throws Error if id is empty
 */
export function createFieldId(id: string): FieldId {
  if (!id || id.trim().length === 0) {
    throw new Error('FieldId cannot be empty');
  }
  return id as FieldId;
}

/**
 * Create an ItemId from a string
 * @param id - The string ID value
 * @returns A branded ItemId
 * @throws Error if id is empty
 */
export function createItemId(id: string): ItemId {
  if (!id || id.trim().length === 0) {
    throw new Error('ItemId cannot be empty');
  }
  return id as ItemId;
}

/**
 * Create an ActionId from a string
 * @param id - The string ID value
 * @returns A branded ActionId
 * @throws Error if id is empty
 */
export function createActionId(id: string): ActionId {
  if (!id || id.trim().length === 0) {
    throw new Error('ActionId cannot be empty');
  }
  return id as ActionId;
}

/**
 * Create a PluginId from a string
 * @param id - The string ID value
 * @returns A branded PluginId
 * @throws Error if id is empty
 */
export function createPluginId(id: string): PluginId {
  if (!id || id.trim().length === 0) {
    throw new Error('PluginId cannot be empty');
  }
  return id as PluginId;
}

/**
 * Create a Percentage from a number
 * @param value - The number value (0-100)
 * @returns A branded Percentage
 * @throws Error if value is not in range
 */
export function createPercentage(value: number): Percentage {
  if (value < 0 || value > 100) {
    throw new Error(`Percentage must be between 0 and 100, got ${value}`);
  }
  return value as Percentage;
}

/**
 * Create a HexColor from a string
 * @param value - The hex color string
 * @returns A branded HexColor
 * @throws Error if not a valid hex color
 */
export function createHexColor(value: string): HexColor {
  if (!isValidHexColor(value)) {
    throw new Error(`Invalid hex color: ${value}`);
  }
  return value as HexColor;
}

/**
 * Create a Url from a string
 * @param value - The URL string
 * @returns A branded Url
 * @throws Error if not a valid URL
 */
export function createUrl(value: string): Url {
  if (!isValidUrl(value)) {
    throw new Error(`Invalid URL: ${value}`);
  }
  return value as Url;
}

/**
 * Create an Email from a string
 * @param value - The email string
 * @returns A branded Email
 * @throws Error if not a valid email
 */
export function createEmail(value: string): Email {
  if (!isValidEmail(value)) {
    throw new Error(`Invalid email: ${value}`);
  }
  return value as Email;
}

/**
 * Create a Pixels value from a number
 * @param value - The pixel value
 * @returns A branded Pixels value
 */
export function createPixels(value: number): Pixels {
  return value as Pixels;
}

/**
 * Create a Milliseconds value from a number
 * @param value - The milliseconds value
 * @returns A branded Milliseconds value
 */
export function createMilliseconds(value: number): Milliseconds {
  return value as Milliseconds;
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a unique CardId
 * @param prefix - Optional prefix for the ID
 * @returns A new unique CardId
 */
export function generateCardId(prefix = 'card'): CardId {
  return createCardId(`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
}

/**
 * Generate a unique SectionId
 * @param prefix - Optional prefix for the ID
 * @returns A new unique SectionId
 */
export function generateSectionId(prefix = 'section'): SectionId {
  return createSectionId(`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
}

/**
 * Generate a unique FieldId
 * @param prefix - Optional prefix for the ID
 * @returns A new unique FieldId
 */
export function generateFieldId(prefix = 'field'): FieldId {
  return createFieldId(`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
}

/**
 * Generate a unique ItemId
 * @param prefix - Optional prefix for the ID
 * @returns A new unique ItemId
 */
export function generateItemId(prefix = 'item'): ItemId {
  return createItemId(`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
}

/**
 * Generate a unique ActionId
 * @param prefix - Optional prefix for the ID
 * @returns A new unique ActionId
 */
export function generateActionId(prefix = 'action'): ActionId {
  return createActionId(`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
}

