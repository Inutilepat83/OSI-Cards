import { createSelector, createFeatureSelector } from '@ngrx/store';
import { CardsState } from './cards.reducer';
import { AppState } from '../app.state';

export const selectCardsState = createFeatureSelector<AppState, CardsState>('cards');

export const selectAllCards = createSelector(selectCardsState, (state: CardsState) => state.cards);

export const selectSelectedCard = createSelector(
  selectCardsState,
  (state: CardsState) => state.selectedCard
);

export const selectCardsLoading = createSelector(
  selectCardsState,
  (state: CardsState) => state.loading
);

export const selectCardsError = createSelector(
  selectCardsState,
  (state: CardsState) => state.error
);

export const selectCardById = (cardId: string) =>
  createSelector(selectAllCards, cards => cards.find(card => card.id === cardId));

export const selectCardsByType = (cardType: string) =>
  createSelector(selectAllCards, cards => cards.filter(card => card.cardType === cardType));
