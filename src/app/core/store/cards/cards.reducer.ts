import { createReducer, on } from '@ngrx/store';
import { CardsState, cardsAdapter } from '../enhanced-app.state';
import * as CardsActions from './cards.actions';

export const initialCardsState: CardsState = cardsAdapter.getInitialState({
  selectedCardId: null,
  loading: false,
  error: null,
  totalCount: 0,
  lastUpdated: null,
  filters: {},
  sortBy: { field: 'created', direction: 'desc' },
  searchQuery: '',
});

export const cardsReducer = createReducer(
  initialCardsState,

  on(CardsActions.loadCards, state => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CardsActions.loadCardsSuccess, (state, { cards }) => {
    const newState = cardsAdapter.setAll(cards, state);
    return {
      ...newState,
      loading: false,
      totalCount: cards.length,
      lastUpdated: new Date(),
    };
  }),

  on(CardsActions.loadCardsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(CardsActions.selectCard, (state, { card }) => ({
    ...state,
    selectedCardId: card.id || null,
  })),

  on(CardsActions.createCard, (state, { card }) => {
    const newState = cardsAdapter.addOne(card, state);
    return {
      ...newState,
      totalCount: state.totalCount + 1,
      lastUpdated: new Date(),
    };
  }),

  on(CardsActions.createCardSuccess, (state, { card }) => {
    const newState = cardsAdapter.addOne(card, state);
    return {
      ...newState,
      totalCount: state.totalCount + 1,
      lastUpdated: new Date(),
    };
  }),

  on(CardsActions.updateCard, (state, { card }) => {
    const newState = cardsAdapter.updateOne({ id: card.id || '', changes: card }, state);
    return {
      ...newState,
      lastUpdated: new Date(),
    };
  }),

  on(CardsActions.updateCardSuccess, (state, { card }) => {
    const newState = cardsAdapter.updateOne({ id: card.id || '', changes: card }, state);
    return {
      ...newState,
      lastUpdated: new Date(),
    };
  }),

  on(CardsActions.deleteCard, (state, { cardId }) => {
    const newState = cardsAdapter.removeOne(cardId, state);
    return {
      ...newState,
      totalCount: Math.max(0, state.totalCount - 1),
      selectedCardId: state.selectedCardId === cardId ? null : state.selectedCardId,
      lastUpdated: new Date(),
    };
  }),

  on(CardsActions.deleteCardSuccess, (state, { cardId }) => {
    const newState = cardsAdapter.removeOne(cardId, state);
    return {
      ...newState,
      totalCount: Math.max(0, state.totalCount - 1),
      selectedCardId: state.selectedCardId === cardId ? null : state.selectedCardId,
      lastUpdated: new Date(),
    };
  })
);
