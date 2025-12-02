/**
 * Card Diff Service - Application Wrapper
 *
 * This service wraps the CardDiffUtil from the library for convenience.
 * The library utility provides the core diffing functionality; this service
 * makes it injectable for dependency injection.
 *
 * Note: For most use cases, you can directly use CardDiffUtil from the library.
 * This service is provided for backward compatibility and DI convenience.
 *
 * @example
 * ```typescript
 * // Preferred: Direct utility usage
 * import { CardDiffUtil } from '@osi-cards/utils';
 * const result = CardDiffUtil.mergeCardUpdates(oldCard, newCard);
 *
 * // Alternative: Injectable service
 * const diffService = inject(CardDiffService);
 * const result = diffService.mergeCardUpdates(oldCard, newCard);
 * ```
 */

import { Injectable } from '@angular/core';

// Re-export types from library
export { CardChangeType, CardDiffResult } from '@osi-cards/utils';

import { CardChangeType, CardDiffResult, CardDiffUtil } from '@osi-cards/utils';
import { AICardConfig } from '../../models';

/**
 * Injectable service for card diffing and merging
 * Wraps CardDiffUtil for better dependency injection and testability
 */
@Injectable({
  providedIn: 'root',
})
export class CardDiffService {
  /**
   * Merge card updates, preserving references to unchanged sections/fields/items
   *
   * @param oldCard - The previous card state
   * @param newCard - The new card state
   * @returns CardDiffResult with merged card and change type
   */
  mergeCardUpdates(oldCard: AICardConfig, newCard: AICardConfig): CardDiffResult {
    return CardDiffUtil.mergeCardUpdates(oldCard, newCard);
  }

  /**
   * Get the change type for a card update
   *
   * @param oldCard - The previous card state
   * @param newCard - The new card state
   * @returns The type of change: 'content', 'structural', 'style', or 'none'
   */
  getChangeType(oldCard: AICardConfig, newCard: AICardConfig): CardChangeType {
    const result = this.mergeCardUpdates(oldCard, newCard);
    return result.changeType;
  }

  /**
   * Check if two cards are identical (no changes)
   *
   * @param oldCard - The previous card state
   * @param newCard - The new card state
   * @returns True if the cards are identical
   */
  areCardsEqual(oldCard: AICardConfig, newCard: AICardConfig): boolean {
    const result = this.mergeCardUpdates(oldCard, newCard);
    // If the merge returns the same reference, cards are identical
    return result.card === oldCard;
  }
}
