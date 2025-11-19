import { createAction, props } from '@ngrx/store';
import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { encode } from '@toon-format/toon';
import { AICardConfig, CardType } from '../../models/card.model';
import { ensureCardIds, removeAllIds } from '../../shared/utils/card-utils';
import { CardChangeType } from '../../shared/utils/card-diff.util';

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
export const loadCardIncremental = createAction(
  '[Cards] Load Card Incremental',
  props<{ card: AICardConfig }>()
);
export const loadCardsComplete = createAction('[Cards] Load Cards Complete');
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

// TOON Input and Card Generation Actions
export const updateToonInput = createAction(
  '[Cards] Update TOON Input',
  props<{ toonInput: string }>()
);
export const generateCard = createAction(
  '[Cards] Generate Card',
  props<{ config: AICardConfig }>()
);
export const generateCardSuccess = createAction(
  '[Cards] Generate Card Success',
  props<{ card: AICardConfig; changeType?: CardChangeType }>()
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

export const loadFirstCardExample = createAction('[Cards] Load First Card Example');

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
  toonInput: string;
  isGenerating: boolean;
  isFullscreen: boolean;
  error: string | null;
  loading: boolean;
  lastChangeType: CardChangeType;
}

// ===== INITIAL STATE =====

export const initialState: CardsState = cardsAdapter.getInitialState({
  currentCardId: null,
  cardType: 'company',
  cardVariant: 1,
  toonInput: '',
  isGenerating: false,
  isFullscreen: false,
  error: null,
  loading: false,
  lastChangeType: 'structural'
});

const removeNullValues = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map(removeNullValues)
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = removeNullValues(val);
      if (cleaned === undefined) {
        continue;
      }
      result[key] = cleaned;
    }
    return result;
  }

  if (value === null || value === undefined) {
    return undefined;
  }

  return value;
};

const formatToonPayload = (value: unknown): string => {
  try {
    const cleaned = removeNullValues(value);
    return `${encode(cleaned ?? value, { indent: 2, keyFolding: 'safe' })}\n`;
  } catch {
    return '';
  }
};

/**
 * Fast hash function for card comparison (replaces expensive TOON encoding)
 * Uses shallow hash based on key properties for O(1) comparison
 */
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Generate fast hash for card comparison
 * Only uses key properties to avoid expensive serialization
 */
function getCardHash(card: AICardConfig): string {
  const key = `${card.id || ''}|${card.cardTitle || ''}|${card.cardSubtitle || ''}|${card.sections?.length || 0}`;
  return String(hashString(key));
}

/**
 * Check if TOON input should be updated
 * Only update when structure changes or TOON editor is active
 */
function shouldUpdateToonInput(state: CardsState, newCard: AICardConfig): boolean {
  // Only update if structure changed or TOON input is empty
  return state.lastChangeType === 'structural' || !state.toonInput;
}

/**
 * Merge new card with existing card, preserving displayed values
 * Once a field/item has a real value (not placeholder), it won't be overwritten
 */
function mergeCardPreservingValues(existing: AICardConfig | null, incoming: AICardConfig): AICardConfig {
  if (!existing || existing.id !== incoming.id) {
    return incoming;
  }

  // Merge sections, preserving existing field/item values
  const mergedSections = (incoming.sections ?? []).map((incomingSection, sectionIndex) => {
    const existingSection = existing.sections?.[sectionIndex];
    if (!existingSection || existingSection.id !== incomingSection.id) {
      return incomingSection;
    }

    // Merge fields - preserve existing values that are not placeholders
    const mergedFields = (incomingSection.fields ?? []).map((incomingField, fieldIndex) => {
      const existingField = existingSection.fields?.[fieldIndex];
      if (!existingField || existingField.id !== incomingField.id) {
        return incomingField;
      }
      
      // If existing field has a real value (not placeholder), preserve it
      const meta = existingField.meta as Record<string, unknown> | undefined;
      const isPlaceholder = existingField.value === 'Streaming…' || 
                           (meta && meta['placeholder'] === true);
      
      if (!isPlaceholder && existingField.value !== undefined && existingField.value !== null) {
        // Preserve existing value and other properties
        return {
          ...incomingField,
          value: existingField.value,
          percentage: existingField.percentage ?? incomingField.percentage,
          trend: existingField.trend ?? incomingField.trend
        };
      }
      
      return incomingField;
    });

    // Merge items - preserve existing values that are not placeholders
    const mergedItems = (incomingSection.items ?? []).map((incomingItem, itemIndex) => {
      const existingItem = existingSection.items?.[itemIndex];
      if (!existingItem || existingItem.id !== incomingItem.id) {
        return incomingItem;
      }
      
      // If existing item has a real value (not placeholder), preserve it
      const meta = existingItem.meta as Record<string, unknown> | undefined;
      const isPlaceholder = existingItem.description === 'Streaming…' ||
                           (meta && meta['placeholder'] === true);
      
      if (!isPlaceholder && existingItem.title && existingItem.title !== 'Item ' + (itemIndex + 1)) {
        // Preserve existing item
        return {
          ...incomingItem,
          title: existingItem.title,
          description: existingItem.description ?? incomingItem.description,
          value: existingItem.value ?? incomingItem.value
        };
      }
      
      return incomingItem;
    });

    return {
      ...incomingSection,
      fields: mergedFields,
      items: mergedItems
    };
  });

  return {
    ...incoming,
    sections: mergedSections
  };
}

// ===== REDUCER =====

export const reducer = createReducer(
  initialState,
  on(loadCards, (state) => ({ ...state, loading: true })),
  on(loadCardsSuccess, (state, { cards }) => {
    const cardsWithIds = cards.map(card => ensureCardIds(card));
    return cardsAdapter.setAll(cardsWithIds, { ...state, loading: false });
  }),
  on(loadCardIncremental, (state, { card }) => {
    const cardWithId = ensureCardIds(card);
    return cardsAdapter.upsertOne(cardWithId, { ...state, loading: true });
  }),
  on(loadCardsComplete, (state) => ({ ...state, loading: false })),
  on(loadCardsFailure, (state, { error }) => ({ ...state, error: error as string, loading: false })),

  on(setCardType, (state, { cardType }) => ({ ...state, cardType })),
  on(setCardVariant, (state, { variant }) => ({ ...state, cardVariant: variant })),

  on(updateToonInput, (state, { toonInput }) => ({ ...state, toonInput })),
  on(generateCard, (state) => ({ ...state, isGenerating: true, error: null })),
  on(generateCardSuccess, (state, { card, changeType = 'structural' }) => {
    const cardWithId = ensureCardIds(card);
    const existingCard = state.currentCardId ? state.entities[state.currentCardId] ?? null : null;
    
    // Fast path: reference equality check
    if (existingCard === cardWithId) {
      return { ...state, lastChangeType: changeType, isGenerating: false };
    }
    
    // Merge card preserving existing displayed values
    const mergedCard = mergeCardPreservingValues(existingCard, cardWithId);
    
    // Fast path: hash-based comparison (replaces expensive TOON encoding)
    if (existingCard && existingCard.id === mergedCard.id) {
      // Compare key properties first (cheapest check)
      if (existingCard.cardTitle === mergedCard.cardTitle &&
          existingCard.cardSubtitle === mergedCard.cardSubtitle &&
          existingCard.sections?.length === mergedCard.sections?.length) {
        // Use hash-based comparison instead of expensive TOON encoding
        const existingHash = getCardHash(existingCard);
        const newHash = getCardHash(mergedCard);
        if (existingHash === newHash) {
          return { ...state, lastChangeType: changeType, isGenerating: false };
        }
      }
    }
    
    // Only encode TOON when actually needed (lazy evaluation)
    const cardWithoutIds = removeAllIds(mergedCard);
    const toonInput = shouldUpdateToonInput(state, mergedCard) 
      ? formatToonPayload(cardWithoutIds)
      : state.toonInput;
    
    return {
      ...cardsAdapter.upsertOne(mergedCard, state),
      currentCardId: mergedCard.id ?? null,
      toonInput,
      isGenerating: false,
      lastChangeType: changeType
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
  on(loadFirstCardExample, (state) => ({ ...state, loading: true })),
  on(loadTemplateSuccess, (state, { template }) => {
    const templateWithId = ensureCardIds(template);
    const templateWithoutIds = removeAllIds(template);
    return {
      ...cardsAdapter.upsertOne(templateWithId, state),
      currentCardId: templateWithId.id ?? null,
      toonInput: formatToonPayload(templateWithoutIds),
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
