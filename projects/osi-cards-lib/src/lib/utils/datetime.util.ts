/**
 * Date/Time Utilities
 *
 * Comprehensive date and time manipulation utilities for formatting,
 * parsing, and calculations.
 *
 * Features:
 * - Date formatting
 * - Date parsing
 * - Date arithmetic
 * - Relative time
 * - Time zone handling
 * - Date validation
 *
 * @example
 * ```typescript
 * import { formatDate, addDays, isToday, getRelativeTime } from '@osi-cards/utils';
 *
 * const formatted = formatDate(new Date(), 'YYYY-MM-DD');
 * const tomorrow = addDays(new Date(), 1);
 * const isDateToday = isToday(someDate);
 * const relative = getRelativeTime(someDate); // "2 hours ago"
 * ```
 */

/**
 * Date format tokens
 */
const FORMAT_TOKENS: Record<string, (date: Date) => string> = {
  YYYY: (date) => date.getFullYear().toString(),
  YY: (date) => date.getFullYear().toString().slice(-2),
  MM: (date) => String(date.getMonth() + 1).padStart(2, '0'),
  M: (date) => String(date.getMonth() + 1),
  DD: (date) => String(date.getDate()).padStart(2, '0'),
  D: (date) => String(date.getDate()),
  HH: (date) => String(date.getHours()).padStart(2, '0'),
  H: (date) => String(date.getHours()),
  hh: (date) => String(date.getHours() % 12 || 12).padStart(2, '0'),
  h: (date) => String(date.getHours() % 12 || 12),
  mm: (date) => String(date.getMinutes()).padStart(2, '0'),
  m: (date) => String(date.getMinutes()),
  ss: (date) => String(date.getSeconds()).padStart(2, '0'),
  s: (date) => String(date.getSeconds()),
  SSS: (date) => String(date.getMilliseconds()).padStart(3, '0'),
  A: (date) => (date.getHours() >= 12 ? 'PM' : 'AM'),
  a: (date) => (date.getHours() >= 12 ? 'pm' : 'am'),
};

/**
 * Format date
 *
 * @param date - Date to format
 * @param format - Format string
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
 * // '2025-12-03 14:30:00'
 *
 * formatDate(new Date(), 'MM/DD/YYYY');
 * // '12/03/2025'
 * ```
 */
export function formatDate(date: Date | string | number, format: string): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  let result = format;

  Object.entries(FORMAT_TOKENS).forEach(([token, formatter]) => {
    result = result.replace(new RegExp(token, 'g'), formatter(d));
  });

  return result;
}

/**
 * Add days to date
 *
 * @param date - Base date
 * @param days - Number of days to add (negative to subtract)
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add hours to date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Add minutes to date
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Add months to date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add years to date
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Get difference between dates in milliseconds
 */
export function diffInMs(date1: Date, date2: Date): number {
  return date1.getTime() - date2.getTime();
}

/**
 * Get difference in days
 */
export function diffInDays(date1: Date, date2: Date): number {
  return Math.floor(diffInMs(date1, date2) / (1000 * 60 * 60 * 24));
}

/**
 * Get difference in hours
 */
export function diffInHours(date1: Date, date2: Date): number {
  return Math.floor(diffInMs(date1, date2) / (1000 * 60 * 60));
}

/**
 * Get difference in minutes
 */
export function diffInMinutes(date1: Date, date2: Date): number {
  return Math.floor(diffInMs(date1, date2) / (1000 * 60));
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return isSameDay(date, today);
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = addDays(new Date(), -1);
  return isSameDay(date, yesterday);
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = addDays(new Date(), 1);
  return isSameDay(date, tomorrow);
}

/**
 * Check if two dates are same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date is in past
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Check if date is in future
 */
export function isFuture(date: Date): boolean {
  return date > new Date();
}

/**
 * Check if date is between two dates
 */
export function isBetween(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

/**
 * Get start of day
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get relative time string
 *
 * @param date - Date to compare
 * @returns Relative time string
 *
 * @example
 * ```typescript
 * getRelativeTime(new Date(Date.now() - 3600000));
 * // '1 hour ago'
 * ```
 */
export function getRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (seconds < 2592000) {
    const weeks = Math.floor(seconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(seconds / 31536000);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Parse ISO date string
 */
export function parseISO(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Check if valid date
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Get day of week name
 *
 * @param date - Date
 * @param short - Use short name (Mon vs Monday)
 * @returns Day name
 */
export function getDayName(date: Date, short = false): string {
  const days = short
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Get month name
 *
 * @param date - Date
 * @param short - Use short name (Jan vs January)
 * @returns Month name
 */
export function getMonthName(date: Date, short = false): string {
  const months = short
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
  return months[date.getMonth()];
}

/**
 * Get days in month
 */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Check if leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get week number
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get quarter
 */
export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

/**
 * Format duration
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 *
 * @example
 * ```typescript
 * formatDuration(90000); // '1m 30s'
 * formatDuration(3665000); // '1h 1m 5s'
 * ```
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
