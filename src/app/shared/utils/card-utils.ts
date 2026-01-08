/**
 * Card Utilities
 *
 * App-specific card utility functions.
 * For core card utilities, use CardUtil from 'osi-cards-lib'.
 *
 * These utilities now use domain entities for ID generation and validation.
 */

import { AICardConfig } from 'osi-cards-lib';
import { CardAggregate, CardIdUtils, SectionIdUtils } from '../../domain/index';

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

// Card ID utilities - now using domain entities
export function ensureCardIds(card: AICardConfig): AICardConfig {
  // Use domain entity to ensure proper ID generation
  const cardResult = CardAggregate.fromDomainModel(card);

  if (cardResult.success) {
    return cardResult.value.toDomainModel();
  }

  // Fallback to legacy behavior if domain conversion fails
  const cardWithId = {
    ...card,
    id: card.id || (CardIdUtils.generate() as string),
  };

  if (cardWithId.sections) {
    cardWithId.sections = cardWithId.sections.map((section) => ({
      ...section,
      id: section.id || (SectionIdUtils.generate() as string),
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
