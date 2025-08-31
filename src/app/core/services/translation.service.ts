import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentLanguage$ = new BehaviorSubject<string>('en');
  private availableLanguages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  constructor(private translateService: TranslateService) {
    this.initializeTranslation();
  }

  /**
   * Initialize translation service
   */
  private initializeTranslation(): void {
    // Set default language
    this.translateService.setDefaultLang('en');

    // Get browser language or fallback to English
    const browserLang = this.translateService.getBrowserLang();
    const defaultLang =
      browserLang && this.availableLanguages.find(lang => lang.code === browserLang)
        ? browserLang
        : 'en';

    // Use language from localStorage if available
    const savedLang = localStorage.getItem('osi-cards-language');
    const initialLang = savedLang || defaultLang;

    this.setLanguage(initialLang);
  }

  /**
   * Get current language as observable
   */
  getCurrentLanguage$(): Observable<string> {
    return this.currentLanguage$.asObservable();
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage$.value;
  }

  /**
   * Set current language
   */
  setLanguage(langCode: string): void {
    if (this.availableLanguages.find(lang => lang.code === langCode)) {
      this.translateService.use(langCode);
      this.currentLanguage$.next(langCode);
      localStorage.setItem('osi-cards-language', langCode);

      // Update document language attribute
      document.documentElement.lang = langCode;

      // Update document direction for RTL languages
      document.documentElement.dir = this.isRTL(langCode) ? 'rtl' : 'ltr';
    }
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): Language[] {
    return [...this.availableLanguages];
  }

  /**
   * Get language by code
   */
  getLanguageByCode(code: string): Language | undefined {
    return this.availableLanguages.find(lang => lang.code === code);
  }

  /**
   * Check if language is RTL
   */
  isRTL(langCode: string): boolean {
    const rtlLanguages = ['ar'];
    return rtlLanguages.includes(langCode);
  }

  /**
   * Get translation key with parameters
   */
  getTranslation(key: string, params?: any): Observable<string> {
    return this.translateService.get(key, params);
  }

  /**
   * Get instant translation
   */
  instant(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }

  /**
   * Check if translation exists
   */
  hasTranslation(key: string): boolean {
    return this.translateService.instant(key) !== key;
  }

  /**
   * Reload translations
   */
  reloadTranslations(): void {
    this.translateService.reloadLang(this.getCurrentLanguage());
  }

  /**
   * Add new language at runtime
   */
  addLanguage(language: Language): void {
    if (!this.availableLanguages.find(lang => lang.code === language.code)) {
      this.availableLanguages.push(language);
    }
  }

  /**
   * Remove language
   */
  removeLanguage(langCode: string): void {
    this.availableLanguages = this.availableLanguages.filter(lang => lang.code !== langCode);
  }

  /**
   * Get browser preferred languages
   */
  getBrowserLanguages(): string[] {
    const browserLang = this.translateService.getBrowserLang();
    return browserLang ? [browserLang] : [];
  }

  /**
   * Detect user language from various sources
   */
  detectUserLanguage(): string {
    // Priority: localStorage > browser language > default
    const saved = localStorage.getItem('osi-cards-language');
    if (saved && this.availableLanguages.find(lang => lang.code === saved)) {
      return saved;
    }

    const browserLang = this.translateService.getBrowserLang();
    if (browserLang && this.availableLanguages.find(lang => lang.code === browserLang)) {
      return browserLang;
    }

    return 'en';
  }
}
