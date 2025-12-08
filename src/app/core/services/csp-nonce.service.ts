import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '@environments/environment';

/**
 * CSP Nonce Service
 *
 * Generates and manages Content Security Policy nonces for production builds.
 * Nonces allow inline scripts and styles while maintaining security.
 *
 * In production, this service generates unique nonces per page load and
 * injects them into the DOM. The server should use these nonces in the
 * Content-Security-Policy header.
 *
 * @example
 * ```typescript
 * const nonceService = inject(CSPNonceService);
 *
 * // Get nonce for script tag
 * const nonce = nonceService.getNonce();
 *
 * // Use in script tag
 * const script = document.createElement('script');
 * script.nonce = nonce;
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CSPNonceService {
  private readonly document = inject(DOCUMENT);
  private nonce: string | null = null;

  constructor() {
    if (environment.production) {
      this.generateNonce();
      this.injectNonceIntoMeta();
    }
  }

  /**
   * Generate a cryptographically secure random nonce
   *
   * @returns Base64-encoded nonce string
   */
  private generateNonce(): void {
    // Generate 16 random bytes (128 bits)
    const array = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto API
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }

    // Convert to base64
    this.nonce = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Inject nonce into meta tag for server-side rendering
   */
  private injectNonceIntoMeta(): void {
    if (!this.nonce) {
      return;
    }

    let metaTag = this.document.querySelector('meta[name="csp-nonce"]');

    if (!metaTag) {
      metaTag = this.document.createElement('meta');
      metaTag.setAttribute('name', 'csp-nonce');
      this.document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', this.nonce);
  }

  /**
   * Get the current nonce
   *
   * @returns Nonce string or null if not in production
   */
  getNonce(): string | null {
    if (!environment.production) {
      return null; // Nonces not needed in development
    }

    if (!this.nonce) {
      this.generateNonce();
    }

    return this.nonce;
  }

  /**
   * Get nonce for script-src directive
   *
   * @returns Nonce string formatted for CSP (e.g., 'nonce-abc123')
   */
  getScriptNonce(): string | null {
    const nonce = this.getNonce();
    return nonce ? `'nonce-${nonce}'` : null;
  }

  /**
   * Get nonce for style-src directive
   *
   * @returns Nonce string formatted for CSP (e.g., 'nonce-abc123')
   */
  getStyleNonce(): string | null {
    const nonce = this.getNonce();
    return nonce ? `'nonce-${nonce}'` : null;
  }

  /**
   * Generate CSP header with nonces
   *
   * @returns Complete CSP header string
   */
  generateCSPHeader(): string {
    const scriptNonce = this.getScriptNonce();
    const styleNonce = this.getStyleNonce();

    const directives = [
      "default-src 'self'",
      scriptNonce
        ? `script-src 'self' ${scriptNonce}`
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Fallback for dev
      styleNonce ? `style-src 'self' ${styleNonce}` : "style-src 'self' 'unsafe-inline'", // Fallback for dev
      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ];

    return directives.join('; ');
  }

  /**
   * Apply nonce to an element
   *
   * @param element - HTML element to apply nonce to
   */
  applyNonceToElement(element: HTMLElement): void {
    const nonce = this.getNonce();
    if (nonce && element) {
      element.setAttribute('nonce', nonce);
    }
  }
}



