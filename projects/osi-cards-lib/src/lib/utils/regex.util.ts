/**
 * Regex Utilities
 *
 * Common regex patterns and validation utilities.
 *
 * @example
 * ```typescript
 * import { isEmail, isURL, extractPhones } from '@osi-cards/utils';
 *
 * const valid = isEmail('test@example.com');
 * const phones = extractPhones(text);
 * ```
 */

// Common regex patterns
export const REGEX_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  phone: /(\+?\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  zipCode: /^\d{5}(-\d{4})?$/,
  creditCard: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  hexColor: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
  username: /^[a-zA-Z0-9_-]{3,16}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

export function isEmail(str: string): boolean {
  return REGEX_PATTERNS.email.test(str);
}

export function isURL(str: string): boolean {
  return REGEX_PATTERNS.url.test(str);
}

export function isPhone(str: string): boolean {
  return REGEX_PATTERNS.phone.test(str);
}

export function isZipCode(str: string): boolean {
  return REGEX_PATTERNS.zipCode.test(str);
}

export function isCreditCard(str: string): boolean {
  return REGEX_PATTERNS.creditCard.test(str);
}

export function isIPv4(str: string): boolean {
  return REGEX_PATTERNS.ipv4.test(str);
}

export function isIPv6(str: string): boolean {
  return REGEX_PATTERNS.ipv6.test(str);
}

export function isHexColor(str: string): boolean {
  return REGEX_PATTERNS.hexColor.test(str);
}

export function isUsername(str: string): boolean {
  return REGEX_PATTERNS.username.test(str);
}

export function isStrongPassword(str: string): boolean {
  return REGEX_PATTERNS.strongPassword.test(str);
}

export function isDate(str: string): boolean {
  return REGEX_PATTERNS.date.test(str);
}

export function isTime(str: string): boolean {
  return REGEX_PATTERNS.time.test(str);
}

export function isSlug(str: string): boolean {
  return REGEX_PATTERNS.slug.test(str);
}

export function isUUID(str: string): boolean {
  return REGEX_PATTERNS.uuid.test(str);
}

export function extractEmails(str: string): string[] {
  return str.match(new RegExp(REGEX_PATTERNS.email.source, 'g')) || [];
}

export function extractURLs(str: string): string[] {
  return str.match(new RegExp(REGEX_PATTERNS.url.source, 'g')) || [];
}

export function extractPhones(str: string): string[] {
  return str.match(REGEX_PATTERNS.phone) || [];
}

export function extractHexColors(str: string): string[] {
  return str.match(new RegExp(REGEX_PATTERNS.hexColor.source, 'gi')) || [];
}

export function sanitizeHTML(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
