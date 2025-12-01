import { Injectable } from '@angular/core';
import { AICardConfig } from '../../models';
import { CardChangeType, CardDiffResult, CardDiffUtil } from '../utils/card-diff.util';

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
   */
  mergeCardUpdates(oldCard: AICardConfig, newCard: AICardConfig): CardDiffResult {
    return CardDiffUtil.mergeCardUpdates(oldCard, newCard);
  }

  /**
   * Get the change type for a card update
   */
  getChangeType(oldCard: AICardConfig, newCard: AICardConfig): CardChangeType {
    const result = this.mergeCardUpdates(oldCard, newCard);
    return result.changeType;
  }
}
