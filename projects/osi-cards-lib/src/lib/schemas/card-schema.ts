/**
 * Card Configuration Schemas (Improvement #89)
 * 
 * JSON Schema definitions for card validation.
 * Enables runtime validation and IDE support.
 * 
 * @example
 * ```typescript
 * import { validateCard, CardSchema, isValidCard } from 'osi-cards-lib';
 * 
 * // Validate a card configuration
 * const result = validateCard(cardConfig);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * 
 * // Type guard
 * if (isValidCard(unknownConfig)) {
 *   // unknownConfig is now typed as AICardConfig
 * }
 * ```
 */

import type { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../models';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Validation error
 */
export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
  expected?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Schema definition
 */
export interface SchemaDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  required?: boolean;
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  enum?: unknown[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  format?: 'email' | 'url' | 'date' | 'uri';
  description?: string;
  default?: unknown;
  nullable?: boolean;
}

// ============================================================================
// SECTION TYPE SCHEMAS
// ============================================================================

/**
 * Section type definitions with their required fields
 */
export const SECTION_TYPE_SCHEMAS: Record<string, { required: string[]; optional: string[] }> = {
  'info': { required: ['title', 'type'], optional: ['fields', 'description'] },
  'analytics': { required: ['title', 'type'], optional: ['fields', 'metrics'] },
  'list': { required: ['title', 'type', 'items'], optional: ['description'] },
  'chart': { required: ['title', 'type'], optional: ['chartConfig', 'chartType', 'chartData'] },
  'map': { required: ['title', 'type'], optional: ['mapConfig', 'location', 'markers'] },
  'table': { required: ['title', 'type'], optional: ['tableData', 'columns', 'rows'] },
  'contact-card': { required: ['title', 'type'], optional: ['fields', 'avatar', 'contact'] },
  'network-card': { required: ['title', 'type'], optional: ['fields', 'connections'] },
  'overview': { required: ['title', 'type'], optional: ['fields', 'description', 'summary'] },
  'event': { required: ['title', 'type'], optional: ['fields', 'date', 'location'] },
  'product': { required: ['title', 'type'], optional: ['fields', 'price', 'image'] },
  'news': { required: ['title', 'type'], optional: ['fields', 'content', 'author'] },
  'social-media': { required: ['title', 'type'], optional: ['fields', 'platform', 'handle'] },
  'financials': { required: ['title', 'type'], optional: ['fields', 'metrics', 'currency'] },
  'quotation': { required: ['title', 'type'], optional: ['quote', 'author', 'source'] },
  'text-reference': { required: ['title', 'type'], optional: ['content', 'references'] },
  'solutions': { required: ['title', 'type', 'items'], optional: ['description'] },
  'brand-colors': { required: ['title', 'type'], optional: ['colors', 'palette'] },
  'fallback': { required: ['title', 'type'], optional: ['content'] }
};

/**
 * Valid section types
 */
export const VALID_SECTION_TYPES = Object.keys(SECTION_TYPE_SCHEMAS);

/**
 * Valid action types
 */
export const VALID_ACTION_TYPES = ['website', 'mail', 'phone', 'download', 'copy', 'custom'];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a card configuration
 */
export function validateCard(config: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Check if config is an object
  if (!config || typeof config !== 'object') {
    errors.push({
      path: '',
      message: 'Card configuration must be an object',
      value: config,
      expected: 'object'
    });
    return { valid: false, errors, warnings };
  }
  
  const card = config as Record<string, unknown>;
  
  // Required: cardTitle
  if (!card['cardTitle'] || typeof card['cardTitle'] !== 'string') {
    errors.push({
      path: 'cardTitle',
      message: 'cardTitle is required and must be a string',
      value: card['cardTitle'],
      expected: 'string'
    });
  } else if ((card['cardTitle'] as string).length === 0) {
    errors.push({
      path: 'cardTitle',
      message: 'cardTitle cannot be empty',
      value: card['cardTitle']
    });
  } else if ((card['cardTitle'] as string).length > 200) {
    warnings.push({
      path: 'cardTitle',
      message: 'cardTitle is very long (>200 chars), consider shortening',
      value: card['cardTitle']
    });
  }
  
  // Required: sections
  if (!Array.isArray(card['sections'])) {
    errors.push({
      path: 'sections',
      message: 'sections must be an array',
      value: card['sections'],
      expected: 'array'
    });
  } else {
    // Validate each section
    const sections = card['sections'] as unknown[];
    sections.forEach((section, index) => {
      const sectionResult = validateSection(section, `sections[${index}]`);
      errors.push(...sectionResult.errors);
      warnings.push(...sectionResult.warnings);
    });
    
    if (sections.length === 0) {
      warnings.push({
        path: 'sections',
        message: 'Card has no sections'
      });
    }
  }
  
  // Optional: id
  if (card['id'] !== undefined && typeof card['id'] !== 'string') {
    errors.push({
      path: 'id',
      message: 'id must be a string',
      value: card['id'],
      expected: 'string'
    });
  }
  
  // Optional: description
  if (card['description'] !== undefined && typeof card['description'] !== 'string') {
    errors.push({
      path: 'description',
      message: 'description must be a string',
      value: card['description'],
      expected: 'string'
    });
  }
  
  // Optional: actions
  if (card['actions'] !== undefined) {
    if (!Array.isArray(card['actions'])) {
      errors.push({
        path: 'actions',
        message: 'actions must be an array',
        value: card['actions'],
        expected: 'array'
      });
    } else {
      (card['actions'] as unknown[]).forEach((action, index) => {
        const actionResult = validateAction(action, `actions[${index}]`);
        errors.push(...actionResult.errors);
        warnings.push(...actionResult.warnings);
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate a section
 */
export function validateSection(section: unknown, basePath = ''): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const path = (field: string) => basePath ? `${basePath}.${field}` : field;
  
  if (!section || typeof section !== 'object') {
    errors.push({
      path: basePath,
      message: 'Section must be an object',
      value: section,
      expected: 'object'
    });
    return { valid: false, errors, warnings };
  }
  
  const s = section as Record<string, unknown>;
  
  // Required: title
  if (!s['title'] || typeof s['title'] !== 'string') {
    errors.push({
      path: path('title'),
      message: 'Section title is required and must be a string',
      value: s['title'],
      expected: 'string'
    });
  }
  
  // Required: type
  if (!s['type'] || typeof s['type'] !== 'string') {
    errors.push({
      path: path('type'),
      message: 'Section type is required and must be a string',
      value: s['type'],
      expected: 'string'
    });
  } else if (!VALID_SECTION_TYPES.includes(s['type'] as string)) {
    warnings.push({
      path: path('type'),
      message: `Unknown section type "${s['type']}". Will use fallback renderer.`,
      value: s['type'],
      expected: VALID_SECTION_TYPES.join(' | ')
    });
  }
  
  // Validate fields if present
  if (s['fields'] !== undefined) {
    if (!Array.isArray(s['fields'])) {
      errors.push({
        path: path('fields'),
        message: 'fields must be an array',
        value: s['fields'],
        expected: 'array'
      });
    } else {
      (s['fields'] as unknown[]).forEach((field, index) => {
        const fieldResult = validateField(field, path(`fields[${index}]`));
        errors.push(...fieldResult.errors);
        warnings.push(...fieldResult.warnings);
      });
    }
  }
  
  // Validate items if present
  if (s['items'] !== undefined) {
    if (!Array.isArray(s['items'])) {
      errors.push({
        path: path('items'),
        message: 'items must be an array',
        value: s['items'],
        expected: 'array'
      });
    } else {
      (s['items'] as unknown[]).forEach((item, index) => {
        const itemResult = validateItem(item, path(`items[${index}]`));
        errors.push(...itemResult.errors);
        warnings.push(...itemResult.warnings);
      });
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate a field
 */
export function validateField(field: unknown, basePath = ''): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const path = (f: string) => basePath ? `${basePath}.${f}` : f;
  
  if (!field || typeof field !== 'object') {
    errors.push({
      path: basePath,
      message: 'Field must be an object',
      value: field,
      expected: 'object'
    });
    return { valid: false, errors, warnings };
  }
  
  const f = field as Record<string, unknown>;
  
  // Required: label
  if (f['label'] !== undefined && typeof f['label'] !== 'string') {
    errors.push({
      path: path('label'),
      message: 'Field label must be a string',
      value: f['label'],
      expected: 'string'
    });
  }
  
  // Required: value
  if (f['value'] === undefined) {
    warnings.push({
      path: path('value'),
      message: 'Field value is undefined',
      value: f['value']
    });
  } else if (
    typeof f['value'] !== 'string' &&
    typeof f['value'] !== 'number' &&
    typeof f['value'] !== 'boolean'
  ) {
    warnings.push({
      path: path('value'),
      message: 'Field value should be a string, number, or boolean',
      value: f['value'],
      expected: 'string | number | boolean'
    });
  }
  
  // Optional: url validation
  if (f['url'] !== undefined && typeof f['url'] === 'string') {
    if (!isValidUrl(f['url'])) {
      errors.push({
        path: path('url'),
        message: 'Invalid URL format',
        value: f['url'],
        expected: 'valid URL'
      });
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate an item
 */
export function validateItem(item: unknown, basePath = ''): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const path = (f: string) => basePath ? `${basePath}.${f}` : f;
  
  if (!item || typeof item !== 'object') {
    errors.push({
      path: basePath,
      message: 'Item must be an object',
      value: item,
      expected: 'object'
    });
    return { valid: false, errors, warnings };
  }
  
  const i = item as Record<string, unknown>;
  
  // Required: title
  if (!i['title'] || typeof i['title'] !== 'string') {
    errors.push({
      path: path('title'),
      message: 'Item title is required and must be a string',
      value: i['title'],
      expected: 'string'
    });
  }
  
  // Optional: description
  if (i['description'] !== undefined && typeof i['description'] !== 'string') {
    warnings.push({
      path: path('description'),
      message: 'Item description should be a string',
      value: i['description'],
      expected: 'string'
    });
  }
  
  // Optional: url validation
  if (i['url'] !== undefined && typeof i['url'] === 'string') {
    if (!isValidUrl(i['url'])) {
      errors.push({
        path: path('url'),
        message: 'Invalid URL format',
        value: i['url'],
        expected: 'valid URL'
      });
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate an action
 */
export function validateAction(action: unknown, basePath = ''): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const path = (f: string) => basePath ? `${basePath}.${f}` : f;
  
  if (!action || typeof action !== 'object') {
    errors.push({
      path: basePath,
      message: 'Action must be an object',
      value: action,
      expected: 'object'
    });
    return { valid: false, errors, warnings };
  }
  
  const a = action as Record<string, unknown>;
  
  // Required: type
  if (!a['type'] || typeof a['type'] !== 'string') {
    errors.push({
      path: path('type'),
      message: 'Action type is required and must be a string',
      value: a['type'],
      expected: 'string'
    });
  } else if (!VALID_ACTION_TYPES.includes(a['type'] as string)) {
    warnings.push({
      path: path('type'),
      message: `Unknown action type "${a['type']}"`,
      value: a['type'],
      expected: VALID_ACTION_TYPES.join(' | ')
    });
  }
  
  // Required: label
  if (!a['label'] || typeof a['label'] !== 'string') {
    errors.push({
      path: path('label'),
      message: 'Action label is required and must be a string',
      value: a['label'],
      expected: 'string'
    });
  }
  
  // Type-specific validation
  const actionType = a['type'] as string;
  
  if (actionType === 'website') {
    if (!a['url'] || typeof a['url'] !== 'string') {
      errors.push({
        path: path('url'),
        message: 'Website action requires a url',
        value: a['url'],
        expected: 'string'
      });
    } else if (!isValidUrl(a['url'])) {
      errors.push({
        path: path('url'),
        message: 'Invalid URL format',
        value: a['url'],
        expected: 'valid URL'
      });
    }
  }
  
  if (actionType === 'mail') {
    if (!a['email'] || typeof a['email'] !== 'object') {
      errors.push({
        path: path('email'),
        message: 'Mail action requires an email configuration',
        value: a['email'],
        expected: 'object'
      });
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for AICardConfig
 */
export function isValidCard(config: unknown): config is AICardConfig {
  return validateCard(config).valid;
}

/**
 * Type guard for CardSection
 */
export function isValidSection(section: unknown): section is CardSection {
  return validateSection(section).valid;
}

/**
 * Type guard for CardField
 */
export function isValidField(field: unknown): field is CardField {
  return validateField(field).valid;
}

/**
 * Type guard for CardItem
 */
export function isValidItem(item: unknown): item is CardItem {
  return validateItem(item).valid;
}

/**
 * Type guard for CardAction
 */
export function isValidAction(action: unknown): action is CardAction {
  return validateAction(action).valid;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    // Check for relative URLs
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

/**
 * Check if a string is a valid email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Format validation errors as a string
 */
export function formatValidationErrors(result: ValidationResult): string {
  const lines: string[] = [];
  
  if (result.errors.length > 0) {
    lines.push('Errors:');
    result.errors.forEach(e => {
      lines.push(`  - ${e.path || 'root'}: ${e.message}`);
    });
  }
  
  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    result.warnings.forEach(w => {
      lines.push(`  - ${w.path || 'root'}: ${w.message}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Strict validation that throws on error
 */
export function assertValidCard(config: unknown): asserts config is AICardConfig {
  const result = validateCard(config);
  if (!result.valid) {
    throw new Error(`Invalid card configuration:\n${formatValidationErrors(result)}`);
  }
}

