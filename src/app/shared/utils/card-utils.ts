/**
 * Card Utilities
 *
 * App-specific card utility functions.
 * For core card utilities, use CardUtil from 'osi-cards-lib'.
 */

import { AICardConfig } from 'osi-cards-lib';

// Placeholder for sanitizer - implement as needed
export class Sanitizer {
  static sanitize(value: any): any {
    // Basic sanitization - extend as needed
    if (typeof value === 'string') {
      return value.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    return value;
  }
}

// Card ID utilities
export function ensureCardIds(card: AICardConfig): AICardConfig {
  const cardWithId = {
    ...card,
    id: card.id || `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  if (cardWithId.sections) {
    cardWithId.sections = cardWithId.sections.map((section, index) => ({
      ...section,
      id: section.id || `section-${index}-${Date.now()}`,
    }));
  }

  return cardWithId;
}

export function removeAllIds(card: AICardConfig): AICardConfig {
  const { id, ...cardWithoutId } = card;

  if (cardWithoutId.sections) {
    cardWithoutId.sections = cardWithoutId.sections.map((section) => {
      const { id, ...sectionWithoutId } = section;
      return sectionWithoutId;
    });
  }

  return cardWithoutId as AICardConfig;
}

// Card sanitization
export function sanitizeCardConfig(card: AICardConfig | Partial<AICardConfig>): AICardConfig {
  // Basic sanitization - extend as needed
  const sanitized = {
    cardTitle: card.cardTitle || 'Untitled Card',
    sections: card.sections || [],
    ...card,
  } as AICardConfig;
  return sanitized;
}

// Re-export for backward compatibility
export { CardUtil } from 'osi-cards-lib';
