import { Injectable } from '@angular/core';
import { AICardConfig, CardSection, CardField, CardItem } from '../../models';

export interface SearchFilterOptions {
  query: string;
  searchInTitle?: boolean;
  searchInFields?: boolean;
  searchInItems?: boolean;
  searchInDescription?: boolean;
  caseSensitive?: boolean;
}

/**
 * Search and filter service
 * Implements search and filter functionality for cards and sections
 */
@Injectable({
  providedIn: 'root'
})
export class SearchFilterService {
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
}


