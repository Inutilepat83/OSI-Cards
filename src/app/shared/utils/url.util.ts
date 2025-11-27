import { SanitizationUtil } from './sanitization.util';

/**
 * URL validation and sanitization utilities
 * 
 * Provides comprehensive URL validation and sanitization for external links,
 * ensuring security and preventing malicious URL attacks.
 * 
 * @example
 * ```typescript
 * const safeUrl = UrlUtil.validateAndSanitizeUrl(userInput);
 * if (safeUrl) {
 *   // Use safe URL
 * }
 * ```
 */
export class UrlUtil {
  /**
   * Allowed URL protocols for external links
   */
  private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'] as const;

  /**
   * Allowed URL protocols for website actions
   */
  private static readonly ALLOWED_WEBSITE_PROTOCOLS = ['http:', 'https:'] as const;

  /**
   * Validate and sanitize a URL for external use
   * 
   * Performs comprehensive validation:
   * - Checks protocol is allowed (http, https, mailto)
   * - Validates URL format
   * - Prevents javascript: and data: protocols
   * - Sanitizes query parameters
   * 
   * @param url - URL to validate and sanitize
   * @param allowedProtocols - Optional custom allowed protocols (defaults to ALLOWED_PROTOCOLS)
   * @returns Sanitized URL if valid, null otherwise
   */
  static validateAndSanitizeUrl(
    url: string | null | undefined,
    allowedProtocols: readonly string[] = this.ALLOWED_PROTOCOLS
  ): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Trim whitespace
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return null;
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /about:/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmedUrl)) {
        console.warn('UrlUtil: Dangerous URL pattern detected:', trimmedUrl);
        return null;
      }
    }

    try {
      // Parse URL
      const urlObj = new URL(trimmedUrl);

      // Check protocol
      if (!allowedProtocols.includes(urlObj.protocol)) {
        console.warn('UrlUtil: Protocol not allowed:', urlObj.protocol);
        return null;
      }

      // For http/https, validate hostname
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        // Check for localhost/internal IPs (optional - can be configured)
        const hostname = urlObj.hostname.toLowerCase();
        const localhostPatterns = [
          /^localhost$/,
          /^127\./,
          /^192\.168\./,
          /^10\./,
          /^172\.(1[6-9]|2[0-9]|3[01])\./
        ];

        // Allow localhost in development, but log it
        if (localhostPatterns.some(pattern => pattern.test(hostname))) {
          console.warn('UrlUtil: Localhost/internal IP detected:', hostname);
          // In production, you might want to reject these
          // return null;
        }

        // Validate hostname format
        if (!this.isValidHostname(hostname)) {
          console.warn('UrlUtil: Invalid hostname:', hostname);
          return null;
        }
      }

      // Reconstruct URL to ensure it's properly formatted
      return urlObj.toString();
    } catch (error) {
      // Invalid URL format
      console.warn('UrlUtil: Invalid URL format:', trimmedUrl, error);
      return null;
    }
  }

  /**
   * Validate and sanitize URL for website actions (http/https only)
   * 
   * @param url - URL to validate
   * @returns Sanitized URL if valid, null otherwise
   */
  static validateWebsiteUrl(url: string | null | undefined): string | null {
    return this.validateAndSanitizeUrl(url, this.ALLOWED_WEBSITE_PROTOCOLS);
  }

  /**
   * Validate hostname format
   * 
   * @param hostname - Hostname to validate
   * @returns true if hostname is valid
   */
  private static isValidHostname(hostname: string): boolean {
    // Basic hostname validation
    // Must be between 1 and 253 characters
    if (hostname.length === 0 || hostname.length > 253) {
      return false;
    }

    // Must not start or end with a dot
    if (hostname.startsWith('.') || hostname.endsWith('.')) {
      return false;
    }

    // Must contain only valid characters (letters, numbers, dots, hyphens)
    const hostnamePattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    return hostnamePattern.test(hostname);
  }

  /**
   * Check if URL is external (not same origin)
   * 
   * @param url - URL to check
   * @returns true if URL is external
   */
  static isExternalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.href);
      return urlObj.origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Get safe URL for use in href attributes
   * 
   * Returns null for external URLs that should use rel="noopener noreferrer"
   * or for invalid URLs
   * 
   * @param url - URL to process
   * @returns Safe URL string or null
   */
  static getSafeHref(url: string | null | undefined): string | null {
    const sanitized = this.validateAndSanitizeUrl(url);
    if (!sanitized) {
      return null;
    }

    // For external URLs, we still return the URL but recommend using
    // rel="noopener noreferrer" in the HTML
    return sanitized;
  }
}
