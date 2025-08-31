import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private currentLanguage$ = new BehaviorSubject<SupportedLanguage>('en');

  constructor(private translate: TranslateService) {
    this.initializeTranslations();
  }

  /**
   * Initialize translation service with default settings
   */
  private initializeTranslations(): void {
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    // Get browser language
    const browserLang = this.translate.getBrowserLang() as SupportedLanguage;
    if (this.isSupportedLanguage(browserLang)) {
      this.setLanguage(browserLang);
    }
  }

  /**
   * Set the current language
   */
  setLanguage(lang: SupportedLanguage): void {
    this.translate.use(lang);
    this.currentLanguage$.next(lang);
    localStorage.setItem('preferred-language', lang);
  }

  /**
   * Get the current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage$.value;
  }

  /**
   * Get current language as observable
   */
  getCurrentLanguage$(): Observable<SupportedLanguage> {
    return this.currentLanguage$.asObservable();
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): { code: SupportedLanguage; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
    ];
  }

  /**
   * Translate a key
   */
  translateKey(key: string, params?: any): Observable<string> {
    return this.translate.get(key, params);
  }

  /**
   * Get instant translation (synchronous)
   */
  translateInstant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  /**
   * Check if language is supported
   */
  private isSupportedLanguage(lang: string): lang is SupportedLanguage {
    return ['en', 'es', 'fr', 'de'].includes(lang);
  }

  /**
   * Load user preferred language from storage
   */
  loadPreferredLanguage(): void {
    const savedLang = localStorage.getItem('preferred-language') as SupportedLanguage;
    if (savedLang && this.isSupportedLanguage(savedLang)) {
      this.setLanguage(savedLang);
    }
  }
}
