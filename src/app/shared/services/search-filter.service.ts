import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AICardConfig, CardSection, CardField, CardItem, CardType } from '../../models';
import { LoggingService } from '../../core/services/logging.service';

export interface SearchFilterOptions {
  query: string;
  searchInTitle?: boolean;
  searchInFields?: boolean;
  searchInItems?: boolean;
  searchInDescription?: boolean;
  caseSensitive?: boolean;
}

export interface AdvancedFilterCriteria {
  cardTypes?: CardType[];
  sectionTypes?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
    field?: 'created' | 'updated' | 'modified';
  };
  tags?: string[];
  hasFields?: boolean;
  hasItems?: boolean;
  minSections?: number;
  maxSections?: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  searchOptions: SearchFilterOptions;
  advancedCriteria?: AdvancedFilterCriteria;
  createdAt: Date;
}

export interface SearchResult {
  card: AICardConfig;
  score: number;
  matches: {
    field: string;
    value: string;
    highlighted?: string;
  }[];
}

/**
 * Search and filter service
 * Implements advanced search and filter functionality for cards and sections
 * Supports multi-criteria filtering, saved presets, and search highlighting
 */
@Injectable({
  providedIn: 'root'
})
export class SearchFilterService {
  private readonly logger = inject(LoggingService);
  private readonly presetsSubject = new BehaviorSubject<FilterPreset[]>([]);
  readonly presets$: Observable<FilterPreset[]> = this.presetsSubject.asObservable();

  constructor() {
    // Load presets in constructor to ensure they're available immediately
    this.loadPresets();
  }
  /**
   * Search cards by query
   */
  searchCards(cards: AICardConfig[], options: SearchFilterOptions): AICardConfig[] {
    if (!options.query || options.query.trim() === '') {
      return cards;
    }

    const query = options.caseSensitive ? options.query : options.query.toLowerCase();

    return cards.filter(card => this.matchesCard(card, query, options));
  }

  /**
   * Check if card matches search query
   */
  private matchesCard(card: AICardConfig, query: string, options: SearchFilterOptions): boolean {
    // Search in title
    if (options.searchInTitle !== false) {
      const title = options.caseSensitive ? card.cardTitle : card.cardTitle.toLowerCase();
      if (title.includes(query)) {
        return true;
      }
    }

    // Search in subtitle
    if (options.searchInDescription !== false && card.cardSubtitle) {
      const subtitle = options.caseSensitive ? card.cardSubtitle : card.cardSubtitle.toLowerCase();
      if (subtitle.includes(query)) {
        return true;
      }
    }

    // Search in description
    if (options.searchInDescription !== false && card.description) {
      const description = options.caseSensitive ? card.description : card.description.toLowerCase();
      if (description.includes(query)) {
        return true;
      }
    }

    // Search in sections
    if (card.sections) {
      for (const section of card.sections) {
        if (this.matchesSection(section, query, options)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if section matches search query
   */
  private matchesSection(section: CardSection, query: string, options: SearchFilterOptions): boolean {
    // Search in section title
    const title = options.caseSensitive ? section.title : section.title.toLowerCase();
    if (title.includes(query)) {
      return true;
    }

    // Search in section description
    if (options.searchInDescription !== false && section.description) {
      const description = options.caseSensitive ? section.description : section.description.toLowerCase();
      if (description.includes(query)) {
        return true;
      }
    }

    // Search in fields
    if (options.searchInFields !== false && section.fields) {
      for (const field of section.fields) {
        if (this.matchesField(field, query, options)) {
          return true;
        }
      }
    }

    // Search in items
    if (options.searchInItems !== false && section.items) {
      for (const item of section.items) {
        if (this.matchesItem(item, query, options)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if field matches search query
   */
  private matchesField(field: CardField, query: string, options: SearchFilterOptions): boolean {
    // Search in label
    if (field.label) {
      const label = options.caseSensitive ? field.label : field.label.toLowerCase();
      if (label.includes(query)) {
        return true;
      }
    }

    // Search in title
    if (field.title) {
      const title = options.caseSensitive ? field.title : field.title.toLowerCase();
      if (title.includes(query)) {
        return true;
      }
    }

    // Search in value
    if (field.value !== undefined && field.value !== null) {
      const value = options.caseSensitive ? String(field.value) : String(field.value).toLowerCase();
      if (value.includes(query)) {
        return true;
      }
    }

    // Search in description
    if (options.searchInDescription !== false && field.description) {
      const description = options.caseSensitive ? field.description : field.description.toLowerCase();
      if (description.includes(query)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if item matches search query
   */
  private matchesItem(item: CardItem, query: string, options: SearchFilterOptions): boolean {
    // Search in title
    if (item.title) {
      const title = options.caseSensitive ? item.title : item.title.toLowerCase();
      if (title.includes(query)) {
        return true;
      }
    }

    // Search in description
    if (options.searchInDescription !== false && item.description) {
      const description = options.caseSensitive ? item.description : item.description.toLowerCase();
      if (description.includes(query)) {
        return true;
      }
    }

    // Search in value
    if (item.value !== undefined && item.value !== null) {
      const value = options.caseSensitive ? String(item.value) : String(item.value).toLowerCase();
      if (value.includes(query)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Filter cards by type
   */
  filterByType(cards: AICardConfig[], cardType: string): AICardConfig[] {
    if (!cardType) {
      return cards;
    }
    return cards.filter(card => card.cardType === cardType);
  }

  /**
   * Filter cards by section type
   */
  filterBySectionType(cards: AICardConfig[], sectionType: string): AICardConfig[] {
    if (!sectionType) {
      return cards;
    }
    return cards.filter(card =>
      card.sections?.some(section => section.type === sectionType)
    );
  }

  /**
   * Advanced multi-criteria filtering
   */
  filterCards(
    cards: AICardConfig[],
    searchOptions: SearchFilterOptions,
    advancedCriteria?: AdvancedFilterCriteria
  ): AICardConfig[] {
    let filtered = cards;

    // Apply search query
    if (searchOptions.query) {
      filtered = this.searchCards(filtered, searchOptions);
    }

    // Apply advanced criteria
    if (advancedCriteria) {
      filtered = this.applyAdvancedCriteria(filtered, advancedCriteria);
    }

    return filtered;
  }

  /**
   * Apply advanced filter criteria
   */
  private applyAdvancedCriteria(
    cards: AICardConfig[],
    criteria: AdvancedFilterCriteria
  ): AICardConfig[] {
    return cards.filter(card => {
      // Filter by card types
      if (criteria.cardTypes && criteria.cardTypes.length > 0) {
        if (!card.cardType || !criteria.cardTypes.includes(card.cardType)) {
          return false;
        }
      }

      // Filter by section types
      if (criteria.sectionTypes && criteria.sectionTypes.length > 0) {
        const hasMatchingSection = card.sections?.some(section =>
          criteria.sectionTypes!.includes(section.type)
        );
        if (!hasMatchingSection) {
          return false;
        }
      }

      // Filter by date range
      if (criteria.dateRange) {
        const { start, end, field = 'updated' } = criteria.dateRange;
        const cardDate = this.getCardDate(card, field);
        if (cardDate) {
          if (start && cardDate < start) {
            return false;
          }
          if (end && cardDate > end) {
            return false;
          }
        }
      }

      // Filter by tags
      if (criteria.tags && criteria.tags.length > 0) {
        const cardTags = (card as any).tags || [];
        const hasMatchingTag = criteria.tags.some(tag =>
          cardTags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Filter by has fields
      if (criteria.hasFields !== undefined) {
        const hasFields = card.sections?.some(section =>
          section.fields && section.fields.length > 0
        ) ?? false;
        if (hasFields !== criteria.hasFields) {
          return false;
        }
      }

      // Filter by has items
      if (criteria.hasItems !== undefined) {
        const hasItems = card.sections?.some(section =>
          section.items && section.items.length > 0
        ) ?? false;
        if (hasItems !== criteria.hasItems) {
          return false;
        }
      }

      // Filter by section count
      const sectionCount = card.sections?.length ?? 0;
      if (criteria.minSections !== undefined && sectionCount < criteria.minSections) {
        return false;
      }
      if (criteria.maxSections !== undefined && sectionCount > criteria.maxSections) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get card date based on field type
   */
  private getCardDate(card: AICardConfig, field: 'created' | 'updated' | 'modified'): Date | null {
    const metadata = (card as any).metadata as Record<string, unknown> | undefined;
    if (!metadata) {
      return null;
    }

    const dateValue = metadata[field] || metadata[`${field}At`] || metadata[`${field}_at`];
    if (!dateValue) {
      return null;
    }

    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof dateValue === 'number') {
      return new Date(dateValue);
    }

    return null;
  }

  /**
   * Search with highlighting
   */
  searchWithHighlighting(
    cards: AICardConfig[],
    options: SearchFilterOptions
  ): SearchResult[] {
    if (!options.query || options.query.trim() === '') {
      return cards.map(card => ({
        card,
        score: 1,
        matches: []
      }));
    }

    const query = options.caseSensitive ? options.query : options.query.toLowerCase();
    const results: SearchResult[] = [];

    for (const card of cards) {
      const matches: SearchResult['matches'] = [];
      let score = 0;

      // Search in title
      if (options.searchInTitle !== false && card.cardTitle) {
        const title = options.caseSensitive ? card.cardTitle : card.cardTitle.toLowerCase();
        if (title.includes(query)) {
          score += 10;
          matches.push({
            field: 'title',
            value: card.cardTitle,
            highlighted: this.highlightText(card.cardTitle, options.query, options.caseSensitive)
          });
        }
      }

      // Search in sections
      if (card.sections) {
        for (const section of card.sections) {
          // Section title
          if (section.title) {
            const title = options.caseSensitive ? section.title : section.title.toLowerCase();
            if (title.includes(query)) {
              score += 5;
              matches.push({
                field: `section.${section.id}.title`,
                value: section.title,
                highlighted: this.highlightText(section.title, options.query, options.caseSensitive)
              });
            }
          }

          // Fields
          if (options.searchInFields !== false && section.fields) {
            for (const field of section.fields) {
              if (this.matchesField(field, query, options)) {
                score += 3;
                const value = String(field.value || '');
                matches.push({
                  field: `section.${section.id}.field.${field.id}`,
                  value: `${field.label || ''}: ${value}`,
                  highlighted: this.highlightText(value, options.query, options.caseSensitive)
                });
              }
            }
          }

          // Items
          if (options.searchInItems !== false && section.items) {
            for (const item of section.items) {
              if (this.matchesItem(item, query, options)) {
                score += 2;
                matches.push({
                  field: `section.${section.id}.item.${item.id}`,
                  value: item.title || '',
                  highlighted: this.highlightText(item.title || '', options.query, options.caseSensitive)
                });
              }
            }
          }
        }
      }

      if (matches.length > 0) {
        results.push({
          card,
          score,
          matches
        });
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Highlight search terms in text
   */
  highlightText(text: string, query: string, caseSensitive = false): string {
    const regex = new RegExp(
      `(${this.escapeRegex(query)})`,
      caseSensitive ? 'g' : 'gi'
    );
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Save filter preset
   */
  savePreset(preset: Omit<FilterPreset, 'id' | 'createdAt'>): string {
    const newPreset: FilterPreset = {
      ...preset,
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    const presets = [...this.presetsSubject.value, newPreset];
    this.presetsSubject.next(presets);
    this.savePresetsToStorage(presets);
    this.logger.info(`Filter preset saved: ${newPreset.name}`, 'SearchFilterService');
    return newPreset.id;
  }

  /**
   * Delete filter preset
   */
  deletePreset(id: string): void {
    const presets = this.presetsSubject.value.filter(p => p.id !== id);
    this.presetsSubject.next(presets);
    this.savePresetsToStorage(presets);
    this.logger.info(`Filter preset deleted: ${id}`, 'SearchFilterService');
  }

  /**
   * Get preset by ID
   */
  getPreset(id: string): FilterPreset | undefined {
    return this.presetsSubject.value.find(p => p.id === id);
  }

  /**
   * Load presets from storage
   */
  private loadPresets(): void {
    try {
      const stored = localStorage.getItem('osi-filter-presets');
      if (stored) {
        const presets = JSON.parse(stored) as FilterPreset[];
        // Convert date strings back to Date objects
        presets.forEach(preset => {
          preset.createdAt = new Date(preset.createdAt);
        });
        this.presetsSubject.next(presets);
      }
    } catch (error) {
      this.logger.error('Failed to load filter presets', 'SearchFilterService', error);
    }
  }

  /**
   * Save presets to storage
   */
  private savePresetsToStorage(presets: FilterPreset[]): void {
    try {
      localStorage.setItem('osi-filter-presets', JSON.stringify(presets));
    } catch (error) {
      this.logger.error('Failed to save filter presets', 'SearchFilterService', error);
    }
  }
}


