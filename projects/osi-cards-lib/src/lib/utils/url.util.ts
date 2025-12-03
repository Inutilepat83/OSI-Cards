/**
 * URL Utilities
 *
 * Collection of utilities for URL manipulation, parsing, and building.
 *
 * Features:
 * - URL parsing
 * - Query string manipulation
 * - URL building
 * - Path manipulation
 * - URL validation
 *
 * @example
 * ```typescript
 * import { parseUrl, buildUrl, addQueryParams } from '@osi-cards/utils';
 *
 * const parsed = parseUrl('https://example.com/api?page=1');
 * const url = buildUrl('/api/users', { page: 2, limit: 10 });
 * const updated = addQueryParams(url, { filter: 'active' });
 * ```
 */

/**
 * Parsed URL components
 */
export interface ParsedUrl {
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  searchParams: Record<string, string>;
  hash: string;
  origin: string;
  href: string;
}

/**
 * Parse URL
 *
 * @param url - URL string to parse
 * @returns Parsed URL components
 *
 * @example
 * ```typescript
 * const parsed = parseUrl('https://example.com:8080/api/users?page=1#section');
 * // {
 * //   protocol: 'https:',
 * //   hostname: 'example.com',
 * //   port: '8080',
 * //   pathname: '/api/users',
 * //   searchParams: { page: '1' },
 * //   hash: '#section'
 * // }
 * ```
 */
export function parseUrl(url: string): ParsedUrl {
  const parsed = new URL(url, window.location.origin);
  const searchParams: Record<string, string> = {};

  parsed.searchParams.forEach((value, key) => {
    searchParams[key] = value;
  });

  return {
    protocol: parsed.protocol,
    host: parsed.host,
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    search: parsed.search,
    searchParams,
    hash: parsed.hash,
    origin: parsed.origin,
    href: parsed.href,
  };
}

/**
 * Build URL from components
 *
 * @param base - Base URL or path
 * @param params - Query parameters
 * @param hash - URL hash
 * @returns Complete URL string
 *
 * @example
 * ```typescript
 * const url = buildUrl('/api/users', { page: 2, limit: 10 }, 'results');
 * // '/api/users?page=2&limit=10#results'
 * ```
 */
export function buildUrl(
  base: string,
  params?: Record<string, any>,
  hash?: string
): string {
  let url = base;

  if (params && Object.keys(params).length > 0) {
    const queryString = objectToQueryString(params);
    url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
  }

  if (hash) {
    url += `#${hash}`;
  }

  return url;
}

/**
 * Convert object to query string
 *
 * @param obj - Object to convert
 * @returns Query string
 *
 * @example
 * ```typescript
 * const qs = objectToQueryString({ page: 1, filter: 'active' });
 * // 'page=1&filter=active'
 * ```
 */
export function objectToQueryString(obj: Record<string, any>): string {
  return Object.entries(obj)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
          .join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
}

/**
 * Parse query string to object
 *
 * @param queryString - Query string (with or without '?')
 * @returns Object with query parameters
 *
 * @example
 * ```typescript
 * const params = queryStringToObject('?page=1&filter=active');
 * // { page: '1', filter: 'active' }
 * ```
 */
export function queryStringToObject(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const search = queryString.startsWith('?') ? queryString.slice(1) : queryString;

  if (!search) return params;

  search.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });

  return params;
}

/**
 * Add query parameters to URL
 *
 * @param url - Base URL
 * @param params - Parameters to add
 * @returns Updated URL
 *
 * @example
 * ```typescript
 * const url = addQueryParams('/api/users', { page: 2 });
 * // '/api/users?page=2'
 * ```
 */
export function addQueryParams(url: string, params: Record<string, any>): string {
  const [base, existing] = url.split('?');
  const existingParams = existing ? queryStringToObject(existing) : {};
  const mergedParams = { ...existingParams, ...params };
  return buildUrl(base, mergedParams);
}

/**
 * Remove query parameters from URL
 *
 * @param url - Base URL
 * @param keys - Parameter keys to remove
 * @returns Updated URL
 *
 * @example
 * ```typescript
 * const url = removeQueryParams('/api/users?page=1&filter=active', ['filter']);
 * // '/api/users?page=1'
 * ```
 */
export function removeQueryParams(url: string, keys: string[]): string {
  const [base, existing] = url.split('?');

  if (!existing) return base;

  const params = queryStringToObject(existing);
  keys.forEach(key => delete params[key]);

  return buildUrl(base, params);
}

/**
 * Join URL paths
 *
 * @param segments - Path segments
 * @returns Joined path
 *
 * @example
 * ```typescript
 * const path = joinPaths('/api', 'users', '123');
 * // '/api/users/123'
 * ```
 */
export function joinPaths(...segments: string[]): string {
  return segments
    .map((segment, index) => {
      if (index === 0) {
        return segment.replace(/\/$/, '');
      }
      return segment.replace(/^\//, '').replace(/\/$/, '');
    })
    .filter(Boolean)
    .join('/');
}

/**
 * Get base URL (protocol + host)
 *
 * @param url - Full URL
 * @returns Base URL
 *
 * @example
 * ```typescript
 * const base = getBaseUrl('https://example.com:8080/api/users');
 * // 'https://example.com:8080'
 * ```
 */
export function getBaseUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.origin;
}

/**
 * Check if URL is absolute
 *
 * @param url - URL to check
 * @returns True if absolute URL
 */
export function isAbsoluteUrl(url: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/.test(url);
}

/**
 * Check if URL is relative
 *
 * @param url - URL to check
 * @returns True if relative URL
 */
export function isRelativeUrl(url: string): boolean {
  return !isAbsoluteUrl(url);
}

/**
 * Normalize URL (remove double slashes, trailing slash, etc.)
 *
 * @param url - URL to normalize
 * @returns Normalized URL
 *
 * @example
 * ```typescript
 * const normalized = normalizeUrl('https://example.com//api///users/');
 * // 'https://example.com/api/users'
 * ```
 */
export function normalizeUrl(url: string): string {
  const parsed = new URL(url);

  // Normalize pathname (remove double slashes)
  parsed.pathname = parsed.pathname.replace(/\/+/g, '/');

  // Remove trailing slash (except for root)
  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.href;
}

/**
 * Get query parameter value
 *
 * @param url - URL string
 * @param param - Parameter name
 * @returns Parameter value or null
 */
export function getQueryParam(url: string, param: string): string | null {
  const parsed = new URL(url, window.location.origin);
  return parsed.searchParams.get(param);
}

/**
 * Check if URLs are on same origin
 *
 * @param url1 - First URL
 * @param url2 - Second URL
 * @returns True if same origin
 */
export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const parsed1 = new URL(url1, window.location.origin);
    const parsed2 = new URL(url2, window.location.origin);
    return parsed1.origin === parsed2.origin;
  } catch {
    return false;
  }
}

/**
 * Make URL relative
 *
 * @param url - Absolute URL
 * @returns Relative URL
 *
 * @example
 * ```typescript
 * const relative = makeRelative('https://example.com/api/users?page=1');
 * // '/api/users?page=1'
 * ```
 */
export function makeRelative(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return url;
  }
}

/**
 * Make URL absolute
 *
 * @param url - Relative URL
 * @param base - Base URL (defaults to current origin)
 * @returns Absolute URL
 */
export function makeAbsolute(url: string, base?: string): string {
  if (isAbsoluteUrl(url)) {
    return url;
  }

  const baseUrl = base || window.location.origin;
  return new URL(url, baseUrl).href;
}

/**
 * Extract domain from URL
 *
 * @param url - URL string
 * @returns Domain name
 *
 * @example
 * ```typescript
 * const domain = extractDomain('https://api.example.com/users');
 * // 'api.example.com'
 * ```
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Get file extension from URL
 *
 * @param url - URL string
 * @returns File extension or empty string
 *
 * @example
 * ```typescript
 * const ext = getFileExtension('https://example.com/image.jpg?size=large');
 * // 'jpg'
 * ```
 */
export function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const match = pathname.match(/\.([^./?#]+)(?:[?#]|$)/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

/**
 * Check if URL points to image
 *
 * @param url - URL to check
 * @returns True if image URL
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const ext = getFileExtension(url).toLowerCase();
  return imageExtensions.includes(ext);
}

/**
 * Update URL hash
 *
 * @param url - Base URL
 * @param hash - New hash
 * @returns Updated URL
 */
export function updateHash(url: string, hash: string): string {
  const parsed = new URL(url, window.location.origin);
  parsed.hash = hash.startsWith('#') ? hash : `#${hash}`;
  return parsed.href;
}

/**
 * Remove URL hash
 *
 * @param url - URL with hash
 * @returns URL without hash
 */
export function removeHash(url: string): string {
  const [base] = url.split('#');
  return base;
}

