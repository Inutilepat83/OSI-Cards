import { createAction, props } from '@ngrx/store';
import { createReducer, on } from '@ngrx/store';
import { AICardConfig, CardType } from '../../models/card.model';

// ===== ACTIONS =====

// Card Loading Actions
export const loadCards = createAction('[Cards] Load Cards');
export const loadCardsSuccess = createAction(
  '[Cards] Load Cards Success',
  props<{ cards: AICardConfig[] }>()
);
export const loadCardsFailure = createAction(
  '[Cards] Load Cards Failure',
  props<{ error: string }>()
);

// Card Type and Variant Actions
export const setCardType = createAction(
  '[Cards] Set Card Type',
  props<{ cardType: CardType }>()
);
export const setCardVariant = createAction(
  '[Cards] Set Card Variant',
  props<{ variant: number }>()
);

// JSON Input and Card Generation Actions
export const updateJsonInput = createAction(
  '[Cards] Update JSON Input',
  props<{ jsonInput: string }>()
);
export const generateCard = createAction(
  '[Cards] Generate Card',
  props<{ config: AICardConfig }>()
);
export const generateCardSuccess = createAction(
  '[Cards] Generate Card Success',
  props<{ card: AICardConfig }>()
);
export const generateCardFailure = createAction(
  '[Cards] Generate Card Failure',
  props<{ error: string }>()
);

// UI State Actions
export const toggleFullscreen = createAction('[Cards] Toggle Fullscreen');
export const setFullscreen = createAction(
  '[Cards] Set Fullscreen',
  props<{ fullscreen: boolean }>()
);

// Template Loading Actions
export const loadTemplate = createAction(
  '[Cards] Load Template',
  props<{ cardType: CardType; variant: number }>()
);
export const loadTemplateSuccess = createAction(
  '[Cards] Load Template Success',
  props<{ template: AICardConfig }>()
);
export const loadTemplateFailure = createAction(
  '[Cards] Load Template Failure',
  props<{ error: string }>()
);

// Clear State Actions
export const clearError = createAction('[Cards] Clear Error');
export const resetCardState = createAction('[Cards] Reset Card State');

// Performance Tracking Actions
export const trackPerformance = createAction(
  '[Cards] Track Performance',
  props<{ action: string; duration: number }>()
);

// Backwards-compatibility re-exports for older test-suite / legacy action names
export const createCard = generateCard;
export const createCardSuccess = generateCardSuccess;
export const createCardFailure = generateCardFailure;

// Update / upsert actions -> map to generateCard for compatibility
export const updateCard = generateCard;
export const updateCardSuccess = generateCardSuccess;
export const updateCardFailure = generateCardFailure;

export const deleteCard = createAction('[Cards] Delete Card', props<{ id: string }>());
export const deleteCardSuccess = createAction('[Cards] Delete Card Success', props<{ id: string }>());
export const deleteCardFailure = createAction('[Cards] Delete Card Failure', props<{ error: string }>());

export const searchCards = createAction('[Cards] Search Cards', props<{ query: string }>());
export const searchCardsSuccess = createAction('[Cards] Search Cards Success', props<{ query: string; results: AICardConfig[] }>());
export const searchCardsFailure = createAction('[Cards] Search Cards Failure', props<{ query: string; error: string }>());

// ===== STATE INTERFACE =====

export interface CardsState {
  cards: AICardConfig[];
  currentCard: AICardConfig | null;
  cardType: CardType;
  cardVariant: number;
  jsonInput: string;
  isGenerating: boolean;
  isFullscreen: boolean;
  error: string | null;
  loading: boolean;
}

// ===== INITIAL STATE =====

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

// ===== REDUCER =====

export const reducer = createReducer(
  initialState,
  on(loadCards, (state) => ({ ...state, loading: true })),
  on(loadCardsSuccess, (state, { cards }) => ({ ...state, cards, loading: false })),
  on(loadCardsFailure, (state, { error }) => ({ ...state, error: error as string, loading: false })),

  on(setCardType, (state, { cardType }) => ({ ...state, cardType })),
  on(setCardVariant, (state, { variant }) => ({ ...state, cardVariant: variant })),

  on(updateJsonInput, (state, { jsonInput }) => ({ ...state, jsonInput })),
  on(generateCard, (state) => ({ ...state, isGenerating: true, error: null })),
  on(generateCardSuccess, (state, { card }) => ({
    ...state,
    currentCard: card,
    isGenerating: false,
  })),
  on(generateCardFailure, (state, { error }) => ({
    ...state,
    error,
    isGenerating: false,
  })),

  on(toggleFullscreen, (state) => ({ ...state, isFullscreen: !state.isFullscreen })),
  on(setFullscreen, (state, { fullscreen }) => ({ ...state, isFullscreen: fullscreen })),

  on(loadTemplate, (state) => ({ ...state, loading: true })),
  on(loadTemplateSuccess, (state, { template }) => ({
    ...state,
    currentCard: template,
    jsonInput: JSON.stringify(template, null, 2),
    loading: false,
  })),
  on(loadTemplateFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  }))
);
