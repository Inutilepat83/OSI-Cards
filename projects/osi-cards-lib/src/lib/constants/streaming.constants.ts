/**
 * OSI Cards Streaming Constants
 *
 * Configuration values for LLM streaming simulation and card generation.
 *
 * @example
 * ```typescript
 * import { STREAMING_CONFIG, STREAMING_STAGES } from '../../public-api';
 *
 * const delay = STREAMING_CONFIG.THINKING_DELAY_MS;
 * ```
 */

// ============================================================================
// STREAMING CONFIGURATION
// ============================================================================

/**
 * Default streaming configuration
 */
export const STREAMING_CONFIG = {
  /** Minimum chunk size in characters */
  MIN_CHUNK_SIZE: 10,

  /** Maximum chunk size in characters */
  MAX_CHUNK_SIZE: 50,

  /** Thinking delay before streaming starts (ms) */
  THINKING_DELAY_MS: 100,

  /** Characters per token for speed calculation */
  CHARS_PER_TOKEN: 4,

  /** Target tokens per second */
  TOKENS_PER_SECOND: 80,

  /** Card update throttle (ms) */
  CARD_UPDATE_THROTTLE_MS: 50,

  /** Completion batch delay (ms) */
  COMPLETION_BATCH_DELAY_MS: 100,

  /** Maximum buffer size before forcing parse */
  MAX_BUFFER_SIZE: 100000,

  /** Timeout for streaming operations (ms) */
  STREAMING_TIMEOUT_MS: 30000,

  /** Retry delay after parse error (ms) */
  PARSE_RETRY_DELAY_MS: 100,

  /** Maximum parse retries */
  MAX_PARSE_RETRIES: 3,
} as const;

/**
 * Streaming stages
 */
export const STREAMING_STAGES = {
  /** No streaming active */
  IDLE: 'idle',

  /** LLM is thinking/processing */
  THINKING: 'thinking',

  /** Actively receiving chunks */
  STREAMING: 'streaming',

  /** Streaming finished successfully */
  COMPLETE: 'complete',

  /** Streaming was cancelled */
  ABORTED: 'aborted',

  /** An error occurred */
  ERROR: 'error',
} as const;

/**
 * Streaming progress thresholds
 */
export const STREAMING_PROGRESS = {
  /** Progress at which to start showing preview */
  PREVIEW_THRESHOLD: 0.1,

  /** Progress at which structure is usually complete */
  STRUCTURE_THRESHOLD: 0.3,

  /** Progress at which most content is available */
  CONTENT_THRESHOLD: 0.7,

  /** Progress at which to prepare for completion */
  NEAR_COMPLETE_THRESHOLD: 0.9,

  /** Complete progress */
  COMPLETE: 1.0,
} as const;

// ============================================================================
// PLACEHOLDER CONFIGURATION
// ============================================================================

/**
 * Placeholder text for streaming
 */
export const PLACEHOLDER_TEXT = {
  /** Default card title during streaming */
  CARD_TITLE: 'Generating card…',

  /** Default section title during streaming */
  SECTION_TITLE: 'Loading section…',

  /** Default field label during streaming */
  FIELD_LABEL: 'Loading…',

  /** Default field value during streaming */
  FIELD_VALUE: 'Streaming…',

  /** Default item title during streaming */
  ITEM_TITLE: 'Loading…',

  /** Default item description during streaming */
  ITEM_DESCRIPTION: '…',
} as const;

/**
 * Default loading messages for empty state
 */
export const DEFAULT_LOADING_MESSAGES = [
  'Deepening into archives...',
  'Asking all 40,000 employees...',
  'Re-reading manifesto...',
  'Consulting the oracle...',
  'Checking under the couch...',
  'Asking ChatGPT for help...',
  'Brewing coffee first...',
  'Counting to infinity...',
  'Summoning the data spirits...',
  'Teaching AI to read minds...',
  'Searching parallel universes...',
  'Waiting for inspiration...',
  'Polishing crystal ball...',
  'Decoding ancient scrolls...',
  'Training neural networks...',
  'Consulting the stars...',
  'Asking Siri nicely...',
  'Reading tea leaves...',
  'Channeling inner wisdom...',
  'Waiting for the right moment...',
] as const;

// ============================================================================
// ID PREFIXES
// ============================================================================

/**
 * Prefixes for auto-generated IDs during streaming
 */
export const STREAMING_ID_PREFIXES = {
  /** Prefix for streaming-generated section IDs */
  SECTION: 'llm-section',

  /** Prefix for streaming-generated field IDs */
  FIELD: 'llm-field',

  /** Prefix for streaming-generated item IDs */
  ITEM: 'llm-item',

  /** Prefix for streaming-generated card IDs */
  CARD: 'llm-card',

  /** Prefix for streaming-generated action IDs */
  ACTION: 'llm-action',
} as const;

// ============================================================================
// JSON PARSING
// ============================================================================

/**
 * JSON parsing configuration
 */
export const JSON_PARSING_CONFIG = {
  /** Regex for detecting section boundaries */
  SECTIONS_ARRAY_REGEX: /"sections"\s*:\s*\[/,

  /** Regex for detecting card title */
  CARD_TITLE_REGEX: /"cardTitle"\s*:\s*"([^"]*)"/,

  /** Characters that indicate a JSON boundary */
  BOUNDARY_CHARS: /[\n,}\]]/,

  /** Maximum recursion depth for parsing */
  MAX_PARSE_DEPTH: 50,
} as const;

// ============================================================================
// SECTION COMPLETION
// ============================================================================

/**
 * Section completion detection
 */
export const SECTION_COMPLETION = {
  /** Minimum fields to consider section complete */
  MIN_FIELDS_FOR_COMPLETE: 1,

  /** Minimum items to consider section complete */
  MIN_ITEMS_FOR_COMPLETE: 1,

  /** Delay before emitting completion (ms) */
  COMPLETION_EMIT_DELAY: 50,

  /** Batch multiple completions within this window (ms) */
  COMPLETION_BATCH_WINDOW: 100,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate delay for a chunk based on size
 * @param chunkLength - Length of the chunk in characters
 * @returns Delay in milliseconds
 */
export function calculateChunkDelay(chunkLength: number): number {
  const { CHARS_PER_TOKEN, TOKENS_PER_SECOND } = STREAMING_CONFIG;
  const msPerToken = 1000 / TOKENS_PER_SECOND;
  const tokensInChunk = Math.max(1, chunkLength / CHARS_PER_TOKEN);
  return Math.round(tokensInChunk * msPerToken);
}

/**
 * Generate a streaming ID
 * @param prefix - ID prefix type
 * @param index - Optional index for uniqueness
 * @returns Generated ID string
 */
export function generateStreamingId(
  prefix: keyof typeof STREAMING_ID_PREFIXES,
  index?: number
): string {
  const prefixValue = STREAMING_ID_PREFIXES[prefix];
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  const indexPart = index !== undefined ? `-${index}` : '';
  return `${prefixValue}${indexPart}-${timestamp}-${random}`;
}

/**
 * Check if text is a streaming placeholder
 * @param text - Text to check
 * @returns True if text is a placeholder
 */
export function isStreamingPlaceholder(text: unknown): boolean {
  if (typeof text !== 'string') return false;
  return (
    text === PLACEHOLDER_TEXT.FIELD_VALUE ||
    text === PLACEHOLDER_TEXT.ITEM_DESCRIPTION ||
    text === 'Streaming...' ||
    text === '…'
  );
}

/**
 * Get a random loading message
 * @param customMessages - Optional custom messages to use
 * @returns A random loading message
 */
export function getRandomLoadingMessage(customMessages?: readonly string[]): string {
  const messages = customMessages?.length ? customMessages : DEFAULT_LOADING_MESSAGES;
  const index = Math.floor(Math.random() * messages.length);
  return messages[index] ?? DEFAULT_LOADING_MESSAGES[0]!;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type StreamingStage = (typeof STREAMING_STAGES)[keyof typeof STREAMING_STAGES];
export type StreamingIdPrefix = keyof typeof STREAMING_ID_PREFIXES;
