/**
 * Format Utilities
 *
 * Comprehensive formatting utilities for various data types.
 *
 * @example
 * ```typescript
 * import { formatPhone, formatCreditCard, formatSSN } from '@osi-cards/utils';
 *
 * const phone = formatPhone('1234567890');
 * const card = formatCreditCard('1234567890123456');
 * ```
 */

export function formatPhone(phone: string, format = 'US'): string {
  const cleaned = phone.replace(/\D/g, '');

  if (format === 'US' && cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

export function formatCreditCard(card: string): string {
  const cleaned = card.replace(/\s/g, '');
  return cleaned.match(/.{1,4}/g)?.join(' ') || card;
}

export function formatSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return ssn;
}

export function formatPostalCode(code: string, country = 'US'): string {
  const cleaned = code.replace(/\s/g, '');

  if (country === 'US' && cleaned.length === 5) {
    return cleaned;
  }

  if (country === 'CA' && cleaned.length === 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }

  return code;
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function formatList(items: string[], conjunction = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  const last = items[items.length - 1];
  const rest = items.slice(0, -1);
  return `${rest.join(', ')}, ${conjunction} ${last}`;
}

export function formatInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

export function formatTitle(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatSentence(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() + '.';
}

