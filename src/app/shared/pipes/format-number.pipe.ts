import { Pipe, PipeTransform } from '@angular/core';

/**
 * Format number pipe for formatting numbers with locale support
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
  transform(
    value: number | null | undefined,
    format: 'number' | 'currency' | 'percent' = 'number',
    locale: string = 'en-US'
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


