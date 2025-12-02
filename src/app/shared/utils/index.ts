/**
 * Shared Utilities Barrel Export
 * Organized by domain for better discoverability
 *
 * NOTE: Many utilities are now consolidated in the library.
 * Prefer using @osi-cards/utils imports directly when possible.
 */

// ============================================================================
// RE-EXPORTS FROM LIBRARY (Canonical implementations)
// ============================================================================

// Card diff and comparison utilities
export { CardChangeType, CardDiffResult, CardDiffUtil } from '@osi-cards/utils';

// NOTE: The following imports are commented out because they are not yet exported from the library
// TODO: Implement and export these utilities from the library

// // Memoization and caching
// export {
//   MemoOptions,
//   MemoStats,
//   MemoizedFunction,
//   createBatchProcessor,
//   createDebouncedLayout,
//   createRAFScheduler,
//   heightKeyGenerator,
//   layoutKeyGenerator,
//   memoize,
// } from '@osi-cards/utils';

// // Virtual scrolling
// export {
//   IntersectionState,
//   VirtualScrollState,
//   createInfiniteScrollTrigger,
//   createLazyLoadTrigger,
//   useIntersectionObserver,
//   useVirtualScroll,
// } from '@osi-cards/utils';

// // Error handling
// export {
//   AggregateError,
//   ClassifiedError,
//   ErrorBoundaryOptions,
//   ErrorBoundaryState,
//   ErrorSeverity,
//   RetryOptions,
//   classifyError,
//   createSafeAsyncFunction,
//   createSafeFunction,
//   executeWithErrors,
//   tryCatch,
//   tryCatchAsync,
//   useErrorBoundary,
//   withRetry,
// } from '@osi-cards/utils';

// // Sanitization
// export { sanitizeHtml, sanitizeUrl } from '@osi-cards/utils';

// // Responsive utilities are available from library via direct import
// // ResponsiveConfig and related types are defined in responsive.util.ts

// // Layout optimization
// export {
//   OptimizationMetrics,
//   OptimizationResult,
//   UnifiedLayoutOptimizerConfig,
//   analyzeLayout,
//   fillLayoutGaps,
//   findLayoutGaps,
//   optimizeColumnSpans,
//   optimizeLayout,
//   quickOptimize,
// } from '@osi-cards/utils';

// // Performance monitoring
// export {
//   PerformanceMonitor,
//   fpsMonitor,
//   performanceMonitor,
//   renderTracker,
// } from '@osi-cards/utils';

// // Component composition hooks
// export {
//   useAsyncState,
//   useCounter,
//   useDebouncedValue,
//   useExpandableState,
//   useFocusState,
//   useHoverState,
//   useKeyboardNavigation,
//   useLoadingState,
//   usePagination,
//   useSelectionState,
//   useToggleState,
//   useVisibility,
// } from '@osi-cards/utils';

// // Input coercion
// export { coerceBoolean, coerceNumber } from '@osi-cards/utils';

// ============================================================================
// APP-SPECIFIC UTILITIES
// ============================================================================

// ===== Card Utilities =====
export * from './batch-conversion.util';
export * from './card-utils';

// ===== Validation & Input =====
export * from '../decorators/validation.decorator';
export * from './form-labels.util';
export * from './validation.util';

// ===== Performance & Optimization (App-specific) =====
export * from './bundle-optimization.util';
export * from './cache.util';
export * from './change-detection-optimization.util';
export * from './code-splitting.util';
export * from './compression.util';
export * from './css-optimization.util';
export * from './memoization.util'; // Local extensions
export * from './progressive-loading.util';
export * from './resource-hints.util';
export * from './virtual-scrolling.util'; // Local extensions

// ===== Memory & Cleanup =====
export * from './cleanup.util';
export * from './memory-management.util';
export * from './track-by.util';
// Object pool consolidated to core/utils/object-pool.util.ts

// ===== Network & HTTP =====
export * from './rate-limiting.util';
export * from './request-cancellation.util';
export * from './url.util';

// ===== Error Handling (App-specific extensions) =====
export * from './error-recovery.util';
export * from './improved-error-messages.util';

// ===== Security =====
export * from './security-headers.util';

// ===== UI & Accessibility =====
export * from './alt-text.util';
export * from './color-contrast.util';
export * from './drag-drop.util';
export * from './image-optimization.util';
export * from './pagination.util';

// ===== Design Patterns =====
export * from './base-classes.util';
export * from './command-pattern.util';
export * from './dependency-injection-tokens.util';
export * from './event-bus.util';
export * from './facade-pattern.util';
export * from './interface-segregation.util';
export * from './repository-pattern.util';

// ===== Type Utilities =====
export * from './type-guards-enhanced.util';

// ===== Service Worker & PWA =====
export * from './service-worker-cache.util';

// ===== Testing Utilities =====
export * from './contract-testing.util';
export * from './snapshot-testing.util';
export * from './test-utilities.util';
