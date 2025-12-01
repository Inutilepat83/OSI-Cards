import { Injectable, inject, signal, computed, LOCALE_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Supported locales
 */
export type SupportedLocale = 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it' | 'ja' | 'zh' | 'ko' | 'ar';

/**
 * Translation dictionary
 */
export type TranslationDictionary = Record<string, string | Record<string, string>>;

/**
 * RTL languages
 */
const RTL_LOCALES: SupportedLocale[] = ['ar'];

/**
 * Default translations for OSI Cards
 */
const DEFAULT_TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      close: 'Close',
      expand: 'Expand',
      collapse: 'Collapse',
      showMore: 'Show more',
      showLess: 'Show less',
      copyToClipboard: 'Copy to clipboard',
      copied: 'Copied!',
      search: 'Search',
      noResults: 'No results found',
      viewAll: 'View all',
    },
    card: {
      streaming: 'Generating content...',
      complete: 'Content loaded',
      error: 'Failed to load content',
    },
    sections: {
      info: 'Information',
      overview: 'Overview',
      timeline: 'Timeline',
      gallery: 'Gallery',
      video: 'Video',
      code: 'Code',
      faq: 'FAQ',
      pricing: 'Pricing',
      rating: 'Reviews',
      social: 'Social',
      kanban: 'Board',
      comparison: 'Comparison',
    },
    accessibility: {
      skipToContent: 'Skip to main content',
      expandSection: 'Expand section',
      collapseSection: 'Collapse section',
      playVideo: 'Play video',
      pauseVideo: 'Pause video',
      nextSlide: 'Next slide',
      prevSlide: 'Previous slide',
    }
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      retry: 'Réessayer',
      close: 'Fermer',
      expand: 'Développer',
      collapse: 'Réduire',
      showMore: 'Voir plus',
      showLess: 'Voir moins',
      copyToClipboard: 'Copier',
      copied: 'Copié !',
      search: 'Rechercher',
      noResults: 'Aucun résultat',
      viewAll: 'Voir tout',
    },
    card: {
      streaming: 'Génération du contenu...',
      complete: 'Contenu chargé',
      error: 'Échec du chargement',
    },
    sections: {
      info: 'Informations',
      overview: 'Aperçu',
      timeline: 'Chronologie',
      gallery: 'Galerie',
      video: 'Vidéo',
      code: 'Code',
      faq: 'FAQ',
      pricing: 'Tarifs',
      rating: 'Avis',
      social: 'Social',
      kanban: 'Tableau',
      comparison: 'Comparaison',
    },
    accessibility: {
      skipToContent: 'Aller au contenu principal',
      expandSection: 'Développer la section',
      collapseSection: 'Réduire la section',
      playVideo: 'Lire la vidéo',
      pauseVideo: 'Pause',
      nextSlide: 'Diapositive suivante',
      prevSlide: 'Diapositive précédente',
    }
  },
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Se produjo un error',
      retry: 'Reintentar',
      close: 'Cerrar',
      expand: 'Expandir',
      collapse: 'Contraer',
      showMore: 'Ver más',
      showLess: 'Ver menos',
      copyToClipboard: 'Copiar',
      copied: '¡Copiado!',
      search: 'Buscar',
      noResults: 'Sin resultados',
      viewAll: 'Ver todo',
    },
    card: {
      streaming: 'Generando contenido...',
      complete: 'Contenido cargado',
      error: 'Error al cargar',
    },
    sections: {
      info: 'Información',
      overview: 'Resumen',
      timeline: 'Cronología',
      gallery: 'Galería',
      video: 'Video',
      code: 'Código',
      faq: 'Preguntas frecuentes',
      pricing: 'Precios',
      rating: 'Reseñas',
      social: 'Social',
      kanban: 'Tablero',
      comparison: 'Comparación',
    },
    accessibility: {
      skipToContent: 'Ir al contenido principal',
      expandSection: 'Expandir sección',
      collapseSection: 'Contraer sección',
      playVideo: 'Reproducir video',
      pauseVideo: 'Pausar',
      nextSlide: 'Siguiente diapositiva',
      prevSlide: 'Diapositiva anterior',
    }
  },
  de: {
    common: {
      loading: 'Laden...',
      error: 'Ein Fehler ist aufgetreten',
      retry: 'Erneut versuchen',
      close: 'Schließen',
      expand: 'Erweitern',
      collapse: 'Minimieren',
      showMore: 'Mehr anzeigen',
      showLess: 'Weniger anzeigen',
      copyToClipboard: 'Kopieren',
      copied: 'Kopiert!',
      search: 'Suchen',
      noResults: 'Keine Ergebnisse',
      viewAll: 'Alle anzeigen',
    },
    card: {
      streaming: 'Inhalt wird generiert...',
      complete: 'Inhalt geladen',
      error: 'Laden fehlgeschlagen',
    },
    sections: {
      info: 'Informationen',
      overview: 'Überblick',
      timeline: 'Zeitleiste',
      gallery: 'Galerie',
      video: 'Video',
      code: 'Code',
      faq: 'FAQ',
      pricing: 'Preise',
      rating: 'Bewertungen',
      social: 'Sozial',
      kanban: 'Board',
      comparison: 'Vergleich',
    },
    accessibility: {
      skipToContent: 'Zum Inhalt springen',
      expandSection: 'Abschnitt erweitern',
      collapseSection: 'Abschnitt minimieren',
      playVideo: 'Video abspielen',
      pauseVideo: 'Pause',
      nextSlide: 'Nächste Folie',
      prevSlide: 'Vorherige Folie',
    }
  },
  // Placeholder translations for other languages
  pt: { common: {}, card: {}, sections: {}, accessibility: {} },
  it: { common: {}, card: {}, sections: {}, accessibility: {} },
  ja: { common: {}, card: {}, sections: {}, accessibility: {} },
  zh: { common: {}, card: {}, sections: {}, accessibility: {} },
  ko: { common: {}, card: {}, sections: {}, accessibility: {} },
  ar: { common: {}, card: {}, sections: {}, accessibility: {} },
};

/**
 * I18n Service for OSI Cards
 *
 * Provides internationalization support with translations,
 * locale detection, and RTL handling.
 *
 * @example
 * ```typescript
 * const i18n = inject(I18nService);
 *
 * // Set locale
 * i18n.setLocale('fr');
 *
 * // Get translation
 * const text = i18n.t('common.loading');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly localeId = inject(LOCALE_ID, { optional: true });

  /** Current locale */
  private readonly currentLocale = signal<SupportedLocale>('en');

  /** Custom translations */
  private readonly customTranslations = signal<Record<string, TranslationDictionary>>({});

  /** Current locale (readonly) */
  readonly locale = computed(() => this.currentLocale());

  /** Is RTL language */
  readonly isRTL = computed(() => RTL_LOCALES.includes(this.currentLocale()));

  /** Text direction */
  readonly direction = computed(() => this.isRTL() ? 'rtl' : 'ltr');

  constructor() {
    // Auto-detect locale
    this.detectLocale();
  }

  /**
   * Set the current locale
   */
  setLocale(locale: SupportedLocale): void {
    this.currentLocale.set(locale);
    this.updateDocumentDirection();
  }

  /**
   * Get a translation by key
   */
  t(key: string, params?: Record<string, string | number>): string {
    const locale = this.currentLocale();
    let value = this.getNestedValue(key, locale);

    // Fallback to English
    if (!value && locale !== 'en') {
      value = this.getNestedValue(key, 'en');
    }

    // Fallback to key
    if (!value) {
      return key;
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }

    return value;
  }

  /**
   * Add custom translations
   */
  addTranslations(locale: SupportedLocale, translations: TranslationDictionary): void {
    this.customTranslations.update(current => ({
      ...current,
      [locale]: this.mergeDeep(current[locale] || {}, translations)
    }));
  }

  /**
   * Get all translations for a locale
   */
  getTranslations(locale?: SupportedLocale): TranslationDictionary {
    const targetLocale = locale ?? this.currentLocale();
    return this.mergeDeep(
      DEFAULT_TRANSLATIONS[targetLocale] || {},
      this.customTranslations()[targetLocale] || {}
    );
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): SupportedLocale[] {
    return Object.keys(DEFAULT_TRANSLATIONS) as SupportedLocale[];
  }

  /**
   * Format number for locale
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat(this.currentLocale()).format(value);
  }

  /**
   * Format date for locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLocale(), options).format(date);
  }

  /**
   * Format currency for locale
   */
  formatCurrency(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat(this.currentLocale(), {
      style: 'currency',
      currency
    }).format(value);
  }

  /**
   * Detect locale from browser/Angular
   */
  private detectLocale(): void {
    // Try Angular locale
    if (this.localeId) {
      const locale = this.localeId.split('-')[0] as SupportedLocale;
      if (this.isSupported(locale)) {
        this.currentLocale.set(locale);
        return;
      }
    }

    // Try browser locale
    const browserLocale = navigator.language?.split('-')[0] as SupportedLocale;
    if (this.isSupported(browserLocale)) {
      this.currentLocale.set(browserLocale);
    }
  }

  /**
   * Check if locale is supported
   */
  private isSupported(locale: string): locale is SupportedLocale {
    return locale in DEFAULT_TRANSLATIONS;
  }

  /**
   * Get nested value from translation dictionary
   */
  private getNestedValue(key: string, locale: SupportedLocale): string {
    const translations = this.getTranslations(locale);
    const keys = key.split('.');

    let value: unknown = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return '';
      }
    }

    return typeof value === 'string' ? value : '';
  }

  /**
   * Deep merge objects
   */
  private mergeDeep(target: TranslationDictionary, source: TranslationDictionary): TranslationDictionary {
    const result: TranslationDictionary = { ...target };

    for (const key of Object.keys(source)) {
      const targetValue = result[key];
      const sourceValue = source[key];

      if (sourceValue === undefined) continue;

      if (typeof sourceValue === 'object' && sourceValue !== null && typeof targetValue === 'object' && targetValue !== null) {
        result[key] = this.mergeDeep(
          targetValue as Record<string, string>,
          sourceValue as Record<string, string>
        ) as Record<string, string>;
      } else {
        result[key] = sourceValue;
      }
    }

    return result;
  }

  /**
   * Update document direction for RTL support
   */
  private updateDocumentDirection(): void {
    const dir = this.direction();
    this.document.documentElement.setAttribute('dir', dir);
    this.document.documentElement.setAttribute('lang', this.currentLocale());
  }
}

