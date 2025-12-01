import { sanitizeCardConfig } from './card-utils';
import { AICardConfig } from '../../models';
import { CardValidationService } from '../services/card-validation.service';

/**
 * Batch conversion utility for processing multiple cards
 * Supports JSON-only operations
 */
export class BatchConversionUtil {
  /**
   * Validate multiple JSON strings
   * Returns validation results with success count and failures
   */
  static validateMultipleCards(
    jsonStrings: string[],
    validationService: CardValidationService
  ): {
    valid: AICardConfig[];
    invalid: { index: number; error: string; content: string }[];
    successRate: number;
  } {
    const valid: AICardConfig[] = [];
    const invalid: { index: number; error: string; content: string }[] = [];

    jsonStrings.forEach((jsonString, index) => {
      try {
        const card = validationService.validateCardJson(jsonString);

        if (!card) {
          invalid.push({
            index,
            error: 'JSON structure validation failed',
            content: jsonString.substring(0, 100),
          });
          return;
        }

        if (!validationService.validateCardStructure(card)) {
          invalid.push({
            index,
            error: 'Card structure validation failed',
            content: jsonString.substring(0, 100),
          });
          return;
        }

        valid.push(card as AICardConfig);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        invalid.push({
          index,
          error: msg,
          content: jsonString.substring(0, 100),
        });
      }
    });

    return {
      valid,
      invalid,
      successRate: jsonStrings.length > 0 ? (valid.length / jsonStrings.length) * 100 : 0,
    };
  }

  /**
   * Sanitize multiple cards (remove unsafe properties)
   */
  static sanitizeMultipleCards(cards: Partial<AICardConfig>[]): AICardConfig[] {
    return cards
      .map((card) => {
        try {
          return sanitizeCardConfig(card) as AICardConfig;
        } catch (error: unknown) {
          console.error('Sanitization failed for card:', error);
          return null;
        }
      })
      .filter((card): card is AICardConfig => card !== null);
  }

  /**
   * Batch convert from JSON to JSON with validation
   * Ensures all cards meet structure requirements
   */
  static convertAndValidateCards(
    jsonStrings: string[],
    validationService: CardValidationService
  ): {
    converted: AICardConfig[];
    results: {
      success: boolean;
      cardId?: string;
      error?: string;
    }[];
  } {
    const converted: AICardConfig[] = [];
    const results: {
      success: boolean;
      cardId?: string;
      error?: string;
    }[] = [];

    jsonStrings.forEach((jsonString) => {
      try {
        const card = validationService.validateCardJson(jsonString);

        if (!card) {
          results.push({
            success: false,
            error: 'JSON validation failed',
          });
          return;
        }

        if (!validationService.validateCardStructure(card)) {
          results.push({
            success: false,
            cardId: (card as any).id || 'unknown',
            error: 'Structure validation failed',
          });
          return;
        }

        const sanitized = sanitizeCardConfig(card as Partial<AICardConfig>) as AICardConfig;
        converted.push(sanitized);

        results.push({
          success: true,
          ...(sanitized.id !== undefined && { cardId: sanitized.id }),
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          error: msg,
        });
      }
    });

    return { converted, results };
  }

  /**
   * Merge multiple cards into a single collection
   * Removes duplicates based on card ID
   */
  static mergeCards(...cardCollections: AICardConfig[][]): {
    merged: AICardConfig[];
    duplicateCount: number;
    duplicates: { id: string; count: number }[];
  } {
    const idMap = new Map<string, AICardConfig>();
    const duplicates: { id: string; count: number }[] = [];
    let duplicateCount = 0;

    cardCollections.forEach((collection) => {
      collection.forEach((card) => {
        const cardId = card.id || 'unknown';

        if (idMap.has(cardId)) {
          // Track duplicates
          const existing = duplicates.find((d) => d.id === cardId);
          if (existing) {
            existing.count++;
          } else {
            duplicates.push({ id: cardId, count: 2 });
          }
          duplicateCount++;
        } else {
          idMap.set(cardId, card);
        }
      });
    });

    return {
      merged: Array.from(idMap.values()),
      duplicateCount,
      duplicates,
    };
  }

  /**
   * Filter cards by type
   */
  static filterCardsByType(cards: AICardConfig[], cardType: string): AICardConfig[] {
    return cards.filter((card) => card.cardType === cardType);
  }

  /**
   * Sort cards by priority
   */
  static sortCardsByPriority(cards: AICardConfig[]): AICardConfig[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return [...cards].sort((a, b) => {
      const priorityA = priorityOrder[(a as any).priority as keyof typeof priorityOrder] || 0;
      const priorityB = priorityOrder[(b as any).priority as keyof typeof priorityOrder] || 0;
      return priorityB - priorityA;
    });
  }

  /**
   * Export multiple cards as JSON array
   */
  static exportAsJsonArray(cards: AICardConfig[]): string {
    try {
      const sanitized = cards.map((card) => sanitizeCardConfig(card as any) as AICardConfig);
      return JSON.stringify(sanitized, null, 2);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Export failed: ${msg}`);
      throw new Error(`Failed to export cards: ${msg}`);
    }
  }

  /**
   * Import from JSON array
   */
  static importFromJsonArray(
    jsonString: string,
    validationService: CardValidationService
  ): {
    cards: AICardConfig[];
    errors: { index: number; error: string }[];
  } {
    const errors: { index: number; error: string }[] = [];
    const cards: AICardConfig[] = [];

    try {
      const parsed = JSON.parse(jsonString);

      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of cards');
      }

      parsed.forEach((item, index) => {
        try {
          if (typeof item === 'string') {
            const card = validationService.validateCardJson(item);
            if (card && validationService.validateCardStructure(card)) {
              cards.push(sanitizeCardConfig(card as any) as AICardConfig);
            } else {
              errors.push({ index, error: 'Invalid card structure' });
            }
          } else if (typeof item === 'object') {
            if (validationService.validateCardStructure(item as Partial<AICardConfig>)) {
              cards.push(sanitizeCardConfig(item as any) as AICardConfig);
            } else {
              errors.push({ index, error: 'Invalid card structure' });
            }
          } else {
            errors.push({ index, error: 'Card must be string or object' });
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ index, error: msg });
        }
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to import cards: ${msg}`);
    }

    return { cards, errors };
  }

  /**
   * Get statistics about a card collection
   */
  static getCollectionStats(cards: AICardConfig[]): {
    totalCards: number;
    byType: Record<string, number>;
    totalSections: number;
    avgSectionsPerCard: number;
    cardsWithActions: number;
  } {
    const byType: Record<string, number> = {};
    let totalSections = 0;
    let cardsWithActions = 0;

    cards.forEach((card) => {
      // Count by type
      const type = card.cardType || 'unknown';
      byType[type] = (byType[type] || 0) + 1;

      // Count sections
      totalSections += card.sections?.length || 0;

      // Count cards with actions
      if (card.actions && card.actions.length > 0) {
        cardsWithActions++;
      }
    });

    return {
      totalCards: cards.length,
      byType,
      totalSections,
      avgSectionsPerCard: cards.length > 0 ? totalSections / cards.length : 0,
      cardsWithActions,
    };
  }

  /**
   * Deduplicate cards by title (case-insensitive)
   */
  static deduplicateByTitle(cards: AICardConfig[]): {
    unique: AICardConfig[];
    duplicates: { title: string; count: number; cardIds: string[] }[];
  } {
    const titleMap = new Map<string, AICardConfig[]>();
    const duplicates: { title: string; count: number; cardIds: string[] }[] = [];

    cards.forEach((card) => {
      const titleLower = card.cardTitle.toLowerCase();
      if (!titleMap.has(titleLower)) {
        titleMap.set(titleLower, []);
      }
      titleMap.get(titleLower)!.push(card);
    });

    const unique: AICardConfig[] = [];

    titleMap.forEach((cardsWithTitle, title) => {
      if (cardsWithTitle.length > 1) {
        duplicates.push({
          title,
          count: cardsWithTitle.length,
          cardIds: cardsWithTitle.map((c) => c.id || 'unknown'),
        });
      }
      // Keep first occurrence
      const firstCard = cardsWithTitle[0];
      if (firstCard) {
        unique.push(firstCard);
      }
    });

    return { unique, duplicates };
  }

  /**
   * Validate and report comprehensive collection info
   */
  static analyzeCollection(
    jsonStrings: string[],
    validationService: CardValidationService
  ): {
    validCards: AICardConfig[];
    invalidCards: number;
    stats: {
      totalCards: number;
      byType: Record<string, number>;
      totalSections: number;
      avgSectionsPerCard: number;
      cardsWithActions: number;
    };
    duplicates: { title: string; count: number; cardIds: string[] }[];
    issues: string[];
  } {
    const { valid, invalid } = this.validateMultipleCards(jsonStrings, validationService);
    const { unique, duplicates } = this.deduplicateByTitle(valid);
    const stats = this.getCollectionStats(unique);
    const issues: string[] = [];

    // Check for issues
    if (invalid.length > 0) {
      issues.push(`${invalid.length} invalid cards found`);
    }
    if (duplicates.length > 0) {
      issues.push(`${duplicates.length} duplicate titles found`);
    }
    if (stats.cardsWithActions === 0) {
      issues.push('No cards have actions defined');
    }
    if (Object.keys(stats.byType).length === 0) {
      issues.push('No card types defined');
    }

    return {
      validCards: unique,
      invalidCards: invalid.length,
      stats,
      duplicates,
      issues,
    };
  }
}
