// Shared components barrel exports
export * from './components/cards';
export * from './components/error-display/error-display.component';
export * from './components/json-editor/json-editor.component';
export * from './components/card-type-selector/card-type-selector.component';
export * from './components/preview-controls/preview-controls.component';
export * from './components/system-stats/system-stats.component';
export * from './components/card-templates-gallery/card-templates-gallery.component';
export * from './components/performance-dashboard/performance-dashboard.component';
export * from './services/section-completion.service';
export * from './services/card-diff.service';
export * from './services/toast.service';
export * from './services/keyboard-shortcuts.service';
export * from './services/command.service';
export * from './services/confirmation-dialog.service';
export * from './services/export.service';
export * from './services/auto-save.service';
export * from './services/search-filter.service';
export * from './services/card-templates.service';
export * from './services/optimistic-updates.service';
export * from './services/card-preview.service';
export * from './pipes';
export * from './utils';

// Re-export from library for backwards compatibility
export { 
  ThemeService,
  SectionNormalizationService
} from '@osi-cards/services';
