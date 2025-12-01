/**
 * Security Utilities
 * 
 * Comprehensive security utilities for XSS prevention, CSP compliance,
 * input sanitization, and safe content rendering.
 * 
 * @example
 * ```typescript
 * import { SecurityUtil, createSafeHtml, createCSPNonce } from 'osi-cards-lib';
 * 
 * // Sanitize user input
 * const safeContent = SecurityUtil.sanitize(userInput);
 * 
 * // Create safe HTML for Angular
 * const safeHtml = createSafeHtml(sanitizer, htmlContent);
 * 
 * // Generate CSP nonce
 * const nonce = createCSPNonce();
 * ```
 */

import { SecurityContext } from '@angular/core';
import type { DomSanitizer, SafeHtml, SafeUrl, SafeStyle } from '@angular/platform-browser';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Security scan result
 */
export interface SecurityScanResult {
  safe: boolean;
  threats: SecurityThreat[];
  sanitizedContent?: string;
}

/**
 * Security threat descriptor
 */
export interface SecurityThreat {
  type: ThreatType;
  description: string;
  location?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Types of security threats
 */
export type ThreatType = 
  | 'xss_script'
  | 'xss_event_handler'
  | 'xss_javascript_url'
  | 'xss_data_url'
  | 'xss_svg'
  | 'sql_injection'
  | 'path_traversal'
  | 'command_injection'
  | 'csp_violation';

/**
 * CSP directive types
 */
export type CSPDirective = 
  | 'default-src'
  | 'script-src'
  | 'style-src'
  | 'img-src'
  | 'connect-src'
  | 'font-src'
  | 'object-src'
  | 'media-src'
  | 'frame-src';

// ============================================================================
// XSS PREVENTION
// ============================================================================

/**
 * Patterns that indicate potential XSS attacks
 */
const XSS_PATTERNS: Array<{ pattern: RegExp; type: ThreatType; severity: SecurityThreat['severity'] }> = [
  // Script tags
  { pattern: /<script\b[^>]*>[\s\S]*?<\/script>/gi, type: 'xss_script', severity: 'critical' },
  { pattern: /<script\b[^>]*>/gi, type: 'xss_script', severity: 'critical' },
  
  // Event handlers
  { pattern: /\bon\w+\s*=/gi, type: 'xss_event_handler', severity: 'high' },
  { pattern: /\bformaction\s*=/gi, type: 'xss_event_handler', severity: 'high' },
  
  // JavaScript URLs
  { pattern: /javascript\s*:/gi, type: 'xss_javascript_url', severity: 'critical' },
  { pattern: /vbscript\s*:/gi, type: 'xss_javascript_url', severity: 'critical' },
  { pattern: /livescript\s*:/gi, type: 'xss_javascript_url', severity: 'critical' },
  
  // Data URLs with scripts
  { pattern: /data\s*:[^,]*;base64/gi, type: 'xss_data_url', severity: 'medium' },
  
  // SVG with embedded scripts
  { pattern: /<svg\b[^>]*>[\s\S]*?<script/gi, type: 'xss_svg', severity: 'high' },
  { pattern: /<svg\b[^>]*\bon\w+=/gi, type: 'xss_svg', severity: 'high' },
  
  // Expression evaluation
  { pattern: /expression\s*\(/gi, type: 'xss_script', severity: 'high' },
  { pattern: /eval\s*\(/gi, type: 'xss_script', severity: 'high' },
  { pattern: /Function\s*\(/gi, type: 'xss_script', severity: 'high' },
  
  // Angular template injection
  { pattern: /\{\{[\s\S]*?\}\}/gi, type: 'xss_script', severity: 'medium' },
];

/**
 * Security utility class
 */
export class SecurityUtil {
  /**
   * Scan content for security threats
   */
  static scan(content: string): SecurityScanResult {
    const threats: SecurityThreat[] = [];
    
    for (const { pattern, type, severity } of XSS_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        threats.push({
          type,
          description: `Detected potential ${type.replace(/_/g, ' ')} attack`,
          location: match[0]?.substring(0, 100),
          severity
        });
      }
    }
    
    return {
      safe: threats.length === 0,
      threats,
      sanitizedContent: threats.length > 0 ? this.sanitize(content) : content
    };
  }

  /**
   * Sanitize content by removing dangerous patterns
   */
  static sanitize(content: string): string {
    if (typeof content !== 'string') return '';
    
    let sanitized = content;
    
    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove style tags
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/(?:href|src|action|formaction)\s*=\s*["']?\s*(?:javascript|vbscript|livescript):[^"'>\s]*/gi, '');
    
    // Remove data: URLs with potential scripts
    sanitized = sanitized.replace(/(?:href|src)\s*=\s*["']?\s*data\s*:[^"'>\s]*/gi, '');
    
    // Remove expression() in CSS
    sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '');
    
    return sanitized;
  }

  /**
   * Escape HTML entities
   */
  static escapeHtml(text: string): string {
    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return text.replace(/[&<>"'`=/]/g, char => entityMap[char] || char);
  }

  /**
   * Unescape HTML entities
   */
  static unescapeHtml(text: string): string {
    const reverseMap: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x2F;': '/',
      '&#x60;': '`',
      '&#x3D;': '='
    };
    
    return text.replace(/&(?:amp|lt|gt|quot|#39|#x2F|#x60|#x3D);/g, 
      entity => reverseMap[entity] || entity
    );
  }

  /**
   * Validate that a URL is safe
   */
  static isSafeUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    const trimmed = url.trim().toLowerCase();
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'livescript:', 'data:'];
    if (dangerousProtocols.some(proto => trimmed.startsWith(proto))) {
      return false;
    }
    
    try {
      const parsed = new URL(url, 'https://placeholder.com');
      const safeProtocols = ['https:', 'http:', 'mailto:', 'tel:'];
      return safeProtocols.includes(parsed.protocol);
    } catch {
      // Relative URLs are generally safe
      return !trimmed.includes(':');
    }
  }

  /**
   * Validate email address format
   */
  static isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return email.length <= 254 && emailRegex.test(email.trim());
  }
}

// ============================================================================
// CSP UTILITIES
// ============================================================================

/**
 * Generate a cryptographically secure CSP nonce
 */
export function createCSPNonce(): string {
  const array = new Uint8Array(16);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  return btoa(String.fromCharCode(...array));
}

/**
 * Build a Content Security Policy header string
 */
export function buildCSPHeader(
  directives: Partial<Record<CSPDirective, string[]>>,
  nonce?: string
): string {
  const parts: string[] = [];
  
  for (const [directive, sources] of Object.entries(directives)) {
    if (sources && sources.length > 0) {
      let value = sources.join(' ');
      
      // Add nonce to script-src and style-src if provided
      if (nonce && (directive === 'script-src' || directive === 'style-src')) {
        value += ` 'nonce-${nonce}'`;
      }
      
      parts.push(`${directive} ${value}`);
    }
  }
  
  return parts.join('; ');
}

/**
 * Recommended CSP directives for OSI Cards
 */
export const RECOMMENDED_CSP: Partial<Record<CSPDirective, string[]>> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"], // Required for dynamic theming
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'"],
  'font-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-src': ["'none'"]
};

// ============================================================================
// ANGULAR SANITIZER HELPERS
// ============================================================================

/**
 * Create safe HTML using Angular's DomSanitizer
 */
export function createSafeHtml(
  sanitizer: DomSanitizer,
  html: string
): SafeHtml {
  // Pre-sanitize before trusting
  const preSanitized = SecurityUtil.sanitize(html);
  return sanitizer.bypassSecurityTrustHtml(preSanitized);
}

/**
 * Create safe URL using Angular's DomSanitizer
 */
export function createSafeUrl(
  sanitizer: DomSanitizer,
  url: string
): SafeUrl | null {
  if (!SecurityUtil.isSafeUrl(url)) {
    console.warn(`Blocked unsafe URL: ${url}`);
    return null;
  }
  return sanitizer.bypassSecurityTrustUrl(url);
}

/**
 * Create safe style using Angular's DomSanitizer
 */
export function createSafeStyle(
  sanitizer: DomSanitizer,
  style: string
): SafeStyle {
  // Remove any expression() or javascript:
  const safeStyle = style
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/behavior\s*:/gi, '');
    
  return sanitizer.bypassSecurityTrustStyle(safeStyle);
}

// ============================================================================
// CONTENT VALIDATION
// ============================================================================

/**
 * Validate JSON content before parsing
 */
export function validateJsonContent(content: string): { valid: boolean; error?: string } {
  try {
    // Check for maximum size (10MB)
    if (content.length > 10 * 1024 * 1024) {
      return { valid: false, error: 'JSON content exceeds maximum size' };
    }
    
    JSON.parse(content);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Rate limiter for preventing abuse
 */
export class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  /**
   * Check if a request is allowed
   */
  isAllowed(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Remove expired entries
    this.requests = this.requests.filter(time => time > windowStart);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
  
  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    this.requests = this.requests.filter(time => time > windowStart);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
  
  /**
   * Get time until rate limit resets
   */
  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = this.requests[0] ?? 0;
    return Math.max(0, oldestRequest + this.windowMs - Date.now());
  }
  
  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

// ============================================================================
// IFRAME SANDBOXING
// ============================================================================

/**
 * Recommended sandbox attributes for embedded iframes
 */
export const IFRAME_SANDBOX_ATTRS = [
  'allow-scripts',
  'allow-same-origin',
  // Explicitly NOT included: allow-forms, allow-popups, allow-top-navigation
].join(' ');

/**
 * Create a sandboxed iframe configuration
 */
export function createSandboxedIframe(src: string): {
  src: string;
  sandbox: string;
  referrerPolicy: string;
} {
  return {
    src: SecurityUtil.isSafeUrl(src) ? src : '',
    sandbox: IFRAME_SANDBOX_ATTRS,
    referrerPolicy: 'no-referrer'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SecurityUtil as default
};

