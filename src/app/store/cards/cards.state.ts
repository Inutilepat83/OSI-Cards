import { createAction, props } from '@ngrx/store';
import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { AICardConfig, CardType } from '../../models/card.model';
import { ensureCardIds, removeAllIds } from '../../shared/utils/card-utils';

// ===== ENTITY ADAPTER =====

export const cardsAdapter = createEntityAdapter<AICardConfig>({
  selectId: (card) => card.id ?? ensureCardIds(card).id!,
  sortComparer: (a, b) => a.cardTitle.localeCompare(b.cardTitle)
});

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

// Card CRUD Actions
export const addCard = createAction(
  '[Cards] Add Card',
  props<{ card: AICardConfig }>()
);
export const updateCard = createAction(
  '[Cards] Update Card',
  props<{ id: string; changes: Partial<AICardConfig> }>()
);
export const upsertCard = createAction(
  '[Cards] Upsert Card',
  props<{ card: AICardConfig }>()
);
export const deleteCard = createAction('[Cards] Delete Card', props<{ id: string }>());
export const deleteCardSuccess = createAction('[Cards] Delete Card Success', props<{ id: string }>());
export const deleteCardFailure = createAction('[Cards] Delete Card Failure', props<{ error: string }>());

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

// Search Actions
export const searchCards = createAction('[Cards] Search Cards', props<{ query: string }>());
export const searchCardsSuccess = createAction('[Cards] Search Cards Success', props<{ query: string; results: AICardConfig[] }>());
export const searchCardsFailure = createAction('[Cards] Search Cards Failure', props<{ query: string; error: string }>());

// ===== STATE INTERFACE =====

export interface CardsState extends EntityState<AICardConfig> {
  currentCardId: string | null;
  cardType: CardType;
  cardVariant: number;
  jsonInput: string;
  isGenerating: boolean;
  isFullscreen: boolean;
  error: string | null;
  loading: boolean;
}

// ===== INITIAL STATE =====

export const initialState: CardsState = cardsAdapter.getInitialState({
  currentCardId: null,
  cardType: 'company',
  cardVariant: 1,
  jsonInput: '{}',
  isGenerating: false,
  isFullscreen: false,
  error: null,
  loading: false,
});

// ===== REDUCER =====

export const reducer = createReducer(
  initialState,
  on(loadCards, (state) => ({ ...state, loading: true })),
  on(loadCardsSuccess, (state, { cards }) => {
    const cardsWithIds = cards.map(card => ensureCardIds(card));
    return cardsAdapter.setAll(cardsWithIds, { ...state, loading: false });
  }),
  on(loadCardsFailure, (state, { error }) => ({ ...state, error: error as string, loading: false })),

  on(setCardType, (state, { cardType }) => ({ ...state, cardType })),
  on(setCardVariant, (state, { variant }) => ({ ...state, cardVariant: variant })),

  on(updateJsonInput, (state, { jsonInput }) => ({ ...state, jsonInput })),
  on(generateCard, (state) => ({ ...state, isGenerating: true, error: null })),
  on(generateCardSuccess, (state, { card }) => {
    const cardWithId = ensureCardIds(card);
    const existingCard = state.currentCardId ? state.entities[state.currentCardId] : null;
    
    // If card reference is the same (from incremental merge), return state unchanged
    if (existingCard === cardWithId) {
      return state;
    }
    
    // If card content is identical, return state unchanged
    // Note: We still use JSON.stringify for the reducer check but only compare IDs/titles for fast path
    if (existingCard && existingCard.id === cardWithId.id) {
      // Fast path: compare key properties first
      if (existingCard.cardTitle === cardWithId.cardTitle &&
          existingCard.cardSubtitle === cardWithId.cardSubtitle &&
          existingCard.sections?.length === cardWithId.sections?.length) {
        // Only do deep comparison if key properties match
        const existingJson = JSON.stringify(removeAllIds(existingCard));
        const newJson = JSON.stringify(removeAllIds(cardWithId));
        if (existingJson === newJson) {
          return state;
        }
      }
    }
    
    const cardWithoutIds = removeAllIds(card);
    return {
      ...cardsAdapter.upsertOne(cardWithId, state),
      currentCardId: cardWithId.id ?? null,
      jsonInput: JSON.stringify(cardWithoutIds, null, 2),
      isGenerating: false,
    };
  }),
  on(generateCardFailure, (state, { error }) => ({
    ...state,
    error,
    isGenerating: false,
  })),

  on(addCard, (state, { card }) => {
    const cardWithId = ensureCardIds(card);
    return cardsAdapter.addOne(cardWithId, state);
  }),
  on(updateCard, (state, { id, changes }) => {
    return cardsAdapter.updateOne({ id, changes }, state);
  }),
  on(upsertCard, (state, { card }) => {
    const cardWithId = ensureCardIds(card);
    return cardsAdapter.upsertOne(cardWithId, state);
  }),
  on(deleteCard, (state, { id }) => {
    return cardsAdapter.removeOne(id, state);
  }),
  on(deleteCardSuccess, (state, { id }) => {
    const newState = cardsAdapter.removeOne(id, state);
    return {
      ...newState,
      currentCardId: state.currentCardId === id ? null : state.currentCardId
    };
  }),
  on(deleteCardFailure, (state, { error }) => ({
    ...state,
    error: error as string,
  })),

  on(toggleFullscreen, (state) => ({ ...state, isFullscreen: !state.isFullscreen })),
  on(setFullscreen, (state, { fullscreen }) => ({ ...state, isFullscreen: fullscreen })),

  on(loadTemplate, (state) => ({ ...state, loading: true })),
  on(loadTemplateSuccess, (state, { template }) => {
    const templateWithId = ensureCardIds(template);
    const templateWithoutIds = removeAllIds(template);
    return {
      ...cardsAdapter.upsertOne(templateWithId, state),
      currentCardId: templateWithId.id ?? null,
      jsonInput: JSON.stringify(templateWithoutIds, null, 2),
      loading: false,
    };
  }),
  on(loadTemplateFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),

  on(clearError, (state) => ({ ...state, error: null })),
  on(resetCardState, () => initialState),

  on(searchCardsSuccess, (state, { results }) => {
    const resultsWithIds = results.map(card => ensureCardIds(card));
    return cardsAdapter.setAll(resultsWithIds, state);
  }),
  on(searchCardsFailure, (state, { error }) => ({
    ...state,
    error: error as string,
  }))
);
