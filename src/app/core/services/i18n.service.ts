/**
 * Internationalization (i18n) Service
 *
 * Provides runtime translation functionality for all user-facing text.
 * Supports dynamic language switching, lazy loading of translation files,
 * and fallback to default language when translations are missing.
 *
 * Features:
 * - Runtime language switching
 * - Lazy loading of translation files
 * - Fallback to default language (en)
 * - Pluralization support
 * - Parameter interpolation
 * - Type-safe translation keys
 *
 * @example
 * ```typescript
 * const i18n = inject(I18nService);
 *
 * // Simple translation
 * const text = i18n.translate('common.save');
 *
 * // Translation with parameters
 * const greeting = i18n.translate('common.greeting', { name: 'John' });
 *
 * // Pluralization
 * const items = i18n.translate('common.items', { count: 5 });
 * ```
 */

import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export type SupportedLocale = 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it' | 'ja' | 'zh' | 'ko';

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

export type TranslationParams = Record<string, string | number>;

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  // Default locale (English)
  private readonly defaultLocale: SupportedLocale = 'en';

  // Current locale signal
  private readonly _currentLocale = signal<SupportedLocale>(this.detectLocale());

  // Current translations dictionary
  private translations: TranslationDictionary = {};

  // Cache for loaded translations
  private translationCache = new Map<SupportedLocale, TranslationDictionary>();

  // Observable for locale changes
  private localeSubject = new BehaviorSubject<SupportedLocale>(this._currentLocale());

  constructor() {
    // Load default translations on initialization
    this.loadTranslations(this.defaultLocale).subscribe();

    // Update document lang attribute when locale changes
    effect(() => {
      const locale = this._currentLocale();
      if (this.document.documentElement) {
        this.document.documentElement.lang = locale;
      }
    });
  }

  /**
   * Get current locale as signal
   */
  get currentLocale() {
    return this._currentLocale.asReadonly();
  }

  /**
   * Get current locale as observable
   */
  get locale$(): Observable<SupportedLocale> {
    return this.localeSubject.asObservable();
  }

  /**
   * Translate a key to the current locale
   *
   * @param key Translation key (dot notation supported, e.g., 'common.save')
   * @param params Optional parameters for interpolation
   * @returns Translated string
   */
  translate(key: string, params?: TranslationParams): string {
    const translation = this.getTranslation(key, this._currentLocale());

    if (!translation) {
      console.warn(`Translation missing for key: ${key} (locale: ${this._currentLocale()})`);
      return key; // Return key as fallback
    }

    return this.interpolate(translation, params);
  }

  /**
   * Get translation as observable
   */
  translate$(key: string, params?: TranslationParams): Observable<string> {
    return this.locale$.pipe(map(() => this.translate(key, params)));
  }

  /**
   * Set the current locale
   */
  setLocale(locale: SupportedLocale): Observable<void> {
    if (this._currentLocale() === locale) {
      return of(undefined);
    }

    return this.loadTranslations(locale).pipe(
      map(() => {
        this._currentLocale.set(locale);
        this.localeSubject.next(locale);
        // Persist to localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('preferred-locale', locale);
        }
      }),
      catchError((error) => {
        console.error(`Failed to load translations for locale: ${locale}`, error);
        return of(undefined);
      })
    );
  }

  /**
   * Load translations for a locale
   */
  private loadTranslations(locale: SupportedLocale): Observable<TranslationDictionary> {
    // Check cache first
    if (this.translationCache.has(locale)) {
      this.translations = this.translationCache.get(locale)!;
      return of(this.translations);
    }

    // Load from assets
    return this.http.get<TranslationDictionary>(`/assets/i18n/${locale}.json`).pipe(
      map((translations) => {
        this.translationCache.set(locale, translations);
        this.translations = translations;
        return translations;
      }),
      catchError((error) => {
        console.error(`Failed to load translations for ${locale}:`, error);
        // Fallback to default locale if not already using it
        if (locale !== this.defaultLocale) {
          return this.loadTranslations(this.defaultLocale);
        }
        // Return empty dictionary as last resort
        return of({});
      })
    );
  }

  /**
   * Get translation value for a key
   */
  private getTranslation(key: string, locale: SupportedLocale): string | null {
    const keys = key.split('.');
    let value: TranslationDictionary | string | null = this.translations;

    // Navigate through nested keys
    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        const nextValue: string | TranslationDictionary | undefined = value[k];
        if (nextValue === undefined) {
          break;
        }
        value = nextValue;
      } else {
        // Try fallback to default locale
        if (locale !== this.defaultLocale) {
          const defaultTranslations = this.translationCache.get(this.defaultLocale);
          if (defaultTranslations) {
            const fallbackValue = this.getNestedValue(defaultTranslations, keys);
            if (fallbackValue && typeof fallbackValue === 'string') {
              return fallbackValue;
            }
          }
        }
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
  }

  /**
   * Get nested value from object using key path
   */
  private getNestedValue(
    obj: TranslationDictionary,
    keys: string[]
  ): string | TranslationDictionary | null {
    let value: TranslationDictionary | string | null = obj;
    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        const nextValue: string | TranslationDictionary | undefined = value[k];
        if (nextValue === undefined) {
          return null;
        }
        value = nextValue;
      } else {
        return null;
      }
    }
    return value;
  }

  /**
   * Interpolate parameters in translation string
   */
  private interpolate(translation: string, params?: TranslationParams): string {
    if (!params) {
      return translation;
    }

    let result = translation;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
    }

    return result;
  }

  /**
   * Detect user's preferred locale from browser or localStorage
   */
  private detectLocale(): SupportedLocale {
    // Check localStorage first
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('preferred-locale') as SupportedLocale | null;
      if (saved && this.isSupportedLocale(saved)) {
        return saved;
      }
    }

    // Check browser language
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0] as SupportedLocale;
      if (this.isSupportedLocale(browserLang)) {
        return browserLang;
      }
    }

    return this.defaultLocale;
  }

  /**
   * Check if locale is supported
   */
  private isSupportedLocale(locale: string): locale is SupportedLocale {
    const supported: SupportedLocale[] = ['en', 'fr', 'es', 'de', 'pt', 'it', 'ja', 'zh', 'ko'];
    return supported.includes(locale as SupportedLocale);
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): SupportedLocale[] {
    return ['en', 'fr', 'es', 'de', 'pt', 'it', 'ja', 'zh', 'ko'];
  }

  /**
   * Check if translations are loaded
   */
  isReady(): boolean {
    return Object.keys(this.translations).length > 0;
  }
}
