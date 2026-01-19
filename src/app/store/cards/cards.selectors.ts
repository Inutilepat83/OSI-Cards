import { createFeatureSelector, createSelector } from '@ngrx/store';
import { cardsAdapter, CardsState } from './cards.state';

/**
 * Feature Selector
 * Memoized selector for the cards feature state
 */
export const selectCardsState = createFeatureSelector<CardsState>('cards');

// ============================================================================
// ENTITY ADAPTER SELECTORS
// ============================================================================

/**
 * Entity adapter selectors with memoization
 * These are automatically memoized by the adapter
 */
const { selectIds, selectEntities, selectAll, selectTotal } =
  cardsAdapter.getSelectors(selectCardsState);

export const selectCardIds = selectIds;
export const selectCardEntities = selectEntities;
export const selectCards = selectAll;
export const selectCardTotal = selectTotal;

// ============================================================================
// BASIC STATE SELECTORS
// ============================================================================

/**
 * Select current card using memoized composition
 * Combines state and entities selectors for optimal performance
 */
export const selectCurrentCard = createSelector(
  selectCardsState,
  selectCardEntities,
  (state, entities) => {
    if (!state.currentCardId) {
      return null;
    }
    return entities[state.currentCardId] || null;
  }
);

/**
 * Selector factory for card by ID
 * Uses memoization to avoid recalculating for same ID
 */
export const selectCardById = (id: string) =>
  createSelector(selectCardEntities, (entities) => entities[id] || null);

/**
 * Card type selector
 */
export const selectCardType = createSelector(selectCardsState, (state) => state.cardType);

/**
 * Card variant selector
 */
export const selectCardVariant = createSelector(selectCardsState, (state) => state.cardVariant);

/**
 * JSON input selector
 */
export const selectJsonInput = createSelector(selectCardsState, (state) => state.jsonInput);

/**
 * Is generating selector
 */
export const selectIsGenerating = createSelector(selectCardsState, (state) => state.isGenerating);

/**
 * Is fullscreen selector
 */
export const selectIsFullscreen = createSelector(selectCardsState, (state) => state.isFullscreen);

/**
 * Error selector
 */
export const selectError = createSelector(selectCardsState, (state) => state.error);

/**
 * Loading selector
 */
export const selectLoading = createSelector(selectCardsState, (state) => state.loading);

/**
 * Last change type selector
 */
export const selectLastChangeType = createSelector(
  selectCardsState,
  (state) => state.lastChangeType
);

// ============================================================================
// DERIVED SELECTORS (Composed from basic selectors)
// ============================================================================

/**
 * Has error selector - composed from error selector
 */
export const selectHasError = createSelector(selectError, (error) => Boolean(error));

/**
 * Card count selector - alias for selectCardTotal
 */
export const selectCardCount = selectCardTotal;

/**
 * Is busy selector - composed from loading and generating selectors
 * Memoized to only recalculate when loading or generating changes
 */
export const selectIsBusy = createSelector(
  selectLoading,
  selectIsGenerating,
  (loading, generating) => loading || generating
);

/**
 * Has cards selector - composed from card total
 */
export const selectHasCards = createSelector(selectCardTotal, (count) => count > 0);

// ============================================================================
// SELECTOR FACTORIES (Parameterized selectors with memoization)
// ============================================================================

/**
 * Selector factory for cards by type
 * Memoized per cardType parameter
 */
export const selectCardsByType = (cardType: string) =>
  createSelector(selectCards, (cards) => cards.filter((card) => card.cardType === cardType));

/**
 * Selector factory for filtered cards
 * Memoized per searchTerm parameter
 */
export const selectFilteredCards = (searchTerm: string) =>
  createSelector(selectCards, (cards) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return cards;
    }
    const term = searchTerm.toLowerCase().trim();
    return cards.filter(
      (card) =>
        card.cardTitle?.toLowerCase().includes(term) ||
        card.sections?.some(
          (section) =>
            section.title?.toLowerCase().includes(term) ||
            section.description?.toLowerCase().includes(term)
        )
    );
  });

/**
 * Selector factory for sorted cards
 * Memoized per sortBy and order parameters
 */
export const selectSortedCards = (
  sortBy: 'title' | 'type' | 'date' = 'title',
  order: 'asc' | 'desc' = 'asc'
) =>
  createSelector(selectCards, (cards) => {
    const sorted = [...cards].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = (a.cardTitle || '').localeCompare(b.cardTitle || '');
          break;
        case 'type':
          comparison = (a.cardType || '').localeCompare(b.cardType || '');
          break;
        case 'date':
          // Assuming cards have a date field or use creation order
          comparison = 0; // Implement date comparison if needed
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });
    return sorted;
  });

// ============================================================================
// AGGREGATE SELECTORS (Composed from multiple selectors)
// ============================================================================

/**
 * Cards by type count selector
 * Memoized to avoid recalculating counts on every access
 */
export const selectCardsByTypeCount = createSelector(selectCards, (cards) => {
  const counts: Record<string, number> = {};
  cards.forEach((card) => {
    const type = card.cardType || 'unknown';
    counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
});

/**
 * Cards sorted by display order selector
 * Memoized to avoid re-sorting on every access
 */
export const selectCardsByDisplayOrder = createSelector(selectCards, (cards) => {
  return [...cards].sort((a, b) => {
    const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // Fallback to title sorting if displayOrder is not set
    return (a.cardTitle || '').localeCompare(b.cardTitle || '');
  });
});

// ============================================================================
// COMPOSED SELECTORS (Combining multiple selectors)
// ============================================================================

/**
 * Filtered and sorted cards selector
 * Composed from filteredCards and sortedCards for optimal performance
 */
export const selectFilteredAndSortedCards = (
  searchTerm: string,
  sortBy: 'title' | 'type' | 'date' = 'title',
  order: 'asc' | 'desc' = 'asc'
) =>
  createSelector(selectFilteredCards(searchTerm), (filteredCards) => {
    const sorted = [...filteredCards].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = (a.cardTitle || '').localeCompare(b.cardTitle || '');
          break;
        case 'type':
          comparison = (a.cardType || '').localeCompare(b.cardType || '');
          break;
        case 'date':
          comparison = 0; // Implement date comparison if needed
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });
    return sorted;
  });
