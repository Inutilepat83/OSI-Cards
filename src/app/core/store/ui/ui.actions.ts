import { createAction, props } from '@ngrx/store';
import { NotificationState, ModalState, BreadcrumbItem } from '../enhanced-app.state';

// Theme Actions
export const setTheme = createAction(
  '[UI] Set Theme',
  props<{ theme: 'light' | 'dark' | 'auto' }>()
);

// Sidebar Actions
export const toggleSidebar = createAction('[UI] Toggle Sidebar');
export const setSidebarOpen = createAction('[UI] Set Sidebar Open', props<{ open: boolean }>());

// Loading Actions
export const setLoading = createAction('[UI] Set Loading', props<{ loading: boolean }>());

// Notification Actions
export const addNotification = createAction(
  '[UI] Add Notification',
  props<{ notification: NotificationState }>()
);

export const removeNotification = createAction('[UI] Remove Notification', props<{ id: string }>());

export const clearNotifications = createAction('[UI] Clear Notifications');

// Modal Actions
export const openModal = createAction('[UI] Open Modal', props<{ modal: ModalState }>());

export const closeModal = createAction('[UI] Close Modal');

export const updateModal = createAction(
  '[UI] Update Modal',
  props<{ modal: Partial<ModalState> }>()
);

// Breadcrumb Actions
export const setBreadcrumbs = createAction(
  '[UI] Set Breadcrumbs',
  props<{ breadcrumbs: BreadcrumbItem[] }>()
);

export const addBreadcrumb = createAction(
  '[UI] Add Breadcrumb',
  props<{ breadcrumb: BreadcrumbItem }>()
);

export const removeBreadcrumb = createAction('[UI] Remove Breadcrumb', props<{ index: number }>());

// Search Actions
export const setSearchQuery = createAction('[UI] Set Search Query', props<{ query: string }>());

export const performSearch = createAction('[UI] Perform Search', props<{ query: string }>());

export const searchSuccess = createAction(
  '[UI] Search Success',
  props<{ results: any[]; query: string }>()
);

export const searchFailure = createAction('[UI] Search Failure', props<{ error: string }>());

// Layout Actions
export const setLayoutMobile = createAction(
  '[UI] Set Layout Mobile',
  props<{ isMobile: boolean }>()
);

export const toggleSidebarCollapsed = createAction('[UI] Toggle Sidebar Collapsed');

export const setCurrentView = createAction(
  '[UI] Set Current View',
  props<{ view: 'grid' | 'list' | 'table' }>()
);

export const setItemsPerPage = createAction(
  '[UI] Set Items Per Page',
  props<{ itemsPerPage: number }>()
);

export const setCurrentPage = createAction(
  '[UI] Set Current Page',
  props<{ currentPage: number }>()
);
