import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AICardConfig, CardType } from '../../models';
import { AppState } from '../../store/app.state';
import * as CardActions from '../../store/cards/cards.state';
import { ensureCardIds } from '../../shared/utils/card-utils';
import { CardDiffUtil, CardChangeType } from '../../shared/utils/card-diff.util';
import { JsonProcessingService } from './json-processing.service';

/**
 * Service for card generation logic
 * Extracted from HomePageComponent for better separation of concerns
 */
@Injectable({
  providedIn: 'root'
})
export class CardGenerationService {
  private readonly store = inject(Store<AppState>);
  private readonly jsonProcessing = inject(JsonProcessingService);

  /**
   * Generate a card from JSON input
   * @param jsonInput - The JSON string to parse and generate card from
   * @param _existingCard - Optional existing card to merge with (reserved for future use)
   * @returns The generated card configuration or null if invalid
   */
  generateCardFromJson(
    jsonInput: string,
    _existingCard?: AICardConfig | null
  ): AICardConfig | null {
    if (!jsonInput || jsonInput.trim() === '') {
      return null;
    }

    try {
      const data = JSON.parse(jsonInput);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return null;
      }

      const cardData = data as Partial<AICardConfig> & Record<string, unknown>;

      // Validate required fields
      if (!cardData.cardTitle && !cardData.sections) {
        return null;
      }

      // Create complete card config
      const card: AICardConfig = {
        ...cardData,
        cardTitle: typeof cardData.cardTitle === 'string' ? cardData.cardTitle : '',
        sections: Array.isArray(cardData.sections) ? cardData.sections : []
      };

      // Ensure IDs exist
      const sanitized = ensureCardIds(card);

      // Validate using JsonProcessingService
      const validation = this.jsonProcessing.parseAndValidate(JSON.stringify(sanitized));
      if (!validation.success || !validation.card) {
        return null;
      }

      return validation.card;
    } catch {
      return null;
    }
  }

  /**
   * Merge a new card with an existing card
   * @param newCard - The new card to merge
   * @param existingCard - The existing card to merge with
   * @returns The merged card and change type
   */
  mergeCard(
    newCard: AICardConfig,
    existingCard: AICardConfig | null
  ): { card: AICardConfig; changeType: CardChangeType } {
    if (!existingCard) {
      return { card: newCard, changeType: 'structural' };
    }

    // Use CardDiffUtil.mergeCardUpdates which handles change detection and merging
    return CardDiffUtil.mergeCardUpdates(existingCard, newCard);
  }

  /**
   * Dispatch card to store
   * @param card - The card to dispatch
   * @param changeType - The type of change
   */
  dispatchCard(card: AICardConfig, changeType: CardChangeType): void {
    this.store.dispatch(CardActions.generateCardSuccess({ card, changeType }));
  }

  /**
   * Load a card template
   * @param cardType - The type of card to load
   * @param variant - The variant number (1-3)
   */
  loadTemplate(cardType: CardType, variant: number): void {
    this.store.dispatch(CardActions.setCardType({ cardType }));
    this.store.dispatch(CardActions.loadTemplate({ cardType, variant }));
  }

  /**
   * Load the first card example
   */
  loadFirstCardExample(): void {
    this.store.dispatch(CardActions.loadFirstCardExample());
  }

  /**
   * Clear any errors
   */
  clearError(): void {
    this.store.dispatch(CardActions.clearError());
  }
}

