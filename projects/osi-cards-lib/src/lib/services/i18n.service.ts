/**
 * Internationalization Service
 *
 * Provides i18n features including translation, pluralization,
 * date/number formatting, and locale management.
 *
 * @example
 * ```typescript
 * const i18n = inject(I18nService);
 *
 * i18n.setLocale('es');
 * const greeting = i18n.translate('greeting', { name: 'John' });
 * const plural = i18n.plural('items', 5);
 * ```
 */

import { Injectable, signal, computed } from '@angular/core';

export interface Translation {
  [key: string]: string | Translation;
}

export interface Translations {
  [locale: string]: Translation;
}

export interface PluralRules {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ar' | string;

export interface I18nConfig {
  defaultLocale: string;
  fallbackLocale?: string;
  translations: Translations;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private config = signal<I18nConfig>({
    defaultLocale: 'en',
    fallbackLocale: 'en',
    translations: {},
  });

  private currentLocale = signal<string>('en');

  /**
   * Current locale
   */
  readonly locale = this.currentLocale.asReadonly();

  /**
   * Available locales
   */
  readonly availableLocales = computed(() => {
    return Object.keys(this.config().translations);
  });

  /**
   * Initialize i18n
   */
  init(config: I18nConfig): void {
    this.config.set(config);
    this.currentLocale.set(config.defaultLocale);
  }

  /**
   * Set current locale
   */
  setLocale(locale: string): void {
    if (this.availableLocales().includes(locale)) {
      this.currentLocale.set(locale);
    } else {
      console.warn(`Locale '${locale}' not available`);
    }
  }

  /**
   * Translate key
   *
   * @param key - Translation key (supports dot notation)
   * @param params - Interpolation parameters
   * @returns Translated string
   *
   * @example
   * ```typescript
   * i18n.translate('greeting'); // "Hello"
   * i18n.translate('welcome', { name: 'John' }); // "Welcome, John!"
   * ```
   */
  translate(key: string, params?: Record<string, any>): string {
    const locale = this.currentLocale();
    const translations = this.config().translations[locale];

    let value = this.getNestedValue(translations, key);

    // Fallback to default locale
    if (value === undefined && this.config().fallbackLocale) {
      const fallbackTranslations = this.config().translations[this.config().fallbackLocale!];
      value = this.getNestedValue(fallbackTranslations, key);
    }

    // Return key if no translation found
    if (value === undefined) {
      return key;
    }

    // Interpolate parameters
    if (params) {
      return this.interpolate(value as string, params);
    }

    return value as string;
  }

  /**
   * Alias for translate
   */
  t(key: string, params?: Record<string, any>): string {
    return this.translate(key, params);
  }

  /**
   * Pluralize
   *
   * @param key - Translation key
   * @param count - Count for pluralization
   * @param params - Additional parameters
   * @returns Pluralized string
   *
   * @example
   * ```typescript
   * i18n.plural('items', 0); // "No items"
   * i18n.plural('items', 1); // "1 item"
   * i18n.plural('items', 5); // "5 items"
   * ```
   */
  plural(key: string, count: number, params?: Record<string, any>): string {
    const pluralKey = this.getPluralKey(count);
    const translationKey = `${key}.${pluralKey}`;

    return this.translate(translationKey, { count, ...params });
  }

  /**
   * Format date
   */
  formatDate(date: Date, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
    const locale = this.currentLocale();

    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: { month: 'numeric', day: 'numeric', year: '2-digit' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric' },
      full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    };

    const options = formatOptions[format] || formatOptions['medium'];

    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * Format number
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.currentLocale();
    return new Intl.NumberFormat(locale, options).format(value);
  }

  /**
   * Format currency
   */
  formatCurrency(value: number, currency: string): string {
    const locale = this.currentLocale();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }

  /**
   * Format percentage
   */
  formatPercent(value: number): string {
    const locale = this.currentLocale();
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Add translations
   */
  addTranslations(locale: string, translations: Translation): void {
    this.config.update(config => ({
      ...config,
      translations: {
        ...config.translations,
        [locale]: {
          ...config.translations[locale],
          ...translations,
        },
      },
    }));
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Interpolate parameters into string
   */
  private interpolate(template: string, params: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
    });
  }

  /**
   * Get plural key based on count
   */
  private getPluralKey(count: number): string {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    if (count === 2) return 'two';
    return 'other';
  }

  /**
   * Check if locale is RTL
   */
  isRTL(locale?: string): boolean {
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    const checkLocale = locale || this.currentLocale();
    return rtlLocales.some(rtl => checkLocale.startsWith(rtl));
  }

  /**
   * Get text direction
   */
  getDirection(locale?: string): 'ltr' | 'rtl' {
    return this.isRTL(locale) ? 'rtl' : 'ltr';
  }

  /**
   * Format relative time
   */
  formatRelativeTime(date: Date): string {
    const locale = this.currentLocale();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffDay > 0) return rtf.format(-diffDay, 'day');
    if (diffHour > 0) return rtf.format(-diffHour, 'hour');
    if (diffMin > 0) return rtf.format(-diffMin, 'minute');
    return rtf.format(-diffSec, 'second');
  }

  /**
   * Get locale display name
   */
  getLocaleDisplayName(locale: string): string {
    const currentLocale = this.currentLocale();
    return new Intl.DisplayNames([currentLocale], { type: 'language' }).of(locale) || locale;
  }
}
