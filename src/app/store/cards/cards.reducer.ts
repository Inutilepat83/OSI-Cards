import { createReducer, on } from '@ngrx/store';
import * as CardsActions from './cards.actions';
import { AICardConfig } from '../../models/card.model';

export interface CardsState {
  cards: AICardConfig[];
  currentCard: AICardConfig | null;
  cardType: string;
  cardVariant: number;
  jsonInput: string;
  isGenerating: boolean;
  isFullscreen: boolean;
  error: string | null;
  loading: boolean;
}

export const initialState: CardsState = {
  cards: [],
  currentCard: null,
  cardType: 'company',
  cardVariant: 1,
  jsonInput: '{}',
  isGenerating: false,
  isFullscreen: false,
  error: null,
  loading: false,
};

export const reducer = createReducer(
  initialState,
  on(CardsActions.loadCards, (state) => ({ ...state, loading: true })),
  on(CardsActions.loadCardsSuccess, (state, { cards }) => ({ ...state, cards, loading: false })),
  on(CardsActions.loadCardsFailure, (state, { error }) => ({ ...state, error: error as string, loading: false })),

  on(CardsActions.setCardType, (state, { cardType }) => ({ ...state, cardType })),
  on(CardsActions.setCardVariant, (state, { variant }) => ({ ...state, cardVariant: variant })),

  on(CardsActions.updateJsonInput, (state, { jsonInput }) => ({ ...state, jsonInput })),
  on(CardsActions.generateCard, (state) => ({ ...state, isGenerating: true, error: null })),
  on(CardsActions.generateCardSuccess, (state, { card }) => ({
    ...state,
    currentCard: card,
    isGenerating: false,
  })),
  on(CardsActions.generateCardFailure, (state, { error }) => ({
    ...state,
    error,
    isGenerating: false,
  })),

  on(CardsActions.toggleFullscreen, (state) => ({ ...state, isFullscreen: !state.isFullscreen })),
  on(CardsActions.setFullscreen, (state, { fullscreen }) => ({ ...state, isFullscreen: fullscreen })),

  on(CardsActions.loadTemplate, (state) => ({ ...state, loading: true })),
  on(CardsActions.loadTemplateSuccess, (state, { template }) => ({
    ...state,
    currentCard: template,
    jsonInput: JSON.stringify(template, null, 2),
    loading: false,
  })),
  on(CardsActions.loadTemplateFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  }))
);
