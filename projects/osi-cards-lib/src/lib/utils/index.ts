/**
 * Public API - Utilities
 *
 * Exports all utility functions with organized subdirectories (Phase 4).
 */

// ============================================================================
// CONSOLIDATED UTILITIES (Phase 4) - Use These!
// ============================================================================

// Performance utilities (organized in utils/performance/)
export { PerformanceUtil, MemoryUtil, CleanupRegistry } from './performance';
export type { Memoized, MemoOptions, MemoTTLOptions, CacheStats } from './performance';

// Animation utilities (organized in utils/animations/)
export { AnimationUtil, slideIn } from './animations';

// Virtual scroll (consolidated) - only export from one source
export { VirtualScrollManager, type VirtualItem } from './virtual-scroll.util';

// ============================================================================
// CORE UTILITIES (Kept at root level)
// ============================================================================

export * from './card-diff.util';
export * from './component-composition.util';
export * from './section-design.utils';
export * from './accessibility.util';
export * from './container-queries.util';
export * from './error-boundary.util';
export * from './input-coercion.util';
export * from './input-validation.util';
export * from './masonry-detection.util';
export * from './responsive.util';
export * from './retry.util';
export * from './style-validator.util';

// Re-export type for convenience
export type { CardChangeType } from '../types';
