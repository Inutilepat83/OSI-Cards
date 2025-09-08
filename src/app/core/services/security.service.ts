import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';

/**
 * Security service for handling input sanitization and validation
 * Provides utilities for safe data handling and XSS prevention
 */
@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Sanitizes HTML content to prevent XSS attacks
   */
  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.sanitize(1, html) || '';
  }

  /**
   * Sanitizes URL to prevent XSS through href attributes
   */
  sanitizeUrl(url: string): SafeUrl {
    return this.sanitizer.sanitize(4, url) || '';
  }

  /**
   * Validates and sanitizes JSON input
   */
  sanitizeJsonInput(input: string): { isValid: boolean; sanitized: string; error?: string } {
    try {
      // Remove potentially dangerous characters
      const cleaned = input
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .replace(/vbscript:/gi, '') // Remove vbscript: protocol
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers

      // Validate JSON structure
      JSON.parse(cleaned);

      return {
        isValid: true,
        sanitized: cleaned
      };
    } catch (error) {
      return {
        isValid: false,
        sanitized: input,
        error: error instanceof Error ? error.message : 'Invalid JSON format'
      };
    }
  }

  /**
   * Validates string input with length and content restrictions
   */
  validateStringInput(
    input: string, 
    options: {
      maxLength?: number;
      minLength?: number;
      allowedCharacters?: RegExp;
      forbiddenPatterns?: RegExp[];
    } = {}
  ): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = input;

    // Length validation
    if (options.maxLength && input.length > options.maxLength) {
      errors.push(`Input exceeds maximum length of ${options.maxLength} characters`);
      sanitized = input.substring(0, options.maxLength);
    }

    if (options.minLength && input.length < options.minLength) {
      errors.push(`Input must be at least ${options.minLength} characters long`);
    }

    // Character validation
    if (options.allowedCharacters && !options.allowedCharacters.test(sanitized)) {
      errors.push('Input contains invalid characters');
      // Remove invalid characters
      sanitized = sanitized.replace(new RegExp(`[^${options.allowedCharacters.source}]`, 'g'), '');
    }

    // Forbidden pattern validation
    if (options.forbiddenPatterns) {
      for (const pattern of options.forbiddenPatterns) {
        if (pattern.test(sanitized)) {
          errors.push(`Input contains forbidden pattern: ${pattern.source}`);
          sanitized = sanitized.replace(pattern, '');
        }
      }
    }

    // Remove potentially dangerous content
    sanitized = this.removeDangerousContent(sanitized);

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Removes potentially dangerous content from strings
   */
  private removeDangerousContent(input: string): string {
    return input
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/expression\s*\(/gi, '') // Remove CSS expressions
      .replace(/url\s*\(/gi, ''); // Remove CSS url() functions
  }

  /**
   * Validates file uploads (for future file upload features)
   */
  validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Size validation
    if (options.maxSize && file.size > options.maxSize) {
      errors.push(`File size exceeds maximum of ${options.maxSize} bytes`);
    }

    // Type validation
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Extension validation
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowedExtensions.includes(extension)) {
        errors.push(`File extension .${extension} is not allowed`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generates Content Security Policy directives
   */
  getCSPDirectives(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Note: 'unsafe-inline' needed for Angular
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];

    return directives.join('; ');
  }

  /**
   * Validates that an object matches expected schema
   */
  validateObjectStructure(
    obj: unknown, 
    schema: Record<string, { required: boolean; type: string; maxLength?: number }>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!obj || typeof obj !== 'object') {
      errors.push('Input must be an object');
      return { isValid: false, errors };
    }

    const data = obj as Record<string, unknown>;

    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];

      // Required field validation
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Required field '${key}' is missing`);
        continue;
      }

      // Type validation
      if (value !== undefined && value !== null && typeof value !== rules.type) {
        errors.push(`Field '${key}' must be of type ${rules.type}`);
      }

      // String length validation
      if (rules.type === 'string' && typeof value === 'string' && rules.maxLength) {
        if (value.length > rules.maxLength) {
          errors.push(`Field '${key}' exceeds maximum length of ${rules.maxLength}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
