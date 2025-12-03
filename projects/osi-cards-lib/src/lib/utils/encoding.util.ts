/**
 * Encoding Utilities
 *
 * Utilities for various encoding and decoding operations.
 *
 * @example
 * ```typescript
 * import { encodeBase64, decodeBase64, encodeURI } from '@osi-cards/utils';
 *
 * const encoded = encodeBase64('Hello World');
 * const decoded = decodeBase64(encoded);
 * ```
 */

/**
 * Base64 encode
 */
export function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Base64 decode
 */
export function decodeBase64(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

/**
 * URL encode
 */
export function encodeURL(str: string): string {
  return encodeURIComponent(str);
}

/**
 * URL decode
 */
export function decodeURL(str: string): string {
  return decodeURIComponent(str);
}

/**
 * HTML encode
 */
export function encodeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * HTML decode
 */
export function decodeHTML(str: string): string {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent || '';
}

/**
 * Hex encode
 */
export function encodeHex(str: string): string {
  return Array.from(str)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hex decode
 */
export function decodeHex(hex: string): string {
  const bytes = hex.match(/.{1,2}/g) || [];
  return bytes.map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
}

/**
 * Binary encode
 */
export function encodeBinary(str: string): string {
  return Array.from(str)
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}

/**
 * Binary decode
 */
export function decodeBinary(binary: string): string {
  return binary
    .split(' ')
    .map(byte => String.fromCharCode(parseInt(byte, 2)))
    .join('');
}

/**
 * UTF-8 encode
 */
export function encodeUTF8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * UTF-8 decode
 */
export function decodeUTF8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Escape for SQL
 */
export function escapeSQLString(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Escape for regex
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Encode query string
 */
export function encodeQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

/**
 * Decode query string
 */
export function decodeQueryString(query: string): Record<string, string> {
  const params: Record<string, string> = {};

  query.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });

  return params;
}

