/**
 * I18n Service Wrapper
 *
 * This wrapper extends the library I18nService to provide app-specific functionality
 * and backwards-compatible API for existing app code.
 */

import { Injectable } from '@angular/core';
import { I18nService as LibI18nService, SupportedLocale } from '@osi-cards/services';
import { BehaviorSubject } from 'rxjs';

export type TranslationParams = Record<string, string | number>;
export type { SupportedLocale };

@Injectable({ providedIn: 'root' })
export class I18nService extends LibI18nService {
  // Backwards compatibility: Observable for locale changes
  private localeSubject = new BehaviorSubject<string>(this.locale());
  public locale$ = this.localeSubject.asObservable();

  /**
   * Translate a key with optional parameters
   * Backwards compatibility method
   */
  public translate(key: string, params?: TranslationParams): string {
    // For now, return the key as-is since translations aren't implemented
    // This matches the old behavior
    if (!params) {
      return key;
    }

    // Simple parameter substitution
    let result = key;
    Object.entries(params).forEach(([paramKey, value]) => {
      result = result.replace(`{{${paramKey}}}`, String(value));
    });
    return result;
  }

  /**
   * Override setLocale to also update the locale$ observable
   */
  override setLocale(locale: SupportedLocale): void {
    super.setLocale(locale);
    this.localeSubject.next(locale);
  }
}
