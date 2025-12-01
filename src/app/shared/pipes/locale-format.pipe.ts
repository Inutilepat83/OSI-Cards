/**
 * Locale Format Pipe
 *
 * Pipe for formatting values according to the current locale in templates.
 * Supports numbers, currency, percentages, dates, and relative time.
 *
 * @example
 * ```html
 * <!-- Format currency -->
 * <span>{{ 1234.56 | localeFormat: 'currency': 'USD' }}</span>
 *
 * <!-- Format number -->
 * <span>{{ 1234.56 | localeFormat: 'number' }}</span>
 *
 * <!-- Format percentage -->
 * <span>{{ 0.1234 | localeFormat: 'percent' }}</span>
 *
 * <!-- Format date -->
 * <span>{{ date | localeFormat: 'date': 'medium' }}</span>
 *
 * <!-- Format relative time -->
 * <span>{{ date | localeFormat: 'relative' }}</span>
 * ```
 */

import { inject, Pipe, PipeTransform } from '@angular/core';
import {
  CurrencyFormatOptions,
  DateFormatOptions,
  DateFormatStyle,
  LocaleFormattingService,
  NumberFormatOptions,
} from '../../core/services/locale-formatting.service';

export type FormatType =
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'dateTime'
  | 'relative'
  | 'compact';

@Pipe({
  name: 'localeFormat',
  standalone: true,
  pure: false, // Not pure to react to locale changes
})
export class LocaleFormatPipe implements PipeTransform {
  private readonly formatter = inject(LocaleFormattingService);

  transform(
    value: number | string | Date | null | undefined,
    type: FormatType = 'number',
    ...args: unknown[]
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (type) {
      case 'currency': {
        const currency = (args[0] as string) || 'USD';
        const options = args[1] as Omit<CurrencyFormatOptions, 'currency' | 'style'> | undefined;
        // Convert Date to number for currency formatting
        const numValue = value instanceof Date ? value.getTime() : value;
        return this.formatter.formatCurrency(numValue, currency, options);
      }

      case 'percent': {
        const options = args[0] as
          | { minimumFractionDigits?: number; maximumFractionDigits?: number }
          | undefined;
        // Convert Date to number for percentage formatting
        const numValue = value instanceof Date ? value.getTime() : value;
        return this.formatter.formatPercent(numValue, options);
      }

      case 'date': {
        const style = (args[0] as DateFormatStyle) || 'medium';
        const options = args[1] as DateFormatOptions | undefined;
        return this.formatter.formatDate(value, style, options);
      }

      case 'dateTime': {
        const dateStyle = (args[0] as DateFormatStyle) || 'medium';
        const timeStyle = (args[1] as DateFormatStyle) || 'short';
        return this.formatter.formatDateTime(value, dateStyle, timeStyle);
      }

      case 'relative': {
        const unit = args[0] as Intl.RelativeTimeFormatUnit | undefined;
        return this.formatter.formatRelativeTime(value, unit);
      }

      case 'compact': {
        // Convert Date to number for compact formatting
        const numValue = value instanceof Date ? value.getTime() : value;
        return this.formatter.formatCompactNumber(numValue);
      }

      case 'number':
      default: {
        const options = args[0] as NumberFormatOptions | undefined;
        // Convert Date to number for number formatting
        const numValue = value instanceof Date ? value.getTime() : value;
        return this.formatter.formatNumber(numValue, options);
      }
    }
  }
}
