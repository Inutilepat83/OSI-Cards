import { ActionReducer } from '@ngrx/store';
import { AppState } from '../app.state';

/**
 * Meta-reducer to sync state with localStorage
 */
export function localStorageSyncReducer(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return (state, action) => {
    // Run the reducer first
    const nextState = reducer(state, action);

    // Sync to localStorage with security measures
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
            // Don't persist UI state or sensitive data
            isGenerating: false,
            isFullscreen: false,
            error: null,
            loading: false,
          }
        };
        
        const stateString = JSON.stringify(stateToStore);
        const stateSize = new Blob([stateString]).size;
        const MAX_STATE_SIZE = 10 * 1024 * 1024; // 10MB max state size
        
        // Prevent storing excessively large state (DoS protection)
        if (stateSize > MAX_STATE_SIZE) {
          console.warn('State size exceeds maximum, skipping localStorage sync');
          return nextState;
        }
        
        localStorage.setItem('osi-cards-state', stateString);
      } catch (error) {
        // Handle quota exceeded and other storage errors gracefully
        if ((error as any)?.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old state');
          try {
            localStorage.removeItem('osi-cards-state');
            // Retry with current state (might still fail, but try)
            const stateString = JSON.stringify({
              cards: {
                ids: nextState.cards.ids,
                currentCardId: nextState.cards.currentCardId,
                cardType: nextState.cards.cardType,
                cardVariant: nextState.cards.cardVariant,
              }
            });
            localStorage.setItem('osi-cards-state', stateString);
          } catch (retryError) {
            console.warn('Failed to save minimal state to localStorage:', retryError);
          }
        } else {
          console.warn('Failed to save state to localStorage:', error);
        }
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

