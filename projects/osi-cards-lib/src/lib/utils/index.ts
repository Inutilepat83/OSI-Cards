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

// Performance & Memoization
export { Memoize, MemoizeLRU, MemoizeTTL } from './advanced-memoization.util';
export { ObjectPool } from './object-pool.util';

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

// Validation & Coercion
export * from './input-coercion.util';
export * from './input-validation.util';

// Error handling
export * from './error-boundary.util';

// Subscription management
export { AutoUnsubscribe, SubscriptionTracker } from './subscription-tracker.util';

// Retry logic
export * from './retry.util';

// Performance utilities
export * from './debounce-throttle.util';
export * from './performance.util';

// Masonry detection
export * from './masonry-detection.util';

// Note: smart-grid.util was removed - use master-grid-layout-engine.util instead

// Section design utilities
export * from './section-design.utils';

// Re-export type for convenience
export type { CardChangeType } from '../types';
