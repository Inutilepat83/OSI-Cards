import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CardsState } from './cards.reducer';

export const selectCardsState = createFeatureSelector<CardsState>('cards');

export const selectCards = createSelector(selectCardsState, (state) => state.cards);
export const selectCurrentCard = createSelector(selectCardsState, (state) => state.currentCard);
export const selectCardType = createSelector(selectCardsState, (state) => state.cardType);
export const selectCardVariant = createSelector(selectCardsState, (state) => state.cardVariant);
export const selectJsonInput = createSelector(selectCardsState, (state) => state.jsonInput);
export const selectIsGenerating = createSelector(selectCardsState, (state) => state.isGenerating);
export const selectIsFullscreen = createSelector(selectCardsState, (state) => state.isFullscreen);
export const selectError = createSelector(selectCardsState, (state) => state.error);
export const selectLoading = createSelector(selectCardsState, (state) => state.loading);
