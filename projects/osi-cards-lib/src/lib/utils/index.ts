/**
 * Public API - Utilities
 *
 * Exports all utility functions with organized subdirectories (Phase 4).
 */

// ============================================================================
// CONSOLIDATED UTILITIES (Phase 4) - Use These!
// ============================================================================

// Performance and memory utilities (consolidated)
// export { PerformanceUtil, MemoryUtil, CleanupRegistry } from './performance';
// export type { Memoized, MemoOptions, MemoTTLOptions, CacheStats } from './performance';

// Animation utilities (consolidated)
// export { AnimationUtil, slideIn } from './animations';

// Virtual scroll
export * from './virtual-scroll.util';

// ============================================================================
// CORE UTILITIES (Kept at root level)
// ============================================================================

// Card utilities (consolidated) - selective export to avoid conflicts
export * from './accessibility.util';
export { CardDiffUtil, type CardDiffResult } from './card.util';
export * from './component-composition.util';
export * from './container-queries.util';
export * from './input-coercion.util';
export * from './section-design.utils';
// Input validation utilities
export * from './input-validation.util';
export * from './masonry-detection.util';
export * from './responsive.util';
export * from './retry.util';
export * from './style-validator.util';

// Consolidated utilities
export * from './error.util';
export * from './grid-logger.util';
export * from './timing.util';
export * from './virtual-scroll.util';

// Animation utilities
export * from './animation-optimization.util';
export * from './flip-animation.util';
export * from './web-animations.util';

// Memoization (use this instead of memo.util, memory.util, etc.)
export * from './memoization.util';

// Re-export type for convenience
export type { CardChangeType } from '../types';
