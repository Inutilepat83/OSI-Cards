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
  ANIMATION_PRESETS,
  ANIMATION_TIMING,
  EASING,
  OPACITY,
  STAGGER_DELAYS,
  TILT_CONFIG,
  TRANSFORM,
  getAnimationTiming,
  getEasing,
  prefersReducedMotion,
  type AnimationPresetKey,
  type AnimationTimingKey,
  type EasingKey,
  type OpacityKey,
  type StaggerDelayKey,
  type TransformKey,
} from './animation.constants';

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================
export {
  BORDER_RADIUS,
  BREAKPOINTS,
  CARD_BORDER_RADIUS,
  CARD_SIZES,
  CARD_SPACING,
  COLUMNS_BY_BREAKPOINT,
  GRID_CONFIG,
  MASONRY_CONFIG,
  SECTION_SIZES,
  SHADOWS,
  SPACING,
  Z_INDEX,
  getColumnsForBreakpoint,
  getCurrentBreakpoint,
  isDesktopViewport,
  isMobileViewport,
  isTabletViewport,
  type BorderRadiusKey,
  type BreakpointKey,
  type ShadowKey,
  type SpacingKey,
  type ZIndexKey,
} from './layout.constants';

// ============================================================================
// STREAMING CONSTANTS
// ============================================================================
export {
  DEFAULT_LOADING_MESSAGES,
  JSON_PARSING_CONFIG,
  PLACEHOLDER_TEXT,
  SECTION_COMPLETION,
  STREAMING_CONFIG,
  STREAMING_ID_PREFIXES,
  STREAMING_PROGRESS,
  STREAMING_STAGES,
  calculateChunkDelay,
  generateStreamingId,
  getRandomLoadingMessage,
  isStreamingPlaceholder,
  type StreamingIdPrefix,
  type StreamingStage,
} from './streaming.constants';

// ============================================================================
// UI CONSTANTS
// ============================================================================
export {
  CARD_LIMITS,
  CARD_SIZE_CONFIG,
  CONTAINER_CONFIG,
  EMPTY_STATE_CONFIG,
  ICON_SIZE,
  ID_CONSTANTS,
  INTERACTION_THRESHOLDS,
  LAYOUT_CONSTANTS,
  PARTICLE_CONFIG,
  RETRY_CONSTANTS,
  SIZE_CONSTANTS,
  SKELETON_CONFIG,
  TILT_EFFECT_CONFIG,
  // Additional constants from ui.constants
  TIME_CONSTANTS,
  TOAST_CONFIG,
  VALIDATION_CONSTANTS,
  VALIDATION_LIMITS,
  type IconSizeKey,
  type ParticleConfigKey,
} from './ui.constants';
