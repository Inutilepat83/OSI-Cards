import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card } from './card-selector.component';

/**
 * Service for managing card selection state
 * Provides centralized state management for card selectors
 */
@Injectable({
  providedIn: 'root'
})
export class CardSelectionService {
  private selectedCardsSubject = new BehaviorSubject<Card[]>([]);
  public selectedCards$ = this.selectedCardsSubject.asObservable();

  /**
   * Updates the selected cards
   */
  updateSelectedCards(cards: Card[]): void {
    this.selectedCardsSubject.next(cards);
  }

  /**
   * Gets the current selected cards
   */
  getSelectedCards(): Card[] {
    return this.selectedCardsSubject.value;
  }

  /**
   * Clears all selected cards
   */
  clearSelection(): void {
    this.selectedCardsSubject.next([]);
  }

  /**
   * Toggles selection of a specific card
   */
  toggleCardSelection(card: Card, currentSelection: Card[], allowMultiple: boolean): Card[] {
    const isSelected = currentSelection.some(selected => selected.id === card.id);

    if (isSelected) {
      return currentSelection.filter(selected => selected.id !== card.id);
    } else {
      if (allowMultiple) {
        return [...currentSelection, card];
      } else {
        return [card];
      }
    }
  }

  /**
   * Validates card data
   */
  validateCards(cards: Card[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(cards)) {
      errors.push('Cards must be an array');
      return { isValid: false, errors };
    }

    cards.forEach((card, index) => {
      if (!card) {
        errors.push(`Card at index ${index} is null or undefined`);
      } else if (!card.id) {
        errors.push(`Card at index ${index} is missing required 'id' property`);
      } else if (!card.title) {
        errors.push(`Card at index ${index} is missing required 'title' property`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
