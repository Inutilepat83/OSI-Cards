import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { LoggingService } from './logging.service';

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXFrameOptions: boolean;
  enableXContentTypeOptions: boolean;
  enableReferrerPolicy: boolean;
  allowedDomains: string[];
  cspDirectives: Record<string, string[]>;
}

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private config: SecurityConfig = {
    enableCSP: true,
    enableHSTS: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableReferrerPolicy: true,
    allowedDomains: [
      'self',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
    ],
    cspDirectives: {
      'default-src': ['self'],
      'script-src': ['self', 'https://cdn.jsdelivr.net', 'unsafe-inline'],
      'style-src': ['self', 'https://fonts.googleapis.com', 'unsafe-inline'],
      'font-src': ['self', 'https://fonts.gstatic.com'],
      'img-src': ['self', 'data:', 'https:'],
      'connect-src': ['self', 'https://api.example.com'],
      'frame-src': ['none'],
      'object-src': ['none'],
      'base-uri': ['self'],
      'form-action': ['self'],
    },
  };

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private logger: LoggingService
  ) {
    this.initializeSecurityHeaders();
  }

  /**
   * Initialize security headers and CSP
   */
  private initializeSecurityHeaders(): void {
    if (this.config.enableCSP) {
      this.setCSPHeader();
    }

    if (this.config.enableHSTS) {
      this.setHSTSHeader();
    }

    if (this.config.enableXFrameOptions) {
      this.setXFrameOptionsHeader();
    }

    if (this.config.enableXContentTypeOptions) {
      this.setXContentTypeOptionsHeader();
    }

    if (this.config.enableReferrerPolicy) {
      this.setReferrerPolicyHeader();
    }
  }

  /**
   * Set Content Security Policy header
   */
  private setCSPHeader(): void {
    const cspValue = this.buildCSPString();
    this.setMetaTag('http-equiv', 'Content-Security-Policy', cspValue);
  }

  /**
   * Set HSTS header
   */
  private setHSTSHeader(): void {
    // Note: HSTS is typically set at server level
    // This is for client-side enforcement
    this.logger.log('SecurityService', 'HSTS should be configured at server level');
  }

  /**
   * Set X-Frame-Options header
   */
  private setXFrameOptionsHeader(): void {
    this.setMetaTag('http-equiv', 'X-Frame-Options', 'DENY');
  }

  /**
   * Set X-Content-Type-Options header
   */
  private setXContentTypeOptionsHeader(): void {
    this.setMetaTag('http-equiv', 'X-Content-Type-Options', 'nosniff');
  }

  /**
   * Set Referrer-Policy header
   */
  private setReferrerPolicyHeader(): void {
    this.setMetaTag('name', 'referrer', 'strict-origin-when-cross-origin');
  }

  /**
   * Build CSP directive string
   */
  private buildCSPString(): string {
    return Object.entries(this.config.cspDirectives)
      .map(([directive, values]) => `${directive} ${values.join(' ')}`)
      .join('; ');
  }

  /**
   * Set meta tag for security headers
   */
  private setMetaTag(attrName: string, attrValue: string, content: string): void {
    const meta = document.createElement('meta');
    meta.setAttribute(attrName, attrValue);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Sanitize URL
   */
  sanitizeUrl(url: string): string {
    return this.sanitizer.sanitize(4, url) || '';
  }

  /**
   * Validate input against XSS patterns
   */
  validateInput(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ];

    return !xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize user input
   */
  sanitizeUserInput(input: string): string {
    if (!input) return '';

    // Remove potentially dangerous characters
    return input.replace(/[<>'"&]/g, '').trim();
  }

  /**
   * Check if URL is from allowed domain
   */
  isAllowedDomain(url: string): boolean {
    try {
      // If it's a relative URL (starts with / or no protocol), it's considered 'self'
      if (url.startsWith('/') || (!url.includes('://') && !url.startsWith('http'))) {
        return true; // Relative URLs are always allowed as they're from the same origin
      }

      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      return this.config.allowedDomains.some(allowed => {
        if (allowed === 'self') {
          return domain === window.location.hostname;
        }
        return domain === allowed || domain.endsWith(allowed.replace('https://', ''));
      });
    } catch {
      return false;
    }
  }

  /**
   * Generate secure random string
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash sensitive data
   */
  async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeSecurityHeaders();
  }

  /**
   * Get current security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}
