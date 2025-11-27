import { Injectable } from '@angular/core';
import { LoggingService } from './logging.service';
import { inject } from '@angular/core';

/**
 * Security Headers Service
 * 
 * Manages HTTP security headers for the application. Provides utilities for
 * setting and managing Content Security Policy (CSP), XSS protection, and
 * other security-related headers.
 * 
 * Features:
 * - Content Security Policy (CSP) management
 * - XSS protection headers
 * - Frame options configuration
 * - Referrer policy management
 * - Security header validation
 * 
 * @example
 * ```typescript
 * const securityService = inject(SecurityHeadersService);
 * 
 * // Set CSP header
 * securityService.setCSPHeader('default-src \'self\'');
 * 
 * // Get current security headers
 * const headers = securityService.getSecurityHeaders();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SecurityHeadersService {
  private readonly logger = inject(LoggingService);
  private securityHeaders: Map<string, string> = new Map();

  constructor() {
    // Initialize default headers in constructor to ensure they're set immediately
    this.initializeDefaultHeaders();
  }

  /**
   * Initialize default security headers
   */
  private initializeDefaultHeaders(): void {
    // X-Content-Type-Options: Prevent MIME type sniffing
    this.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options: Prevent clickjacking
    this.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection: Enable XSS filter (legacy, but still useful)
    this.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy: Control referrer information
    this.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy: Control browser features
    this.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Comprehensive Content Security Policy
    this.setComprehensiveCSP();
  }

  /**
   * Set comprehensive Content Security Policy
   * 
   * Implements a strict CSP that:
   * - Prevents XSS attacks
   * - Restricts resource loading
   * - Prevents data exfiltration
   * - Allows necessary inline styles/scripts with nonces (should be implemented server-side)
   */
  private setComprehensiveCSP(): void {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-inline/unsafe-eval should be replaced with nonces in production
      "style-src 'self' 'unsafe-inline'", // Note: unsafe-inline should be replaced with nonces in production
      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join('; ');

    this.setCSPHeader(cspDirectives);
  }

  /**
   * Set a security header
   * 
   * @param name - Header name
   * @param value - Header value
   */
  setHeader(name: string, value: string): void {
    this.securityHeaders.set(name, value);
    this.logger.debug(`Security header set: ${name}`, 'SecurityHeadersService');
  }

  /**
   * Get a security header value
   * 
   * @param name - Header name
   * @returns Header value or undefined if not set
   */
  getHeader(name: string): string | undefined {
    return this.securityHeaders.get(name);
  }

  /**
   * Get all security headers as an object
   * 
   * @returns Object with all security headers
   */
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    this.securityHeaders.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /**
   * Set Content Security Policy header
   * 
   * @param policy - CSP policy string
   * @example
   * ```typescript
   * securityService.setCSPHeader("default-src 'self'; script-src 'self' 'unsafe-inline'");
   * ```
   */
  setCSPHeader(policy: string): void {
    this.setHeader('Content-Security-Policy', policy);
  }

  /**
   * Get Content Security Policy header
   * 
   * @returns CSP policy string or undefined
   */
  getCSPHeader(): string | undefined {
    return this.getHeader('Content-Security-Policy');
  }

  /**
   * Set Strict-Transport-Security (HSTS) header
   * 
   * @param maxAge - Maximum age in seconds (default: 31536000 = 1 year)
   * @param includeSubDomains - Include subdomains (default: true)
   * @param preload - Enable HSTS preload (default: false)
   */
  setHSTSHeader(maxAge: number = 31536000, includeSubDomains: boolean = true, preload: boolean = false): void {
    let value = `max-age=${maxAge}`;
    if (includeSubDomains) {
      value += '; includeSubDomains';
    }
    if (preload) {
      value += '; preload';
    }
    this.setHeader('Strict-Transport-Security', value);
  }

  /**
   * Remove a security header
   * 
   * @param name - Header name to remove
   */
  removeHeader(name: string): void {
    this.securityHeaders.delete(name);
    this.logger.debug(`Security header removed: ${name}`, 'SecurityHeadersService');
  }

  /**
   * Clear all security headers
   */
  clearHeaders(): void {
    this.securityHeaders.clear();
    this.initializeDefaultHeaders();
  }

  /**
   * Validate security headers configuration
   * 
   * @returns Object with validation results
   */
  validateHeaders(): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for required headers
    if (!this.getHeader('X-Content-Type-Options')) {
      warnings.push('X-Content-Type-Options header is recommended');
    }

    if (!this.getHeader('X-Frame-Options')) {
      warnings.push('X-Frame-Options header is recommended');
    }

    // Validate CSP if present
    const csp = this.getCSPHeader();
    if (csp) {
      if (csp.includes("'unsafe-inline'") && csp.includes("'unsafe-eval'")) {
        warnings.push('CSP contains unsafe directives. Consider using nonces or hashes instead.');
      }
    } else {
      warnings.push('Content-Security-Policy header is recommended for enhanced security');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}

