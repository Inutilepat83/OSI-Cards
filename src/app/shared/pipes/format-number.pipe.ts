import { Pipe, PipeTransform } from '@angular/core';

/**
 * Format number pipe for formatting numbers with locale support
 * 
 * Formats numbers using Intl.NumberFormat with support for currency, percentage,
 * and standard number formatting. Provides locale-aware number formatting.
 * 
 * @example
 * ```html
 * {{ 1234.56 | formatNumber }}
 * {{ 1234.56 | formatNumber:'currency' }}
 * {{ 0.85 | formatNumber:'percent' }}
 * ```
 */
@Pipe({
  name: 'formatNumber',
  standalone: true
})
export class FormatNumberPipe implements PipeTransform {
  /**
   * Transform number to formatted string
   * 
   * @param value - The number to format (can be null or undefined)
   * @param format - Format type: 'number', 'currency', or 'percent' (default: 'number')
   * @param locale - Locale string for formatting (default: 'en-US')
   * @returns Formatted number string, or empty string if value is invalid
   */
  transform(
    value: number | null | undefined,
    format: 'number' | 'currency' | 'percent' = 'number',
    locale = 'en-US'
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '';
    }

    const options: Intl.NumberFormatOptions = {};

    switch (format) {
      case 'currency':
        options.style = 'currency';
        options.currency = 'USD';
        break;
      case 'percent':
        options.style = 'percent';
        options.minimumFractionDigits = 0;
        options.maximumFractionDigits = 2;
        break;
      default:
        options.minimumFractionDigits = 0;
        options.maximumFractionDigits = 2;
    }

    return new Intl.NumberFormat(locale, options).format(value);
  }
}


