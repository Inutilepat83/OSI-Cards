/**
 * Crypto Utilities
 *
 * Utilities for hashing, encoding, and basic cryptographic operations.
 *
 * @example
 * ```typescript
 * import { hash, encode, decode, generateUUID } from '@osi-cards/utils';
 *
 * const hashed = await hash('password');
 * const encoded = encode('Hello World');
 * const uuid = generateUUID();
 * ```
 */

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate random ID
 */
export function generateId(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(
    ''
  );
}

/**
 * Base64 encode
 */
export function encode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

/**
 * Base64 decode
 */
export function decode(str: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
}

/**
 * Hash string using SHA-256
 */
export async function hash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate secure random string
 */
export function secureRandom(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Simple XOR cipher (for demonstration only, not secure)
 */
export function xorCipher(str: string, key: string): string {
  return str
    .split('')
    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join('');
}

/**
 * ROT13 cipher
 */
export function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

/**
 * Generate checksum
 */
export function checksum(str: string): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return sum % 256;
}

/**
 * Verify checksum
 */
export function verifyChecksum(str: string, expected: number): boolean {
  return checksum(str) === expected;
}
