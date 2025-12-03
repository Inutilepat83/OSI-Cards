/**
 * Sanitization Utilities
 *
 * Utilities for sanitizing user input.
 *
 * @example
 * ```typescript
 * import { sanitizeHTML, sanitizeURL, sanitizeFilename } from '@osi-cards/utils';
 *
 * const clean = sanitizeHTML(userInput);
 * const safeUrl = sanitizeURL(url);
 * ```
 */

export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

export function stripScripts(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'javascript:') {
      return '';
    }
    return url;
  } catch {
    return '';
  }
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9._-]/gi, '_');
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000);
}

export function removeSQLInjection(input: string): string {
  return input.replace(/('|;|--|\*|\/\*|\*\/|xp_|sp_)/gi, '');
}

export function removeXSS(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function sanitizeNumber(input: string): string {
  return input.replace(/[^\d.-]/g, '');
}
