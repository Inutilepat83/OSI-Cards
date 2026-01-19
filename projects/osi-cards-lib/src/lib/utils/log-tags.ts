/**
 * Log Tags Utility
 *
 * Common tag constants for categorizing logs.
 * Use these constants to ensure consistency across the codebase.
 *
 * @example
 * ```typescript
 * import { LOG_TAGS } from '@osi-cards/utils/log-tags';
 *
 * logger.info('Layout complete', { sections: 21 }, [LOG_TAGS.MASONRY_GRID, LOG_TAGS.LAYOUT]);
 * ```
 */

/**
 * Common log tags for categorizing logs
 */
export const LOG_TAGS = {
  // Component tags
  MASONRY_GRID: 'masonry-grid',
  SECTION_RENDERER: 'section-renderer',
  CARD_SECTION_LIST: 'card-section-list',
  AI_CARD_RENDERER: 'ai-card-renderer',

  // Feature tags
  RENDERING: 'rendering',
  LAYOUT: 'layout',
  STREAMING: 'streaming',
  PERFORMANCE: 'performance',
  STATE: 'state',

  // Type tags
  ERRORS: 'errors',
  WARNINGS: 'warnings',
  DOCUMENTATION: 'documentation',
  API: 'api',
  AUTH: 'auth',
  VALIDATION: 'validation',
} as const;

/**
 * Type for log tag values
 */
export type LogTag = (typeof LOG_TAGS)[keyof typeof LOG_TAGS];

/**
 * Helper function to create a tags array from tag strings
 * @param tags One or more tag strings
 * @returns Array of tag strings
 *
 * @example
 * ```typescript
 * const tags = createTags(LOG_TAGS.MASONRY_GRID, LOG_TAGS.LAYOUT);
 * // Returns: ['masonry-grid', 'layout']
 * ```
 */
export function createTags(...tags: string[]): string[] {
  return tags.filter((tag) => tag && tag.length > 0);
}

/**
 * Helper function to combine multiple tag arrays
 * @param tagArrays Arrays of tags to combine
 * @returns Combined array of unique tags
 *
 * @example
 * ```typescript
 * const tags = combineTags(
 *   [LOG_TAGS.MASONRY_GRID],
 *   [LOG_TAGS.LAYOUT, LOG_TAGS.PERFORMANCE]
 * );
 * // Returns: ['masonry-grid', 'layout', 'performance']
 * ```
 */
export function combineTags(...tagArrays: (string[] | undefined)[]): string[] {
  const allTags = tagArrays
    .filter((tags): tags is string[] => tags !== undefined && tags.length > 0)
    .flat();
  return Array.from(new Set(allTags));
}
