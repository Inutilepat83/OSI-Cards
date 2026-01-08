/**
 * Input Validation Utilities
 *
 * Provides comprehensive input validation and sanitization for security.
 * Protects against XSS, injection attacks, and malformed data.
 *
 * @example
 * ```typescript
 * import { validateUrl, sanitizeHtml, validateEmail } from 'osi-cards-lib';
 *
 * // Validate URL
 * const urlResult = validateUrl('https://example.com');
 * if (urlResult.valid) {
 *   console.log('Safe URL:', urlResult.sanitized);
 * }
 *
 * // Sanitize HTML content
 * const safeHtml = sanitizeHtml('<script>alert("xss")</script><p>Hello</p>');
 * // Returns: '<p>Hello</p>'
 *
 * // Validate email
 * if (validateEmail('user@example.com')) {
 *   console.log('Valid email');
 * }
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult<T = string> {
  valid: boolean;
  sanitized?: T;
  error?: string;
}

/**
 * URL validation options
 */
export interface UrlValidationOptions {
  /** Allowed protocols (default: ['https:', 'http:', 'mailto:', 'tel:']) */
  allowedProtocols?: string[];
  /** Allow relative URLs */
  allowRelative?: boolean;
  /** Allow data: URLs */
  allowDataUrls?: boolean;
  /** Maximum URL length */
  maxLength?: number;
}

/**
 * HTML sanitization options
 */
export interface HtmlSanitizationOptions {
  /** Allowed HTML tags */
  allowedTags?: string[];
  /** Allowed HTML attributes */
  allowedAttributes?: Record<string, string[]>;
  /** Allow href attributes on anchor tags */
  allowLinks?: boolean;
  /** Strip all HTML and return plain text */
  stripHtml?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default allowed URL protocols
 */
const DEFAULT_ALLOWED_PROTOCOLS = ['https:', 'http:', 'mailto:', 'tel:'];

/**
 * Default allowed HTML tags (safe subset)
 */
const DEFAULT_ALLOWED_TAGS = [
  'p',
  'br',
  'b',
  'i',
  'u',
  'strong',
  'em',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'code',
  'pre',
];

/**
 * Default allowed HTML attributes
 */
const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  span: ['class'],
  '*': ['class', 'id'],
};

/**
 * Maximum default lengths
 */
const MAX_URL_LENGTH = 2048;
const MAX_EMAIL_LENGTH = 254;
const MAX_TEXT_LENGTH = 10000;
const MAX_TITLE_LENGTH = 200;

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Validate and sanitize a URL
 *
 * @param url - URL to validate
 * @param options - Validation options
 * @returns Validation result with sanitized URL
 */
export function validateUrl(url: unknown, options: UrlValidationOptions = {}): ValidationResult {
  const {
    allowedProtocols = DEFAULT_ALLOWED_PROTOCOLS,
    allowRelative = false,
    allowDataUrls = false,
    maxLength = MAX_URL_LENGTH,
  } = options;

  // Check type
  if (typeof url !== 'string') {
    return { valid: false, error: 'URL must be a string' };
  }

  // Trim and check empty
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  // Check length
  if (trimmed.length > maxLength) {
    return { valid: false, error: `URL exceeds maximum length of ${maxLength}` };
  }

  // Check for javascript: protocol (XSS)
  const lowerUrl = trimmed.toLowerCase();
  if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('vbscript:')) {
    return { valid: false, error: 'Script URLs are not allowed' };
  }

  // Check data: URLs
  if (lowerUrl.startsWith('data:') && !allowDataUrls) {
    return { valid: false, error: 'Data URLs are not allowed' };
  }

  // Try to parse URL
  try {
    // Handle relative URLs
    if (allowRelative && !trimmed.includes('://') && !trimmed.startsWith('//')) {
      // Relative URL - just sanitize
      return { valid: true, sanitized: encodeURI(trimmed) };
    }

    const parsed = new URL(trimmed, 'https://placeholder.com');

    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Protocol ${parsed.protocol} is not allowed. Allowed: ${allowedProtocols.join(', ')}`,
      };
    }

    // Reconstruct sanitized URL
    return { valid: true, sanitized: parsed.href };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Check if a URL is safe for use in href attributes
 *
 * @param url - URL to check
 * @returns true if URL is safe
 */
export function isSafeUrl(url: unknown): boolean {
  return validateUrl(url).valid;
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate an email address
 *
 * @param email - Email to validate
 * @returns true if email is valid
 */
export function validateEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;

  const trimmed = email.trim();
  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH) return false;

  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validate and sanitize email configuration for mail actions
 *
 * @param config - Email configuration
 * @returns Validation result
 */
export function validateEmailConfig(config: unknown): ValidationResult<Record<string, unknown>> {
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'Email configuration must be an object' };
  }

  const emailConfig = config as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  // Validate contact
  if (emailConfig['contact']) {
    const contact = emailConfig['contact'] as Record<string, unknown>;

    if (contact['email'] && !validateEmail(contact['email'])) {
      return { valid: false, error: 'Invalid contact email address' };
    }

    sanitized['contact'] = {
      name: sanitizeText(contact['name'] as string, MAX_TEXT_LENGTH),
      email: contact['email'] ? (contact['email'] as string).trim() : '',
      role: sanitizeText(contact['role'] as string, MAX_TEXT_LENGTH),
    };
  }

  // Validate CC emails
  if (Array.isArray(emailConfig['cc'])) {
    const validCc = (emailConfig['cc'] as unknown[])
      .filter((email) => validateEmail(email))
      .map((email) => (email as string).trim());
    sanitized['cc'] = validCc;
  }

  // Validate BCC emails
  if (Array.isArray(emailConfig['bcc'])) {
    const validBcc = (emailConfig['bcc'] as unknown[])
      .filter((email) => validateEmail(email))
      .map((email) => (email as string).trim());
    sanitized['bcc'] = validBcc;
  }

  // Sanitize subject and body
  sanitized['subject'] = sanitizeText(emailConfig['subject'] as string, MAX_TITLE_LENGTH);
  sanitized['body'] = sanitizeText(emailConfig['body'] as string, MAX_TEXT_LENGTH);

  return { valid: true, sanitized };
}

// ============================================================================
// HTML SANITIZATION
// ============================================================================

/**
 * HTML entities for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML special characters
 *
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
export function escapeHtml(text: unknown): string {
  if (typeof text !== 'string') return '';

  return text.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize HTML content
 *
 * @param html - HTML to sanitize
 * @param options - Sanitization options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: unknown, options: HtmlSanitizationOptions = {}): string {
  if (typeof html !== 'string') return '';

  const {
    allowedTags = DEFAULT_ALLOWED_TAGS,
    allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES,
    allowLinks = true,
    stripHtml = false,
  } = options;

  // If stripping HTML, just escape everything
  if (stripHtml) {
    return escapeHtml(html.replace(/<[^>]*>/g, ''));
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: and vbscript: URLs from href/src
  sanitized = sanitized.replace(/(?:href|src)\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, '');
  sanitized = sanitized.replace(/(?:href|src)\s*=\s*["']?\s*vbscript:[^"'>\s]*/gi, '');

  // Remove disallowed tags
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagRegex, (match, tagName: string) => {
    const lowerTag = tagName.toLowerCase();

    if (!allowedTags.includes(lowerTag)) {
      return '';
    }

    // If it's a closing tag, just return it
    if (match.startsWith('</')) {
      return `</${lowerTag}>`;
    }

    // For anchor tags, verify href is safe
    if (lowerTag === 'a' && !allowLinks) {
      return '';
    }

    // Filter attributes
    const attrAllowed = allowedAttributes[lowerTag] || allowedAttributes['*'] || [];
    const cleanTag = filterAttributes(match, lowerTag, attrAllowed);

    return cleanTag;
  });

  return sanitized;
}

/**
 * Filter attributes from an HTML tag
 */
function filterAttributes(tag: string, tagName: string, allowed: string[]): string {
  // Extract attributes
  const attrRegex = /([a-z-]+)\s*=\s*["']([^"']*)["']/gi;
  const attrs: string[] = [];

  let match;
  while ((match = attrRegex.exec(tag)) !== null) {
    const attrName = match[1]?.toLowerCase() ?? '';
    let attrValue = match[2] ?? '';

    if (allowed.includes(attrName)) {
      // Special handling for href
      if (attrName === 'href') {
        const urlResult = validateUrl(attrValue);
        if (!urlResult.valid) continue;
        attrValue = urlResult.sanitized ?? attrValue;
      }

      attrs.push(`${attrName}="${escapeHtml(attrValue)}"`);
    }
  }

  const isSelfClosing = tag.endsWith('/>');
  const attrString = attrs.length ? ' ' + attrs.join(' ') : '';

  return `<${tagName}${attrString}${isSelfClosing ? ' /' : ''}>`;
}

// ============================================================================
// TEXT SANITIZATION
// ============================================================================

/**
 * Sanitize plain text input
 *
 * @param text - Text to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export function sanitizeText(text: unknown, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof text !== 'string') return '';

  // Trim whitespace
  let sanitized = text.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Normalize whitespace (but preserve single line breaks)
  sanitized = sanitized.replace(/[^\S\n]+/g, ' ');
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize a card title
 *
 * @param title - Title to sanitize
 * @returns Sanitized title
 */
export function sanitizeTitle(title: unknown): string {
  const sanitized = sanitizeText(title, MAX_TITLE_LENGTH);
  // Remove any remaining HTML entities and escape for display
  return escapeHtml(sanitized);
}

// ============================================================================
// CARD CONFIG VALIDATION
// ============================================================================

/**
 * Validate and sanitize card configuration
 *
 * @param config - Card configuration to validate
 * @returns Validation result
 */
export function validateCardConfig(config: unknown): ValidationResult<Record<string, unknown>> {
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'Card configuration must be an object' };
  }

  const cardConfig = config as Record<string, unknown>;
  const errors: string[] = [];

  // Check required fields
  if (!cardConfig['cardTitle'] || typeof cardConfig['cardTitle'] !== 'string') {
    errors.push('cardTitle is required and must be a string');
  }

  if (!Array.isArray(cardConfig['sections'])) {
    errors.push('sections must be an array');
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  // Sanitize the configuration
  const sanitized: Record<string, unknown> = {
    ...cardConfig,
    cardTitle: sanitizeTitle(cardConfig['cardTitle']),
    description: cardConfig['description']
      ? sanitizeText(cardConfig['description'] as string)
      : undefined,
    sections: (cardConfig['sections'] as unknown[]).map((section) => sanitizeSection(section)),
  };

  // Sanitize actions if present
  if (Array.isArray(cardConfig['actions'])) {
    sanitized['actions'] = (cardConfig['actions'] as unknown[]).map((action) =>
      sanitizeAction(action)
    );
  }

  return { valid: true, sanitized };
}

/**
 * Sanitize a section object
 */
function sanitizeSection(section: unknown): Record<string, unknown> {
  if (!section || typeof section !== 'object') {
    return { title: '', type: 'list' };
  }

  const sectionObj = section as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {
    ...sectionObj,
    title: sanitizeText(sectionObj['title'] as string, MAX_TITLE_LENGTH),
    description: sectionObj['description']
      ? sanitizeText(sectionObj['description'] as string)
      : undefined,
  };

  // Sanitize fields
  if (Array.isArray(sectionObj['fields'])) {
    sanitized['fields'] = (sectionObj['fields'] as unknown[]).map((field) => sanitizeField(field));
  }

  // Sanitize items
  if (Array.isArray(sectionObj['items'])) {
    sanitized['items'] = (sectionObj['items'] as unknown[]).map((item) => sanitizeItem(item));
  }

  return sanitized;
}

/**
 * Sanitize a field object
 */
function sanitizeField(field: unknown): Record<string, unknown> {
  if (!field || typeof field !== 'object') {
    return { label: '', value: '' };
  }

  const fieldObj = field as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {
    ...fieldObj,
    label: sanitizeText(fieldObj['label'] as string, MAX_TITLE_LENGTH),
    value: sanitizeFieldValue(fieldObj['value']),
  };

  // Sanitize URL if present
  if (fieldObj['url']) {
    const urlResult = validateUrl(fieldObj['url']);
    sanitized['url'] = urlResult.valid ? urlResult.sanitized : undefined;
  }

  return sanitized;
}

/**
 * Sanitize a field value (can be string, number, boolean)
 */
function sanitizeFieldValue(value: unknown): string | number | boolean {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  return '';
}

/**
 * Sanitize an item object
 */
function sanitizeItem(item: unknown): Record<string, unknown> {
  if (!item || typeof item !== 'object') {
    return { title: '' };
  }

  const itemObj = item as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {
    ...itemObj,
    title: sanitizeText(itemObj['title'] as string, MAX_TITLE_LENGTH),
    description: itemObj['description']
      ? sanitizeText(itemObj['description'] as string)
      : undefined,
  };

  // Sanitize URL if present
  if (itemObj['url']) {
    const urlResult = validateUrl(itemObj['url']);
    sanitized['url'] = urlResult.valid ? urlResult.sanitized : undefined;
  }

  return sanitized;
}

/**
 * Sanitize an action object
 */
function sanitizeAction(action: unknown): Record<string, unknown> {
  if (!action || typeof action !== 'object') {
    return { label: '' };
  }

  const actionObj = action as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {
    ...actionObj,
    label: sanitizeText(actionObj['label'] as string, MAX_TITLE_LENGTH),
  };

  // Validate email for mail actions
  if (actionObj['type'] === 'mail' && actionObj['email']) {
    const emailResult = validateEmailConfig(actionObj['email']);
    if (emailResult.valid) {
      sanitized['email'] = emailResult.sanitized;
    }
  }

  // Validate URL for website actions
  if (actionObj['type'] === 'website' && actionObj['url']) {
    const urlResult = validateUrl(actionObj['url']);
    sanitized['url'] = urlResult.valid ? urlResult.sanitized : undefined;
  }

  return sanitized;
}

// ============================================================================
// CSP COMPLIANCE HELPERS
// ============================================================================

/**
 * Check if styles are CSP-compliant (no inline styles via string)
 *
 * @param element - Element to check
 * @returns true if element has no inline style attribute
 */
export function isCspCompliantElement(element: HTMLElement): boolean {
  return !element.hasAttribute('style');
}

/**
 * Apply styles in a CSP-compliant way using CSS custom properties
 *
 * @param element - Element to style
 * @param styles - CSS custom properties to set
 */
export function applyCspCompliantStyles(
  element: HTMLElement,
  styles: Record<string, string | number>
): void {
  for (const [property, value] of Object.entries(styles)) {
    const cssProperty = property.startsWith('--') ? property : `--${property}`;
    element.style.setProperty(cssProperty, String(value));
  }
}
