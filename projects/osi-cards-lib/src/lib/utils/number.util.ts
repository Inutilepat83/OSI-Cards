/**
 * Number Utilities
 *
 * Extended number utilities for formatting and manipulation.
 *
 * @example
 * ```typescript
 * import { formatNumber, formatCurrency, formatPercent } from '@osi-cards/utils';
 *
 * const formatted = formatNumber(1234567.89);
 * const currency = formatCurrency(1234.56, 'USD');
 * const percent = formatPercent(0.856);
 * ```
 */

/**
 * Format number with separators
 */
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency
 */
export function formatCurrency(num: number, currency = 'USD', locale?: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(num);
}

/**
 * Format percent
 */
export function formatPercent(num: number, decimals = 1): string {
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format as compact (1K, 1M, 1B)
 */
export function formatCompact(num: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

/**
 * Format with ordinal
 */
export function formatOrdinal(num: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

/**
 * Parse number safely
 */
export function parseNumber(str: string, defaultValue = 0): number {
  const num = parseFloat(str);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Parse integer safely
 */
export function parseIntSafe(str: string, defaultValue = 0): number {
  const num = parseInt(str, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Round to precision
 */
export function roundToPrecision(num: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}

/**
 * Clamp number
 */
export function clampNumber(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Is in range
 */
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * Random between
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random int between
 */
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

/**
 * To fixed without trailing zeros
 */
export function toFixedClean(num: number, decimals: number): string {
  return parseFloat(num.toFixed(decimals)).toString();
}

/**
 * Pad number
 */
export function padNumber(num: number, length: number, char = '0'): string {
  return num.toString().padStart(length, char);
}

/**
 * Format bytes
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format duration (seconds to HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${padNumber(m, 2)}:${padNumber(s, 2)}`;
  }
  return `${m}:${padNumber(s, 2)}`;
}

/**
 * Abbreviate number
 */
export function abbreviateNumber(num: number): string {
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);

  if (tier === 0) return num.toString();

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;

  return scaled.toFixed(1) + suffix;
}
