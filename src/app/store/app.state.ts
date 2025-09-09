import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import * as fromCards from './cards/cards.reducer';
import * as fromUI from './ui/ui.reducer';
import * as fromPerformance from './performance/performance.reducer';
import * as fromFeatureFlags from './feature-flags/feature-flags.reducer';
import * as fromAnalytics from './analytics/analytics.reducer';
import { environment } from '../../environments/environment';

export interface AppState {
  cards: fromCards.CardsState;
  ui: fromUI.UIState;
  performance: fromPerformance.PerformanceState;
  featureFlags: fromFeatureFlags.FeatureFlagsState;
  analytics: fromAnalytics.AnalyticsState;
}

export const reducers: ActionReducerMap<AppState> = {
  cards: fromCards.reducer,
  ui: fromUI.reducer,
  performance: fromPerformance.reducer,
  featureFlags: fromFeatureFlags.reducer,
  analytics: fromAnalytics.reducer
};

// Meta reducers for cross-cutting concerns
export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];

// State persistence keys
export const STORAGE_KEYS = {
  CARDS: 'osi-cards-state',
  UI: 'osi-ui-state',
  FEATURE_FLAGS: 'osi-feature-flags',
  PERFORMANCE: 'osi-performance-state'
} as const;
