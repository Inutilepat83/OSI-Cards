/**
 * Public API for OSI Cards Library
 *
 * This file exports all public APIs that can be imported by other Angular projects.
 *
 * @example
 * ```typescript
 * import { AICardRendererComponent, CardDataService } from 'osi-cards';
 * ```
 */

// Core Services and Providers
export * from './app/core';

// Shared Components, Services, and Pipes (but not utils to avoid conflicts)
export * from './app/shared/components/cards';
export * from './app/shared/components/error-display/error-display.component';
export * from './app/shared/components/json-editor/json-editor.component';
export * from './app/shared/components/card-type-selector/card-type-selector.component';
export * from './app/shared/components/preview-controls/preview-controls.component';
export * from './app/shared/components/system-stats/system-stats.component';
export * from './app/shared/components/card-templates-gallery/card-templates-gallery.component';

// Shared Services (only existing ones)
export * from './app/shared/services/section-completion.service';
export * from './app/shared/services/card-diff.service';
export * from './app/shared/services/toast.service';
export * from './app/shared/services/keyboard-shortcuts.service';
export * from './app/shared/services/command.service';
export * from './app/shared/services/confirmation-dialog.service';
export * from './app/shared/services/auto-save.service';
export * from './app/shared/services/card-templates.service';
export * from './app/shared/services/optimistic-updates.service';
export * from './app/shared/services/card-preview.service';
export * from './app/shared/pipes';

// Shared Utils - Export individually to avoid conflicts with core exports
export * from './app/shared/utils/alt-text.util';
export * from './app/shared/utils/card-utils';
export * from './app/shared/utils/compression.util';
export * from './app/shared/utils/error-recovery.util';
export * from './app/shared/utils/form-labels.util';
export * from './app/shared/utils/pagination.util';
export * from './app/shared/utils/resource-hints.util';
export * from './app/shared/utils/batch-conversion.util';
export * from './app/shared/utils/validation.util';
export * from './app/shared/utils/memoization.util';
export * from './app/shared/utils/cache.util';
export * from './app/shared/utils/url.util';
export * from './app/shared/utils/color-contrast.util';
export * from './app/shared/utils/request-cancellation.util';
export * from './app/shared/utils/cleanup.util';
export * from './app/shared/utils/track-by.util';
export * from './app/shared/utils/rate-limiting.util';
export * from './app/shared/utils/bundle-optimization.util';
export * from './app/shared/utils/memory-management.util';
export * from './app/shared/utils/event-bus.util';
export * from './app/shared/utils/command-pattern.util';
export * from './app/shared/utils/repository-pattern.util';
export * from './app/shared/utils/facade-pattern.util';
export * from './app/shared/utils/dependency-injection-tokens.util';
export * from './app/shared/utils/base-classes.util';
export * from './app/shared/utils/interface-segregation.util';
export * from './app/shared/utils/type-guards-enhanced.util';
export * from './app/shared/utils/security-headers.util';
export * from './app/shared/utils/virtual-scrolling.util';
export * from './app/shared/utils/code-splitting.util';
export * from './app/shared/utils/css-optimization.util';
export * from './app/shared/utils/progressive-loading.util';
export * from './app/shared/utils/service-worker-cache.util';
export * from './app/shared/utils/change-detection-optimization.util';
export * from './app/shared/utils/drag-drop.util';
export * from './app/shared/utils/improved-error-messages.util';
export * from './app/shared/utils/test-utilities.util';
export * from './app/shared/utils/snapshot-testing.util';
export * from './app/shared/utils/contract-testing.util';

// Models
export * from './app/models';

// Store (NgRx) - Actions, Selectors, Reducers, Effects
export * from './app/store';

// Features
export * from './app/features';
