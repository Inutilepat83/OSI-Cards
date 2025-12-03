/**
 * OSI Cards UI Constants
 *
 * Centralized constants for UI elements, particles, and interactions.
 * Eliminates magic numbers from component code.
 *
 * @module constants/ui
 */

// ============================================================================
// PARTICLE CONFIGURATION
// ============================================================================

/**
 * Configuration for particle animations in empty state
 */
export const PARTICLE_CONFIG = {
  /** Number of particles in the animation */
  COUNT: 20,

  /** Base scale for particles */
  BASE_SCALE: 1,

  /** Maximum scale multiplier on hover */
  MAX_SCALE_MULTIPLIER: 0.4,

  /** Base opacity for particles */
  BASE_OPACITY: 0.5,

  /** Maximum additional opacity on interaction */
  MAX_OPACITY_ADDITION: 0.3,

  /** Opacity factor based on position */
  POSITION_OPACITY_FACTOR: 0.2,

  /** Delay multiplier between particles */
  DELAY_MULTIPLIER: 0.08,

  /** Follow strength reduction per particle */
  FOLLOW_STRENGTH_REDUCTION: 0.3,

  /** Base follow strength */
  BASE_FOLLOW_STRENGTH: 0.4,

  /** Spiral radius base */
  SPIRAL_RADIUS_BASE: 15,

  /** Spiral radius increment */
  SPIRAL_RADIUS_INCREMENT: 8,

  /** Golden angle for spiral distribution */
  GOLDEN_ANGLE: 137.5,
} as const;

// ============================================================================
// EMPTY STATE CONFIGURATION
// ============================================================================

/**
 * Configuration for the empty/loading state
 */
export const EMPTY_STATE_CONFIG = {
  /** Message rotation interval in milliseconds */
  MESSAGE_INTERVAL_MS: 2500,

  /** Default loading title */
  DEFAULT_TITLE: 'Creating OSI Card',

  /** Gradient transform multiplier for mouse tracking */
  GRADIENT_TRANSFORM_MULTIPLIER: 0.1,

  /** Content parallax mouse multiplier */
  CONTENT_PARALLAX_MOUSE: 0.02,

  /** Content parallax scroll multiplier */
  CONTENT_PARALLAX_SCROLL: 0.05,
} as const;

// ============================================================================
// CONTAINER CONFIGURATION
// ============================================================================

/**
 * Configuration for container measurements and fallbacks
 */
export const CONTAINER_CONFIG = {
  /** Default margin for window-based width calculation */
  WINDOW_MARGIN: 80,

  /** Minimum container width */
  MIN_WIDTH: 260,

  /** Width change threshold for triggering updates (pixels) */
  WIDTH_CHANGE_THRESHOLD: 4,

  /** Section highlight duration in milliseconds */
  SECTION_HIGHLIGHT_DURATION_MS: 2000,

  /** Scroll offset from top for section navigation */
  SCROLL_OFFSET: -20,
} as const;

// ============================================================================
// TILT EFFECT CONFIGURATION
// ============================================================================

/**
 * Extended tilt effect configuration
 */
export const TILT_EFFECT_CONFIG = {
  /** Default maximum tilt angle in degrees */
  MAX_ANGLE_DEG: 10,

  /** Tilt sensitivity multiplier */
  SENSITIVITY: 0.5,

  /** Glow effect base intensity */
  GLOW_INTENSITY: 0.4,

  /** Maximum glow blur in pixels */
  MAX_GLOW_BLUR_PX: 40,

  /** Reflection opacity multiplier */
  REFLECTION_OPACITY_MULTIPLIER: 0.3,

  /** Distance threshold for activation in pixels */
  ACTIVATION_DISTANCE_PX: 300,

  /** Primary brand color for glow (RGB) */
  GLOW_COLOR_RGB: '255, 121, 0',
} as const;

// ============================================================================
// INTERACTION THRESHOLDS
// ============================================================================

/**
 * Thresholds for various UI interactions
 */
export const INTERACTION_THRESHOLDS = {
  /** Double-click detection time in milliseconds */
  DOUBLE_CLICK_MS: 300,

  /** Long press detection time in milliseconds */
  LONG_PRESS_MS: 500,

  /** Swipe minimum distance in pixels */
  SWIPE_MIN_DISTANCE_PX: 50,

  /** Swipe maximum vertical deviation ratio */
  SWIPE_MAX_VERTICAL_RATIO: 0.3,

  /** Debounce delay for resize events in milliseconds */
  RESIZE_DEBOUNCE_MS: 150,

  /** Debounce delay for scroll events in milliseconds */
  SCROLL_DEBOUNCE_MS: 100,

  /** Throttle delay for mouse move events in milliseconds */
  MOUSEMOVE_THROTTLE_MS: 16, // ~60fps
} as const;

// ============================================================================
// CARD SIZING
// ============================================================================

/**
 * Card size constraints and defaults
 */
export const CARD_SIZE_CONFIG = {
  /** Minimum card width in pixels */
  MIN_WIDTH_PX: 280,

  /** Maximum card width in pixels */
  MAX_WIDTH_PX: 800,

  /** Default card width in pixels */
  DEFAULT_WIDTH_PX: 400,

  /** Minimum card height in pixels */
  MIN_HEIGHT_PX: 200,

  /** Maximum recommended sections before scrolling */
  MAX_SECTIONS_BEFORE_SCROLL: 10,

  /** Default action button count limit */
  MAX_VISIBLE_ACTIONS: 4,
} as const;

// ============================================================================
// SKELETON LOADING
// ============================================================================

/**
 * Configuration for skeleton loading states
 */
export const SKELETON_CONFIG = {
  /** Shimmer animation duration in milliseconds */
  SHIMMER_DURATION_MS: 1500,

  /** Shimmer background size multiplier */
  SHIMMER_BG_SIZE_MULTIPLIER: 2,

  /** Header skeleton height in pixels */
  HEADER_HEIGHT_PX: 24,

  /** Line skeleton height in pixels */
  LINE_HEIGHT_PX: 16,

  /** Gap between skeleton lines in pixels */
  LINE_GAP_PX: 8,

  /** Short line width percentage */
  SHORT_LINE_WIDTH_PERCENT: 70,

  /** Number of lines in default skeleton */
  DEFAULT_LINE_COUNT: 3,
} as const;

// ============================================================================
// ICON SIZES
// ============================================================================

/**
 * Standard icon sizes
 */
export const ICON_SIZE = {
  /** Extra small icons (12px) */
  XS: 12,

  /** Small icons (16px) */
  SM: 16,

  /** Medium icons (20px - default) */
  MD: 20,

  /** Large icons (24px) */
  LG: 24,

  /** Extra large icons (32px) */
  XL: 32,

  /** Hero icons (48px) */
  HERO: 48,
} as const;

// ============================================================================
// TOAST/NOTIFICATION
// ============================================================================

/**
 * Configuration for toast notifications
 */
export const TOAST_CONFIG = {
  /** Default duration in milliseconds */
  DEFAULT_DURATION_MS: 4000,

  /** Minimum duration for auto-dismiss */
  MIN_DURATION_MS: 2000,

  /** Maximum simultaneous toasts */
  MAX_VISIBLE: 5,

  /** Animation duration for enter/exit */
  ANIMATION_DURATION_MS: 300,

  /** Gap between stacked toasts in pixels */
  STACK_GAP_PX: 8,
} as const;

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

/**
 * Input validation limits
 */
export const VALIDATION_LIMITS = {
  /** Maximum card title length */
  MAX_TITLE_LENGTH: 200,

  /** Maximum section title length */
  MAX_SECTION_TITLE_LENGTH: 150,

  /** Maximum field label length */
  MAX_FIELD_LABEL_LENGTH: 100,

  /** Maximum field value length */
  MAX_FIELD_VALUE_LENGTH: 1000,

  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 2000,

  /** Maximum number of sections per card */
  MAX_SECTIONS_PER_CARD: 50,

  /** Maximum number of fields per section */
  MAX_FIELDS_PER_SECTION: 100,

  /** Maximum number of items per section */
  MAX_ITEMS_PER_SECTION: 100,

  /** Maximum number of actions per card */
  MAX_ACTIONS_PER_CARD: 10,
} as const;

// ============================================================================
// TIMING CONSTANTS (from app/shared/utils/constants.ts)
// ============================================================================

/**
 * Time constants (in milliseconds)
 */
export const TIME_CONSTANTS = {
  /** Debounce delay for JSON input processing */
  JSON_DEBOUNCE_DELAY: 300,
  /** Immediate stream debounce for live preview updates */
  IMMEDIATE_STREAM_DEBOUNCE: 50,
  /** Completion batch delay for section updates */
  COMPLETION_BATCH_DELAY: 70,
  /** Resize throttle delay (~1 frame at 60fps) */
  RESIZE_THROTTLE: 16,
  /** Cache timeout (1 hour) */
  CACHE_TIMEOUT: 3600000,
  /** API timeout (30 seconds) */
  API_TIMEOUT: 30000,
  /** Search input debounce delay */
  SEARCH_DEBOUNCE_DELAY: 300,
  /** Filter operation debounce delay */
  FILTER_DEBOUNCE_DELAY: 200,
} as const;

/**
 * Size constants (in pixels)
 */
export const SIZE_CONSTANTS = {
  /** Root margin for intersection observer (lazy loading) */
  LAZY_LOAD_ROOT_MARGIN: 50,
  /** Maximum preview length for JSON errors */
  JSON_PREVIEW_LENGTH: 200,
  /** Default max length for safe string conversion */
  DEFAULT_MAX_STRING_LENGTH: 1000,
  /** Maximum card title length */
  MAX_CARD_TITLE_LENGTH: 200,
} as const;

/**
 * Validation constants
 */
export const VALIDATION_CONSTANTS = {
  /** Maximum number of sections per card */
  MAX_SECTIONS: 20,
  /** Maximum number of actions per card */
  MAX_ACTIONS: 10,
  /** Maximum fields per section */
  MAX_FIELDS_PER_SECTION: 50,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;

/**
 * Layout constants
 */
export const LAYOUT_CONSTANTS = {
  /** Maximum number of reflows before giving up */
  MAX_REFLOWS: 3,
  /** Default column count */
  DEFAULT_COLUMNS: 1,
  /** Maximum column count */
  MAX_COLUMNS: 4,
} as const;

/**
 * ID generation constants
 */
export const ID_CONSTANTS = {
  /** Default prefix for generated IDs */
  DEFAULT_ID_PREFIX: 'item',
  /** Random string length for ID generation */
  RANDOM_STRING_LENGTH: 7,
} as const;

/**
 * Card limits constants
 */
export const CARD_LIMITS = {
  /** Maximum card title length */
  MAX_TITLE_LENGTH: 200,
  /** Maximum card subtitle length */
  MAX_SUBTITLE_LENGTH: 500,
  /** Maximum card description length */
  MAX_DESCRIPTION_LENGTH: 1000,
  /** Maximum tag length */
  MAX_TAG_LENGTH: 50,
  /** Maximum field label length */
  MAX_FIELD_LABEL_LENGTH: 100,
  /** Maximum field value length */
  MAX_FIELD_VALUE_LENGTH: 200,
  /** Maximum item title length */
  MAX_ITEM_TITLE_LENGTH: 200,
  /** Maximum item description length */
  MAX_ITEM_DESCRIPTION_LENGTH: 500,
  /** Maximum item value length */
  MAX_ITEM_VALUE_LENGTH: 200,
  /** Maximum action label length */
  MAX_ACTION_LABEL_LENGTH: 100,
  /** Maximum action icon length */
  MAX_ACTION_ICON_LENGTH: 50,
  /** Minimum title length */
  MIN_TITLE_LENGTH: 1,
  /** Minimum section title length */
  MIN_SECTION_TITLE_LENGTH: 1,
  /** Maximum section title length */
  MAX_SECTION_TITLE_LENGTH: 200,
  /** Maximum section description length */
  MAX_SECTION_DESCRIPTION_LENGTH: 500,
  /** Maximum section subtitle length */
  MAX_SECTION_SUBTITLE_LENGTH: 200,
  /** Maximum field description length */
  MAX_FIELD_DESCRIPTION_LENGTH: 500,
  /** Maximum email body length */
  MAX_EMAIL_BODY_LENGTH: 5000,
} as const;

/**
 * Retry and delay constants
 */
export const RETRY_CONSTANTS = {
  /** Default retry delay in milliseconds */
  DEFAULT_RETRY_DELAY: 1000,
  /** Maximum retry delay in milliseconds */
  MAX_RETRY_DELAY: 4000,
  /** Default maximum retries */
  DEFAULT_MAX_RETRIES: 3,
  /** Exponential backoff base multiplier */
  EXPONENTIAL_BACKOFF_BASE: 2,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type IconSizeKey = keyof typeof ICON_SIZE;
export type ParticleConfigKey = keyof typeof PARTICLE_CONFIG;



