/**
 * Application State Management
 *
 * Centralized NgRx store configuration with feature state slices.
 * Organized by domain for better scalability and maintainability.
 *
 * State Structure:
 * - cards: Card data and selection state
 * - ui: UI state (modals, sidebars, theme)
 * - streaming: Streaming progress and status
 *
 * @example
 * ```typescript
 * // Select card state
 * const cards$ = store.select(selectAllCards);
 *
 * // Select UI state
 * const theme$ = store.select(selectCurrentTheme);
 * ```
 */

import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import * as fromCards from './cards/cards.state';
import { localStorageSyncReducer } from './meta-reducers/local-storage.meta-reducer';

// ============================================================================
// STATE INTERFACES
// ============================================================================

/**
 * UI State - Manages application UI state
 */
export interface UIState {
  /** Current theme mode */
  theme: 'light' | 'dark' | 'system';
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Active modal (if any) */
  activeModal: string | null;
  /** Toast notifications */
  notifications: Notification[];
  /** Loading indicators by feature */
  loading: Record<string, boolean>;
}

/**
 * Notification interface for toasts
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  dismissed: boolean;
}

/**
 * Streaming State - Manages LLM streaming state
 */
export interface StreamingState {
  /** Whether currently streaming */
  isStreaming: boolean;
  /** Current streaming progress (0-100) */
  progress: number;
  /** Current streaming stage */
  stage: 'idle' | 'connecting' | 'streaming' | 'processing' | 'complete' | 'error';
  /** Buffered content */
  buffer: string;
  /** Error message if any */
  error: string | null;
  /** Streaming start time */
  startedAt: number | null;
  /** Estimated completion time */
  estimatedCompletion: number | null;
}

/**
 * Root Application State
 */
export interface AppState {
  /** Cards feature state */
  cards: fromCards.CardsState;
  /** UI state (optional - can be added when needed) */
  // ui: UIState;
  /** Streaming state (optional - can be added when needed) */
  // streaming: StreamingState;
}

// ============================================================================
// INITIAL STATES
// ============================================================================

/**
 * Initial UI state
 */
export const initialUIState: UIState = {
  theme: 'dark',
  sidebarCollapsed: false,
  activeModal: null,
  notifications: [],
  loading: {},
};

/**
 * Initial streaming state
 */
export const initialStreamingState: StreamingState = {
  isStreaming: false,
  progress: 0,
  stage: 'idle',
  buffer: '',
  error: null,
  startedAt: null,
  estimatedCompletion: null,
};

// ============================================================================
// REDUCERS
// ============================================================================

/**
 * Root reducer map
 */
export const reducers: ActionReducerMap<AppState> = {
  cards: fromCards.reducer,
  // Add ui and streaming reducers when implementing those features:
  // ui: uiReducer,
  // streaming: streamingReducer,
};

// ============================================================================
// META REDUCERS
// ============================================================================

/**
 * Meta reducers for cross-cutting concerns
 * Order matters: they are applied from last to first
 */
export const metaReducers: MetaReducer<AppState>[] = [
  localStorageSyncReducer,
  // Add other meta-reducers here:
  // loggerMetaReducer (for development)
  // errorReportingMetaReducer
];

// ============================================================================
// FEATURE SELECTORS
// ============================================================================

/**
 * Feature selector for cards state
 * NOTE: Use selectCardsState from './cards/cards.selectors' instead
 * to avoid duplicate exports
 */
// export const selectCardsState = createFeatureSelector<fromCards.CardsState>('cards');

/**
 * Feature selector for UI state (when implemented)
 */
// export const selectUIState = createFeatureSelector<UIState>('ui');

/**
 * Feature selector for streaming state (when implemented)
 */
// export const selectStreamingState = createFeatureSelector<StreamingState>('streaming');

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * State persistence keys for localStorage
 */
export const STORAGE_KEYS = {
  CARDS: 'osi-cards-state',
  UI: 'osi-cards-ui-state',
  THEME: 'osi-cards-theme',
} as const;

/**
 * Feature keys for dynamic feature loading
 */
export const FEATURE_KEYS = {
  CARDS: 'cards',
  UI: 'ui',
  STREAMING: 'streaming',
} as const;
