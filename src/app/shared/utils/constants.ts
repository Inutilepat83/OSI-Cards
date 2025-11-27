/**
 * Application-wide constants
 * 
 * Centralized location for magic numbers and configuration values
 * used throughout the application to improve maintainability.
 */

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
  /** Maximum card subtitle length */
  MAX_CARD_SUBTITLE_LENGTH: 500,
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
 * Defines maximum lengths and counts for card properties
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

