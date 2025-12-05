import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ValidateCardType } from '@osi-cards/decorators';
import { CardChangeType, CardUtil } from 'osi-cards-lib';
import { AICardConfig, CardType } from '../../models';
import { ensureCardIds } from '../../shared/utils/card-utils';
import { AppState } from '../../store/app.state';
import * as CardActions from '../../store/cards/cards.state';
import { JsonProcessingService } from './json-processing.service';

/**
 * Card Generation Service
 *
 * Handles card generation from JSON input, validation, and merging with existing cards.
 * Provides a clean separation of concerns for card generation logic, making it easier
 * to test and maintain.
 *
 * Features:
 * - JSON parsing and validation
 * - Card ID generation
 * - Card merging with change detection
 * - NgRx store integration
 * - Template loading support
 *
 * @example
 * ```typescript
 * const cardGen = inject(CardGenerationService);
 *
 * // Generate card from JSON
 * const card = cardGen.generateCardFromJson(jsonString);
 * if (card) {
 *   cardGen.dispatchCard(card, 'content');
 * }
 *
 * // Merge with existing card
 * const merged = cardGen.mergeCard(newCard, existingCard);
 * ```
 */
@Injectable({
  providedIn: 'root',
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
        sections: Array.isArray(cardData.sections) ? cardData.sections : [],
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

    // Stub implementation - use proper diffing
    return { card: newCard, changeType: 'updated' as CardChangeType };
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
   * @param cardType - The type of card to load (validated)
   * @param variant - The variant number (1-3)
   */
  loadTemplate(cardType: CardType, variant: number): void {
    // Validate card type using decorator pattern
    try {
      const validationResult = ValidateCardType();
      const validator = (validationResult as any).prototype?.constructor || validationResult;
      // Runtime validation
      const validTypes: CardType[] = [
        'company',
        'contact',
        'opportunity',
        'product',
        'analytics',
        'event',
        'sko',
      ];
      if (!validTypes.includes(cardType)) {
        throw new Error(`Invalid card type: ${cardType}`);
      }

      // Validate variant
      if (variant < 1 || variant > 3) {
        throw new Error(`Invalid variant: ${variant}. Must be between 1 and 3`);
      }

      this.store.dispatch(CardActions.setCardType({ cardType }));
      this.store.dispatch(CardActions.loadTemplate({ cardType, variant }));
    } catch (error) {
      console.error('Template loading validation failed:', error);
      // Fallback to company type
      this.store.dispatch(CardActions.setCardType({ cardType: 'company' }));
      this.store.dispatch(CardActions.loadTemplate({ cardType: 'company', variant: 1 }));
    }
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
