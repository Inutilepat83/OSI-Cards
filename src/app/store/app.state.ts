import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import * as fromCards from './cards/cards.state';
import { environment } from '../../environments/environment';

export interface AppState {
  cards: fromCards.CardsState;
}

export const reducers: ActionReducerMap<AppState> = {
  cards: fromCards.reducer
};

// Meta reducers for cross-cutting concerns
export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];

// State persistence keys
export const STORAGE_KEYS = {
  CARDS: 'osi-cards-state'
} as const;
