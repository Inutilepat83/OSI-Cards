/**
 * XSS Sanitization Utilities
 *
 * Provides comprehensive XSS (Cross-Site Scripting) protection for user-provided content.
 * Use these utilities to sanitize any untrusted data before rendering.
 *
 * @example
 * ```typescript
 * import { sanitizeHtml, sanitizeUrl, sanitizeText } from 'osi-cards-lib';
 *
 * const safeHtml = sanitizeHtml(userInput);
 * const safeUrl = sanitizeUrl(userProvidedUrl);
 * const safeText = sanitizeText(userText);
 * ```
 *
 * @module utils/sanitization
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Allowed HTML tags for sanitization */
export const ALLOWED_TAGS = [
  'a', 'b', 'i', 'u', 'em', 'strong', 'span', 'p', 'br', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'section', 'article'
] as const;

/** Allowed HTML attributes */
export const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'span': ['class', 'style'],
  'div': ['class', 'style'],
  'p': ['class', 'style'],
  'td': ['colspan', 'rowspan'],
  'th': ['colspan', 'rowspan', 'scope'],
  '*': ['class', 'id', 'data-*']
};

/** Dangerous URL protocols */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:'
];

/** Safe URL protocols */
const SAFE_PROTOCOLS = [
  'http:',
  'https:',
  'mailto:',
  'tel:',
  'ftp:'
];

// ============================================================================
// TEXT SANITIZATION
// ============================================================================

/**
 * Sanitize plain text by escaping HTML entities
 *
 * This is the safest option - converts all HTML to escaped text.
 *
 * @param text - Input text to sanitize
 * @returns Escaped text safe for HTML rendering
 *
 * @example
 * ```typescript
 * const safe = sanitizeText('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 * ```
 */
export function sanitizeText(text: string | null | undefined): string {
  if (text == null) {
    return '';
  }

  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;');
}

/**
 * Unescape HTML entities back to text
 *
 * @param text - Escaped text
 * @returns Unescaped text
 */
export function unescapeText(text: string): string {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

// ============================================================================
// HTML SANITIZATION
// ============================================================================

/**
 * Options for HTML sanitization
 */
export interface SanitizeHtmlOptions {
  /** Additional allowed tags beyond defaults */
  allowedTags?: string[];
  /** Tags to completely remove (not just escape) */
  removeTags?: string[];
  /** Allow data-* attributes */
  allowDataAttributes?: boolean;
  /** Allow style attribute */
  allowStyles?: boolean;
  /** Custom attribute filter */
  attributeFilter?: (tag: string, attr: string, value: string) => boolean;
}

/**
 * Sanitize HTML content by removing dangerous elements and attributes
 *
 * Uses a whitelist approach - only allowed tags and attributes are kept.
 *
 * @param html - HTML string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized HTML string
 *
 * @example
 * ```typescript
 * const safe = sanitizeHtml('<div onclick="alert(1)">Hello</div>');
 * // Returns: '<div>Hello</div>'
 * ```
 */
export function sanitizeHtml(
  html: string | null | undefined,
  options: SanitizeHtmlOptions = {}
): string {
  if (html == null || html === '') {
    return '';
  }

  const {
    allowedTags = [],
    removeTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    allowDataAttributes = false,
    allowStyles = false,
    attributeFilter
  } = options;

  // Combine default and custom allowed tags
  const allAllowedTags = new Set([...ALLOWED_TAGS, ...allowedTags]);
  const tagsToRemove = new Set(removeTags);

  // Use DOMParser for safe parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Process the document
  sanitizeNode(doc.body, allAllowedTags, tagsToRemove, {
    allowDataAttributes,
    allowStyles,
    attributeFilter
  });

  return doc.body.innerHTML;
}

/**
 * Recursively sanitize a DOM node
 */
function sanitizeNode(
  node: Node,
  allowedTags: Set<string>,
  removeTags: Set<string>,
  options: {
    allowDataAttributes: boolean;
    allowStyles: boolean;
    attributeFilter?: (tag: string, attr: string, value: string) => boolean;
  }
): void {
  // Process child nodes in reverse order (so removal doesn't affect iteration)
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      const tagName = element.tagName.toLowerCase();

      // Remove dangerous tags completely
      if (removeTags.has(tagName)) {
        element.remove();
        continue;
      }

      // If tag not allowed, replace with text content
      if (!allowedTags.has(tagName)) {
        const text = document.createTextNode(element.textContent || '');
        element.replaceWith(text);
        continue;
      }

      // Sanitize attributes
      sanitizeAttributes(element, tagName, options);

      // Recursively process children
      sanitizeNode(element, allowedTags, removeTags, options);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      // Remove comments (can contain conditional IE exploits)
      child.remove();
    }
  }
}

/**
 * Sanitize element attributes
 */
function sanitizeAttributes(
  element: Element,
  tagName: string,
  options: {
    allowDataAttributes: boolean;
    allowStyles: boolean;
    attributeFilter?: (tag: string, attr: string, value: string) => boolean;
  }
): void {
  const allowedAttrs = new Set([
    ...(ALLOWED_ATTRIBUTES[tagName] || []),
    ...(ALLOWED_ATTRIBUTES['*'] || [])
  ]);

  // Get all attributes to check
  const attrs = Array.from(element.attributes);

  for (const attr of attrs) {
    const attrName = attr.name.toLowerCase();
    const attrValue = attr.value;

    // Check for event handlers (onclick, onerror, etc.)
    if (attrName.startsWith('on')) {
      element.removeAttribute(attr.name);
      continue;
    }

    // Check data-* attributes
    if (attrName.startsWith('data-')) {
      if (!options.allowDataAttributes) {
        element.removeAttribute(attr.name);
      }
      continue;
    }

    // Check style attribute
    if (attrName === 'style') {
      if (!options.allowStyles) {
        element.removeAttribute(attr.name);
      } else {
        // Sanitize style content
        element.setAttribute('style', sanitizeStyleAttribute(attrValue));
      }
      continue;
    }

    // Check href/src for dangerous protocols
    if (attrName === 'href' || attrName === 'src') {
      if (!isSafeUrl(attrValue)) {
        element.removeAttribute(attr.name);
      }
      continue;
    }

    // Custom attribute filter
    if (options.attributeFilter && !options.attributeFilter(tagName, attrName, attrValue)) {
      element.removeAttribute(attr.name);
      continue;
    }

    // Remove if not in allowed list
    if (!allowedAttrs.has(attrName) && !allowedAttrs.has('data-*')) {
      element.removeAttribute(attr.name);
    }
  }

  // Add security attributes to links
  if (tagName === 'a' && element.hasAttribute('href')) {
    element.setAttribute('rel', 'noopener noreferrer');
  }
}

/**
 * Sanitize style attribute content
 */
function sanitizeStyleAttribute(style: string): string {
  // Remove potentially dangerous CSS properties
  const dangerousPatterns = [
    /expression\s*\(/gi,
    /javascript:/gi,
    /behavior\s*:/gi,
    /-moz-binding/gi,
    /url\s*\([^)]*\)/gi,
    /@import/gi,
    /position\s*:\s*fixed/gi,
    /position\s*:\s*absolute/gi
  ];

  let sanitized = style;
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized;
}

// ============================================================================
// URL SANITIZATION
// ============================================================================

/**
 * Check if a URL is safe to use
 *
 * @param url - URL to check
 * @returns True if the URL uses a safe protocol
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (url == null || url === '') {
    return false;
  }

  // Trim and lowercase for checking
  const trimmed = url.trim().toLowerCase();

  // Check for dangerous protocols
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) {
      return false;
    }
  }

  // Allow relative URLs
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }

  // Allow fragment-only URLs
  if (trimmed.startsWith('#')) {
    return true;
  }

  // Check for safe protocols
  for (const protocol of SAFE_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) {
      return true;
    }
  }

  // Allow protocol-relative URLs
  if (trimmed.startsWith('//')) {
    return true;
  }

  // Reject anything else that looks like a protocol
  if (trimmed.includes(':') && trimmed.indexOf(':') < 10) {
    return false;
  }

  return true;
}

/**
 * Sanitize a URL, returning empty string if unsafe
 *
 * @param url - URL to sanitize
 * @returns Safe URL or empty string
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!isSafeUrl(url)) {
    return '';
  }
  return url!.trim();
}

/**
 * Sanitize a mailto URL
 *
 * @param email - Email address
 * @param subject - Optional subject
 * @param body - Optional body
 * @returns Sanitized mailto URL
 */
export function sanitizeMailtoUrl(
  email: string,
  subject?: string,
  body?: string
): string {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '';
  }

  let url = `mailto:${encodeURIComponent(email)}`;
  const params: string[] = [];

  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }

  if (params.length > 0) {
    url += '?' + params.join('&');
  }

  return url;
}

// ============================================================================
// ATTRIBUTE VALUE SANITIZATION
// ============================================================================

/**
 * Sanitize a value for use in an HTML attribute
 *
 * @param value - Value to sanitize
 * @returns Sanitized value safe for HTML attributes
 */
export function sanitizeAttributeValue(value: string | null | undefined): string {
  if (value == null) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanitize a value for use in a CSS property
 *
 * @param value - Value to sanitize
 * @returns Sanitized CSS value
 */
export function sanitizeCssValue(value: string | null | undefined): string {
  if (value == null) {
    return '';
  }

  // Remove dangerous patterns
  let sanitized = String(value);

  // Remove expressions and javascript
  sanitized = sanitized.replace(/expression\s*\(/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/url\s*\([^)]*script[^)]*\)/gi, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '');

  return sanitized;
}

// ============================================================================
// JSON SANITIZATION
// ============================================================================

/**
 * Sanitize JSON data by escaping HTML in string values
 *
 * @param data - JSON-compatible data
 * @returns Data with sanitized string values
 */
export function sanitizeJsonStrings<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeText(data) as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeJsonStrings(item)) as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = sanitizeJsonStrings(value);
    }
    return result as T;
  }

  return data;
}

// ============================================================================
// CARD-SPECIFIC SANITIZATION
// ============================================================================

/**
 * Sanitize card field value
 *
 * Handles different field types appropriately
 */
export function sanitizeFieldValue(
  value: unknown,
  fieldType?: string
): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  const stringValue = String(value);

  // For URL-type fields, validate the URL
  if (fieldType === 'url' || fieldType === 'link') {
    return sanitizeUrl(stringValue);
  }

  // For email-type fields, validate email format
  if (fieldType === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(stringValue)) {
      return stringValue;
    }
    return '';
  }

  // Default: escape HTML
  return sanitizeText(stringValue);
}

/**
 * Sanitize a card section's content
 */
export function sanitizeSectionContent<T extends Record<string, unknown>>(
  section: T
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(section)) {
    if (key === 'fields' && Array.isArray(value)) {
      sanitized[key] = value.map(field => {
        if (typeof field === 'object' && field !== null) {
          return sanitizeJsonStrings(field);
        }
        return field;
      });
    } else if (key === 'items' && Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return sanitizeJsonStrings(item);
        }
        return item;
      });
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}



