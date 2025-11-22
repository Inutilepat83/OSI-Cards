/**
 * URL utilities for validating and sanitizing URLs
 */

/**
 * Validate if a string is a valid URL
 * 
 * @param url - The URL string to validate
 * @returns True if the URL is valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidUrl('https://example.com'); // true
 * isValidUrl('not-a-url'); // false
 * ```
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a URL uses an allowed protocol
 * 
 * @param url - The URL string to validate
 * @param allowedProtocols - Array of allowed protocols (default: ['http:', 'https:', 'mailto:'])
 * @returns True if the URL uses an allowed protocol, false otherwise
 * 
 * @example
 * ```typescript
 * isAllowedProtocol('https://example.com'); // true
 * isAllowedProtocol('javascript:alert(1)'); // false
 * ```
 */
export function isAllowedProtocol(url: string, allowedProtocols: string[] = ['http:', 'https:', 'mailto:']): boolean {
  try {
    const urlObj = new URL(url);
    return allowedProtocols.includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize a URL by validating it and checking protocol
 * 
 * @param url - The URL string to sanitize
 * @param allowedProtocols - Array of allowed protocols
 * @returns The sanitized URL or null if invalid
 * 
 * @example
 * ```typescript
 * sanitizeUrl('https://example.com'); // 'https://example.com'
 * sanitizeUrl('javascript:alert(1)'); // null
 * ```
 */
export function sanitizeUrl(url: string, allowedProtocols: string[] = ['http:', 'https:', 'mailto:']): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  if (!isValidUrl(url)) {
    return null;
  }

  if (!isAllowedProtocol(url, allowedProtocols)) {
    return null;
  }

  return url;
}

/**
 * Get domain from URL
 * 
 * @param url - The URL string
 * @returns The domain or null if invalid
 * 
 * @example
 * ```typescript
 * getDomain('https://example.com/path'); // 'example.com'
 * ```
 */
export function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if URL is external (different domain)
 * 
 * @param url - The URL to check
 * @param currentDomain - The current domain to compare against
 * @returns True if URL is external, false otherwise
 * 
 * @example
 * ```typescript
 * isExternalUrl('https://example.com', 'mysite.com'); // true
 * isExternalUrl('https://mysite.com/page', 'mysite.com'); // false
 * ```
 */
export function isExternalUrl(url: string, currentDomain: string): boolean {
  const urlDomain = getDomain(url);
  if (!urlDomain) {
    return false;
  }
  return urlDomain !== currentDomain && !urlDomain.endsWith('.' + currentDomain);
}


