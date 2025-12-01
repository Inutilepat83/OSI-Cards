/**
 * Security headers utilities
 * Implements security headers (HSTS, X-Frame-Options, etc.)
 * Note: Most security headers are set server-side, but this provides client-side utilities
 */

/**
 * Security header configuration
 */
export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'Strict-Transport-Security'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
}

/**
 * Default security headers
 */
export const DEFAULT_SECURITY_HEADERS: SecurityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Generate CSP header
 */
export function generateCSPHeader(
  options: {
    allowInlineScripts?: boolean;
    allowInlineStyles?: boolean;
    allowEval?: boolean;
    allowedDomains?: string[];
  } = {}
): string {
  const {
    allowInlineScripts = false,
    allowInlineStyles = false,
    allowEval = false,
    allowedDomains = [],
  } = options;

  const directives: string[] = [];

  // Default source
  directives.push(`default-src 'self'`);

  // Script source
  const scriptSrc = ['self'];
  if (allowInlineScripts) {
    scriptSrc.push("'unsafe-inline'");
  }
  if (allowEval) {
    scriptSrc.push("'unsafe-eval'");
  }
  allowedDomains.forEach((domain) => scriptSrc.push(domain));
  directives.push(`script-src ${scriptSrc.join(' ')}`);

  // Style source
  const styleSrc = ['self'];
  if (allowInlineStyles) {
    styleSrc.push("'unsafe-inline'");
  }
  allowedDomains.forEach((domain) => styleSrc.push(domain));
  directives.push(`style-src ${styleSrc.join(' ')}`);

  // Image source
  directives.push(`img-src 'self' data: https:`);

  // Font source
  directives.push(`font-src 'self' data:`);

  return directives.join('; ');
}

/**
 * Validate security headers
 */
export function validateSecurityHeaders(headers: SecurityHeaders): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for recommended headers
  if (!headers['Content-Security-Policy']) {
    warnings.push('Content-Security-Policy header is recommended');
  }

  if (!headers['X-Frame-Options']) {
    warnings.push('X-Frame-Options header is recommended');
  }

  if (!headers['X-Content-Type-Options']) {
    warnings.push('X-Content-Type-Options header is recommended');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
