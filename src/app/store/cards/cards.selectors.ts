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

// TOON Input selector - return as-is (IDs already stripped in reducer)
export const selectToonInput = createSelector(selectCardsState, (state) => state.toonInput);
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
