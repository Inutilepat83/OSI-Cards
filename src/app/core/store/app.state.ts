import { CardsState, UiState, UserState } from './enhanced-app.state';

export interface AppState {
  cards: CardsState;
  ui: UiState;
  user: UserState;
}
