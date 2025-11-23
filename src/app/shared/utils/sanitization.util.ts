import { ValidationUtil } from './validation.util';

/**
 * Sanitization utilities for preventing XSS attacks
 * 
 * Provides comprehensive sanitization functions for:
 * - HTML content
 * - Card titles and section titles
 * - Field values
 * - URLs and email addresses
 * - JSON inputs
 * 
 * All functions are static and can be used throughout the application
 * to ensure user-provided content is safe to render.
 * 
 * @example
 * ```typescript
 * const safeTitle = SanitizationUtil.sanitizeCardTitle(userInput);
 * const safeUrl = SanitizationUtil.sanitizeUrl(userUrl);
 * const safeHtml = SanitizationUtil.sanitizeHtml(userHtml);
 * ```
 */
export class SanitizationUtil {
  /**
   * Sanitize HTML string to prevent XSS
   */
  static sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Sanitize card title
   */
  static sanitizeCardTitle(title: string): string {
    return ValidationUtil.sanitizeCardTitle(title);
  }

  /**
   * Sanitize section title
   */
  static sanitizeSectionTitle(title: string): string {
    if (typeof title !== 'string') {
      return '';
    }
    return ValidationUtil.sanitizeString(title.substring(0, 100));
  }

  /**
   * Sanitize field value
   */
  static sanitizeFieldValue(value: string | number | boolean | null | undefined): string | number | boolean | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return ValidationUtil.sanitizeString(value);
    }
    return String(value);
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Check if it's a valid URL
    if (!ValidationUtil.isValidUrl(url)) {
      return null;
    }

    // Only allow http, https, and mailto protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    try {
      const urlObj = new URL(url);
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return null;
      }
      return url;
    } catch {
      return null;
    }
  }

  /**
   * Sanitize email
   */
  static sanitizeEmail(email: string): string | null {
    if (!email || typeof email !== 'string') {
      return null;
    }

    if (!ValidationUtil.isValidEmail(email)) {
      return null;
    }

    return email.toLowerCase().trim();
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJsonInput(jsonInput: string): string {
    if (!jsonInput || typeof jsonInput !== 'string') {
      return '';
    }

    // Remove potentially dangerous patterns
    let sanitized = jsonInput;

    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return ValidationUtil.sanitizeString(obj) as T;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item)) as T;
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key
        const sanitizedKey = ValidationUtil.sanitizeString(key);
        // Sanitize value
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized as T;
    }

    return obj;
  }
}


