import { ActionReducerMap } from '@ngrx/store';
import { AppState } from './app.state';
import { cardsReducer } from './cards/cards.reducer';
import { uiReducer } from './ui/ui.reducer';

export const reducers: ActionReducerMap<AppState> = {
  cards: cardsReducer,
  ui: uiReducer,
  user: {} as any, // TODO: Implement User reducer
};
