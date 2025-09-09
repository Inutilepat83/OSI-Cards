import { createReducer, on } from '@ngrx/store';
import * as UIActions from './ui.actions';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

export interface Modal {
  id: string;
  isOpen: boolean;
  data?: any;
}

export interface UIState {
  // Theme and Appearance
  theme: 'light' | 'dark' | 'auto';
  
  // Layout
  layout: 'grid' | 'list' | 'masonry';
  viewMode: 'card' | 'detail' | 'fullscreen';
  sidebarOpen: boolean;
  
  // Loading States
  globalLoading: boolean;
  componentLoading: Record<string, boolean>;
  
  // Modals
  modals: Record<string, Modal>;
  
  // Notifications
  notifications: Notification[];
  
  // Search
  searchQuery: string;
  searchFilters: Record<string, any>;
  
  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  
  // Performance
  performanceMode: boolean;
  animationsEnabled: boolean;
  
  // Responsive
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  orientation: 'portrait' | 'landscape';
}

export const initialState: UIState = {
  theme: 'auto',
  layout: 'grid',
  viewMode: 'card',
  sidebarOpen: true,
  globalLoading: false,
  componentLoading: {},
  modals: {},
  notifications: [],
  searchQuery: '',
  searchFilters: {},
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  performanceMode: false,
  animationsEnabled: true,
  breakpoint: 'lg',
  orientation: 'landscape'
};

export const reducer = createReducer(
  initialState,
  
  // Theme Actions
  on(UIActions.setTheme, (state, { theme }) => ({
    ...state,
    theme
  })),
  
  // Sidebar Actions
  on(UIActions.toggleSidebar, (state) => ({
    ...state,
    sidebarOpen: !state.sidebarOpen
  })),
  
  on(UIActions.setSidebarState, (state, { isOpen }) => ({
    ...state,
    sidebarOpen: isOpen
  })),
  
  // Layout Actions
  on(UIActions.setLayout, (state, { layout }) => ({
    ...state,
    layout
  })),
  
  on(UIActions.setViewMode, (state, { viewMode }) => ({
    ...state,
    viewMode
  })),
  
  // Loading Actions
  on(UIActions.setGlobalLoading, (state, { isLoading }) => ({
    ...state,
    globalLoading: isLoading
  })),
  
  on(UIActions.setComponentLoading, (state, { componentId, isLoading }) => ({
    ...state,
    componentLoading: {
      ...state.componentLoading,
      [componentId]: isLoading
    }
  })),
  
  // Modal Actions
  on(UIActions.openModal, (state, { modalId, data }) => ({
    ...state,
    modals: {
      ...state.modals,
      [modalId]: { id: modalId, isOpen: true, data }
    }
  })),
  
  on(UIActions.closeModal, (state, { modalId }) => ({
    ...state,
    modals: {
      ...state.modals,
      [modalId]: { ...state.modals[modalId], isOpen: false }
    }
  })),
  
  on(UIActions.closeAllModals, (state) => ({
    ...state,
    modals: Object.keys(state.modals).reduce((acc, key) => ({
      ...acc,
      [key]: { ...state.modals[key], isOpen: false }
    }), {})
  })),
  
  // Notification Actions
  on(UIActions.showNotification, (state, { type, ...notification }) => ({
    ...state,
    notifications: [
      ...state.notifications,
      { ...notification, type: notification.notificationType, timestamp: Date.now() }
    ]
  })),
  
  on(UIActions.hideNotification, (state, { id }) => ({
    ...state,
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  on(UIActions.clearAllNotifications, (state) => ({
    ...state,
    notifications: []
  })),
  
  // Search Actions
  on(UIActions.setSearchQuery, (state, { query }) => ({
    ...state,
    searchQuery: query
  })),
  
  on(UIActions.setSearchFilters, (state, { filters }) => ({
    ...state,
    searchFilters: filters
  })),
  
  on(UIActions.clearSearch, (state) => ({
    ...state,
    searchQuery: '',
    searchFilters: {}
  })),
  
  // Accessibility Actions
  on(UIActions.setHighContrast, (state, { enabled }) => ({
    ...state,
    highContrast: enabled
  })),
  
  on(UIActions.setReducedMotion, (state, { enabled }) => ({
    ...state,
    reducedMotion: enabled
  })),
  
  on(UIActions.setFontSize, (state, { size }) => ({
    ...state,
    fontSize: size
  })),
  
  // Performance Actions
  on(UIActions.setPerformanceMode, (state, { enabled }) => ({
    ...state,
    performanceMode: enabled
  })),
  
  on(UIActions.setAnimationsEnabled, (state, { enabled }) => ({
    ...state,
    animationsEnabled: enabled
  })),
  
  // Responsive Actions
  on(UIActions.setBreakpoint, (state, { breakpoint }) => ({
    ...state,
    breakpoint
  })),
  
  on(UIActions.setOrientation, (state, { orientation }) => ({
    ...state,
    orientation
  }))
);
