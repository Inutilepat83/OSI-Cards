import { Card } from './card-selector.component';

/**
 * Utility functions for card selector component
 * Extracted to improve testability and maintainability
 */

/**
 * Checks if a card has valid required properties
 */
export function isValidCard(card: any): card is Card {
  return card && typeof card.id === 'string' && typeof card.title === 'string';
}

/**
 * Filters cards by selected IDs
 */
export function getSelectedCards(cards: Card[], selectedIds: string[]): Card[] {
  return cards.filter(card => selectedIds.includes(card.id));
}

/**
 * Calculates the display text for selected count
 */
export function getSelectedCountText(count: number): string {
  return `${count} card${count !== 1 ? 's' : ''} selected`;
}

/**
 * Determines if the clear selection button should be shown
 */
export function shouldShowClearButton(
  selectedCount: number,
  showClearSelectionButton: boolean
): boolean {
  return selectedCount > 0 && showClearSelectionButton;
}

/**
 * Gets the appropriate tabindex for keyboard navigation
 */
export function getTabIndex(index: number): number {
  return index === 0 ? 0 : -1;
}

/**
 * Gets the appropriate ARIA label for the selector
 */
export function getAriaLabel(title: string | undefined): string {
  return title || 'Card selection';
}

/**
 * Gets the appropriate ARIA labelledby attribute
 */
export function getAriaLabelledBy(title: string | undefined): string | null {
  return title ? 'card-selector-title' : null;
}

/**
 * Validates card data and returns warnings
 */
export function validateCardData(cards: Card[]): string[] {
  const warnings: string[] = [];

  if (cards.some(card => !card.id || !card.title)) {
    warnings.push('Card selector received cards with missing required properties (id or title)');
  }

  return warnings;
}

/**
 * Handles keyboard navigation logic
 */
export function getNextFocusableIndex(
  currentIndex: number,
  direction: 'up' | 'down' | 'home' | 'end',
  totalItems: number
): number {
  switch (direction) {
    case 'up':
      return currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
    case 'down':
      return currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
    case 'home':
      return 0;
    case 'end':
      return totalItems - 1;
    default:
      return currentIndex;
  }
}
