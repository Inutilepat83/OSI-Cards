import { ActionReducer, MetaReducer } from '@ngrx/store';
import { AppState } from '../app.state';

/**
 * Meta-reducer to sync state with localStorage
 */
export function localStorageSyncReducer(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return (state, action) => {
    // Run the reducer first
    const nextState = reducer(state, action);

    // Sync to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stateToStore = {
          cards: {
            ids: nextState.cards.ids,
            entities: nextState.cards.entities,
            currentCardId: nextState.cards.currentCardId,
            cardType: nextState.cards.cardType,
            cardVariant: nextState.cards.cardVariant,
            jsonInput: nextState.cards.jsonInput,
            // Don't persist UI state
            isGenerating: false,
            isFullscreen: false,
            error: null,
            loading: false,
          }
        };
        localStorage.setItem('osi-cards-state', JSON.stringify(stateToStore));
      } catch (error) {
        console.warn('Failed to save state to localStorage:', error);
      }
    }

    return nextState;
  };
}

/**
 * Meta-reducer to rehydrate state from localStorage
 */
export function rehydrateState(): Partial<AppState> | undefined {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }

  try {
    const stored = localStorage.getItem('osi-cards-state');
    if (!stored) {
      return undefined;
    }

    const parsed = JSON.parse(stored);
    return parsed as Partial<AppState>;
  } catch (error) {
    console.warn('Failed to rehydrate state from localStorage:', error);
    return undefined;
  }
}

