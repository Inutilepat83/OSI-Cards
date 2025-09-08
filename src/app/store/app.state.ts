import { ActionReducerMap } from '@ngrx/store';
import * as fromCards from './cards/cards.reducer';

export interface AppState {
  cards: fromCards.CardsState;
}

export const reducers: ActionReducerMap<AppState> = {
  cards: fromCards.reducer,
};
