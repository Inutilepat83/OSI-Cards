// Shared components barrel exports
export * from './components/card-templates-gallery/card-templates-gallery.component';
export * from './components/card-type-selector/card-type-selector.component';
export * from './components/cards';
export * from './components/error-display/error-display.component';
export * from './components/json-editor/json-editor.component';
export * from './components/performance-dashboard/performance-dashboard.component';
export * from './components/preview-controls/preview-controls.component';
export * from './components/system-stats/system-stats.component';
export * from './pipes';
export * from './services/auto-save.service';
export * from './services/card-diff.service';
export * from './services/card-preview.service';
export * from './services/card-templates.service';
export * from './services/command.service';
export * from './services/confirmation-dialog.service';
export * from './services/export.service';
export * from './services/focus-management.service';
export * from './services/optimistic-updates.service';
export * from './services/search-filter.service';
export * from './services/section-completion.service';
// Toast service now in library - use osi-cards-lib
// export * from './services/toast.service';

// Utils - export selectively to avoid conflicts
export { ensureCardIds, removeAllIds, CardUtil } from './utils/card-utils';
export * from './utils/error-messages';
export * from './utils/validation.util';
// Note: Constants not exported to avoid StreamingStage conflict with components/cards
// Import directly from './utils/constants' if needed

// Re-export from library for backwards compatibility
export {
  SectionNormalizationService,
  ThemeService,
  KeyboardShortcutsService,
} from '@osi-cards/services';
