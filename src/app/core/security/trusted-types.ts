/**
 * Trusted Types Implementation (Point 54)
 *
 * Implements Trusted Types policy for innerHTML operations.
 * Provides a secure way to handle dynamic HTML content.
 *
 * @see https://web.dev/trusted-types/
 *
 * @example
 * ```typescript
 * import { createTrustedHTML, sanitizeAndTrust } from './trusted-types';
 *
 * // Create trusted HTML
 * const html = createTrustedHTML('<p>Safe content</p>');
 * element.innerHTML = html;
 *
 * // Sanitize and trust
 * const safeHtml = sanitizeAndTrust(userInput);
 * element.innerHTML = safeHtml;
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Trusted Types policy interface
 */
interface TrustedTypesPolicy {
  createHTML(input: string): TrustedHTML;
  createScript?(input: string): TrustedScript;
  createScriptURL?(input: string): TrustedScriptURL;
}

interface TrustedHTML {
  toString(): string;
}

interface TrustedScript {
  toString(): string;
}

interface TrustedScriptURL {
  toString(): string;
}

interface TrustedTypesWindow extends Window {
  trustedTypes?: {
    createPolicy(
      name: string,
      rules: {
        createHTML?: (input: string) => string;
        createScript?: (input: string) => string;
        createScriptURL?: (input: string) => string;
      }
    ): TrustedTypesPolicy;
    isHTML?(value: unknown): boolean;
    isScript?(value: unknown): boolean;
    isScriptURL?(value: unknown): boolean;
  };
}

// =============================================================================
// SANITIZATION
// =============================================================================

/** HTML entities map */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
};

/** Allowed HTML tags for sanitization */
const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'code',
  'dd',
  'div',
  'dl',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

/** Allowed attributes per tag */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  '*': new Set(['class', 'id', 'data-*']),
};

/** Dangerous URL protocols */
const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:'];

/**
 * Escape HTML entities
 */
function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Check if URL is safe
 */
function isSafeUrl(url: string): boolean {
  const normalized = url.toLowerCase().trim();
  return !DANGEROUS_PROTOCOLS.some((protocol) => normalized.startsWith(protocol));
}

/**
 * Sanitize HTML string
 */
function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove event handlers
  result = result.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: and vbscript: URLs
  result = result.replace(/(?:href|src)\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, '');
  result = result.replace(/(?:href|src)\s*=\s*["']?\s*vbscript:[^"'>\s]*/gi, '');

  // Filter tags
  result = result.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tagName) => {
    const tag = tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }

    // For closing tags, just return the tag
    if (match.startsWith('</')) {
      return `</${tag}>`;
    }

    // Filter attributes
    const allowedAttrs = new Set([
      ...(ALLOWED_ATTRIBUTES[tag] || []),
      ...(ALLOWED_ATTRIBUTES['*'] || []),
    ]);

    let cleanTag = `<${tag}`;

    // Extract and filter attributes
    const attrRegex = /\s+([a-z][a-z0-9-]*)\s*=\s*["']([^"']*)["']/gi;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(match)) !== null) {
      const attrName = attrMatch[1]?.toLowerCase() || '';
      const attrValue = attrMatch[2] || '';

      // Check if attribute is allowed
      const isAllowed =
        allowedAttrs.has(attrName) || (allowedAttrs.has('data-*') && attrName.startsWith('data-'));

      if (isAllowed) {
        // Validate URL attributes
        if ((attrName === 'href' || attrName === 'src') && !isSafeUrl(attrValue)) {
          continue;
        }

        cleanTag += ` ${attrName}="${escapeHtml(attrValue)}"`;
      }
    }

    // Handle self-closing tags
    if (match.endsWith('/>')) {
      cleanTag += ' />';
    } else {
      cleanTag += '>';
    }

    return cleanTag;
  });

  return result;
}

// =============================================================================
// TRUSTED TYPES POLICY
// =============================================================================

let policy: TrustedTypesPolicy | null = null;

/**
 * Initialize Trusted Types policy
 */
function initPolicy(): TrustedTypesPolicy | null {
  if (policy) {
    return policy;
  }

  const win = window as TrustedTypesWindow;

  if (win.trustedTypes) {
    try {
      policy = win.trustedTypes.createPolicy('osi-cards', {
        createHTML: (input: string) => sanitizeHtml(input),
        createScript: (input: string) => {
          // Never allow script creation
          console.warn('[TrustedTypes] Script creation blocked');
          return '';
        },
        createScriptURL: (input: string) => {
          // Only allow same-origin URLs
          try {
            const url = new URL(input, window.location.origin);
            if (url.origin === window.location.origin) {
              return input;
            }
          } catch {
            // Invalid URL
          }
          console.warn('[TrustedTypes] Script URL blocked:', input);
          return '';
        },
      });

      console.log('[TrustedTypes] Policy "osi-cards" created');
      return policy;
    } catch (e) {
      console.warn('[TrustedTypes] Failed to create policy:', e);
    }
  }

  return null;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Check if Trusted Types is supported
 */
export function isTrustedTypesSupported(): boolean {
  const win = window as TrustedTypesWindow;
  return typeof win.trustedTypes !== 'undefined';
}

/**
 * Create trusted HTML from a string
 * Falls back to sanitized string if Trusted Types not supported
 */
export function createTrustedHTML(html: string): TrustedHTML | string {
  const p = initPolicy();

  if (p) {
    return p.createHTML(html);
  }

  // Fallback: sanitize and return string
  return sanitizeHtml(html);
}

/**
 * Sanitize and create trusted HTML
 */
export function sanitizeAndTrust(html: string): TrustedHTML | string {
  return createTrustedHTML(html);
}

/**
 * Create trusted script URL
 */
export function createTrustedScriptURL(url: string): TrustedScriptURL | string {
  const p = initPolicy();

  if (p && p.createScriptURL) {
    return p.createScriptURL(url);
  }

  // Fallback: validate URL
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return url;
    }
  } catch {
    // Invalid URL
  }

  console.warn('[TrustedTypes] Script URL blocked:', url);
  return '';
}

/**
 * Check if value is TrustedHTML
 */
export function isTrustedHTML(value: unknown): boolean {
  const win = window as TrustedTypesWindow;

  if (win.trustedTypes?.isHTML) {
    return win.trustedTypes.isHTML(value);
  }

  return false;
}

/**
 * Assign innerHTML safely using Trusted Types
 */
export function setInnerHTML(element: Element, html: string): void {
  const trusted = createTrustedHTML(html);

  // TypeScript doesn't know about TrustedHTML, so we need to cast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (element as any).innerHTML = trusted;
}

/**
 * Get the Trusted Types policy
 */
export function getPolicy(): TrustedTypesPolicy | null {
  return initPolicy();
}

// =============================================================================
// CSP HEADER HELPER
// =============================================================================

/**
 * Generate CSP header for Trusted Types
 *
 * @example
 * ```typescript
 * const cspHeader = generateTrustedTypesCSP();
 * // Returns: "require-trusted-types-for 'script'; trusted-types osi-cards"
 * ```
 */
export function generateTrustedTypesCSP(): string {
  return "require-trusted-types-for 'script'; trusted-types osi-cards dompurify";
}

// =============================================================================
// ANGULAR INTEGRATION
// =============================================================================

/**
 * Create a sanitizer function for Angular
 * Can be used with DomSanitizer
 */
export function createAngularSanitizer(): (html: string) => string {
  return (html: string) => {
    const trusted = createTrustedHTML(html);
    return trusted.toString();
  };
}
