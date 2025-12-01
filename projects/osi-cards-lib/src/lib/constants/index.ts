/**
 * OSI Cards Constants
 * 
 * Centralized constants for animation, layout, streaming, and configuration.
 * Import from this barrel file to access all constants.
 * 
 * @example
 * ```typescript
 * import { 
 *   ANIMATION_TIMING, 
 *   SPACING, 
 *   STREAMING_CONFIG 
 * } from 'osi-cards-lib';
 * ```
 * 
 * @module constants
 */

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================
export {
  ANIMATION_TIMING,
  STAGGER_DELAYS,
  EASING,
  TRANSFORM,
  OPACITY,
  ANIMATION_PRESETS,
  TILT_CONFIG,
  prefersReducedMotion,
  getAnimationTiming,
  getEasing,
  type AnimationTimingKey,
  type StaggerDelayKey,
  type EasingKey,
  type TransformKey,
  type OpacityKey,
  type AnimationPresetKey,
} from './animation.constants';

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================
export {
  GRID_CONFIG,
  MASONRY_CONFIG,
  SPACING,
  CARD_SPACING,
  BREAKPOINTS,
  COLUMNS_BY_BREAKPOINT,
  BORDER_RADIUS,
  CARD_BORDER_RADIUS,
  SHADOWS,
  Z_INDEX,
  CARD_SIZES,
  SECTION_SIZES,
  getCurrentBreakpoint,
  getColumnsForBreakpoint,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
  type BreakpointKey,
  type SpacingKey,
  type BorderRadiusKey,
  type ShadowKey,
  type ZIndexKey,
} from './layout.constants';

// ============================================================================
// STREAMING CONSTANTS
// ============================================================================
export {
  STREAMING_CONFIG,
  STREAMING_STAGES,
  STREAMING_PROGRESS,
  PLACEHOLDER_TEXT,
  DEFAULT_LOADING_MESSAGES,
  STREAMING_ID_PREFIXES,
  JSON_PARSING_CONFIG,
  SECTION_COMPLETION,
  calculateChunkDelay,
  generateStreamingId,
  isStreamingPlaceholder,
  getRandomLoadingMessage,
  type StreamingStage,
  type StreamingIdPrefix,
} from './streaming.constants';






