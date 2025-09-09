import { createAction, props } from '@ngrx/store';

// UI Theme Actions
export const setTheme = createAction(
  '[UI] Set Theme',
  props<{ theme: 'light' | 'dark' | 'auto' }>()
);

export const toggleSidebar = createAction('[UI] Toggle Sidebar');

export const setSidebarState = createAction(
  '[UI] Set Sidebar State',
  props<{ isOpen: boolean }>()
);

// Layout Actions
export const setLayout = createAction(
  '[UI] Set Layout',
  props<{ layout: 'grid' | 'list' | 'masonry' }>()
);

export const setViewMode = createAction(
  '[UI] Set View Mode',
  props<{ viewMode: 'card' | 'detail' | 'fullscreen' }>()
);

// Loading States
export const setGlobalLoading = createAction(
  '[UI] Set Global Loading',
  props<{ isLoading: boolean }>()
);

export const setComponentLoading = createAction(
  '[UI] Set Component Loading',
  props<{ componentId: string; isLoading: boolean }>()
);

// Modal Actions
export const openModal = createAction(
  '[UI] Open Modal',
  props<{ modalId: string; data?: any }>()
);

export const closeModal = createAction(
  '[UI] Close Modal',
  props<{ modalId: string }>()
);

export const closeAllModals = createAction('[UI] Close All Modals');

// Notification Actions
export const showNotification = createAction(
  '[UI] Show Notification',
  props<{ 
    id: string;
    notificationType: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>()
);

export const hideNotification = createAction(
  '[UI] Hide Notification',
  props<{ id: string }>()
);

export const clearAllNotifications = createAction('[UI] Clear All Notifications');

// Search Actions
export const setSearchQuery = createAction(
  '[UI] Set Search Query',
  props<{ query: string }>()
);

export const setSearchFilters = createAction(
  '[UI] Set Search Filters',
  props<{ filters: Record<string, any> }>()
);

export const clearSearch = createAction('[UI] Clear Search');

// Accessibility Actions
export const setHighContrast = createAction(
  '[UI] Set High Contrast',
  props<{ enabled: boolean }>()
);

export const setReducedMotion = createAction(
  '[UI] Set Reduced Motion',
  props<{ enabled: boolean }>()
);

export const setFontSize = createAction(
  '[UI] Set Font Size',
  props<{ size: 'small' | 'medium' | 'large' | 'xl' }>()
);

// Performance UI Actions
export const setPerformanceMode = createAction(
  '[UI] Set Performance Mode',
  props<{ enabled: boolean }>()
);

export const setAnimationsEnabled = createAction(
  '[UI] Set Animations Enabled',
  props<{ enabled: boolean }>()
);

// Responsive Actions
export const setBreakpoint = createAction(
  '[UI] Set Breakpoint',
  props<{ breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }>()
);

export const setOrientation = createAction(
  '[UI] Set Orientation',
  props<{ orientation: 'portrait' | 'landscape' }>()
);
