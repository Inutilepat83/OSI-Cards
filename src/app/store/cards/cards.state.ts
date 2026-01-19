import { createAction, createReducer, on, props } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { AICardConfig, CardType } from '../../models/card.model';
import { ensureCardIds, removeAllIds } from '../../shared/utils/card-utils';
import { CardChangeType } from '@osi-cards/utils';

// Re-export CardChangeType from library for consistency
export type { CardChangeType } from '@osi-cards/utils';

// ===== ENTITY ADAPTER =====

export const cardsAdapter = createEntityAdapter<AICardConfig>({
  selectId: (card) => card.id ?? ensureCardIds(card).id!,
  sortComparer: (a, b) => {
    // First sort by displayOrder if available
    const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // Fallback to title sorting if displayOrder is not set
    return a.cardTitle.localeCompare(b.cardTitle);
  },
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
export const setCardType = createAction('[Cards] Set Card Type', props<{ cardType: CardType }>());
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
  props<{ card: AICardConfig; changeType?: CardChangeType }>()
);
export const generateCardFailure = createAction(
  '[Cards] Generate Card Failure',
  props<{ error: string }>()
);

// Card CRUD Actions
export const addCard = createAction('[Cards] Add Card', props<{ card: AICardConfig }>());
export const updateCard = createAction(
  '[Cards] Update Card',
  props<{ id: string; changes: Partial<AICardConfig> }>()
);
export const updateCardOptimistic = createAction(
  '[Cards] Update Card Optimistic',
  props<{ id: string; changes: Partial<AICardConfig> }>()
);
export const updateCardSuccess = createAction(
  '[Cards] Update Card Success',
  props<{ id: string; card: AICardConfig }>()
);
export const updateCardFailure = createAction(
  '[Cards] Update Card Failure',
  props<{ id: string; error: string }>()
);
export const upsertCard = createAction('[Cards] Upsert Card', props<{ card: AICardConfig }>());
export const deleteCard = createAction('[Cards] Delete Card', props<{ id: string }>());
export const deleteCardSuccess = createAction(
  '[Cards] Delete Card Success',
  props<{ id: string }>()
);
export const deleteCardFailure = createAction(
  '[Cards] Delete Card Failure',
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
export const searchCardsSuccess = createAction(
  '[Cards] Search Cards Success',
  props<{ query: string; results: AICardConfig[] }>()
);
export const searchCardsFailure = createAction(
  '[Cards] Search Cards Failure',
  props<{ query: string; error: string }>()
);

// Card Reordering Actions
export const reorderCards = createAction(
  '[Cards] Reorder Cards',
  props<{ previousIndex: number; currentIndex: number }>()
);
export const reorderCardsSuccess = createAction(
  '[Cards] Reorder Cards Success',
  props<{ cards: AICardConfig[] }>()
);

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
  lastChangeType: CardChangeType;
}

// ===== INITIAL STATE =====

export const initialState: CardsState = cardsAdapter.getInitialState({
  currentCardId: null,
  cardType: 'all',
  cardVariant: 1,
  jsonInput: '',
  isGenerating: false,
  isFullscreen: false,
  error: null,
  loading: false,
  lastChangeType: 'structural',
});

const removeNullValues = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(removeNullValues).filter((item) => item !== undefined);
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

const formatJsonPayload = (value: unknown): string => {
  try {
    const cleaned = removeNullValues(value);
    return `${JSON.stringify(cleaned ?? value, null, 2)}\n`;
  } catch {
    return '';
  }
};

/**
 * Fast hash function for card comparison (replaces expensive JSON encoding)
 * Uses shallow hash based on key properties for O(1) comparison
 */
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Generate fast hash for card comparison
 * Only uses key properties to avoid expensive serialization
 */
/**
 * Fast hash function for card comparison (replaces expensive JSON.stringify)
 * Uses lightweight hash based on key properties to avoid serialization overhead
 * Optimized to include more fields to reduce false positives
 */
function getCardHash(card: AICardConfig): string {
  // Include more fields to reduce false positives: id, title, section count, and section types
  const sectionTypes = card.sections?.map((s) => s.type || '').join(',') || '';
  const sectionIds =
    card.sections
      ?.map((s) => s.id || '')
      .slice(0, 5)
      .join(',') || ''; // First 5 IDs
  const key = `${card.id || ''}|${card.cardTitle || ''}|${card.sections?.length || 0}|${sectionTypes}|${sectionIds}`;

  // Use djb2 hash algorithm for better distribution
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) + hash + key.charCodeAt(i);
    hash = hash & 0xffffffff; // Convert to 32-bit integer
  }
  return String(hash);
}

/**
 * Check if JSON input should be updated
 * Only update when structure changes or JSON editor is active
 */
function shouldUpdateJsonInput(state: CardsState, _newCard: AICardConfig): boolean {
  // Only update if structure changed or JSON input is empty
  return state.lastChangeType === 'structural' || !state.jsonInput;
}

/**
 * Merge new card with existing card, preserving displayed values
 * Once a field/item has a real value (not placeholder), it won't be overwritten
 */
function mergeCardPreservingValues(
  existing: AICardConfig | null,
  incoming: AICardConfig
): AICardConfig {
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
      const isPlaceholder =
        existingField.value === 'Streaming…' || (meta && meta.placeholder === true);

      if (!isPlaceholder && existingField.value !== undefined && existingField.value !== null) {
        // Preserve existing value and other properties
        const merged = {
          ...incomingField,
          value: existingField.value,
        };
        // Only include percentage if defined
        if (existingField.percentage !== undefined) {
          merged.percentage = existingField.percentage;
        } else if (incomingField.percentage !== undefined) {
          merged.percentage = incomingField.percentage;
        }
        // Only include trend if defined
        if (existingField.trend !== undefined) {
          merged.trend = existingField.trend;
        } else if (incomingField.trend !== undefined) {
          merged.trend = incomingField.trend;
        }
        return merged;
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
      const isPlaceholder =
        existingItem.description === 'Streaming…' || (meta && meta.placeholder === true);

      if (
        !isPlaceholder &&
        existingItem.title &&
        existingItem.title !== 'Item ' + (itemIndex + 1)
      ) {
        // Preserve existing item
        const merged = {
          ...incomingItem,
          title: existingItem.title,
        };
        // Only include description if defined
        if (existingItem.description !== undefined) {
          merged.description = existingItem.description;
        } else if (incomingItem.description !== undefined) {
          merged.description = incomingItem.description;
        }
        // Only include value if defined
        if (existingItem.value !== undefined) {
          merged.value = existingItem.value;
        } else if (incomingItem.value !== undefined) {
          merged.value = incomingItem.value;
        }
        return merged;
      }

      return incomingItem;
    });

    return {
      ...incomingSection,
      fields: mergedFields,
      items: mergedItems,
    };
  });

  return {
    ...incoming,
    sections: mergedSections,
  };
}

// ===== REDUCER =====

export const reducer = createReducer(
  initialState,
  on(loadCards, (state) => ({ ...state, loading: true })),
  on(loadCardsSuccess, (state, { cards }) => {
    const cardsWithIds = cards.map((card, index) => {
      const cardWithId = ensureCardIds(card);
      // Initialize displayOrder if not present
      if (cardWithId.displayOrder === undefined) {
        return { ...cardWithId, displayOrder: index };
      }
      return cardWithId;
    });
    return cardsAdapter.setAll(cardsWithIds, { ...state, loading: false });
  }),
  on(loadCardIncremental, (state, { card }) => {
    const cardWithId = ensureCardIds(card);
    return cardsAdapter.upsertOne(cardWithId, { ...state, loading: true });
  }),
  on(loadCardsComplete, (state) => ({ ...state, loading: false })),
  on(loadCardsFailure, (state, { error }) => ({
    ...state,
    error: error as string,
    loading: false,
  })),

  on(setCardType, (state, { cardType }) => ({ ...state, cardType })),
  on(setCardVariant, (state, { variant }) => ({ ...state, cardVariant: variant })),

  on(updateJsonInput, (state, { jsonInput }) => ({ ...state, jsonInput })),
  on(generateCard, (state) => ({ ...state, isGenerating: true, error: null })),
  on(generateCardSuccess, (state, { card, changeType = 'structural' }) => {
    const cardWithId = ensureCardIds(card);
    const existingCard = state.currentCardId ? (state.entities[state.currentCardId] ?? null) : null;

    // Fast path: reference equality check
    if (existingCard === cardWithId) {
      return { ...state, lastChangeType: changeType, isGenerating: false };
    }

    // Merge card preserving existing displayed values
    const mergedCard = mergeCardPreservingValues(existingCard, cardWithId);

    // Fast path: hash-based comparison (replaces expensive JSON encoding)
    if (existingCard && existingCard.id === mergedCard.id) {
      // Compare key properties first (cheapest check)
      if (
        existingCard.cardTitle === mergedCard.cardTitle &&
        existingCard.sections?.length === mergedCard.sections?.length
      ) {
        // Use hash-based comparison instead of expensive JSON encoding
        const existingHash = getCardHash(existingCard);
        const newHash = getCardHash(mergedCard);
        if (existingHash === newHash) {
          return { ...state, lastChangeType: changeType, isGenerating: false };
        }
      }
    }

    // Only encode JSON when actually needed (lazy evaluation)
    const cardWithoutIds = removeAllIds(mergedCard);
    const jsonInput = shouldUpdateJsonInput(state, mergedCard)
      ? formatJsonPayload(cardWithoutIds)
      : state.jsonInput;

    return {
      ...cardsAdapter.upsertOne(mergedCard, state),
      currentCardId: mergedCard.id ?? null,
      jsonInput,
      isGenerating: false,
      lastChangeType: changeType,
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
  on(updateCardOptimistic, (state, { id, changes }) => {
    // Optimistic update - apply changes immediately
    return cardsAdapter.updateOne({ id, changes }, state);
  }),
  on(updateCardSuccess, (state, { card }) => {
    // Confirm optimistic update
    return cardsAdapter.upsertOne(card, state);
  }),
  on(updateCardFailure, (state) => {
    // Revert optimistic update - restore original value
    // Note: Original value should be restored by OptimisticUpdatesService
    // This action is mainly for logging/error handling
    return state;
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
      currentCardId: state.currentCardId === id ? null : state.currentCardId,
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
    const updatedState = cardsAdapter.upsertOne(templateWithId, state);
    return {
      ...updatedState,
      currentCardId: templateWithId.id ?? null,
      jsonInput: formatJsonPayload(templateWithoutIds),
      loading: false,
      lastChangeType: 'structural' as CardChangeType,
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
    const resultsWithIds = results.map((card) => ensureCardIds(card));
    return cardsAdapter.setAll(resultsWithIds, state);
  }),
  on(searchCardsFailure, (state, { error }) => ({
    ...state,
    error: error as string,
  })),

  on(reorderCards, (state, { previousIndex, currentIndex }) => {
    // Get all cards sorted by displayOrder (or by title as fallback)
    const allCards = state.ids
      .map((id) => state.entities[id])
      .filter((card): card is AICardConfig => card !== undefined)
      .sort((a, b) => {
        const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // Fallback to title sorting if displayOrder is not set
        return a.cardTitle.localeCompare(b.cardTitle);
      });

    // Perform array reordering
    if (
      previousIndex < 0 ||
      previousIndex >= allCards.length ||
      currentIndex < 0 ||
      currentIndex >= allCards.length
    ) {
      return state; // Invalid indices, return unchanged state
    }

    const movedCard = allCards[previousIndex];
    if (!movedCard) {
      return state; // Card not found, return unchanged state
    }

    const newCards = [...allCards];
    newCards.splice(previousIndex, 1);
    newCards.splice(currentIndex, 0, movedCard);

    // Update displayOrder for all cards based on new positions
    const updatedCards = newCards.map((card, index) => ({
      ...card,
      displayOrder: index,
    }));

    // Upsert all cards with new displayOrder
    const cardsWithIds = updatedCards.map((card) => ensureCardIds(card));
    return cardsAdapter.setAll(cardsWithIds, state);
  }),
  on(reorderCardsSuccess, (state, { cards }) => {
    const cardsWithIds = cards.map((card) => ensureCardIds(card));
    return cardsAdapter.setAll(cardsWithIds, state);
  })
);
