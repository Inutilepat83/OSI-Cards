/**
 * Locale-Aware Formatting Service
 *
 * Provides locale-aware formatting for dates, numbers, currencies, and percentages.
 * Integrates with I18nService to automatically use the current locale for formatting.
 *
 * Features:
 * - Date/time formatting (short, medium, long, full)
 * - Number formatting with locale-specific separators
 * - Currency formatting with locale-specific currency symbols and formats
 * - Percentage formatting
 * - Relative time formatting (e.g., "2 hours ago")
 * - Compact number formatting (e.g., "1.2K", "3.5M")
 *
 * @example
 * ```typescript
 * const formatter = inject(LocaleFormattingService);
 *
 * // Format currency
 * const price = formatter.formatCurrency(1234.56, 'USD'); // "$1,234.56" (en) or "1 234,56 €" (fr)
 *
 * // Format date
 * const date = formatter.formatDate(new Date(), 'medium'); // "Dec 15, 2024" (en) or "15 déc. 2024" (fr)
 *
 * // Format number
 * const number = formatter.formatNumber(1234.56); // "1,234.56" (en) or "1 234,56" (fr)
 *
 * // Format percentage
 * const percent = formatter.formatPercent(0.1234); // "12.34%" (en) or "12,34 %" (fr)
 * ```
 */

import { computed, inject, Injectable, signal } from '@angular/core';
import { I18nService, SupportedLocale } from './i18n.service';

export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full' | 'custom';
export type NumberFormatStyle = 'decimal' | 'currency' | 'percent' | 'unit' | 'compact';

export interface CurrencyFormatOptions {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  style?: 'currency';
}

export interface DateFormatOptions {
  style?: DateFormatStyle;
  customFormat?: string;
}

export interface RelativeTimeOptions {
  unit?: Intl.RelativeTimeFormatUnit;
}

export interface NumberFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
}

@Injectable({
  providedIn: 'root',
})
export class LocaleFormattingService {
  private readonly i18n = inject(I18nService);

  // Computed locale string for Intl APIs (converts 'en' to 'en-US', 'fr' to 'fr-FR', etc.)
  private readonly localeString = computed(() => {
    const locale = this.i18n.currentLocale();
    return this.convertToLocaleString(locale);
  });

  /**
   * Format a number according to the current locale
   */
  formatNumber(value: number | string | null | undefined, options?: NumberFormatOptions): string {
    if (value === null || value === undefined) {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return String(value);
    }

    const formatOptions: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 3,
      useGrouping: options?.useGrouping ?? true,
      ...(options?.notation && { notation: options.notation }),
    };

    try {
      return new Intl.NumberFormat(this.localeString(), formatOptions).format(numValue);
    } catch (error) {
      console.warn('Number formatting error:', error);
      return String(numValue);
    }
  }

  /**
   * Format a currency value according to the current locale
   */
  formatCurrency(
    value: number | string | null | undefined,
    currency = 'USD',
    options?: Omit<CurrencyFormatOptions, 'currency' | 'style'>
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return String(value);
    }

    const formatOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      useGrouping: true,
    };

    try {
      return new Intl.NumberFormat(this.localeString(), formatOptions).format(numValue);
    } catch (error) {
      console.warn('Currency formatting error:', error);
      // Fallback formatting
      return `${this.getCurrencySymbol(currency)}${this.formatNumber(numValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  /**
   * Format a percentage value according to the current locale
   */
  formatPercent(
    value: number | string | null | undefined,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return String(value);
    }

    // Convert to percentage (multiply by 100 if value is between 0 and 1)
    const percentValue = numValue > 1 ? numValue : numValue * 100;

    const formatOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    };

    try {
      return new Intl.NumberFormat(this.localeString(), formatOptions).format(percentValue / 100);
    } catch (error) {
      console.warn('Percentage formatting error:', error);
      return `${this.formatNumber(percentValue, options)}%`;
    }
  }

  /**
   * Format a date according to the current locale
   */
  formatDate(
    date: Date | string | number | null | undefined,
    style: DateFormatStyle = 'medium',
    options?: DateFormatOptions
  ): string {
    if (!date) {
      return '';
    }

    const dateValue = this.parseDate(date);
    if (!dateValue || isNaN(dateValue.getTime())) {
      return String(date);
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      ...this.getDateFormatOptions(style, options),
    };

    try {
      return new Intl.DateTimeFormat(this.localeString(), formatOptions).format(dateValue);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateValue.toLocaleDateString();
    }
  }

  /**
   * Format a date and time according to the current locale
   */
  formatDateTime(
    date: Date | string | number | null | undefined,
    dateStyle: DateFormatStyle = 'medium',
    timeStyle: DateFormatStyle = 'short'
  ): string {
    if (!date) {
      return '';
    }

    const dateValue = this.parseDate(date);
    if (!dateValue || isNaN(dateValue.getTime())) {
      return String(date);
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      ...this.getDateFormatOptions(dateStyle),
      ...this.getTimeFormatOptions(timeStyle),
    };

    try {
      return new Intl.DateTimeFormat(this.localeString(), formatOptions).format(dateValue);
    } catch (error) {
      console.warn('DateTime formatting error:', error);
      return dateValue.toLocaleString();
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   */
  formatRelativeTime(
    date: Date | string | number | null | undefined,
    unit?: Intl.RelativeTimeFormatUnit
  ): string {
    if (!date) {
      return '';
    }

    const dateValue = this.parseDate(date);
    if (!dateValue || isNaN(dateValue.getTime())) {
      return String(date);
    }

    const now = new Date();
    const diffMs = dateValue.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);

    if (Math.abs(diffSec) < 60) {
      return this.formatRelativeTimeUnit(diffSec, 'second');
    }

    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) {
      return this.formatRelativeTimeUnit(diffMin, 'minute');
    }

    const diffHour = Math.round(diffMin / 60);
    if (Math.abs(diffHour) < 24) {
      return this.formatRelativeTimeUnit(diffHour, 'hour');
    }

    const diffDay = Math.round(diffHour / 24);
    if (Math.abs(diffDay) < 30) {
      return this.formatRelativeTimeUnit(diffDay, 'day');
    }

    const diffMonth = Math.round(diffDay / 30);
    if (Math.abs(diffMonth) < 12) {
      return this.formatRelativeTimeUnit(diffMonth, 'month');
    }

    const diffYear = Math.round(diffMonth / 12);
    return this.formatRelativeTimeUnit(diffYear, 'year');
  }

  /**
   * Format a compact number (e.g., "1.2K", "3.5M")
   */
  formatCompactNumber(value: number | string | null | undefined): string {
    return this.formatNumber(value, {
      notation: 'compact',
      maximumFractionDigits: 1,
    });
  }

  /**
   * Get currency symbol for a currency code
   */
  getCurrencySymbol(currency: string): string {
    try {
      const formatter = new Intl.NumberFormat(this.localeString(), {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      // Extract currency symbol from formatted number
      const parts = formatter.formatToParts(0);
      const currencyPart = parts.find((part) => part.type === 'currency');
      return currencyPart?.value || currency;
    } catch (error) {
      // Fallback currency symbols
      const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CNY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        CHF: 'CHF',
        INR: '₹',
        BRL: 'R$',
        ZAR: 'R',
        RUB: '₽',
        KRW: '₩',
        MXN: '$',
        SEK: 'kr',
        NOK: 'kr',
        DKK: 'kr',
        PLN: 'zł',
        TRY: '₺',
      };
      return symbols[currency] || currency;
    }
  }

  /**
   * Parse various date formats into a Date object
   */
  private parseDate(date: Date | string | number): Date | null {
    if (date instanceof Date) {
      return date;
    }
    if (typeof date === 'number') {
      return new Date(date);
    }
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  /**
   * Get date format options based on style
   */
  private getDateFormatOptions(
    style: DateFormatStyle,
    options?: DateFormatOptions
  ): Intl.DateTimeFormatOptions {
    switch (style) {
      case 'short':
        return { year: 'numeric', month: 'numeric', day: 'numeric' };
      case 'medium':
        return { year: 'numeric', month: 'short', day: 'numeric' };
      case 'long':
        return { year: 'numeric', month: 'long', day: 'numeric' };
      case 'full':
        return { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      case 'custom':
        return options?.customFormat ? {} : { year: 'numeric', month: 'short', day: 'numeric' };
      default:
        return { year: 'numeric', month: 'short', day: 'numeric' };
    }
  }

  /**
   * Get time format options based on style
   */
  private getTimeFormatOptions(style: DateFormatStyle): Intl.DateTimeFormatOptions {
    switch (style) {
      case 'short':
        return { hour: 'numeric', minute: '2-digit' };
      case 'medium':
      case 'long':
      case 'full':
        return { hour: 'numeric', minute: '2-digit', second: '2-digit' };
      default:
        return { hour: 'numeric', minute: '2-digit' };
    }
  }

  /**
   * Format relative time unit
   */
  private formatRelativeTimeUnit(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    try {
      const formatter = new Intl.RelativeTimeFormat(this.localeString(), {
        numeric: 'auto',
      });
      return formatter.format(value, unit);
    } catch (error) {
      // Fallback formatting
      const absValue = Math.abs(value);
      const unitLabel = absValue === 1 ? unit : `${unit}s`;
      const prefix = value > 0 ? 'in ' : '';
      const suffix = value < 0 ? ' ago' : '';
      return `${prefix}${absValue} ${unitLabel}${suffix}`;
    }
  }

  /**
   * Convert locale code to full locale string for Intl APIs
   */
  private convertToLocaleString(locale: SupportedLocale): string {
    const localeMap: Record<SupportedLocale, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      es: 'es-ES',
      de: 'de-DE',
      pt: 'pt-BR',
      it: 'it-IT',
      ja: 'ja-JP',
      zh: 'zh-CN',
      ko: 'ko-KR',
    };
    return localeMap[locale] || 'en-US';
  }
}
