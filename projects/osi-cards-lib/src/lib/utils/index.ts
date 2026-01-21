/**
 * Public API - Utilities
 *
 * Exports consolidated utility functions for OSI Cards library.
 * Reduced from 143 to ~40 utilities focused on core card rendering functionality.
 */

// ============================================================================
// CORE UTILITIES - Essential for card rendering
// ============================================================================

// Accessibility
export * from './accessibility.util';
export * from './grid-accessibility.util';

// Card utilities
export { CardUtil } from './card.util';
export { generateCardSummary, generateBriefSummary } from './card-summary.util';

// Performance & Memoization
export { Memoize, MemoizeLRU, MemoizeTTL } from './advanced-memoization.util';
export { ObjectPool } from './object-pool.util';
export { LRUCache } from './lru-cache.util';

// Layout & Grid - Core algorithms
export * from './grid-config.util';
export * from './master-grid-layout-engine.util';
export { PerfectBinPacker } from './perfect-bin-packer.util';
export * from './row-packer.util';
// Note: skyline-algorithm.util has PackingResult conflict with perfect-bin-packer
// Import directly if needed

// Virtual scrolling
export * from './virtual-scroll.util';
// Note: virtual-scroll-helpers.util exports conflict with virtual-scroll.util
// Import directly if needed: import { ... } from './lib/utils/virtual-scroll-helpers.util';

// Animation
export * from './flip-animation.util';
export * from './web-animations.util';

// Validation & Coercion (organized by domain)
export * from './validation';

// Error handling (organized by domain)
export * from './error';

// Format utilities (organized by domain)
export * from './format';

// Transform utilities (organized by domain)
export * from './transform';

// DOM utilities (organized by domain)
export * from './dom';

// Type utilities (organized by domain)
export * from './type';

// Subscription management
export { AutoUnsubscribe, SubscriptionTracker } from './subscription-tracker.util';

// Performance utilities
export * from './debounce-throttle.util';
export * from './performance.util';

// Debug logging utilities
export {
  sendDebugLog,
  safeDebugFetch,
  isLocalhost,
  shouldEnableDebugLogging,
} from './debug-log.util';
export { sendDebugLogToFile } from './debug-log-file.util';
export { LOG_TAGS, createTags, combineTags, type LogTag } from './log-tags';
export {
  shouldLogMessage,
  getDeduplicationStats,
  clearDeduplicationCache,
} from './log-deduplication.util';

// Masonry detection
export * from './masonry-detection.util';

// Note: smart-grid.util was removed - use master-grid-layout-engine.util instead

// Section design utilities
export * from './section-design.utils';

// Version utilities
export { checkVersionRequirement } from './version.util';

// Height estimation
export { HeightEstimator, estimateSectionHeight } from './height-estimation.util';

// Column packer
export {
  packSectionsIntoColumns,
  type ColumnPackerConfig,
  type ColumnPackingResult,
} from './column-packer.util';

// Re-export type for convenience
export type { CardChangeType } from '../types';
