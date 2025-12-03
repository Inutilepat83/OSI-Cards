/**
 * Extended Cookie Utilities
 *
 * Comprehensive cookie management utilities.
 *
 * @example
 * ```typescript
 * import { setCookie, getCookie, deleteCookie } from '@osi-cards/utils';
 *
 * setCookie('user', 'John', { expires: 7 });
 * const user = getCookie('user');
 * deleteCookie('user');
 * ```
 */

export interface CookieOptions {
  expires?: number | Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Set cookie
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    const expires = typeof options.expires === 'number'
      ? new Date(Date.now() + options.expires * 24 * 60 * 60 * 1000)
      : options.expires;
    cookie += `; expires=${expires.toUTCString()}`;
  }

  if (options.path) cookie += `; path=${options.path}`;
  if (options.domain) cookie += `; domain=${options.domain}`;
  if (options.secure) cookie += '; secure';
  if (options.sameSite) cookie += `; samesite=${options.sameSite}`;

  document.cookie = cookie;
}

/**
 * Get cookie
 */
export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Delete cookie
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  setCookie(name, '', {
    ...options,
    expires: new Date(0),
  });
}

/**
 * Check if cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Get all cookies
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};

  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value || '');
    }
  });

  return cookies;
}

/**
 * Clear all cookies
 */
export function clearAllCookies(): void {
  const cookies = getAllCookies();
  Object.keys(cookies).forEach(name => deleteCookie(name));
}

