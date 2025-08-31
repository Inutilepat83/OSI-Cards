import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AppState, CardsState, UiState, UserState, cardsAdapter } from './enhanced-app.state';

// Feature selectors
export const selectAppState = createFeatureSelector<AppState>('app');
export const selectCardsState = createFeatureSelector<CardsState>('cards');
export const selectUiState = createFeatureSelector<UiState>('ui');
export const selectUserState = createFeatureSelector<UserState>('user');

// Cards selectors
export const {
  selectIds: selectCardIds,
  selectEntities: selectCardEntities,
  selectAll: selectAllCards,
  selectTotal: selectTotalCards,
} = cardsAdapter.getSelectors(selectCardsState);

export const selectSelectedCardId = createSelector(
  selectCardsState,
  (state: CardsState) => state.selectedCardId
);

export const selectSelectedCard = createSelector(
  selectCardEntities,
  selectSelectedCardId,
  (entities, selectedId) => (selectedId ? entities[selectedId] || null : null)
);

export const selectCardsLoading = createSelector(
  selectCardsState,
  (state: CardsState) => state.loading
);

export const selectCardsError = createSelector(
  selectCardsState,
  (state: CardsState) => state.error
);

export const selectCardsFilters = createSelector(
  selectCardsState,
  (state: CardsState) => state.filters
);

export const selectCardsSortBy = createSelector(
  selectCardsState,
  (state: CardsState) => state.sortBy
);

export const selectCardsSearchQuery = createSelector(
  selectCardsState,
  (state: CardsState) => state.searchQuery
);

// Filtered and sorted cards
export const selectFilteredCards = createSelector(
  selectAllCards,
  selectCardsFilters,
  selectCardsSearchQuery,
  (cards, filters, searchQuery) => {
    let filtered = cards;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        card =>
          card.cardTitle.toLowerCase().includes(query) ||
          card.cardSubtitle?.toLowerCase().includes(query) ||
          card.cardType.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filters.cardType) {
      filtered = filtered.filter(card => card.cardType === filters.cardType);
    }

    // Apply status filter
    if (filters.status) {
      // Assuming cards have a status field, filter accordingly
      filtered = filtered.filter(() => true); // Placeholder
    }

    // Apply date range filter
    if (filters.dateRange) {
      // Assuming cards have createdAt field
      filtered = filtered.filter(() => true); // Placeholder
    }

    return filtered;
  }
);

export const selectSortedCards = createSelector(
  selectFilteredCards,
  selectCardsSortBy,
  (cards, sortBy) => {
    const sorted = [...cards].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy.field) {
        case 'name':
          aValue = a.cardTitle;
          bValue = b.cardTitle;
          break;
        case 'type':
          aValue = a.cardType;
          bValue = b.cardType;
          break;
        case 'created':
        case 'updated':
        default:
          aValue = a.cardTitle; // Fallback to name
          bValue = b.cardTitle;
      }

      if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }
);

// UI selectors
export const selectTheme = createSelector(selectUiState, (state: UiState) => state.theme);

export const selectSidebarOpen = createSelector(
  selectUiState,
  (state: UiState) => state.sidebarOpen
);

export const selectUiLoading = createSelector(selectUiState, (state: UiState) => state.loading);

export const selectNotifications = createSelector(
  selectUiState,
  (state: UiState) => state.notifications
);

export const selectActiveNotifications = createSelector(selectNotifications, notifications =>
  notifications.filter(n => !n.autoClose || Date.now() - n.timestamp.getTime() < n.duration)
);

export const selectModal = createSelector(selectUiState, (state: UiState) => state.modal);

export const selectBreadcrumbs = createSelector(
  selectUiState,
  (state: UiState) => state.breadcrumbs
);

export const selectSearchState = createSelector(selectUiState, (state: UiState) => state.search);

export const selectLayoutState = createSelector(selectUiState, (state: UiState) => state.layout);

// User selectors
export const selectIsAuthenticated = createSelector(
  selectUserState,
  (state: UserState) => state.isAuthenticated
);

export const selectCurrentUser = createSelector(selectUserState, (state: UserState) => state.user);

export const selectUserLoading = createSelector(
  selectUserState,
  (state: UserState) => state.isLoading
);

export const selectUserPreferences = createSelector(
  selectUserState,
  (state: UserState) => state.preferences
);

export const selectUserPermissions = createSelector(
  selectUserState,
  (state: UserState) => state.permissions
);

export const selectUserProfile = createSelector(
  selectUserState,
  (state: UserState) => state.profile
);

export const selectUserStats = createSelector(selectUserProfile, profile => profile.stats);

export const selectSessionState = createSelector(
  selectUserState,
  (state: UserState) => state.session
);

export const selectIsSessionExpired = createSelector(selectSessionState, session => {
  if (!session.expiresAt) return false;
  return new Date() > session.expiresAt;
});

// Combined selectors
export const selectAppLoading = createSelector(
  selectCardsLoading,
  selectUiLoading,
  selectUserLoading,
  (cardsLoading, uiLoading, userLoading) => cardsLoading || uiLoading || userLoading
);

export const selectAppError = createSelector(selectCardsError, cardsError => cardsError);

// Permission-based selectors
export const selectHasPermission = (resource: string, action: string) =>
  createSelector(selectUserPermissions, permissions => {
    const permission = permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  });

// Theme-aware selectors
export const selectEffectiveTheme = createSelector(
  selectTheme,
  selectUserPreferences,
  (uiTheme, userPrefs) => {
    if (uiTheme !== 'auto') return uiTheme;
    if (userPrefs.theme !== 'auto') return userPrefs.theme;

    // Detect system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
);

// Search result selectors
export const selectSearchResults = createSelector(selectSearchState, search => search.results);

export const selectIsSearching = createSelector(selectSearchState, search => search.isSearching);

// Layout selectors
export const selectIsMobile = createSelector(selectLayoutState, layout => layout.isMobile);

export const selectCurrentView = createSelector(selectLayoutState, layout => layout.currentView);

export const selectItemsPerPage = createSelector(selectLayoutState, layout => layout.itemsPerPage);

export const selectCurrentPage = createSelector(selectLayoutState, layout => layout.currentPage);

// Pagination selectors
export const selectPaginatedCards = createSelector(
  selectSortedCards,
  selectCurrentPage,
  selectItemsPerPage,
  (cards, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return cards.slice(startIndex, endIndex);
  }
);

export const selectTotalPages = createSelector(
  selectSortedCards,
  selectItemsPerPage,
  (cards, itemsPerPage) => Math.ceil(cards.length / itemsPerPage)
);
