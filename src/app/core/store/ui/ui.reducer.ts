import { createReducer, on } from '@ngrx/store';
import { UiState } from '../enhanced-app.state';
import * as UiActions from './ui.actions';

export const initialUiState: UiState = {
  theme: 'auto',
  sidebarOpen: false,
  loading: false,
  notifications: [],
  modal: null,
  breadcrumbs: [],
  search: {
    query: '',
    results: [],
    isSearching: false,
    filters: {},
  },
  layout: {
    isMobile: false,
    sidebarCollapsed: false,
    currentView: 'grid',
    itemsPerPage: 12,
    currentPage: 1,
  },
};

export const uiReducer = createReducer(
  initialUiState,

  // Theme Actions
  on(UiActions.setTheme, (state, { theme }) => ({
    ...state,
    theme,
  })),

  // Sidebar Actions
  on(UiActions.toggleSidebar, state => ({
    ...state,
    sidebarOpen: !state.sidebarOpen,
  })),
  on(UiActions.setSidebarOpen, (state, { open }) => ({
    ...state,
    sidebarOpen: open,
  })),
  on(UiActions.toggleSidebarCollapsed, state => ({
    ...state,
    layout: {
      ...state.layout,
      sidebarCollapsed: !state.layout.sidebarCollapsed,
    },
  })),

  // Loading Actions
  on(UiActions.setLoading, (state, { loading }) => ({
    ...state,
    loading,
  })),

  // Notification Actions
  on(UiActions.addNotification, (state, { notification }) => ({
    ...state,
    notifications: [...state.notifications, notification],
  })),
  on(UiActions.removeNotification, (state, { id }) => ({
    ...state,
    notifications: state.notifications.filter(n => n.id !== id),
  })),
  on(UiActions.clearNotifications, state => ({
    ...state,
    notifications: [],
  })),

  // Modal Actions
  on(UiActions.openModal, (state, { modal }) => ({
    ...state,
    modal,
  })),
  on(UiActions.closeModal, state => ({
    ...state,
    modal: null,
  })),
  on(UiActions.updateModal, (state, { modal }) => ({
    ...state,
    modal: state.modal ? { ...state.modal, ...modal } : null,
  })),

  // Breadcrumb Actions
  on(UiActions.setBreadcrumbs, (state, { breadcrumbs }) => ({
    ...state,
    breadcrumbs,
  })),
  on(UiActions.addBreadcrumb, (state, { breadcrumb }) => ({
    ...state,
    breadcrumbs: [...state.breadcrumbs, breadcrumb],
  })),
  on(UiActions.removeBreadcrumb, (state, { index }) => ({
    ...state,
    breadcrumbs: state.breadcrumbs.filter((_, i) => i !== index),
  })),

  // Search Actions
  on(UiActions.setSearchQuery, (state, { query }) => ({
    ...state,
    search: {
      ...state.search,
      query,
    },
  })),
  on(UiActions.performSearch, (state, { query }) => ({
    ...state,
    search: {
      ...state.search,
      query,
      isSearching: true,
    },
    loading: true,
  })),
  on(UiActions.searchSuccess, (state, { results, query }) => ({
    ...state,
    search: {
      ...state.search,
      query,
      results,
      isSearching: false,
    },
    loading: false,
  })),
  on(UiActions.searchFailure, state => ({
    ...state,
    search: {
      ...state.search,
      isSearching: false,
    },
    loading: false,
  })),

  // Layout Actions
  on(UiActions.setLayoutMobile, (state, { isMobile }) => ({
    ...state,
    layout: {
      ...state.layout,
      isMobile,
    },
  })),
  on(UiActions.setCurrentView, (state, { view }) => ({
    ...state,
    layout: {
      ...state.layout,
      currentView: view,
    },
  })),
  on(UiActions.setItemsPerPage, (state, { itemsPerPage }) => ({
    ...state,
    layout: {
      ...state.layout,
      itemsPerPage,
    },
  })),
  on(UiActions.setCurrentPage, (state, { currentPage }) => ({
    ...state,
    layout: {
      ...state.layout,
      currentPage,
    },
  }))
);
