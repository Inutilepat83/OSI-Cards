import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CardsState, cardsAdapter } from './cards.state';

export const selectCardsState = createFeatureSelector<CardsState>('cards');

// Entity Adapter Selectors
const { selectIds, selectEntities, selectAll, selectTotal } = cardsAdapter.getSelectors(selectCardsState);

export const selectCardIds = selectIds;
export const selectCardEntities = selectEntities;
export const selectCards = selectAll;
export const selectCardTotal = selectTotal;

// Current Card Selector (using currentCardId)
export const selectCurrentCard = createSelector(
  selectCardsState,
  selectCardEntities,
  (state, entities) => {
    if (!state.currentCardId) return null;
    return entities[state.currentCardId] || null;
  }
);

// Card by ID Selector
export const selectCardById = (id: string) => createSelector(
  selectCardEntities,
  (entities) => entities[id] || null
);

// Other State Selectors
export const selectCardType = createSelector(selectCardsState, (state) => state.cardType);
export const selectCardVariant = createSelector(selectCardsState, (state) => state.cardVariant);

// JSON Input selector - return as-is (IDs already stripped in reducer)
export const selectJsonInput = createSelector(selectCardsState, (state) => state.jsonInput);
export const selectIsGenerating = createSelector(selectCardsState, (state) => state.isGenerating);
export const selectIsFullscreen = createSelector(selectCardsState, (state) => state.isFullscreen);
export const selectError = createSelector(selectCardsState, (state) => state.error);
export const selectLoading = createSelector(selectCardsState, (state) => state.loading);
export const selectLastChangeType = createSelector(selectCardsState, (state) => state.lastChangeType);
export const selectHasError = createSelector(selectError, (error) => Boolean(error));
export const selectCardCount = selectCardTotal;
export const selectIsBusy = createSelector(
  selectLoading,
  selectIsGenerating,
  (loading, generating) => loading || generating
);

// Derived Selectors
export const selectCardsByType = (cardType: string) => createSelector(
  selectCards,
  (cards) => cards.filter((card) => card.cardType === cardType)
);

export const selectHasCards = createSelector(
  selectCardTotal,
  (count) => count > 0
);

// Filtered and sorted selectors
export const selectFilteredCards = (searchTerm: string) => createSelector(
  selectCards,
  (cards) => {
    if (!searchTerm) return cards;
    const term = searchTerm.toLowerCase();
    return cards.filter(card => 
      card.cardTitle?.toLowerCase().includes(term) ||
      card.cardSubtitle?.toLowerCase().includes(term) ||
      card.sections?.some(section => 
        section.title?.toLowerCase().includes(term) ||
        section.description?.toLowerCase().includes(term)
      )
    );
  }
);

export const selectSortedCards = (sortBy: 'title' | 'type' | 'date' = 'title', order: 'asc' | 'desc' = 'asc') => createSelector(
  selectCards,
  (cards) => {
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
  }
);

export const selectCardsByTypeCount = createSelector(
  selectCards,
  (cards) => {
    const counts: Record<string, number> = {};
    cards.forEach(card => {
      const type = card.cardType || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }
);
