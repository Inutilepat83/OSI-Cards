/**
 * Extended String Utilities
 *
 * Additional string manipulation utilities.
 *
 * @example
 * ```typescript
 * import { capitalize, slugify, truncate } from '@osi-cards/utils';
 *
 * const title = capitalize('hello world');
 * const slug = slugify('Hello World!');
 * const short = truncate(longText, 100);
 * ```
 */

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize all words
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert to slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate string
 */
export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Truncate words
 */
export function truncateWords(str: string, wordCount: number, suffix = '...'): string {
  const words = str.split(/\s+/);
  if (words.length <= wordCount) return str;
  return words.slice(0, wordCount).join(' ') + suffix;
}

/**
 * Convert to camelCase
 */
export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^./, (char) => char.toLowerCase());
}

/**
 * Convert to PascalCase
 */
export function pascalCase(str: string): string {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert to snake_case
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .replace(/^_/, '')
    .toLowerCase();
}

/**
 * Convert to kebab-case
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/[\s_]+/g, '-')
    .replace(/^-/, '')
    .toLowerCase();
}

/**
 * Reverse string
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

/**
 * Count words
 */
export function wordCount(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Strip HTML tags
 */
export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML
 */
export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Unescape HTML
 */
export function unescapeHTML(str: string): string {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent || '';
}

/**
 * Repeat string
 */
export function repeat(str: string, times: number): string {
  return str.repeat(times);
}

/**
 * Pad start
 */
export function padStart(str: string, length: number, char = ' '): string {
  return str.padStart(length, char);
}

/**
 * Pad end
 */
export function padEnd(str: string, length: number, char = ' '): string {
  return str.padEnd(length, char);
}

/**
 * Is empty or whitespace
 */
export function isBlank(str: string): boolean {
  return !str || !str.trim();
}

/**
 * Remove extra whitespace
 */
export function squeeze(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Extract numbers
 */
export function extractNumbers(str: string): number[] {
  const matches = str.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Extract URLs
 */
export function extractURLs(str: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return str.match(urlRegex) || [];
}

/**
 * Extract emails
 */
export function extractEmails(str: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return str.match(emailRegex) || [];
}

/**
 * Mask string (for sensitive data)
 */
export function mask(str: string, visibleChars = 4, maskChar = '*'): string {
  if (str.length <= visibleChars) return str;
  return str.slice(0, visibleChars) + maskChar.repeat(str.length - visibleChars);
}

/**
 * Random string
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(
    ''
  );
}

/**
 * Levenshtein distance (string similarity)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * String similarity (0-1)
 */
export function similarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}
