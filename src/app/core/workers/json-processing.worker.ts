/**
 * JSON Processing Web Worker (Point 10)
 *
 * Offloads heavy JSON parsing and validation to a dedicated worker thread.
 * Prevents main thread blocking during large card config processing.
 *
 * @example
 * ```typescript
 * // In a service
 * const worker = new Worker(new URL('./json-processing.worker', import.meta.url));
 * worker.postMessage({ type: 'parse', payload: jsonString });
 * worker.onmessage = (e) => {
 *   if (e.data.success) {
 *     console.log('Parsed:', e.data.result);
 *   }
 * };
 * ```
 */

/// <reference lib="webworker" />

// =============================================================================
// TYPES
// =============================================================================

interface WorkerMessage {
  id: string;
  type: 'parse' | 'validate' | 'sanitize' | 'transform' | 'batch';
  payload: unknown;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface SanitizationResult {
  sanitized: unknown;
  changes: string[];
}

// =============================================================================
// SCRIPT INJECTION PATTERNS
// =============================================================================

const SCRIPT_PATTERNS = [
  /<script[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /eval\s*\(/i,
  /expression\s*\(/i,
  /vbscript:/i,
  /data:text\/html/i,
];

// =============================================================================
// PARSING FUNCTIONS
// =============================================================================

/**
 * Parse JSON with detailed error information
 */
function parseJSON(input: string): {
  success: boolean;
  result?: unknown;
  error?: string;
  position?: number;
} {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Input must be a non-empty string' };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { success: true, result: null };
  }

  try {
    const result = JSON.parse(trimmed);
    return { success: true, result };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown parse error';
    const position = extractErrorPosition(errorMessage);
    return position !== undefined
      ? { success: false, error: errorMessage, position }
      : { success: false, error: errorMessage };
  }
}

/**
 * Extract error position from JSON parse error message
 */
function extractErrorPosition(errorMessage: string): number | undefined {
  const positionMatch = errorMessage.match(/position\s+(\d+)/i);
  if (positionMatch?.[1]) {
    return parseInt(positionMatch[1], 10);
  }

  const columnMatch = errorMessage.match(/column\s+(\d+)/i);
  if (columnMatch?.[1]) {
    return parseInt(columnMatch[1], 10);
  }

  return undefined;
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate card configuration structure
 */
function validateCardConfig(config: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object');
    return { isValid: false, errors, warnings };
  }

  const card = config as Record<string, unknown>;

  // Required fields
  if (!card.cardTitle && !card.title) {
    errors.push('Card must have a title (cardTitle or title field)');
  }

  // Sections validation
  if (card.sections) {
    if (!Array.isArray(card.sections)) {
      errors.push('Sections must be an array');
    } else {
      card.sections.forEach((section: unknown, index: number) => {
        const sectionErrors = validateSection(section, index);
        errors.push(...sectionErrors.errors);
        warnings.push(...sectionErrors.warnings);
      });
    }
  }

  // Check for potential security issues
  const securityCheck = checkSecurityIssues(config);
  if (!securityCheck.safe) {
    errors.push(`Security issue: ${securityCheck.reason}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single section
 */
function validateSection(
  section: unknown,
  index: number
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `Section[${index}]`;

  if (!section || typeof section !== 'object') {
    errors.push(`${prefix}: Must be an object`);
    return { errors, warnings };
  }

  const s = section as Record<string, unknown>;

  // Type is required
  if (!s.type) {
    errors.push(`${prefix}: Missing required 'type' field`);
  } else if (typeof s.type !== 'string') {
    errors.push(`${prefix}: 'type' must be a string`);
  }

  // Title is recommended
  if (!s.title) {
    warnings.push(`${prefix}: Missing 'title' field`);
  }

  // Validate fields if present
  if (s.fields && !Array.isArray(s.fields)) {
    errors.push(`${prefix}: 'fields' must be an array`);
  }

  // Validate items if present
  if (s.items && !Array.isArray(s.items)) {
    errors.push(`${prefix}: 'items' must be an array`);
  }

  return { errors, warnings };
}

/**
 * Check for security issues in the configuration
 */
function checkSecurityIssues(config: unknown): { safe: boolean; reason?: string } {
  const jsonString = JSON.stringify(config);

  for (const pattern of SCRIPT_PATTERNS) {
    if (pattern.test(jsonString)) {
      return { safe: false, reason: 'Potential script injection detected' };
    }
  }

  // Check for excessive nesting (DoS prevention)
  const maxDepth = getObjectDepth(config);
  if (maxDepth > 50) {
    return { safe: false, reason: 'Excessive nesting depth (max 50)' };
  }

  // Check for very long strings
  const hasLongStrings = checkForLongStrings(config, 100000);
  if (hasLongStrings) {
    return { safe: false, reason: 'String value exceeds maximum length (100KB)' };
  }

  return { safe: true };
}

/**
 * Get maximum nesting depth of an object
 */
function getObjectDepth(obj: unknown, currentDepth = 0): number {
  if (currentDepth > 100) {
    return currentDepth;
  } // Safety limit

  if (obj === null || typeof obj !== 'object') {
    return currentDepth;
  }

  if (Array.isArray(obj)) {
    return Math.max(currentDepth, ...obj.map((item) => getObjectDepth(item, currentDepth + 1)));
  }

  const depths = Object.values(obj).map((value) => getObjectDepth(value, currentDepth + 1));
  return Math.max(currentDepth, ...depths);
}

/**
 * Check if object contains strings exceeding max length
 */
function checkForLongStrings(obj: unknown, maxLength: number): boolean {
  if (typeof obj === 'string') {
    return obj.length > maxLength;
  }

  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  if (Array.isArray(obj)) {
    return obj.some((item) => checkForLongStrings(item, maxLength));
  }

  return Object.values(obj).some((value) => checkForLongStrings(value, maxLength));
}

// =============================================================================
// SANITIZATION FUNCTIONS
// =============================================================================

/**
 * Sanitize card configuration
 */
function sanitizeConfig(config: unknown): SanitizationResult {
  const changes: string[] = [];
  const sanitized = deepSanitize(config, '', changes);
  return { sanitized, changes };
}

/**
 * Deep sanitize an object
 */
function deepSanitize(obj: unknown, path: string, changes: string[]): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    const sanitized = sanitizeString(obj);
    if (sanitized !== obj) {
      changes.push(`${path}: Sanitized string value`);
    }
    return sanitized;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => deepSanitize(item, `${path}[${index}]`, changes));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip dangerous keys
      if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
        changes.push(`${path}.${key}: Removed dangerous key`);
        continue;
      }
      result[key] = deepSanitize(value, `${path}.${key}`, changes);
    }
    return result;
  }

  return obj;
}

/**
 * Sanitize a string value
 */
function sanitizeString(str: string): string {
  // Remove script tags
  let result = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  result = result.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: URLs
  result = result.replace(/javascript:/gi, '');
  result = result.replace(/vbscript:/gi, '');

  return result;
}

// =============================================================================
// TRANSFORMATION FUNCTIONS
// =============================================================================

/**
 * Transform card configuration (normalize, add defaults, etc.)
 */
function transformConfig(config: unknown): unknown {
  if (!config || typeof config !== 'object') {
    return config;
  }

  const card = { ...(config as Record<string, unknown>) };

  // Normalize title
  if (!card.cardTitle && card.title) {
    card.cardTitle = card.title;
  }

  // Add default ID if missing
  if (!card.id) {
    card.id = generateId();
  }

  // Transform sections
  if (Array.isArray(card.sections)) {
    card.sections = card.sections.map((section: unknown, index: number) =>
      transformSection(section, index)
    );
  }

  return card;
}

/**
 * Transform a section
 */
function transformSection(section: unknown, index: number): unknown {
  if (!section || typeof section !== 'object') {
    return section;
  }

  const s = { ...(section as Record<string, unknown>) };

  // Add ID if missing
  if (!s.id) {
    s.id = `section-${index}-${generateId()}`;
  }

  // Ensure type is lowercase
  if (typeof s.type === 'string') {
    s.type = s.type.toLowerCase();
  }

  return s;
}

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Process multiple operations in batch
 */
function processBatch(operations: WorkerMessage[]): WorkerResponse[] {
  return operations.map((op) => processMessage(op));
}

// =============================================================================
// MESSAGE HANDLER
// =============================================================================

/**
 * Process a single message
 */
function processMessage(message: WorkerMessage): WorkerResponse {
  const start = performance.now();

  try {
    let result: unknown;

    switch (message.type) {
      case 'parse':
        result = parseJSON(message.payload as string);
        break;

      case 'validate':
        result = validateCardConfig(message.payload);
        break;

      case 'sanitize':
        result = sanitizeConfig(message.payload);
        break;

      case 'transform':
        result = transformConfig(message.payload);
        break;

      case 'batch':
        result = processBatch(message.payload as WorkerMessage[]);
        break;

      default:
        return {
          id: message.id,
          success: false,
          error: `Unknown message type: ${message.type}`,
          duration: performance.now() - start,
        };
    }

    return {
      id: message.id,
      success: true,
      result,
      duration: performance.now() - start,
    };
  } catch (e) {
    return {
      id: message.id,
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      duration: performance.now() - start,
    };
  }
}

// =============================================================================
// WORKER ENTRY POINT
// =============================================================================

addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const response = processMessage(event.data);
  postMessage(response);
});

// Signal that worker is ready
postMessage({ type: 'ready' });
